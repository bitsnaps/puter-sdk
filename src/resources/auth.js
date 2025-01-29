import { PuterError } from '../errors';

export class PuterAuth {
  constructor(client) {
    this.client = client;
  }

  /**
   * Authenticate with Puter using username and password
   * @param {string} username 
   * @param {string} password 
   * @param {string} [otp] Optional OTP for 2FA
   * @returns {Promise<object>} Authentication result
   * @throws {Error} If authentication fails
   */
  async login(username, password, otp = null) {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    try {
      let response = await this.client.http.post('/login', {
        username,
        password
      });

      // Handle 2FA if requested
      if (response.proceed && response.next_step === 'otp') {
        if (!otp) {
          throw new Error('2FA required - OTP is needed');
        }
        
        response = await this.client.http.post('/login/otp', {
          token: response.otp_jwt_token,
          code: otp
        });
      }

      if (!response.proceed || !response.token) {
        throw new Error('Authentication failed: Invalid credentials');
      }

      // Update client with new token
      this.client.token = response.token;
      this.client.http.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;

      return response;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(error.message || 'Authentication failed');
    }
  }

  /**
   * Get current authenticated user information
   * @returns {Promise<object>} User information
   */
  async getCurrentUser() {
    if (!this.client.token) {
      throw new Error('Not authenticated');
    }

    try {
      return await this.client.http.get('/whoami');
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw error;
    }
  }
}