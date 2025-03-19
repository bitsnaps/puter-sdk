import { PuterError } from '../errors.js';

/**
 * PuterAuth class for handling authentication with the Puter platform
 * @class
 */
export class PuterAuth {

  /**
   * Creates an instance of PuterAuth
   * @param {object} client - The Puter client instance
   */
  constructor(client) {
    this.client = client;
  }

  /**
   * Authenticate with Puter using username and password
   * @param {string} username - The user's username or email
   * @param {string} password - The user's password
   * @param {string} [otp=null] - Optional OTP code for two-factor authentication
   * @returns {Promise<object>} Authentication result containing token and user information
   * @throws {Error} If authentication fails due to invalid credentials
   * @throws {Error} If 2FA is required but no OTP is provided
   * @throws {PuterError} If the server returns an error
   * @example
   * // Basic authentication
   * const auth = await client.auth.signIn('username', 'password');
   * 
   * // Authentication with 2FA
   * const auth = await client.auth.signIn('username', 'password', '123456');
   */
  async signIn(username, password, otp = null) {
    if (this.client.token) {
      // Check if user is already logged
      console.error('You are already logged!');
      return;
    }

    if (!username || !password) {
      throw new Error('Username and password are required');
    }
  
    try {
      let response = await this.client.http.post('/login', {
        username,
        password
      });

      // Handle 2FA if required
      if (response.proceed && response.next_step === 'otp') {
        if (!otp) {
          throw new Error('2FA required - OTP is needed');
        }
        
        response = await this.client.http.post('/login/otp', {
          token: response.otp_jwt_token,
          code: otp
        });
      }
  
      // Handle unknown next_step
      if (response.proceed && response.next_step && response.next_step !== 'complete') {
        throw new Error(`Unsupported authentication step: ${response.next_step}`);
      }
  
      if (!response.proceed || !response.token) {
        // Check for specific OTP failure
        if (response.error?.code === 'INVALID_OTP') {
          throw new Error(response.error.message || 'Invalid OTP code');
        }
        throw new Error('Authentication failed: Invalid credentials');
      }
  
      // Update client with new token
      this.client.token = response.token;
      this.client.http.defaults.headers['Authorization'] = `Bearer ${response.token}`;
  
      return response;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(error.message || 'Authentication failed');
    }
  }

  /**
   * Check if the user is currently signed in
   * @returns {boolean} Returns true if the user is signed in, false otherwise
   * @example
   * if (client.auth.isSignedIn()) {
   *   console.log('User is authenticated');
   * }
   */
  isSignedIn() {
    // Check if we have a token and it's not expired
    if (!this.client.token) {
      return false;
    }
    // We may need to add JWT expiration check if tokens are JWTs
    return true;
  }

  /**
   * Sign out the current user by removing the authentication token
   * @returns {void}
   * @throws {PuterError} If the server returns an error
   * @throws {Error} If the sign out process fails
   * @example
   * // Sign out the current user
   * client.auth.signOut();
   */
  signOut() {
    try {
      // There is no such call
      // await this.client.http.post('/logout');
      this.client.token = null;
      delete this.client.http.defaults.headers['Authorization'];
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(`Failed to logout : ${error.message}`);
    }
  }
    
  /**
   * Get information about the currently authenticated user
   * @returns {Promise<object>} User information including username, email, and profile details
   * @throws {PuterError} If the server returns an error
   * @throws {Error} If retrieving user information fails
   * @example
   * // Get current user information
   * const user = await client.auth.getUser();
   * console.log(`Logged in as: ${user.username}`);
   */
  async getUser() {
    try {
      const response = await this.client.http.get('/whoami');
      return response;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error('Failed to get user information');
    }
  }

}