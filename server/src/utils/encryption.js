const crypto = require('crypto');
const bcrypt = require('bcrypt');

class Encryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.saltLength = 64;
    this.tagLength = 16;
    this.secret = process.env.ENCRYPTION_KEY || 'your-secret-encryption-key';
    
    // Validate encryption key
    if (!process.env.ENCRYPTION_KEY) {
      console.warn('Warning: Using default encryption key. Set ENCRYPTION_KEY environment variable in production.');
    }
  }

  /**
   * Generate a secure key from password
   */
  async generateKey(password, salt) {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        100000, // iterations
        this.keyLength,
        'sha512',
        (err, key) => {
          if (err) reject(err);
          resolve(key);
        }
      );
    });
  }

  /**
   * Encrypt data
   * @param {string|object} data - Data to encrypt
   * @returns {string} - Encrypted data
   */
  async encrypt(data) {
    try {
      // Convert object to string if necessary
      const text = typeof data === 'object' ? JSON.stringify(data) : data;

      // Generate salt and IV
      const salt = crypto.randomBytes(this.saltLength);
      const iv = crypto.randomBytes(this.ivLength);

      // Generate key from password
      const key = await this.generateKey(this.secret, salt);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      // Encrypt data
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get auth tag
      const tag = cipher.getAuthTag();

      // Combine everything into a single string
      // Format: salt:iv:tag:encrypted
      const result = [
        salt.toString('hex'),
        iv.toString('hex'),
        tag.toString('hex'),
        encrypted
      ].join(':');

      return result;
    } catch (error) {
      throw new Error('Encryption failed: ' + error.message);
    }
  }

  /**
   * Decrypt data
   * @param {string} encryptedData - Data to decrypt
   * @returns {string|object} - Decrypted data
   */
  async decrypt(encryptedData) {
    try {
      // Split the encrypted data
      const [saltHex, ivHex, tagHex, encrypted] = encryptedData.split(':');

      // Convert from hex
      const salt = Buffer.from(saltHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');

      // Generate key from password
      const key = await this.generateKey(this.secret, salt);

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);

      // Decrypt data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      // Try to parse as JSON if possible
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      throw new Error('Decryption failed: ' + error.message);
    }
  }

  /**
   * Hash password
   * @param {string} password - Password to hash
   * @returns {string} - Hashed password
   */
  async hashPassword(password) {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password
   * @param {string} password - Password to verify
   * @param {string} hash - Hash to compare against
   * @returns {boolean} - Whether password matches hash
   */
  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate random token
   * @param {number} length - Length of token
   * @returns {string} - Random token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash data (one-way)
   * @param {string} data - Data to hash
   * @returns {string} - Hashed data
   */
  hash(data) {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }

  /**
   * Create HMAC
   * @param {string} data - Data to sign
   * @returns {string} - HMAC signature
   */
  createHmac(data) {
    return crypto
      .createHmac('sha256', this.secret)
      .update(data)
      .digest('hex');
  }

  /**
   * Verify HMAC
   * @param {string} data - Original data
   * @param {string} hmac - HMAC to verify
   * @returns {boolean} - Whether HMAC is valid
   */
  verifyHmac(data, hmac) {
    const calculated = this.createHmac(data);
    return crypto.timingSafeEqual(
      Buffer.from(calculated, 'hex'),
      Buffer.from(hmac, 'hex')
    );
  }
}

module.exports = new Encryption();