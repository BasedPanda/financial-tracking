const bcrypt = require('bcrypt');
const db = require('../config/database');
const { ApiError } = require('../utils/errors');
const logger = require('../utils/logger');

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.name = data.name;
    this.preferredCurrency = data.preferred_currency;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Get user by ID
  static async findById(id) {
    try {
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );

      return result.rows[0] ? new User(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error finding user:', error);
      throw error;
    }
  }

  // Get user by email
  static async findByEmail(email) {
    try {
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      return result.rows[0] ? new User(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Create new user
  static async create(data) {
    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);

      const result = await db.query(
        `INSERT INTO users (
          email, password_hash, name, preferred_currency
        ) VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [
          data.email.toLowerCase(),
          hashedPassword,
          data.name,
          data.preferredCurrency || 'USD'
        ]
      );

      return new User(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new ApiError('Email already registered', 409);
      }
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  async update(data) {
    try {
      const updates = [];
      const values = [];
      let valueIndex = 1;

      if (data.name) {
        updates.push(`name = $${valueIndex}`);
        values.push(data.name);
        valueIndex++;
      }

      if (data.email) {
        updates.push(`email = $${valueIndex}`);
        values.push(data.email.toLowerCase());
        valueIndex++;
      }

      if (data.preferredCurrency) {
        updates.push(`preferred_currency = $${valueIndex}`);
        values.push(data.preferredCurrency);
        valueIndex++;
      }

      if (data.password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);
        updates.push(`password_hash = $${valueIndex}`);
        values.push(hashedPassword);
        valueIndex++;
      }

      if (updates.length === 0) {
        return this;
      }

      values.push(this.id);
      const result = await db.query(
        `UPDATE users
         SET ${updates.join(', ')}, updated_at = NOW()
         WHERE id = $${valueIndex}
         RETURNING *`,
        values
      );

      Object.assign(this, new User(result.rows[0]));
      return this;
    } catch (error) {
      if (error.code === '23505') {
        throw new ApiError('Email already in use', 409);
      }
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  // Verify password
  async verifyPassword(password) {
    try {
      const result = await db.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [this.id]
      );

      if (!result.rows[0]) {
        throw new ApiError('User not found', 404);
      }

      return bcrypt.compare(password, result.rows[0].password_hash);
    } catch (error) {
      logger.error('Error verifying password:', error);
      throw error;
    }
  }

  // Delete user
  async delete() {
    try {
      await db.transaction(async (client) => {
        // Delete all user data
        await client.query('DELETE FROM transactions WHERE user_id = $1', [this.id]);
        await client.query('DELETE FROM accounts WHERE user_id = $1', [this.id]);
        await client.query('DELETE FROM budgets WHERE user_id = $1', [this.id]);
        await client.query('DELETE FROM plaid_credentials WHERE user_id = $1', [this.id]);
        await client.query('DELETE FROM users WHERE id = $1', [this.id]);
      });

      return true;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  // Get user statistics
  async getStatistics() {
    try {
      const stats = await db.query(
        `SELECT
           (SELECT COUNT(*) FROM accounts WHERE user_id = $1) as account_count,
           (SELECT COUNT(*) FROM transactions WHERE user_id = $1) as transaction_count,
           (SELECT COUNT(*) FROM budgets WHERE user_id = $1) as budget_count,
           (SELECT SUM(balance) FROM accounts WHERE user_id = $1) as total_balance,
           (
             SELECT json_build_object(
               'expenses', COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0),
               'income', COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)
             )
             FROM transactions
             WHERE user_id = $1
             AND date >= date_trunc('month', CURRENT_DATE)
           ) as current_month
        `,
        [this.id]
      );

      return stats.rows[0];
    } catch (error) {
      logger.error('Error getting user statistics:', error);
      throw error;
    }
  }
}

module.exports = User;