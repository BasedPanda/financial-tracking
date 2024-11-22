// budget.js
const db = require('../config/database');
const { ApiError } = require('../utils/errors');
const logger = require('../utils/logger');

class Budget {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.categoryId = data.category_id;
    this.name = data.name;
    this.amount = parseFloat(data.amount);
    this.spent = parseFloat(data.spent || 0);
    this.period = data.period;
    this.startDate = data.start_date;
    this.endDate = data.end_date;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Get budget by ID
  static async findById(id, userId) {
    try {
      const result = await db.query(
        `SELECT b.*, c.name as category_name,
          COALESCE(
            (SELECT SUM(amount)
             FROM transactions t
             WHERE t.category_id = b.category_id
             AND t.date BETWEEN b.start_date 
             AND COALESCE(b.end_date, NOW())
             AND t.type = 'expense'
            ), 0
          ) as spent
         FROM budgets b
         LEFT JOIN categories c ON b.category_id = c.id
         WHERE b.id = $1 AND b.user_id = $2`,
        [id, userId]
      );

      return result.rows[0] ? new Budget(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error finding budget:', error);
      throw error;
    }
  }

  // Get all budgets for user
  static async findByUser(userId, options = {}) {
    try {
      let query = `
        SELECT b.*, c.name as category_name,
          COALESCE(
            (SELECT SUM(amount)
             FROM transactions t
             WHERE t.category_id = b.category_id
             AND t.date BETWEEN b.start_date 
             AND COALESCE(b.end_date, NOW())
             AND t.type = 'expense'
            ), 0
          ) as spent
        FROM budgets b
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE b.user_id = $1
      `;

      const queryParams = [userId];
      let paramIndex = 2;

      if (options.period) {
        query += ` AND b.period = $${paramIndex}`;
        queryParams.push(options.period);
        paramIndex++;
      }

      if (options.startDate) {
        query += ` AND b.start_date >= $${paramIndex}`;
        queryParams.push(options.startDate);
        paramIndex++;
      }

      query += ' ORDER BY b.start_date DESC';

      const result = await db.query(query, queryParams);
      return result.rows.map(budget => new Budget(budget));
    } catch (error) {
      logger.error('Error finding budgets:', error);
      throw error;
    }
  }

  // Create new budget
  static async create(data) {
    try {
      const result = await db.query(
        `INSERT INTO budgets (
          user_id, category_id, name, amount,
          period, start_date, end_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          data.userId,
          data.categoryId,
          data.name,
          data.amount,
          data.period,
          data.startDate,
          data.endDate
        ]
      );

      return new Budget(result.rows[0]);
    } catch (error) {
      logger.error('Error creating budget:', error);
      throw error;
    }
  }

  // Update budget
  async update(data) {
    try {
      const result = await db.query(
        `UPDATE budgets
         SET name = $1,
             amount = $2,
             period = $3,
             start_date = $4,
             end_date = $5,
             updated_at = NOW()
         WHERE id = $6 AND user_id = $7
         RETURNING *`,
        [
          data.name || this.name,
          data.amount || this.amount,
          data.period || this.period,
          data.startDate || this.startDate,
          data.endDate || this.endDate,
          this.id,
          this.userId
        ]
      );

      if (!result.rows[0]) {
        throw new ApiError('Budget not found', 404);
      }

      Object.assign(this, new Budget(result.rows[0]));
      return this;
    } catch (error) {
      logger.error('Error updating budget:', error);
      throw error;
    }
  }

  // Delete budget
  async delete() {
    try {
      const result = await db.query(
        'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING *',
        [this.id, this.userId]
      );

      if (!result.rows[0]) {
        throw new ApiError('Budget not found', 404);
      }

      return true;
    } catch (error) {
      logger.error('Error deleting budget:', error);
      throw error;
    }
  }

  // Get budget progress
  async getProgress() {
    try {
      const spent = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as total_spent
         FROM transactions
         WHERE category_id = $1
         AND date BETWEEN $2 AND COALESCE($3, NOW())
         AND type = 'expense'`,
        [this.categoryId, this.startDate, this.endDate]
      );

      const totalSpent = parseFloat(spent.rows[0].total_spent);
      const progress = (totalSpent / this.amount) * 100;

      return {
        spent: totalSpent,
        remaining: this.amount - totalSpent,
        progress: Math.min(progress, 100),
        isOverBudget: totalSpent > this.amount
      };
    } catch (error) {
      logger.error('Error getting budget progress:', error);
      throw error;
    }
  }
}

module.exports = Budget;