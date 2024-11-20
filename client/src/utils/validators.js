// validators.js
export const validators = {
    // Email validator
    email: (email) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        isValid: regex.test(email),
        message: regex.test(email) ? '' : 'Please enter a valid email address',
      };
    },
  
    // Password validator (minimum 8 characters, at least one number, one letter)
    password: (password) => {
      const checks = {
        length: password.length >= 8,
        number: /\d/.test(password),
        letter: /[a-zA-Z]/.test(password),
      };
  
      const isValid = Object.values(checks).every(Boolean);
      const messages = [];
  
      if (!checks.length) messages.push('Password must be at least 8 characters');
      if (!checks.number) messages.push('Password must contain at least one number');
      if (!checks.letter) messages.push('Password must contain at least one letter');
  
      return {
        isValid,
        message: messages.join('. '),
        checks,
      };
    },
  
    // Phone number validator
    phone: (phone, country = 'US') => {
      const patterns = {
        US: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
      };
  
      const pattern = patterns[country];
      if (!pattern) return { isValid: false, message: 'Unsupported country code' };
  
      return {
        isValid: pattern.test(phone),
        message: pattern.test(phone) ? '' : 'Please enter a valid phone number',
      };
    },
  
    // Credit card validator (basic Luhn algorithm)
    creditCard: (number) => {
      const cleaned = number.replace(/\D/g, '');
      
      if (cleaned.length < 13 || cleaned.length > 19) {
        return {
          isValid: false,
          message: 'Invalid card number length',
        };
      }
  
      // Luhn algorithm
      let sum = 0;
      let isEven = false;
  
      for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned[i]);
  
        if (isEven) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }
  
        sum += digit;
        isEven = !isEven;
      }
  
      return {
        isValid: sum % 10 === 0,
        message: sum % 10 === 0 ? '' : 'Invalid card number',
      };
    },
  
    // Amount validator
    amount: (amount, { min = 0, max = Infinity } = {}) => {
      const number = parseFloat(amount);
      
      if (isNaN(number)) {
        return {
          isValid: false,
          message: 'Please enter a valid number',
        };
      }
  
      if (number < min) {
        return {
          isValid: false,
          message: `Amount must be at least ${formatters.currency(min)}`,
        };
      }
  
      if (number > max) {
        return {
          isValid: false,
          message: `Amount cannot exceed ${formatters.currency(max)}`,
        };
      }
  
      return {
        isValid: true,
        message: '',
      };
    },
  
    // Date validator
    date: (date, { min, max, format = 'YYYY-MM-DD' } = {}) => {
      const parsed = new Date(date);
      
      if (isNaN(parsed.getTime())) {
        return {
          isValid: false,
          message: 'Please enter a valid date',
        };
      }
  
      if (min && parsed < new Date(min)) {
        return {
          isValid: false,
          message: `Date must be after ${formatters.date.full(min)}`,
        };
      }
  
      if (max && parsed > new Date(max)) {
        return {
          isValid: false,
          message: `Date must be before ${formatters.date.full(max)}`,
        };
      }
  
      return {
        isValid: true,
        message: '',
      };
    },
  
    // Required field validator
    required: (value) => {
      const isValid = value !== null && value !== undefined && value !== '';
      return {
        isValid,
        message: isValid ? '' : 'This field is required',
      };
    },
  
    // Length validator
    length: (value, { min = 0, max = Infinity } = {}) => {
      const length = value?.length || 0;
      
      if (length < min) {
        return {
          isValid: false,
          message: `Must be at least ${min} characters`,
        };
      }
  
      if (length > max) {
        return {
          isValid: false,
          message: `Must not exceed ${max} characters`,
        };
      }
  
      return {
        isValid: true,
        message: '',
      };
    },
  };