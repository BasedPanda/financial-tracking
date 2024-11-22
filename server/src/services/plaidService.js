// plaidService.js
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const logger = require('../utils/logger');
const { ApiError } = require('../utils/errors');
const db = require('../config/database');
const MLService = require('./mlService');

class PlaidService {
  constructor() {
    const configuration = new Configuration({
      basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': process.env.PLAID_SECRET,
          'Plaid-Version': '2020-09-14'
        }
      }
    });

    this.client = new PlaidApi(configuration);
  }

  /**
   * Create link token
   */
  async createLinkToken(userId) {
    try {
      const request = {
        user: { client_user_id: userId.toString() },
        client_name: 'FinTrack',
        products: ['transactions'],
        country_codes: ['US'],
        language: 'en',
        webhook: process.env.PLAID_WEBHOOK_URL
      };

      const response = await this.client.linkTokenCreate(request);
      logger.info('Created Plaid link token');
      return response.data.link_token;
    } catch (error) {
      logger.error('Error creating link token:', error);
      throw this.handlePlaidError(error);
    }
  }

  /**
   * Exchange public token
   */
  async exchangePublicToken(publicToken) {
    try {
      const response = await this.client.itemPublicTokenExchange({
        public_token: publicToken
      });

      logger.info('Exchanged public token for access token');
      return {
        accessToken: response.data.access_token,
        itemId: response.data.item_id
      };
    } catch (error) {
      logger.error('Error exchanging public token:', error);
      throw this.handlePlaidError(error);
    }
  }

  /**
   * Get transactions
   */
  async getTransactions(accessToken, startDate, endDate, options = {}) {
    try {
      let transactions = [];
      let hasMore = true;
      let cursor = null;

      while (hasMore) {
        const request = {
          access_token: accessToken,
          start_date: startDate,
          end_date: endDate,
          options: {
            include_personal_finance_category: true,
            ...options
          }
        };

        if (cursor) {
          request.cursor = cursor;
        }

        const response = await this.client.transactionsGet(request);
        transactions = transactions.concat(response.data.transactions);
        hasMore = response.data.has_more;
        cursor = response.data.next_cursor;
      }

      logger.info(`Retrieved ${transactions.length} transactions from Plaid`);
      return transactions;
    } catch (error) {
      logger.error('Error getting transactions:', error);
      throw this.handlePlaidError(error);
    }
  }

  /**
   * Get accounts
   */
  async getAccounts(accessToken) {
    try {
      const response = await this.client.accountsGet({
        access_token: accessToken
      });

      logger.info(`Retrieved ${response.data.accounts.length} accounts from Plaid`);
      return response.data.accounts;
    } catch (error) {
      logger.error('Error getting accounts:', error);
      throw this.handlePlaidError(error);
    }
  }

  /**
   * Sync transactions for an item
   */
  async syncTransactions(credentials) {
    try {
      logger.info('Starting transaction sync for item:', credentials.item_id);

      // Get transactions from last 30 days
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const transactions = await this.getTransactions(
        credentials.access_token,
        startDate,
        endDate
      );

      // Begin database transaction
      await db.transaction(async (client) => {
        for (const transaction of transactions) {
          // Check if transaction exists
          const existing = await client.query(
            'SELECT * FROM transactions WHERE plaid_transaction_id = $1',
            [transaction.transaction_id]
          );

          if (existing.rows[0]) {
            // Update existing transaction
            await client.query(
              `UPDATE transactions
               SET amount = $1,
                   description = $2,
                   date = $3,
                   updated_at = NOW()
               WHERE plaid_transaction_id = $4`,
              [
                Math.abs(transaction.amount),
                transaction.name,
                transaction.date,
                transaction.transaction_id
              ]
            );
          } else {
            // Predict category for new transaction
            const categoryPrediction = await MLService.predictCategory({
              description: transaction.name,
              amount: Math.abs(transaction.amount),
              date: transaction.date
            });

            // Insert new transaction
            await client.query(
              `INSERT INTO transactions (
                user_id, account_id, category_id, plaid_transaction_id,
                type, amount, description, date, location
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                credentials.user_id,
                transaction.account_id,
                categoryPrediction.categoryId,
                transaction.transaction_id,
                transaction.amount < 0 ? 'expense' : 'income',
                Math.abs(transaction.amount),
                transaction.name,
                transaction.date,
                transaction.location ? JSON.stringify(transaction.location) : null
              ]
            );
          }
        }

        // Update account balances
        const accounts = await this.getAccounts(credentials.access_token);
        for (const account of accounts) {
          await client.query(
            `UPDATE accounts
             SET balance = $1,
                 last_synced = NOW()
             WHERE plaid_account_id = $2`,
            [account.balances.current, account.account_id]
          );
        }
      });

      logger.info('Transaction sync completed successfully');
      return transactions.length;
    } catch (error) {
      logger.error('Error syncing transactions:', error);
      throw error;
    }
  }

  /**
   * Handle webhook
   */
  async handleWebhook(webhookType, webhookCode, itemId) {
    try {
      logger.info('Handling Plaid webhook:', { webhookType, webhookCode, itemId });

      // Get credentials for the item
      const credentials = await db.query(
        'SELECT * FROM plaid_credentials WHERE item_id = $1',
        [itemId]
      );

      if (!credentials.rows[0]) {
        throw new ApiError('Item not found', 404);
      }

      switch (webhookType) {
        case 'TRANSACTIONS':
          await this.handleTransactionWebhook(
            webhookCode,
            credentials.rows[0]
          );
          break;

        case 'ITEM':
          await this.handleItemWebhook(
            webhookCode,
            credentials.rows[0]
          );
          break;

        default:
          logger.warn('Unhandled webhook type:', webhookType);
      }
    } catch (error) {
      logger.error('Error handling webhook:', error);
      throw error;
    }
  }

  /**
   * Handle transaction webhook
   */
  async handleTransactionWebhook(webhookCode, credentials) {
    switch (webhookCode) {
      case 'INITIAL_UPDATE':
      case 'HISTORICAL_UPDATE':
      case 'DEFAULT_UPDATE':
        await this.syncTransactions(credentials);
        break;

      case 'TRANSACTIONS_REMOVED':
        // Handle removed transactions
        await this.handleRemovedTransactions(credentials);
        break;

      default:
        logger.warn('Unhandled transaction webhook code:', webhookCode);
    }
  }

  /**
   * Handle item webhook
   */
  async handleItemWebhook(webhookCode, credentials) {
    switch (webhookCode) {
      case 'ERROR':
        await this.handleItemError(credentials);
        break;

      case 'PENDING_EXPIRATION':
        await this.handlePendingExpiration(credentials);
        break;

      default:
        logger.warn('Unhandled item webhook code:', webhookCode);
    }
  }

  /**
   * Handle removed transactions
   */
  async handleRemovedTransactions(credentials) {
    try {
      const response = await this.client.transactionsSync({
        access_token: credentials.access_token
      });

      if (response.data.removed.length > 0) {
        await db.query(
          `UPDATE transactions
           SET is_deleted = true
           WHERE plaid_transaction_id = ANY($1)`,
          [response.data.removed.map(t => t.transaction_id)]
        );
      }
    } catch (error) {
      logger.error('Error handling removed transactions:', error);
      throw error;
    }
  }

  /**
   * Handle item error
   */
  async handleItemError(credentials) {
    try {
      // Get item status
      const response = await this.client.itemGet({
        access_token: credentials.access_token
      });

      const error = response.data.item.error;
      
      // Update item status in database
      await db.query(
        `UPDATE plaid_credentials
         SET error_code = $1,
             error_message = $2,
             updated_at = NOW()
         WHERE item_id = $3`,
        [error.error_code, error.error_message, credentials.item_id]
      );

      // Notify user if necessary
      if (error.error_code === 'ITEM_LOGIN_REQUIRED') {
        // Implement user notification logic
      }
    } catch (error) {
      logger.error('Error handling item error:', error);
      throw error;
    }
  }

  /**
   * Handle pending expiration
   */
  async handlePendingExpiration(credentials) {
    try {
      // Update item status
      await db.query(
        `UPDATE plaid_credentials
         SET requires_reauth = true,
             updated_at = NOW()
         WHERE item_id = $1`,
        [credentials.item_id]
      );

      // Notify user
      // Implement user notification logic
    } catch (error) {
      logger.error('Error handling pending expiration:', error);
      throw error;
    }
  }

  /**
   * Handle Plaid API errors
   */
  handlePlaidError(error) {
    if (error.response?.data) {
      const plaidError = error.response.data.error_code;
      switch (plaidError) {
        case 'ITEM_LOGIN_REQUIRED':
          return new ApiError('Bank login required', 401);
        case 'INVALID_CREDENTIALS':
          return new ApiError('Invalid bank credentials', 401);
        case 'INSUFFICIENT_CREDENTIALS':
          return new ApiError('Additional bank authentication required', 401);
        case 'INSTITUTION_NOT_RESPONDING':
          return new ApiError('Bank is not responding', 503);
        default:
          return new ApiError(error.response.data.error_message, 500);
      }
    }
    return error;
  }
}

// Export singleton instance
module.exports = new PlaidService();