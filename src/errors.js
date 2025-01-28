export class PuterError extends Error {
  constructor(error) {
    super(error.message || 'An error occurred');
    this.name = 'PuterError';
    this.code = error.code || 'UNKNOWN_ERROR';
    this.details = error;
  }
}

export class AuthenticationError extends PuterError {
  constructor(error) {
    super({
      code: 'AUTHENTICATION_FAILED',
      message: error.message || 'Authentication failed'
    });
    this.name = 'AuthenticationError';
  }
}