const axios = require('axios');
const logger = require('../utils/logger');
const { ApiError } = require('../utils/errors');

class MLService {
  constructor() {
    this.baseURL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 5000
    });
  }

  /**
   * Predict transaction category
   */
  async predictCategory(transaction) {
    try {
      const response = await this.client.post('/predict/category', {
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.date
      });

      return {
        categoryId: response.data.category_id,
        confidence: response.data.confidence,
        alternatives: response.data.alternatives
      };
    } catch (error) {
      logger.error('Error predicting category:', error);
      if (error.response) {
        throw new ApiError(error.response.data.message, error.response.status);
      }
      throw error;
    }
  }

  /**
   * Detect anomalous transactions
   */
  async detectAnomalies(transactions) {
    try {
      const response = await this.client.post('/predict/anomaly', {
        transactions: transactions.map(t => ({
          amount: t.amount,
          category_id: t.categoryId,
          description: t.description,
          date: t.date
        }))
      });

      return response.data.anomalies.map(anomaly => ({
        transactionId: transactions[anomaly.index].id,
        score: anomaly.score,
        reason: anomaly.reason
      }));
    } catch (error) {
      logger.error('Error detecting anomalies:', error);
      if (error.response) {
        throw new ApiError(error.response.data.message, error.response.status);
      }
      throw error;
    }
  }

  /**
   * Analyze spending patterns
   */
  async analyzePatterns(userId, startDate, endDate) {
    try {
      const response = await this.client.post('/analyze/patterns', {
        user_id: userId,
        start_date: startDate,
        end_date: endDate
      });

      return {
        patterns: response.data.patterns,
        insights: response.data.insights,
        recommendations: response.data.recommendations
      };
    } catch (error) {
      logger.error('Error analyzing patterns:', error);
      if (error.response) {
        throw new ApiError(error.response.data.message, error.response.status);
      }
      throw error;
    }
  }

  /**
   * Forecast expenses
   */
  async forecastExpenses(userId, months = 3) {
    try {
      const response = await this.client.post('/predict/forecast', {
        user_id: userId,
        months: months
      });

      return {
        forecasts: response.data.forecasts,
        confidence: response.data.confidence,
        trends: response.data.trends
      };
    } catch (error) {
      logger.error('Error forecasting expenses:', error);
      if (error.response) {
        throw new ApiError(error.response.data.message, error.response.status);
      }
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new MLService();