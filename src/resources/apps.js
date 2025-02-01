import { PuterError } from '../errors';

export class PuterApps {
  constructor(client) {
    this.client = client;
  }

  /**
   * List all apps
   * @param {object} options
   * @param {string} [options.statsPeriod='all'] - Statistics period
   * @param {number} [options.iconSize=64] - Icon size
   * @returns {Promise<Array>} List of apps
   */
  async list(options = {}) {
    const { statsPeriod = 'all', iconSize = 64 } = options;
  
    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: 'puter-apps',
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
        interface: 'puter-apps',
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

  async createAppRecord(options) {
    const { name, url, description = '' } = options;
    
    const response = await this.client.http.post('/drivers/call', {
      interface: 'puter-apps',
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
    return this.client.subdomains.create({
      subdomain: subdomainName,
      rootDir: dirResponse.path
    });
  }

  async updateAppWithSubdomain(app, subdomainName) {
    const response = await this.client.http.post('/drivers/call', {
      interface: 'puter-apps',
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
   * @param {object} options
   * @param {string} [options.directory] - Directory path
   * @returns {Promise<object>} Updated app details
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
        const subdomains = await this.client.subdomains.list();
        const appSubdomain = subdomains.find(sd => 
          sd.root_dir?.dirname?.endsWith(app.uid)
        );

        if (appSubdomain) {
          const files = await this.client.filesystem.list(options.directory);
          for (const file of files) {
            await this.client.filesystem.copy(
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
        interface: 'puter-apps',
        method: 'delete',
        args: {
          id: { name }
        }
      });

      if (!deleteResponse.success) {
        throw new Error('Failed to delete app');
      }

      // Step 3: Delete associated subdomain
      const subdomains = await this.client.subdomains.list();
      const appSubdomain = subdomains.find(sd => 
        sd.root_dir?.dirname?.endsWith(app.uid)
      );

      if (appSubdomain) {
        await this.client.subdomains.delete(appSubdomain.uid);
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