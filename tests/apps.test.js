import { describe, expect, it, vi, beforeEach } from 'vitest';
import PuterClient from '../src/index';
import { mockAxios } from './mocks/axios';
import { API_BASE_URL } from '../src/constants';

describe('App Management', () => {
  let client;

  beforeEach(() => {
    // Use mock by default, but allow real API testing
    if (process.env.USE_REAL_API) {
        client = new PuterClient();
      } else {
        client = new PuterClient({
          baseURL: API_BASE_URL
        });
        mockAxios.reset();
      }
  });

  describe('listApps', () => {
    it('should list apps with default parameters', async () => {
      const mockApps = [{
        title: 'Test App',
        name: 'test-app',
        created_at: '2023-01-01T00:00:00Z',
        index_url: 'https://test.app',
        description: 'Test description',
        stats: {
          open_count: 100,
          user_count: 50
        }
      }];

      mockAxios.onPost('/drivers/call').reply(200, {
        result: mockApps
      });

      const apps = await client.apps.list();
      expect(apps).toEqual(mockApps);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: "puter-apps",
        method: "select",
        args: {
          params: { icon_size: 64 },
          predicate: ["user-can-edit"],
          stats_period: 'all'
        }
      }));
    });

    it('should list apps with custom parameters', async () => {
      const mockApps = [{
        title: 'Test App',
        name: 'test-app',
        created_at: '2023-01-01T00:00:00Z',
        index_url: 'https://test.app',
        description: 'Test description',
        stats: {
          open_count: 100,
          user_count: 50
        }
      }];

      mockAxios.onPost('/drivers/call').reply(200, {
        result: mockApps
      });

      const apps = await client.apps.list({
        statsPeriod: '7d',
        iconSize: 128
      });

      expect(apps).toEqual(mockApps);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: "puter-apps",
        method: "select",
        args: {
          params: { icon_size: 128 },
          predicate: ["user-can-edit"],
          stats_period: '7d'
        }
      }));
    });

    it('should handle empty app list', async () => {
      mockAxios.onPost('/drivers/call').reply(200, {
        result: []
      });

      const apps = await client.apps.list();
      expect(apps).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockAxios.onPost('/drivers/call').reply(500, {
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        }
      });

      await expect(client.apps.list())
        .rejects.toThrow('Internal server error');
    });
  });

  describe('getAppInfo', () => {
    it('should get app information', async () => {
      const mockApp = {
        title: 'Test App',
        name: 'test-app',
        created_at: '2023-01-01T00:00:00Z',
        index_url: 'https://test.app',
        description: 'Test description',
        stats: {
          open_count: 100,
          user_count: 50
        }
      };

      mockAxios.onPost('/drivers/call').reply(200, {
        result: mockApp
      });

      const app = await client.apps.get('test-app');
      expect(app).toEqual(mockApp);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: "puter-apps",
        method: "read",
        args: {
          id: {
            name: 'test-app'
          }
        }
      }));
    });

    it('should handle missing app', async () => {
      mockAxios.onPost('/drivers/call').reply(200, {
        result: null
      });

      await expect(client.apps.get('non-existent-app'))
        .rejects.toThrow('App not found');
    });

    it('should handle API errors', async () => {
      mockAxios.onPost('/drivers/call').reply(500, {
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        }
      });

      await expect(client.apps.get('test-app'))
        .rejects.toThrow('Internal server error');
    });

    it('should throw error when app name is not provided', async () => {
      await expect(client.apps.get())
        .rejects.toThrow('App name is required');
    });
  });

  describe('createApp', () => {
    
    const mockAppRecord = {
      uid: 'app-123',
      name: 'test-app',
      owner: { username: 'testuser' },
      index_url: 'https://test.app'
    };

    const mockDirResponse = {
      uid: 'dir-123',
      path: '/testuser/AppData/app-123/app-dir'
    };

    const mockSubdomainResponse = {
      uid: 'app-123',
      subdomain: 'test-app-123'
    };

    it('should create app record', async () => {
      mockAxios.onPost('/drivers/call').reply(200, {
        success: true,
        result: mockAppRecord
      });
  
      const result = await client.apps.createAppRecord({
        name: 'test-app',
        url: 'https://test.app'
      });
  
      expect(result).toEqual(mockAppRecord);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: 'puter-apps',
        method: 'create',
        args: {
          object: {
            name: 'test-app',
            index_url: 'https://test.app',
            title: 'test-app',
            description: '',
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
      }));
    });

    it('should create app directory', async () => {
      mockAxios.onPost('/mkdir').reply(200, mockDirResponse);  
      const result = await client.apps.createAppDirectory(mockAppRecord);

      expect(result).toEqual(mockDirResponse);
      const parsedOutput = JSON.parse(mockAxios.history.post[0].data);
      expect(parsedOutput['parent']).toEqual(`/${mockAppRecord.owner.username}/AppData/${mockAppRecord.uid}`);
      expect(parsedOutput['path']).toString(/^app-[0-9a-f-]+$/);
      expect(parsedOutput['overwrite']).toEqual(true);
      expect(parsedOutput['dedupe_name']).toEqual(false);
      expect(parsedOutput['create_missing_parents']).toEqual(true);     
    });

    it('should update app with subdomain', async () => {
      mockAxios.onPost('/drivers/call').reply(200, {
        success: true
      });
  
      await client.apps.updateAppWithSubdomain(
        mockAppRecord,
        mockSubdomainResponse.subdomain
      );
  
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: 'puter-apps',
        method: 'update',
        args: {
          id: { name: mockAppRecord.name },
          object: {
            index_url: `https://${mockSubdomainResponse.subdomain}.puter.site`,
            title: mockAppRecord.name
          }
        }
      }));
    });

    it('should create a new app', async () => {
      // Create the app record
      mockAxios.onPost('/drivers/call').reply(200, {
        success: true,
        result: mockAppRecord
      })
      // Create the app directory
      .onPost('/mkdir').reply(200, mockDirResponse)
      // Create the sbudomain
      .onPost('/drivers/call').reply(200, {
        success: true,
        result: {...mockSubdomainResponse, owner: mockAppRecord.owner}
      })
      // Assign a subdomain to the app
      .onPost('/drivers/call', {
        interface: 'puter-apps',
        method: 'update'
      })
      .reply(200, {
        success: true
      });
      
      const result = await client.apps.create({
        name: 'test-app',
        url: 'https://test.app'
      });

      expect(result).toEqual({
        "directory": {
          "path": "/testuser/AppData/app-123/app-dir",
          "uid": mockDirResponse.uid,
        },
        "owner": mockAppRecord.owner,
        "subdomain": {
          "owner": mockAppRecord.owner,
          "subdomain": mockSubdomainResponse.subdomain,
          "uid": mockAppRecord.uid
        },
        "uid": mockAppRecord.uid
      });
      expect(mockAxios.history.post.length).toEqual(4);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: "puter-apps",
        method: "create",
        args: {
          object: {
            name: 'test-app',
            index_url: 'https://test.app',
            title: "test-app",
            description: "",
            maximize_on_start: false,
            background: false,
            metadata: {
              window_resizable: true,
            },
          },
          options: {
            dedupe_name: true
          }
        }
      }));
    });

    it('should handle creation errors', async () => {
      mockAxios.onPost('/drivers/call').reply(200, {
        success: false,
        error: {
          code: 'APP_EXISTS',
          message: 'App already exists'
        }
      });

      await expect(client.apps.create({
        name: 'test-app',
        url: 'https://test.app'
      })).rejects.toThrow('App already exists');
    });
  });
  
});