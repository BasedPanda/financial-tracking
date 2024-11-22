// account.js
const db = require('../config/database');
const { ApiError } = require('../utils/errors');
const logger = require('../utils/logger');

class Account {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.plaidAccountId = data.plaid_account_id;
    this.name = data.name;
    this.type = data.type;
    this.balance = parseFloat(data.balance);
    this.currency = data.currency;
    this.isActive = data.is_active;
    this.lastSynced = data.last_synced;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Get account by ID
  static async findById(id, userId) {
    try {
      const result = await db.query(
        `SELECT a.*, pc.institution_name 
         FROM accounts a
         LEFT JOIN plaid_credentials pc ON a.plaid_account_id = pc.item_id
         WHERE a.id = $1 AND a.user_id = $2`,
        [id, userId]
      );

      return result.rows[0] ? new Account(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error finding account:', error);
      throw error;
    }
  }

  // Get all accounts for user
  static async findByUser(userId, options = {}) {
    try {
      let query = `
        SELECT a.*, pc.institution_name 
        FROM accounts a
        LEFT JOIN plaid_credentials pc ON a.plaid_account_id = pc.item_id
        WHERE a.user_id = $1
      `;

      const queryParams = [userId];

      if (options.isActive !== undefined) {
        query += ' AND a.is_active = $2';
        queryParams.push(options.isActive);
      }

      query += ' ORDER BY a.created_at DESC';

      const result = await db.query(query, queryParams);
      return result.rows.map(account => new Account(account));
    } catch (error) {
      logger.error('Error finding accounts:', error);
      throw error;
    }
  }

  // Create new account
  static async create(data) {
    try {
      const result = await db.query(
        `INSERT INTO accounts (
          user_id, plaid_account_id, name, type,
          balance, currency, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          data.userId,
          data.plaidAccountId,
          data.name,
          data.type,
          data.balance,
          data.currency,
          true
        ]
      );

      return new Account(result.rows[0]);
    } catch (error) {
      logger.error('Error creating account:', error);
      throw error;
    }
  }

  // Update account
  async update(data) {
    try {
      const result = await db.query(
        `UPDATE accounts
         SET name = $1,
             balance = $2,
             currency = $3,
             updated_at = NOW()
         WHERE id = $4 AND user_id = $5
         RETURNING *`,
        [
          data.name || this.name,
          data.balance || this.balance,
          data.currency || this.currency,
          this.id,
          this.userId
        ]
      );

      if (!result.rows[0]) {
        throw new ApiError('Account not found', 404);
      }

      Object.assign(this, new Account(result.rows[0]));
      return this;
    } catch (error) {
      logger.error('Error updating account:', error);
      throw error;
    }
  }

  // Update balance
  async updateBalance(amount, type) {
    try {
      const result = await db.query(
        `UPDATE accounts
         SET balance = balance + $1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [type === 'credit' ? amount : -amount, this.id]
      );

      Object.assign(this, new Account(result.rows[0]));
      return this;
    } catch (error) {
      logger.error('Error updating account balance:', error);
      throw error;
    }
  }

  // Soft delete account
  async delete() {
    try {
      const result = await db.query(
        `UPDATE accounts
         SET is_active = false,
             updated_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [this.id, this.userId]
      );

      if (!result.rows[0]) {
        throw new ApiError('Account not found', 404);
      }

      return true;
    } catch (error) {
      logger.error('Error deleting account:', error);
      throw error;
    }
  }

  // Get account balance history
  async getBalanceHistory(startDate, endDate) {
    try {
      const result = await db.query(
        `SELECT date, balance
         FROM account_balance_history
         WHERE account_id = $1
         AND date BETWEEN $2 AND $3
         ORDER BY date ASC`,
        [this.id, startDate, endDate]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting balance history:', error);
      throw error;
    }
  }

  // Get account statistics
  async getStatistics(startDate, endDate) {
    try {
      const result = await db.query(
        `SELECT
           COUNT(*) as transaction_count,
           SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
           SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
           AVG(amount) as avg_transaction_amount
         FROM transactions
         WHERE account_id = $1
         AND date BETWEEN $2 AND $3`,
        [this.id, startDate, endDate]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting account statistics:', error);
      throw error;
    }
  }
}

module.exports = Account;