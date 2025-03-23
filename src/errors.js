/**
 * Base error class for Puter SDK errors
 * @class
 * @extends Error
 */
export class PuterError extends Error {
  /**
   * Creates a new PuterError instance
   * @param {object} error - Error details
   * @param {string} [error.message] - Error message
   * @param {string} [error.code] - Error code
   */
  constructor(error) {
    super(error.message || 'An error occurred');
    this.name = 'PuterError';
    this.code = error.code || 'UNKNOWN_ERROR';
    this.details = error;
  }
}

/**
 * Error thrown when authentication fails
 * @class
 * @extends PuterError
 */
export class AuthenticationError extends PuterError {
  /**
   * Creates a new AuthenticationError instance
   * @param {object} error - Error details
   * @param {string} [error.message] - Error message
   */
  constructor(error) {
    super({
      code: 'AUTHENTICATION_FAILED',
      message: error.message || 'Authentication failed'
    });
    this.name = 'AuthenticationError';
  }
}

/**
 * Error thrown when two-factor authentication is required
 * @class
 * @extends PuterError
 */
export class TwoFactorRequiredError extends PuterError {
  /**
   * Creates a new TwoFactorRequiredError instance
   */
  constructor() {
    super({
      code: '2FA_REQUIRED',
      message: 'Two-factor authentication required'
    });
    this.name = 'TwoFactorRequiredError';
  }
}