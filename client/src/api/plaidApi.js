// plaidApi.js
import axiosInstance from './axiosConfig';

class PlaidAPI {
  static async createLinkToken() {
    try {
      const response = await axiosInstance.post('/plaid/create-link-token');
      return response.data.link_token;
    } catch (error) {
      throw this.handlePlaidError(error);
    }
  }

  static async exchangePublicToken(publicToken) {
    try {
      const response = await axiosInstance.post('/plaid/exchange-token', {
        public_token: publicToken,
      });
      return response.data;
    } catch (error) {
      throw this.handlePlaidError(error);
    }
  }

  static async getAccounts() {
    try {
      const response = await axiosInstance.get('/plaid/accounts');
      return response.data.accounts;
    } catch (error) {
      throw this.handlePlaidError(error);
    }
  }

  static async getTransactions(startDate, endDate) {
    try {
      const response = await axiosInstance.get('/plaid/transactions', {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });
      return response.data.transactions;
    } catch (error) {
      throw this.handlePlaidError(error);
    }
  }

  static async getBalance() {
    try {
      const response = await axiosInstance.get('/plaid/balance');
      return response.data.accounts;
    } catch (error) {
      throw this.handlePlaidError(error);
    }
  }

  static async refreshTransactions() {
    try {
      const response = await axiosInstance.post('/plaid/refresh-transactions');
      return response.data;
    } catch (error) {
      throw this.handlePlaidError(error);
    }
  }

  static async unlinkAccount(accountId) {
    try {
      const response = await axiosInstance.post('/plaid/unlink-account', {
        account_id: accountId,
      });
      return response.data;
    } catch (error) {
      throw this.handlePlaidError(error);
    }
  }

  // Plaid-specific error handling
  static handlePlaidError(error) {
    if (error.response) {
      const plaidError = error.response.data.error;
      return {
        error_type: plaidError.error_type,
        error_code: plaidError.error_code,
        error_message: plaidError.error_message,
        display_message: plaidError.display_message || 'An error occurred with your bank connection',
        status_code: error.response.status,
      };
    }
    return {
      error_type: 'CLIENT_ERROR',
      error_message: error.message,
      display_message: 'Unable to connect to financial services',
      status_code: 500,
    };
  }

  // Webhook handling
  static async handleWebhook(webhookType, webhookCode, itemId) {
    try {
      const response = await axiosInstance.post('/plaid/webhook', {
        webhook_type: webhookType,
        webhook_code: webhookCode,
        item_id: itemId,
      });
      return response.data;
    } catch (error) {
      throw this.handlePlaidError(error);
    }
  }
}

export default PlaidAPI;