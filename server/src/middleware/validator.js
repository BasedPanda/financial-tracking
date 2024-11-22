const { ApiError } = require('../utils/errors');
const logger = require('../utils/logger');

class Validator {
  static validate(schema) {
    return async (req, res, next) => {
      try {
        const validationOptions = {
          abortEarly: false,
          stripUnknown: true,
          context: { user: req.user }
        };

        if (schema.body) {
          req.body = await schema.body.validateAsync(
            req.body,
            validationOptions
          );
        }

        if (schema.query) {
          req.query = await schema.query.validateAsync(
            req.query,
            validationOptions
          );
        }

        if (schema.params) {
          req.params = await schema.params.validateAsync(
            req.params,
            validationOptions
          );
        }

        next();
      } catch (error) {
        logger.debug('Validation error:', error);
        
        if (error.isJoi) {
          return next(new ApiError('Validation error', 400, {
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message
            }))
          }));
        }
        
        next(error);
      }
    };
  }

  static validateBody(schema) {
    return this.validate({ body: schema });
  }

  static validateQuery(schema) {
    return this.validate({ query: schema });
  }

  static validateParams(schema) {
    return this.validate({ params: schema });
  }

  // Common validation schemas
  static schemas = {
    id: require('../schemas/id'),
    pagination: require('../schemas/pagination'),
    dateRange: require('../schemas/dateRange'),
    email: require('../schemas/email'),
    password: require('../schemas/password'),
    transaction: require('../schemas/transaction'),
    account: require('../schemas/account'),
    category: require('../schemas/category')
  };

  // Helper functions for common validations
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  }

  static validateDate(date) {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }

  static validateUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static validateAmount(amount) {
    return !isNaN(amount) && amount >= 0;
  }

  static validateCurrency(currency) {
    const validCurrencies = ['USD', 'EUR', 'GBP'];
    return validCurrencies.includes(currency);
  }

  // Custom field validators
  static customValidators = {
    isPositive: (value) => value > 0,
    isFutureDate: (value) => new Date(value) > new Date(),
    isValidCategory: async (categoryId, { user }) => {
      // Example of custom async validation
      try {
        const category = await db.query(
          'SELECT * FROM categories WHERE id = $1',
          [categoryId]
        );
        return category.rows.length > 0;
      } catch (error) {
        logger.error('Category validation error:', error);
        return false;
      }
    }
  };
}

module.exports = Validator;