// accountController.js
const db = require('../config/database');
const plaid = require('../config/plaid');
const logger = require('../utils/logger');
const { ApiError } = require('../utils/errors');

class AccountController {
  // Get all accounts for a user
  static async getAccounts(req, res, next) {
    try {
      const userId = req.user.id;
      
      const accounts = await db.query(
        `SELECT a.*, pc.institution_name 
         FROM accounts a
         LEFT JOIN plaid_credentials pc ON a.plaid_account_id = pc.item_id
         WHERE a.user_id = $1 AND a.is_active = true
         ORDER BY a.created_at DESC`,
        [userId]
      );

      return res.json({
        success: true,
        data: accounts.rows
      });
    } catch (error) {
      logger.error('Error fetching accounts:', error);
      next(error);
    }
  }

  // Get single account details
  static async getAccountById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const account = await db.query(
        `SELECT a.*, pc.institution_name
         FROM accounts a
         LEFT JOIN plaid_credentials pc ON a.plaid_account_id = pc.item_id
         WHERE a.id = $1 AND a.user_id = $2`,
        [id, userId]
      );

      if (!account.rows[0]) {
        throw new ApiError('Account not found', 404);
      }

      return res.json({
        success: true,
        data: account.rows[0]
      });
    } catch (error) {
      logger.error('Error fetching account:', error);
      next(error);
    }
  }

  // Link new account via Plaid
  static async linkAccount(req, res, next) {
    try {
      const { publicToken, metadata } = req.body;
      const userId = req.user.id;

      await db.transaction(async (client) => {
        // Exchange public token
        const exchangeResponse = await plaid.exchangePublicToken(publicToken);
        const accessToken = exchangeResponse.access_token;
        const itemId = exchangeResponse.item_id;

        // Save Plaid credentials
        await client.query(
          `INSERT INTO plaid_credentials (user_id, access_token, item_id, institution_id, institution_name)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, accessToken, itemId, metadata.institution.institution_id, metadata.institution.name]
        );

        // Get accounts from Plaid
        const plaidAccounts = await plaid.getAccounts(accessToken);

        // Save accounts to database
        for (const account of plaidAccounts) {
          await client.query(
            `INSERT INTO accounts (
              user_id, plaid_account_id, name, type, balance, currency, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, true)`,
            [
              userId,
              account.account_id,
              account.name,
              account.type,
              account.balances.current,
              account.balances.iso_currency_code
            ]
          );
        }
      });

      return res.json({
        success: true,
        message: 'Account linked successfully'
      });
    } catch (error) {
      logger.error('Error linking account:', error);
      next(error);
    }
  }

  // Unlink account
  static async unlinkAccount(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await db.transaction(async (client) => {
        // Get account details
        const account = await client.query(
          'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
          [id, userId]
        );

        if (!account.rows[0]) {
          throw new ApiError('Account not found', 404);
        }

        // Deactivate account
        await client.query(
          'UPDATE accounts SET is_active = false WHERE id = $1',
          [id]
        );

        // If it's a Plaid account, remove Plaid credentials
        if (account.rows[0].plaid_account_id) {
          await client.query(
            'DELETE FROM plaid_credentials WHERE item_id = $1',
            [account.rows[0].plaid_account_id]
          );
        }
      });

      return res.json({
        success: true,
        message: 'Account unlinked successfully'
      });
    } catch (error) {
      logger.error('Error unlinking account:', error);
      next(error);
    }
  }

  // Update account
  static async updateAccount(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { name } = req.body;

      const result = await db.query(
        'UPDATE accounts SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        [name, id, userId]
      );

      if (!result.rows[0]) {
        throw new ApiError('Account not found', 404);
      }

      return res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Error updating account:', error);
      next(error);
    }
  }

  // Refresh account balances
  static async refreshBalances(req, res, next) {
    try {
      const userId = req.user.id;

      // Get all active Plaid credentials
      const credentials = await db.query(
        'SELECT * FROM plaid_credentials WHERE user_id = $1',
        [userId]
      );

      for (const cred of credentials.rows) {
        // Get updated balances from Plaid
        const balances = await plaid.getBalances(cred.access_token);

        // Update balances in database
        for (const balance of balances) {
          await db.query(
            `UPDATE accounts 
             SET balance = $1, last_synced = NOW() 
             WHERE plaid_account_id = $2`,
            [balance.balances.current, balance.account_id]
          );
        }
      }

      return res.json({
        success: true,
        message: 'Account balances updated successfully'
      });
    } catch (error) {
      logger.error('Error refreshing balances:', error);
      next(error);
    }
  }
}

module.exports = AccountController;