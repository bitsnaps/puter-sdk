import { PuterError } from '../errors.js';
import { INTERFACE_SUBDOMAINS } from '../constants.js';

export class PuterSites {
  constructor(client) {
    this.client = client;
  }

  /**
   * @alias to `hosting.list()`
   */
  async list() {
    try {
      // Reuse hosting functionality
      return await this.client.hosting.list();
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error('Failed to list sites');
    }
  }

  /**
   * Get site information
   * @param {string} siteId - Site ID
   * @returns {Promise<object>} Site information
   */
  async get(siteId) {
    if (!siteId) {
      throw new Error('Site ID is required');
    }

    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: INTERFACE_SUBDOMAINS,
        method: 'read',
        args: { uid: siteId }
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to get site info');
      }

      return response.result;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error('Failed to get site info');
    }
  }

  /**
   * Create a new site
   * @param {object} options
   * @param {string} options.name - Site name
   * @param {string} options.directory - Directory path
   * @returns {Promise<object>} Created site details
   */
  async create(options) {
    const { name, directory } = options;

    if (!name || !directory) {
      throw new Error('Site name and directory are required');
    }

    try {
      // Check if subdomain is available
      const existing = await this.client.hosting.list();
      if (existing.some(s => s.subdomain === name)) {
        throw new Error('Subdomain already exists');
      }

      // Create the site (subdomain)
      return await this.client.hosting.create({
        subdomain: name,
        rootDir: directory
      });
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to create site');
    }
  }

  /**
   * Delete a site
   * @param {string} siteId - Site ID to delete
   * @returns {Promise<boolean>} True if successful
   */
  async delete(siteId) {
    if (!siteId) {
      throw new Error('Site ID is required');
    }

    try {
      // First delete the site
      await this.client.http.post('/delete-site', {
        site_uuid: siteId
      });

      // Then delete the subdomain
      const response = await this.client.hosting.delete(siteId);
      if (!response.ok){
        console.error(`Failed to delete a subdomain for site: ${siteId}`);
      }

      return true;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(`Failed to delete site: ${error.message}`);
    }
  }
}