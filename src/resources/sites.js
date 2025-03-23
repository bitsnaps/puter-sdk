import { PuterError } from '../errors.js';
import { INTERFACE_SUBDOMAINS } from '../constants.js';

/**
 * PuterSites class for managing website deployments
 * @class
 */
export class PuterSites {
  /**
   * Creates an instance of PuterSites
   * @param {object} client - The Puter client instance
   */
  constructor(client) {
    this.client = client;
  }

  /**
   * List all sites for the current user
   * @alias to `hosting.list()`
   * @returns {Promise<Array>} List of sites with their details
   * @throws {PuterError} If the server returns an error
   * @throws {Error} If the listing operation fails
   * @example
   * // List all sites
   * const sites = await client.sites.list();
   * console.log(`You have ${sites.length} sites`);
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
   * Get detailed information about a specific site
   * @param {string} siteId - Site ID (UID)
   * @returns {Promise<object>} Site information including URL, status, and configuration
   * @throws {Error} If siteId is missing
   * @throws {PuterError} If the server returns an error
   * @throws {Error} If retrieving site information fails
   * @example
   * // Get information about a specific site
   * const site = await client.sites.get('site-uid-123');
   * console.log(`Site URL: ${site.url}`);
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
   * Create a new site with a custom subdomain
   * @param {object} options - Options for creating a site
   * @param {string} options.name - Site name (will be used as subdomain)
   * @param {string} options.directory - Directory path containing website files
   * @returns {Promise<object>} Created site details including URL and status
   * @throws {Error} If name or directory is missing
   * @throws {Error} If subdomain already exists
   * @throws {PuterError} If the server returns an error
   * @example
   * // Create a new site
   * const site = await client.sites.create({
   *   name: 'my-portfolio',
   *   directory: '/Projects/portfolio/build'
   * });
   * console.log(`Site created at: ${site.url}`);
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
   * Delete a site and its associated subdomain
   * @param {string} siteId - Site ID (UID) to delete
   * @returns {Promise<boolean>} True if deletion was successful
   * @throws {Error} If siteId is missing
   * @throws {PuterError} If the server returns an error
   * @throws {Error} If the deletion operation fails
   * @example
   * // Delete a site
   * const result = await client.sites.delete('site-uid-123');
   * if (result) {
   *   console.log('Site deleted successfully');
   * }
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