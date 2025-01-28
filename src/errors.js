export class PuterError extends Error {
    constructor(error) {
      super(error.message);
      this.name = 'PuterError';
      this.code = error.code;
      this.details = error;
    }
  }