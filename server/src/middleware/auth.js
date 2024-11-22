const jwt = require('../config/jwt');
const { ApiError } = require('../utils/errors');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('No authentication token, authorization denied', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify token
      const decoded = jwt.verifyToken(token);
      
      // Check token type
      if (decoded.type !== 'access') {
        throw new ApiError('Invalid token type', 401);
      }

      // Add user to request
      req.user = {
        id: decoded.userId,
        email: decoded.email
      };

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new ApiError('Token has expired', 401);
      }
      throw new ApiError('Token is not valid', 401);
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    next(error);
  }
};

// Optional authentication middleware
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verifyToken(token);
      if (decoded.type === 'access') {
        req.user = {
          id: decoded.userId,
          email: decoded.email
        };
      }
    } catch (error) {
      // Don't throw error for optional auth
      logger.debug('Optional auth token invalid:', error);
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    next(error);
  }
};

// Role-based authentication middleware
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError('Authentication required', 401);
      }

      // Check if user has required role
      if (!roles.includes(req.user.role)) {
        throw new ApiError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      logger.error('Role authorization error:', error);
      next(error);
    }
  };
};

module.exports = {
  auth,
  optionalAuth,
  requireRole
};