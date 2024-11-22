// authController.js
const bcrypt = require('bcrypt');
const db = require('../config/database');
const jwt = require('../config/jwt');
const logger = require('../utils/logger');
const { ApiError } = require('../utils/errors');
const { validateEmail, validatePassword } = require('../utils/validators');

class AuthController {
  // User registration
  static async register(req, res, next) {
    try {
      const { email, password, name } = req.body;

      // Validate input
      if (!validateEmail(email)) {
        throw new ApiError('Invalid email format', 400);
      }

      if (!validatePassword(password)) {
        throw new ApiError('Password does not meet requirements', 400);
      }

      // Check if user exists
      const existingUser = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows[0]) {
        throw new ApiError('Email already registered', 409);
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const result = await db.query(
        `INSERT INTO users (email, password_hash, name)
         VALUES ($1, $2, $3)
         RETURNING id, email, name, created_at`,
        [email.toLowerCase(), hashedPassword, name]
      );

      const user = result.rows[0];

      // Generate tokens
      const accessToken = jwt.generateAccessToken(user);
      const refreshToken = jwt.generateRefreshToken(user);

      return res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    } catch (error) {
      logger.error('Error in registration:', error);
      next(error);
    }
  }

  // User login
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Get user
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      const user = result.rows[0];

      if (!user) {
        throw new ApiError('Invalid credentials', 401);
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        throw new ApiError('Invalid credentials', 401);
      }

      // Generate tokens
      const accessToken = jwt.generateAccessToken(user);
      const refreshToken = jwt.generateRefreshToken(user);

      return res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    } catch (error) {
      logger.error('Error in login:', error);
      next(error);
    }
  }

  // Refresh token
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ApiError('Refresh token required', 400);
      }

      // Verify refresh token
      const decoded = jwt.verifyToken(refreshToken);
      if (decoded.type !== 'refresh') {
        throw new ApiError('Invalid token type', 400);
      }

      // Get user
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [decoded.userId]
      );

      const user = result.rows[0];
      if (!user) {
        throw new ApiError('User not found', 404);
      }

      // Generate new tokens
      const newAccessToken = jwt.generateAccessToken(user);
      const newRefreshToken = jwt.generateRefreshToken(user);

      return res.json({
        success: true,
        data: {
          tokens: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
          }
        }
      });
    } catch (error) {
      logger.error('Error refreshing token:', error);
      next(error);
    }
  }

  // Get user profile
  static async getProfile(req, res, next) {
    try {
      const userId = req.user.id;

      const result = await db.query(
        `SELECT id, email, name, created_at, preferred_currency
         FROM users WHERE id = $1`,
        [userId]
      );

      return res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Error fetching profile:', error);
      next(error);
    }
  }

  // Update user profile
  static async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { name, email, currentPassword, newPassword } = req.body;

      await db.transaction(async (client) => {
        // Get current user data
        const user = await client.query(
          'SELECT * FROM users WHERE id = $1',
          [userId]
        );

        if (!user.rows[0]) {
          throw new ApiError('User not found', 404);
        }

        // If changing password
        if (newPassword) {
          if (!currentPassword) {
            throw new ApiError('Current password required', 400);
          }

          // Verify current password
          const validPassword = await bcrypt.compare(
            currentPassword,
            user.rows[0].password_hash
          );

          if (!validPassword) {
            throw new ApiError('Invalid current password', 401);
          }

          // Validate new password
          if (!validatePassword(newPassword)) {
            throw new ApiError('New password does not meet requirements', 400);
          }

          // Hash new password
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(newPassword, salt);

          // Update password
          await client.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [hashedPassword, userId]
          );
        }

        // Update profile data
        const updates = [];
        const values = [];
        let valueIndex = 1;

        if (name) {
          updates.push(`name = $${valueIndex}`);
          values.push(name);
          valueIndex++;
        }

        if (email) {
          if (!validateEmail(email)) {
            throw new ApiError('Invalid email format', 400);
          }
          updates.push(`email = $${valueIndex}`);
          values.push(email.toLowerCase());
          valueIndex++;
        }

        if (updates.length > 0) {
          values.push(userId);
          const result = await client.query(
            `UPDATE users 
             SET ${updates.join(', ')}, updated_at = NOW()
             WHERE id = $${valueIndex}
             RETURNING id, email, name, created_at, updated_at`,
            values
          );

          return res.json({
            success: true,
            data: result.rows[0]
          });
        } else {
          return res.json({
            success: true,
            data: user.rows[0]
          });
        }
      });
    } catch (error) {
      logger.error('Error updating profile:', error);
      next(error);
    }
  }

  // Logout
  static async logout(req, res, next) {
    try {
      // In a more complex implementation, you might want to:
      // 1. Invalidate the refresh token
      // 2. Clear any session data
      // 3. Update user's last activity

      return res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Error in logout:', error);
      next(error);
    }
  }
}

module.exports = AuthController;