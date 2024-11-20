// formatters.js
export const formatters = {
    // Currency formatters
    currency: (amount, currency = 'USD', locale = 'en-US') => {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    },
  
    // Percentage formatters
    percentage: (value, decimals = 1, locale = 'en-US') => {
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value / 100);
    },
  
    // Date formatters
    date: {
      full: (date, locale = 'en-US') => {
        return new Date(date).toLocaleDateString(locale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      },
  
      short: (date, locale = 'en-US') => {
        return new Date(date).toLocaleDateString(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      },
  
      monthYear: (date, locale = 'en-US') => {
        return new Date(date).toLocaleDateString(locale, {
          year: 'numeric',
          month: 'long',
        });
      },
  
      time: (date, locale = 'en-US') => {
        return new Date(date).toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
        });
      },
  
      relative: (date) => {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
  
        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return formatters.date.short(date);
      },
    },
  
    // Number formatters
    number: {
      compact: (number, locale = 'en-US') => {
        return new Intl.NumberFormat(locale, {
          notation: 'compact',
          compactDisplay: 'short',
        }).format(number);
      },
  
      decimal: (number, decimals = 2, locale = 'en-US') => {
        return new Intl.NumberFormat(locale, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(number);
      },
    },
  
    // File size formatter
    fileSize: (bytes) => {
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let size = bytes;
      let unitIndex = 0;
  
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
  
      return `${formatters.number.decimal(size)} ${units[unitIndex]}`;
    },
  
    // Phone number formatter
    phoneNumber: (number, country = 'US') => {
      const cleaned = number.replace(/\D/g, '');
      const formats = {
        US: (num) => {
          if (num.length !== 10) return num;
          return `(${num.slice(0, 3)}) ${num.slice(3, 6)}-${num.slice(6)}`;
        },
      };
  
      return formats[country]?.(cleaned) || cleaned;
    },
  
    // Credit card formatter
    creditCard: (number) => {
      const cleaned = number.replace(/\D/g, '');
      const groups = cleaned.match(/.{1,4}/g) || [];
      return groups.join(' ');
    },
  
    // Transaction description formatter
    transactionDescription: (description, maxLength = 30) => {
      if (description.length <= maxLength) return description;
      return `${description.slice(0, maxLength)}...`;
    },
  };
  