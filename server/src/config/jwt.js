const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// JWT configuration
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
  issuer: process.env.JWT_ISSUER || 'fintrack',
  audience: process.env.JWT_AUDIENCE || 'fintrack-client'
};

// Validate JWT configuration
if (!process.env.JWT_SECRET) {
  logger.warn('JWT_SECRET not set in environment variables. Using default secret (not recommended for production)');
}

// Generate access token
const generateAccessToken = (user) => {
  try {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        type: 'access'
      },
      JWT_CONFIG.secret,
      {
        expiresIn: JWT_CONFIG.accessTokenExpiry,
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience
      }
    );
  } catch (err) {
    logger.error('Error generating access token:', err);
    throw err;
  }
};

// Generate refresh token
const generateRefreshToken = (user) => {
  try {
    return jwt.sign(
      {
        userId: user.id,
        type: 'refresh'
      },
      JWT_CONFIG.secret,
      {
        expiresIn: JWT_CONFIG.refreshTokenExpiry,
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience
      }
    );
  } catch (err) {
    logger.error('Error generating refresh token:', err);
    throw err;
  }
};

// Verify token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_CONFIG.secret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      logger.debug('Token expired');
    } else {
      logger.error('Error verifying token:', err);
    }
    throw err;
  }
};

// Decode token without verification
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (err) {
    logger.error('Error decoding token:', err);
    throw err;
  }
};

module.exports = {
  JWT_CONFIG,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken
};