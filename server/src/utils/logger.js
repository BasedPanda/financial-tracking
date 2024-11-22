const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about our colors
winston.addColors(colors);

// Define format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define which transports to use based on environment
const transports = [
  // Always write to console
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    ),
  }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  // Regular log file
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'fintrack-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info',
    })
  );

  // Error log file
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'fintrack-error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  // Don't exit on uncaught errors
  exitOnError: false,
});

// Handle uncaught exceptions
logger.exceptions.handle(
  new winston.transports.File({ filename: 'logs/exceptions.log' })
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Promise Rejection:', error);
});

// Create a stream object for Morgan
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

// Add convenience methods for structured logging
logger.logRequest = (req, status = 200, error = null) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    status,
    ip: req.ip,
    userId: req.user?.id,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
  };

  if (error) {
    logData.error = error.message;
    logData.stack = error.stack;
    logger.error('Request Error:', logData);
  } else {
    logger.info('Request:', logData);
  }
};

logger.logDatabase = (operation, query, params, duration, error = null) => {
  const logData = {
    operation,
    query,
    params,
    duration,
    timestamp: new Date().toISOString(),
  };

  if (error) {
    logData.error = error.message;
    logData.stack = error.stack;
    logger.error('Database Error:', logData);
  } else {
    logger.debug('Database Query:', logData);
  }
};

logger.logAPI = (service, method, duration, error = null) => {
  const logData = {
    service,
    method,
    duration,
    timestamp: new Date().toISOString(),
  };

  if (error) {
    logData.error = error.message;
    logData.stack = error.stack;
    logger.error('API Error:', logData);
  } else {
    logger.debug('API Call:', logData);
  }
};

module.exports = logger;