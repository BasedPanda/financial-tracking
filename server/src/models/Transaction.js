// transaction.js
const db = require('../config/database');
const { ApiError } = require('../utils/errors');
const logger = require('../utils/logger');

class Transaction {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.accountId = data.account_id;
    this.categoryId = data.category_id;
    this.plaidTransactionId = data.plaid_transaction_id;
    this.type = data.type;
    this.amount = parseFloat(data.amount);
    this.description = data.description;
    this.date = data.date;
    this.location = data.location;
    this.notes = data.notes;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Get transaction by ID
  static async findById(id, userId) {
    try {
      const result = await db.query(
        `SELECT t.*, a.name as account_name, c.name as category_name
         FROM transactions t
         LEFT JOIN accounts a ON t.account_id = a.id
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.id = $1 AND t.user_id = $2`,
        [id, userId]
      );

      return result.rows[0] ? new Transaction(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error finding transaction:', error);
      throw error;
    }
  }

  // Get all transactions for user
  static async findByUser(userId, options = {}) {
    try {
      let query = `
        SELECT t.*, a.name as account_name, c.name as category_name
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1
      `;

      const queryParams = [userId];
      let paramIndex = 2;

      // Add filters
      if (options.startDate) {
        query += ` AND t.date >= $${paramIndex}`;
        queryParams.push(options.startDate);
        paramIndex++;
      }

      if (options.endDate) {
        query += ` AND t.date <= $${paramIndex}`;
        queryParams.push(options.endDate);
        paramIndex++;
      }

      if (options.accountId) {
        query += ` AND t.account_id = $${paramIndex}`;
        queryParams.push(options.accountId);
        paramIndex++;
      }

      if (options.categoryId) {
        query += ` AND t.category_id = $${paramIndex}`;
        queryParams.push(options.categoryId);
        paramIndex++;
      }

      if (options.type) {
        query += ` AND t.type = $${paramIndex}`;
        queryParams.push(options.type);
        paramIndex++;
      }

      if (options.minAmount) {
        query += ` AND t.amount >= $${paramIndex}`;
        queryParams.push(options.minAmount);
        paramIndex++;
      }

      if (options.maxAmount) {
        query += ` AND t.amount <= $${paramIndex}`;
        queryParams.push(options.maxAmount);
        paramIndex++;
      }

      // Add sorting and pagination
      query += ` ORDER BY t.date DESC, t.created_at DESC`;
      
      if (options.limit) {
        query += ` LIMIT $${paramIndex}`;
        queryParams.push(options.limit);
        paramIndex++;

        if (options.offset) {
          query += ` OFFSET $${paramIndex}`;
          queryParams.push(options.offset);
        }
      }

      const result = await db.query(query, queryParams);
      return result.rows.map(transaction => new Transaction(transaction));
    } catch (error) {
      logger.error('Error finding transactions:', error);
      throw error;
    }
  }

  // Create new transaction
  static async create(data) {
    try {
      const result = await db.transaction(async (client) => {
        // Create transaction
        const transaction = await client.query(
          `INSERT INTO transactions (
            user_id, account_id, category_id, plaid_transaction_id,
            type, amount, description, date, location, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *`,
          [
            data.userId,
            data.accountId,
            data.categoryId,
            data.plaidTransactionId,
            data.type,
            data.amount,
            data.description,
            data.date,
            data.location,
            data.notes
          ]
        );

        // Update account balance
        await client.query(
          `UPDATE accounts
           SET balance = balance + $1
           WHERE id = $2`,
          [data.type === 'income' ? data.amount : -data.amount, data.accountId]
        );

        return transaction.rows[0];
      });

      return new Transaction(result);
    } catch (error) {
      logger.error('Error creating transaction:', error);
      throw error;
    }
  }

  // Update transaction
  async update(data) {
    try {
      const result = await db.transaction(async (client) => {
        // Get original transaction for balance adjustment
        const original = await client.query(
          'SELECT * FROM transactions WHERE id = $1',
          [this.id]
        );

        if (!original.rows[0]) {
          throw new ApiError('Transaction not found', 404);
        }

        // Update transaction
        const updated = await client.query(
          `UPDATE transactions
           SET category_id = $1,
               description = $2,
               notes = $3,
               updated_at = NOW()
           WHERE id = $4 AND user_id = $5
           RETURNING *`,
          [
            data.categoryId || this.categoryId,
            data.description || this.description,
            data.notes || this.notes,
            this.id,
            this.userId
          ]
        );

        if (data.amount && data.amount !== original.rows[0].amount) {
          // Adjust account balance
          const balanceAdjustment = 
            (data.amount - original.rows[0].amount) * 
            (original.rows[0].type === 'income' ? 1 : -1);

          await client.query(
            `UPDATE accounts
             SET balance = balance + $1
             WHERE id = $2`,
            [balanceAdjustment, this.accountId]
          );
        }

        return updated.rows[0];
      });

      Object.assign(this, new Transaction(result));
      return this;
    } catch (error) {
      logger.error('Error updating transaction:', error);
      throw error;
    }
  }

  // Delete transaction
  async delete() {
    try {
      await db.transaction(async (client) => {
        // Get transaction details first
        const transaction = await client.query(
          'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
          [this.id, this.userId]
        );

        if (!transaction.rows[0]) {
          throw new ApiError('Transaction not found', 404);
        }

        // Revert account balance
        await client.query(
          `UPDATE accounts
           SET balance = balance + $1
           WHERE id = $2`,
          [
            transaction.rows[0].type === 'income' 
              ? -transaction.rows[0].amount 
              : transaction.rows[0].amount,
            transaction.rows[0].account_id
          ]
        );

        // Delete transaction
        await client.query(
          'DELETE FROM transactions WHERE id = $1',
          [this.id]
        );
      });

      return true;
    } catch (error) {
      logger.error('Error deleting transaction:', error);
      throw error;
    }
  }

  // Get transaction statistics
  static async getStatistics(userId, startDate, endDate) {
    try {
      const result = await db.query(
        `SELECT
           COUNT(*) as total_transactions,
           SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
           SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
           AVG(amount) as avg_transaction_amount,
           MODE() WITHIN GROUP (ORDER BY category_id) as most_common_category
         FROM transactions
         WHERE user_id = $1
         AND date BETWEEN $2 AND $3`,
        [userId, startDate, endDate]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting transaction statistics:', error);
      throw error;
    }
  }
}

module.exports = Transaction;