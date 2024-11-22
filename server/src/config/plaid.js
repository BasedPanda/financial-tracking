const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const logger = require('../utils/logger');

// Plaid configuration
const PLAID_CONFIG = {
  clientId: process.env.PLAID_CLIENT_ID,
  secret: process.env.PLAID_SECRET,
  environment: process.env.PLAID_ENV || 'sandbox',
  products: ['transactions', 'auth', 'identity'],
  countryCodes: ['US'],
  language: 'en',
  webhook: process.env.PLAID_WEBHOOK_URL,
  redirectUri: process.env.PLAID_REDIRECT_URI
};

// Validate Plaid configuration
if (!PLAID_CONFIG.clientId || !PLAID_CONFIG.secret) {
  logger.error('Plaid credentials not properly configured');
  throw new Error('Missing Plaid credentials');
}

// Configure Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_CONFIG.environment],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CONFIG.clientId,
      'PLAID-SECRET': PLAID_CONFIG.secret,
      'Plaid-Version': '2020-09-14'
    }
  }
});

const plaidClient = new PlaidApi(configuration);

// Create link token
const createLinkToken = async (userId) => {
  try {
    const request = {
      user: { client_user_id: userId.toString() },
      client_name: 'FinTrack',
      products: PLAID_CONFIG.products,
      country_codes: PLAID_CONFIG.countryCodes,
      language: PLAID_CONFIG.language,
      webhook: PLAID_CONFIG.webhook,
      redirect_uri: PLAID_CONFIG.redirectUri
    };

    const response = await plaidClient.linkTokenCreate(request);
    logger.debug('Link token created successfully');
    return response.data;
  } catch (err) {
    logger.error('Error creating link token:', err);
    throw err;
  }
};

// Exchange public token
const exchangePublicToken = async (publicToken) => {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken
    });
    logger.debug('Public token exchanged successfully');
    return response.data;
  } catch (err) {
    logger.error('Error exchanging public token:', err);
    throw err;
  }
};

// Get transactions
const getTransactions = async (accessToken, startDate, endDate) => {
  try {
    const request = {
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate
    };

    const response = await plaidClient.transactionsGet(request);
    let transactions = response.data.transactions;

    // Handle pagination
    while (transactions.length < response.data.total_transactions) {
      const paginatedRequest = {
        ...request,
        offset: transactions.length
      };
      const paginatedResponse = await plaidClient.transactionsGet(paginatedRequest);
      transactions = transactions.concat(paginatedResponse.data.transactions);
    }

    logger.debug(`Retrieved ${transactions.length} transactions`);
    return transactions;
  } catch (err) {
    logger.error('Error getting transactions:', err);
    throw err;
  }
};

// Get accounts
const getAccounts = async (accessToken) => {
  try {
    const response = await plaidClient.accountsGet({
      access_token: accessToken
    });
    logger.debug(`Retrieved ${response.data.accounts.length} accounts`);
    return response.data.accounts;
  } catch (err) {
    logger.error('Error getting accounts:', err);
    throw err;
  }
};

// Get account balances
const getBalances = async (accessToken) => {
  try {
    const response = await plaidClient.accountsBalanceGet({
      access_token: accessToken
    });
    logger.debug('Account balances retrieved successfully');
    return response.data.accounts;
  } catch (err) {
    logger.error('Error getting balances:', err);
    throw err;
  }
};

// Handle webhook
const handleWebhook = async (webhookType, webhookCode, itemId) => {
  try {
    logger.info('Handling webhook:', { webhookType, webhookCode, itemId });
    // Implement webhook handling logic based on webhook type and code
    switch (webhookType) {
      case 'TRANSACTIONS':
        return handleTransactionWebhook(webhookCode, itemId);
      case 'ITEM':
        return handleItemWebhook(webhookCode, itemId);
      default:
        logger.warn('Unhandled webhook type:', webhookType);
        return null;
    }
  } catch (err) {
    logger.error('Error handling webhook:', err);
    throw err;
  }
};

const handleTransactionWebhook = async (webhookCode, itemId) => {
  // Implement transaction webhook handling
  switch (webhookCode) {
    case 'TRANSACTIONS_REMOVED':
      // Handle removed transactions
      break;
    case 'DEFAULT_UPDATE':
      // Handle updated transactions
      break;
    case 'INITIAL_UPDATE':
      // Handle initial update
      break;
    default:
      logger.warn('Unhandled transaction webhook code:', webhookCode);
  }
};

const handleItemWebhook = async (webhookCode, itemId) => {
  // Implement item webhook handling
  switch (webhookCode) {
    case 'ERROR':
      // Handle error
      break;
    case 'PENDING_EXPIRATION':
      // Handle pending expiration
      break;
    default:
      logger.warn('Unhandled item webhook code:', webhookCode);
  }
};

module.exports = {
  PLAID_CONFIG,
  plaidClient,
  createLinkToken,
  exchangePublicToken,
  getTransactions,
  getAccounts,
  getBalances,
  handleWebhook
};