import { PuterError } from '../errors.js';

/**
 * PuterUsage class for retrieving storage and resource usage information
 * @class
 */
export class PuterUsage {
  /**
   * Creates an instance of PuterUsage
   * @param {object} client - The Puter client instance
   */
  constructor(client) {
    this.client = client;
  }

  /**
   * Get disk usage information (alias to getDiskUsage)
   * @returns {Promise<object>} Disk usage information including total, used, and available space
   * @throws {PuterError} If the server returns an error
   * @throws {Error} If retrieving disk usage information fails
   * @example
   * // Get disk usage with shorthand method
   * const diskInfo = await client.usage.df();
   * console.log(`Used: ${diskInfo.used} bytes, Available: ${diskInfo.available} bytes`);
   */
  async df() {
    return this.getDiskUsage();
  }

  /**
   * Get detailed disk usage information
   * @returns {Promise<object>} Disk usage information including total, used, and available space in bytes
   * @throws {PuterError} If the server returns an error
   * @throws {Error} If retrieving disk usage information fails
   * @example
   * // Get detailed disk usage information
   * const diskInfo = await client.usage.getDiskUsage();
   * console.log(`Total: ${diskInfo.total} bytes`);
   * console.log(`Used: ${diskInfo.used} bytes (${diskInfo.usedPercentage}%)`);
   * console.log(`Available: ${diskInfo.available} bytes`);
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
   * Get general usage information (alias to getUsageInfo)
   * @returns {Promise<object>} Usage information for various resources
   * @throws {PuterError} If the server returns an error
   * @throws {Error} If retrieving usage information fails
   * @example
   * // Get usage information with shorthand method
   * const usageInfo = await client.usage.usage();
   * console.log('Current resource usage:', usageInfo);
   */
  async usage() {
    return this.getUsageInfo();
  }

  /**
   * Get detailed usage information for all resources
   * @returns {Promise<object>} Comprehensive usage information including storage, bandwidth, 
   *                           API calls, and subscription limits
   * @throws {PuterError} If the server returns an error
   * @throws {Error} If retrieving usage information fails
   * @example
   * // Get detailed usage information
   * const usageInfo = await client.usage.getUsageInfo();
   * console.log('Storage usage:', usageInfo.storage);
   * console.log('Bandwidth usage:', usageInfo.bandwidth);
   * console.log('API calls:', usageInfo.apiCalls);
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