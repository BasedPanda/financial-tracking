// fintrackApi.js
import axiosInstance from './axiosConfig';

class FintrackAPI {
  // Auth endpoints
  static async login(email, password) {
    const response = await axiosInstance.post('/auth/login', { email, password });
    return response.data;
  }

  static async register(userData) {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  }

  static async logout() {
    const response = await axiosInstance.post('/auth/logout');
    localStorage.removeItem('fintrack_token');
    localStorage.removeItem('fintrack_refresh_token');
    return response.data;
  }

  // User endpoints
  static async getUserProfile() {
    const response = await axiosInstance.get('/user/profile');
    return response.data;
  }

  static async updateUserProfile(profileData) {
    const response = await axiosInstance.put('/user/profile', profileData);
    return response.data;
  }

  // Transaction endpoints
  static async getTransactions(params) {
    const response = await axiosInstance.get('/transactions', { params });
    return response.data;
  }

  static async getTransactionById(id) {
    const response = await axiosInstance.get(`/transactions/${id}`);
    return response.data;
  }

  static async updateTransaction(id, transactionData) {
    const response = await axiosInstance.put(`/transactions/${id}`, transactionData);
    return response.data;
  }

  // Account endpoints
  static async getAccounts() {
    const response = await axiosInstance.get('/accounts');
    return response.data;
  }

  static async getAccountById(id) {
    const response = await axiosInstance.get(`/accounts/${id}`);
    return response.data;
  }

  // Budget endpoints
  static async getBudgets() {
    const response = await axiosInstance.get('/budgets');
    return response.data;
  }

  static async createBudget(budgetData) {
    const response = await axiosInstance.post('/budgets', budgetData);
    return response.data;
  }

  static async updateBudget(id, budgetData) {
    const response = await axiosInstance.put(`/budgets/${id}`, budgetData);
    return response.data;
  }

  static async deleteBudget(id) {
    const response = await axiosInstance.delete(`/budgets/${id}`);
    return response.data;
  }

  // Analytics endpoints
  static async getSpendingTrends(params) {
    const response = await axiosInstance.get('/analytics/spending-trends', { params });
    return response.data;
  }

  static async getCategoryAnalysis(params) {
    const response = await axiosInstance.get('/analytics/category-analysis', { params });
    return response.data;
  }

  static async getMonthlyReport(month, year) {
    const response = await axiosInstance.get(`/analytics/monthly-report/${year}/${month}`);
    return response.data;
  }

  // Error handling utility
  static handleError(error) {
    if (error.response) {
      // Server responded with error
      return {
        status: error.response.status,
        message: error.response.data.message || 'An error occurred',
        errors: error.response.data.errors,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        status: 500,
        message: 'No response from server',
      };
    } else {
      // Request setup error
      return {
        status: 500,
        message: error.message,
      };
    }
  }
}

export default FintrackAPI;