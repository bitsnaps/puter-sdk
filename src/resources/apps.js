import { PuterError } from '../errors.js';
import { INTERFACE_APPS } from '../constants.js';
import crypto from '../crypto.js';

/**
 * PuterApps class for managing applications
 * @class
 */
export class PuterApps {

  /**
   * Creates an instance of PuterApps
   * @param {object} client - The Puter client instance
   */
  constructor(client) {
    this.client = client;
  }

  /**
   * List all apps
   * @param {object} [options] - Options for listing apps
   * @param {string} [options.statsPeriod='all'] - Statistics period
   * @param {number} [options.iconSize=64] - Icon size
   * @returns {Promise<Array>} List of apps
   * @throws {Error} If listing apps fails
   * @example
   * // Get all apps
   * const apps = await client.apps.list();
   * 
   * // Get apps with custom icon size
   * const apps = await client.apps.list({ iconSize: 128 });
   */
  async list(options = {}) {
    const { statsPeriod = 'all', iconSize = 64 } = options;
  
    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: INTERFACE_APPS,
        method: 'select',
        args: {
          params: { icon_size: iconSize },
          predicate: ['user-can-edit'],
          stats_period: statsPeriod
        }
      });
  
      if (response.error) {
        throw new PuterError(response.error);
      }
  
      return response.result || [];
    } catch (error) {
      if (error instanceof PuterError) throw error;
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to list apps');
    }
  }

  /**
   * Get app information
   * @param {string} name - App name
   * @returns {Promise<object>} App information
   */
  async get(name) {
    if (!name) {
      throw new Error('App name is required');
    }
  
    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: INTERFACE_APPS,
        method: 'read',
        args: {
          id: { name }
        }
      });
  
      if (response.error) {
        throw new PuterError(response.error);
      }
  
      if (!response.result) {
        throw new Error('App not found');
      }
  
      return response.result;
    } catch (error) {
      if (error instanceof PuterError) throw error;
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to get app info');
    }
  }

  /**
   * Creates a new app record in the system
   * @param {object} options - The options for creating the app record
   * @param {string} options.name - The name of the app
   * @param {string} options.url - The URL where the app is hosted
   * @param {string} [options.description=''] - Optional description of the app
   * @returns {Promise<object>} The created app record
   * @throws {PuterError} If the server returns an error
   * @throws {Error} If the app record creation fails
   * @private
   */
  async createAppRecord(options) {
    const { name, url, description = '' } = options;
    
    const response = await this.client.http.post('/drivers/call', {
      interface: INTERFACE_APPS,
      method: 'create',
      args: {
        object: {
          name,
          index_url: url,
          title: name,
          description,
          maximize_on_start: false,
          background: false,
          metadata: {
            window_resizable: true
          }
        },
        options: {
          dedupe_name: true
        }
      }
    });
  
    if (response.error) {
      throw new PuterError(response.error);
    }
  
    if (!response.success || !response.result) {
      throw new Error(response.error?.message || 'Failed to create app record');
    }
  
    return response.result;
  }

  async createAppDirectory(app) {
    if (!app?.owner?.username || !app?.uid) {
      console.log(app);
      throw new Error('Invalid app record');
    }

    const appDir = `/${app.owner.username}/AppData/${app.uid}`;
    const response = await this.client.http.post('/mkdir', {
      parent: appDir,
      path: `app-${crypto.randomUUID()}`,
      overwrite: true,
      dedupe_name: false,
      create_missing_parents: true
    });

    if (!response.uid) {
      throw new Error('Failed to create app directory');
    }

    return response;
  }

  async createAppSubdomain(app, dirResponse) {
    const subdomainName = `${app.name}-${dirResponse.uid.split('-')[0]}`;
    return this.client.hosting.create({
      subdomain: subdomainName,
      rootDir: dirResponse.path
    });
  }

  /**
   * Updates an app's URL with its subdomain
   * @param {object} app - The app object containing name and other properties
   * @param {string} subdomainName - The subdomain name to be used in the URL
   * @returns {Promise<object>} Response from the update operation
   * @throws {Error} If the update operation fails
   */
  async updateAppWithSubdomain(app, subdomainName) {
    const response = await this.client.http.post('/drivers/call', {
      interface: INTERFACE_APPS,
      method: 'update',
      args: {
        id: { name: app.name },
        object: {
          index_url: `https://${subdomainName}.puter.site`,
          title: app.name
        }
      }
    });

    if (!response.success) {
      throw new Error('Failed to update app with subdomain URL');
    }

    return response;
  }

  /**
   * Create a new app
   * @param {object} options
   * @param {string} options.name - App name
   * @param {string} [options.url] - App URL
   * @param {string} [options.description] - App description
   * @param {string} [options.directory] - Directory path
   * @returns {Promise<object>} Created app details
   */
  async create(options) {
    const { name, url = '', description = '' } = options;
  
    if (!name) {
      throw new Error('App name is required');
    }
  
    try {
      // Step 1: Create app record
      const app = await this.createAppRecord({ name, url, description });
  
      // Step 2: Create app directory
      const dirResponse = await this.createAppDirectory(app);
  
      // Step 3: Create subdomain
      const subdomainResponse = await this.createAppSubdomain(app, dirResponse);
  
      // Step 4: Update app with subdomain URL
      await this.updateAppWithSubdomain(app, subdomainResponse?.subdomain);
  
      return {
        ...app,
        directory: dirResponse,
        subdomain: subdomainResponse
      };
  
    } catch (error) {
      // Handle specific error cases
      if (error.response?.data?.error?.code === 'APP_EXISTS') {
        throw new Error('App already exists');
      }
      
      if (error instanceof PuterError) {
        throw error;
      }
  
      // Handle network errors or other exceptions
      throw new Error(error.message || 'Failed to create app');
    }
  }

