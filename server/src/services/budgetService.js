const logger = require('../utils/logger');
const Budget = require('../models/budget');
const Transaction = require('../models/transaction');
const { ApiError } = require('../utils/errors');

class BudgetService {
  /**
   * Create a budget alert if necessary
   */
  static async checkBudgetAlert(transaction) {
    try {
      if (!transaction.categoryId) {
        return null;
      }

      const budget = await Budget.findByCategory(
        transaction.userId,
        transaction.categoryId,
        new Date()
      );

      if (!budget) {
        return null;
      }

      const progress = await budget.getProgress();

      // Alert thresholds
      const thresholds = [
        { percent: 100, message: 'Budget exceeded' },
        { percent: 90, message: 'Budget nearly exceeded' },
        { percent: 75, message: 'Budget reaching limit' }
      ];

      for (const threshold of thresholds) {
        if (progress.progress >= threshold.percent) {
          return {
            type: 'BUDGET_ALERT',
            userId: transaction.userId,
            budgetId: budget.id,
            message: threshold.message,
            data: {
              budgetName: budget.name,
              spent: progress.spent,
              limit: budget.amount,
              percent: progress.progress
            }
          };
        }
      }

      return null;
    } catch (error) {
      logger.error('Error checking budget alert:', error);
      throw error;
    }
  }

  /**
   * Generate budget recommendations
   */
  static async generateRecommendations(userId) {
    try {
      // Get past 3 months of transactions
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);

      const transactions = await Transaction.findByUser(userId, {
        startDate,
        endDate,
        type: 'expense'
      });

      // Calculate average monthly spending by category
      const categorySpending = transactions.reduce((acc, transaction) => {
        if (!transaction.categoryId) return acc;
        
        if (!acc[transaction.categoryId]) {
          acc[transaction.categoryId] = {
            total: 0,
            count: 0,
            category: transaction.category_name
          };
        }
        
        acc[transaction.categoryId].total += transaction.amount;
        acc[transaction.categoryId].count++;
        return acc;
      }, {});

      // Generate recommendations
      const recommendations = [];
      for (const [categoryId, data] of Object.entries(categorySpending)) {
        const monthlyAverage = data.total / 3; // 3 months
        
        // Check if budget exists
        const existingBudget = await Budget.findByCategory(userId, categoryId);
        
        if (!existingBudget) {
          // Recommend new budget
          recommendations.push({
            type: 'NEW_BUDGET',
            categoryId,
            categoryName: data.category,
            suggestedAmount: Math.ceil(monthlyAverage * 1.1), // 10% buffer
            averageSpending: monthlyAverage
          });
        } else if (existingBudget.amount < monthlyAverage * 0.9) {
          // Recommend budget increase
          recommendations.push({
            type: 'INCREASE_BUDGET',
            budgetId: existingBudget.id,
            categoryName: data.category,
            currentAmount: existingBudget.amount,
            suggestedAmount: Math.ceil(monthlyAverage * 1.1),
            averageSpending: monthlyAverage
          });
        } else if (existingBudget.amount > monthlyAverage * 1.5) {
          // Recommend budget decrease
          recommendations.push({
            type: 'DECREASE_BUDGET',
            budgetId: existingBudget.id,
            categoryName: data.category,
            currentAmount: existingBudget.amount,
            suggestedAmount: Math.ceil(monthlyAverage * 1.2),
            averageSpending: monthlyAverage
          });
        }
      }

      return recommendations;
    } catch (error) {
      logger.error('Error generating budget recommendations:', error);
      throw error;
    }
  }

  /**
   * Forecast budget usage
   */
  static async forecastBudget(budget) {
    try {
      // Get past 6 months of transactions
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);

      const transactions = await Transaction.findByUser(budget.userId, {
        startDate,
        endDate,
        categoryId: budget.categoryId,
        type: 'expense'
      });

      // Group by month
      const monthlySpending = transactions.reduce((acc, transaction) => {
        const month = transaction.date.getMonth();
        acc[month] = (acc[month] || 0) + transaction.amount;
        return acc;
      }, {});

      // Calculate trend
      const months = Object.keys(monthlySpending).sort();
      if (months.length < 2) {
        return {
          forecast: budget.amount,
          trend: 0,
          confidence: 0
        };
      }

      const values = months.map(month => monthlySpending[month]);
      const trend = this.calculateTrend(values);
      const forecast = values[values.length - 1] + trend;
      const confidence = this.calculateConfidence(values);

      return {
        forecast: Math.max(0, forecast),
        trend,
        confidence
      };
    } catch (error) {
      logger.error('Error forecasting budget:', error);
      throw error;
    }
  }

  /**
   * Calculate trend using simple linear regression
   */
  static calculateTrend(values) {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, cur, i) => acc + cur * y[i], 0);
    const sumXX = x.reduce((acc, cur) => acc + cur * cur, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  /**
   * Calculate confidence score
   */
  static calculateConfidence(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalize confidence score between 0 and 1
    const coefficient = stdDev / mean;
    return Math.max(0, Math.min(1, 1 - coefficient));
  }
}

module.exports = BudgetService;