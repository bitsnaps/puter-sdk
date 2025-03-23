import { PuterError } from '../errors.js';
import { INTERFACE_SUBDOMAINS } from '../constants.js';

/**
 * PuterHosting class for managing website hosting and subdomains
 * @class
 */
export class PuterHosting {
  /**
   * Creates an instance of PuterHosting
   * @param {object} client - The Puter client instance
   */
  constructor(client) {
    this.client = client;
  }

  /**
   * Create a new subdomain for hosting content
   * @param {object} options - Options for creating a subdomain
   * @param {string} options.subdomain - Subdomain name (without .puter.site)
   * @param {string} options.rootDir - Root directory path containing website files
   * @returns {Promise<object>} Created subdomain details including URL and status
   * @throws {Error} If subdomain or rootDir is missing
   * @throws {PuterError} If the server returns an error
   * @example
   * // Create a new subdomain
   * const subdomain = await client.hosting.create({
   *   subdomain: 'mywebsite',
   *   rootDir: '/MyWebsite/public'
   * });
   * console.log(`Website available at: ${subdomain.url}`);
   */
  async create(options) {
    const { subdomain, rootDir } = options;

    if (!subdomain || !rootDir) {
      throw new Error('Subdomain and root directory are required');
    }

    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: INTERFACE_SUBDOMAINS,
        method: 'create',
        args: {
          object: {
            subdomain,
            root_dir: rootDir
          }
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
   * List all subdomains for the current user
   * @param {object} [args={}] - Optional filtering arguments
   * @param {string} [args.status] - Filter by subdomain status
   * @param {boolean} [args.active] - Filter by active status
   * @returns {Promise<Array>} List of subdomains with their details
   * @throws {PuterError} If the server returns an error
   * @throws {Error} If the listing operation fails
   * @example
   * // List all subdomains
   * const subdomains = await client.hosting.list();
   * 
   * // List only active subdomains
   * const activeSubdomains = await client.hosting.list({ active: true });
   */
  async list(args = {}) {
    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: INTERFACE_SUBDOMAINS,
        method: 'select',
        args: args
      });

      return response.result || [];
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error('Failed to list hosting');
    }
  }

  /**
   * Delete a subdomain
   * @param {string} subdomainId - Subdomain ID (UID) to delete
   * @returns {Promise<object>} Deletion result with success status
   * @throws {Error} If subdomainId is missing
   * @throws {PuterError} If the server returns an error
   * @throws {Error} If the deletion operation fails
   * @example
   * // Delete a subdomain
   * const result = await client.hosting.delete('subdomain-uid-123');
   * if (result.success) {
   *   console.log('Subdomain deleted successfully');
   * }
   */
  async delete(subdomainId) {
    if (!subdomainId) {
      throw new Error('Subdomain ID is required');
    }

    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: INTERFACE_SUBDOMAINS,
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