/**
   * Update an existing app
   * @param {string} name - App name
   * @param {object} options - Options for updating the app
   * @param {string} [options.directory] - Local directory path containing files to upload to the app
   * @param {string} [options.description] - New description for the app
   * @param {string} [options.url] - New URL for the app
   * @param {boolean} [options.maximizeOnStart] - Whether the app should maximize on start
   * @param {boolean} [options.background] - Whether the app should run in the background
   * @returns {Promise<object>} Updated app details
   * @throws {PuterError} If the server returns an error
   * @throws {Error} If the app update fails
   * @example
   * // Update app files from a local directory
   * const updatedApp = await client.apps.update('myApp', { 
   *   directory: '/path/to/app/files' 
   * });
   * 
   * // Update app metadata
   * const updatedApp = await client.apps.update('myApp', {
   *   description: 'Updated app description',
   *   maximizeOnStart: true
   * });
   */
  async update(name, options = {}) {
    if (!name) {
      throw new Error('App name is required');
    }

    try {
      // Step 1: Get app info
      const app = await this.get(name);

      // Step 2: Update files if directory is provided
      if (options.directory) {
        const hosting = await this.client.hosting.list();
        const appSubdomain = hosting.find(sd => 
          sd.root_dir?.dirname?.endsWith(app.uid)
        );

        if (appSubdomain) {
          const files = await this.client.fs.readdir(options.directory);
          for (const file of files) {
            await this.client.fs.copy(
              path.join(options.directory, file.name),
              appSubdomain.root_dir.path
            );
          }
        }
      }

      return app;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error('Failed to update app');
    }
  }

  /**
   * Delete an app
   * @param {string} name - App name
   * @returns {Promise<boolean>} True if successful
   */
  async delete(name) {
    if (!name) {
      throw new Error('App name is required');
    }

    try {
      // Step 1: Get app info
      const app = await this.get(name);

      // Step 2: Delete app
      const deleteResponse = await this.client.http.post('/drivers/call', {
        interface: INTERFACE_APPS,
        method: 'delete',
        args: {
          id: { name }
        }
      });

      if (!deleteResponse.success) {
        throw new Error('Failed to delete app');
      }

      // Step 3: Delete associated subdomain
      const hosting = await this.client.hosting.list();
      const appSubdomain = hosting.find(sd => 
        sd.root_dir?.dirname?.endsWith(app.uid)
      );

      if (appSubdomain) {
        await this.client.hosting.delete(appSubdomain.uid);
      }

      return true;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error('Failed to delete app');
    }
  }
}