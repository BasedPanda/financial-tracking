const logger = require('../utils/logger');
const { ApiError } = require('../utils/errors');

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    user: req.user?.id
  });

  // Handle specific error types
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        details: err.details
      }
    });
  }

  // Handle database errors
  if (err.code && err.code.startsWith('23')) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Database constraint violation',
        code: err.code,
        details: err.detail
      }
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation error',
        details: err.details
      }
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid token',
        details: err.message
      }
    });
  }

  // Handle rate limit errors
  if (err.type === 'request-rate-limit') {
    return res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests',
        retryAfter: err.retryAfter
      }
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message
    }
  });
};

// Not found middleware
const notFound = (req, res, next) => {
  const error = new ApiError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      user: req.user?.id
    });
  });

  next();
};

module.exports = {
  errorHandler,
  notFound,
  requestLogger
};