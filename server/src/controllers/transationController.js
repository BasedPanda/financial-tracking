// transactionController.js
const db = require('../config/database');
const plaid = require('../config/plaid');
const logger = require('../utils/logger');
const { ApiError } = require('../utils/errors');

class TransactionController {
  // Get transactions
  static async getTransactions(req, res, next) {
    try {
      const userId = req.user.id;
      const {
        startDate,
        endDate,
        accountId,
        category,
        minAmount,
        maxAmount,
        page = 1,
        limit = 20
      } = req.query;

      // Build query
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
      if (startDate) {
        query += ` AND t.date >= $${paramIndex}`;
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        query += ` AND t.date <= $${paramIndex}`;
        queryParams.push(endDate);
        paramIndex++;
      }

      if (accountId) {
        query += ` AND t.account_id = $${paramIndex}`;
        queryParams.push(accountId);
        paramIndex++;
      }

      if (category) {
        query += ` AND c.name = $${paramIndex}`;
        queryParams.push(category);
        paramIndex++;
      }

      if (minAmount) {
        query += ` AND t.amount >= $${paramIndex}`;
        queryParams.push(minAmount);
        paramIndex++;
      }

      if (maxAmount) {
        query += ` AND t.amount <= $${paramIndex}`;
        queryParams.push(maxAmount);
        paramIndex++;
      }

      // Add sorting and pagination
      const offset = (page - 1) * limit;
      query += ` ORDER BY t.date DESC, t.created_at DESC
                 LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*)
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1
        ${query.split('WHERE')[1].split('ORDER BY')[0]}
      `;

      // Execute queries
      const [transactions, countResult] = await Promise.all([
        db.query(query, queryParams),
        db.query(countQuery, queryParams.slice(0, -2))
      ]);

      const totalCount = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalCount / limit);

      return res.json({
        success: true,
        data: {
          transactions: transactions.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: totalCount,
            itemsPerPage: limit
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching transactions:', error);
      next(error);
    }
  }

  // Get single transaction
  static async getTransactionById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await db.query(
        `SELECT t.*, a.name as account_name, c.name as category_name
         FROM transactions t
         LEFT JOIN accounts a ON t.account_id = a.id
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.id = $1 AND t.user_id = $2`,
        [id, userId]
      );

      if (!result.rows[0]) {
        throw new ApiError('Transaction not found', 404);
      }

      return res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Error fetching transaction:', error);
      next(error);
    }
  }

  // Create manual transaction
  static async createTransaction(req, res, next) {
    try {
      const userId = req.user.id;
      const {
        accountId,
        categoryId,
        type,
        amount,
        description,
        date,
        notes
      } = req.body;

      // Validate account ownership
      const account = await db.query(
        'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
        [accountId, userId]
      );

      if (!account.rows[0]) {
        throw new ApiError('Account not found', 404);
      }

      // Create transaction
      const result = await db.query(
        `INSERT INTO transactions (
          user_id, account_id, category_id, type,
          amount, description, date, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          userId,
          accountId,
          categoryId,
          type,
          amount,
          description,
          date,
          notes
        ]
      );

      // Update account balance
      await db.query(
        'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
        [type === 'income' ? amount : -amount, accountId]
      );

      return res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Error creating transaction:', error);
      next(error);
    }
  }

  // Update transaction
  static async updateTransaction(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const {
        categoryId,
        notes
      } = req.body;

      const result = await db.query(
        `UPDATE transactions
         SET category_id = $1,
             notes = $2,
             updated_at = NOW()
         WHERE id = $3 AND user_id = $4
         RETURNING *`,
        [categoryId, notes, id, userId]
      );

      if (!result.rows[0]) {
        throw new ApiError('Transaction not found', 404);
      }

      return res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Error updating transaction:', error);
      next(error);
    }
  }

  // Delete transaction
  static async deleteTransaction(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await db.transaction(async (client) => {
        // Get transaction details
        const transaction = await client.query(
          'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
          [id, userId]
        );

        if (!transaction.rows[0]) {
          throw new ApiError('Transaction not found', 404);
        }

        // Update account balance
        await client.query(
          'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
          [
            transaction.rows[0].type === 'income' 
              ? transaction.rows[0].amount 
              : -transaction.rows[0].amount,
            transaction.rows[0].account_id
          ]
        );

        // Delete transaction
        await client.query(
          'DELETE FROM transactions WHERE id = $1',
          [id]
        );
      });

      return res.json({
        success: true,
        message: 'Transaction deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting transaction:', error);
      next(error);
    }
  }

  // Sync transactions from Plaid
  static async syncTransactions(req, res, next) {
    try {
      const userId = req.user.id;

      // Get user's Plaid credentials
      const credentials = await db.query(
        'SELECT * FROM plaid_credentials WHERE user_id = $1',
        [userId]
      );

      let newTransactions = 0;
      let updatedTransactions = 0;

      for (const cred of credentials.rows) {
        // Get transactions from Plaid
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30); // Last 30 days

        const transactions = await plaid.getTransactions(
          cred.access_token,
          startDate.toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        );

        // Process each transaction
        for (const transaction of transactions) {
          const result = await db.query(
            `INSERT INTO transactions (
              user_id, account_id, plaid_transaction_id,
              type, amount, description, date, location
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (plaid_transaction_id) 
            DO UPDATE SET
              amount = EXCLUDED.amount,
              description = EXCLUDED.description,
              location = EXCLUDED.location
            RETURNING *`,
            [
              userId,
              transaction.account_id,
              transaction.transaction_id,
              transaction.amount < 0 ? 'expense' : 'income',
              Math.abs(transaction.amount),
              transaction.name,
              transaction.date,
              transaction.location ? JSON.stringify(transaction.location) : null
            ]
          );

          if (result.rows[0].created_at === result.rows[0].updated_at) {
            newTransactions++;
          } else {
            updatedTransactions++;
          }
        }
      }

      return res.json({
        success: true,
        data: {
          newTransactions,
          updatedTransactions
        }
      });
    } catch (error) {
      logger.error('Error syncing transactions:', error);
      next(error);
    }
  }

  // Get transaction statistics
  static async getTransactionStats(req, res, next) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      const result = await db.query(
        `SELECT
           COUNT(*) as total_transactions,
           SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
           SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
           AVG(amount) as avg_transaction_amount,
           c.name as top_category,
           COUNT(*) FILTER (WHERE type = 'expense') as expense_count,
           COUNT(*) FILTER (WHERE type = 'income') as income_count
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1
         AND ($2::date IS NULL OR t.date >= $2)
         AND ($3::date IS NULL OR t.date <= $3)
         GROUP BY c.name
         ORDER BY COUNT(*) DESC
         LIMIT 1`,
        [userId, startDate, endDate]
      );

      return res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Error getting transaction stats:', error);
      next(error);
    }
  }
}

module.exports = TransactionController;