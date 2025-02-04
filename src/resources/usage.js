import { PuterError } from '../errors.js';

export class PuterUsage {
  constructor(client) {
    this.client = client;
  }

  /**
   * Get disk usage information
   * @returns {Promise<object>} Disk usage information
   */
  async getDiskUsage() {
    try {
      const response = await this.client.http.post('/df');
      return response;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error('Failed to get disk usage information');
    }
  }

  /**
   * Get usage information
   * @returns {Promise<object>} Usage information
   */
  async getUsageInfo() {
    try {
      const response = await this.client.http.get('/drivers/usage');
      return response;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error('Failed to get usage information');
    }
  }
}