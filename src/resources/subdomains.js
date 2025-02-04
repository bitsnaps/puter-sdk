import { PuterError } from '../errors.js';

export class PuterSubdomains {
  constructor(client) {
    this.client = client;
  }

  /**
   * Create a new subdomain
   * @param {object} options
   * @param {string} options.subdomain - Subdomain name
   * @param {string} options.rootDir - Root directory path
   * @returns {Promise<object>} Created subdomain details
   */
  async create(options) {
    const { subdomain, rootDir } = options;

    if (!subdomain || !rootDir) {
      throw new Error('Subdomain and root directory are required');
    }

    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: 'puter-subdomains',
        method: 'create',
        args: {
          subdomain,
          root_dir: rootDir
        }
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to create subdomain');
      }

      return response.result;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to create subdomain');
    }
  }

  /**
   * List all subdomains
   * @returns {Promise<Array>} List of subdomains
   */
  async list() {
    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: 'puter-subdomains',
        method: 'select'
      });

      return response.result || [];
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error('Failed to list subdomains');
    }
  }

  /**
   * Delete a subdomain
   * @param {string} subdomainId - Subdomain ID to delete
   * @returns {Promise<object>} Deletion result
   */
  async delete(subdomainId) {
    if (!subdomainId) {
      throw new Error('Subdomain ID is required');
    }

    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: 'puter-subdomains',
        method: 'delete',
        args: {
          id: { subdomain: subdomainId }
        }
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete subdomain');
      }

      return response;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to delete subdomain');
    }
  }
}