import { describe, expect, it, beforeEach } from 'vitest';
import PuterClient from '../../src/index';
import { mockAxios } from '../mocks/axios';
import { API_BASE_URL } from '../../src/constants';
import path from 'path';

describe('App Update Integration', () => {
  let client;

  beforeEach(() => {
    client = new PuterClient({ 
      baseURL: API_BASE_URL,
    });
    mockAxios.reset();
  });

  it('should successfully update an app with subdomain', async () => {
    // Mock app object
    const app = {
      uid: 'app-123',
      name: 'test-app',
      owner: { username: 'testuser' }
    };
    
    // Mock response for updateAppWithSubdomain
    mockAxios.onPost('/drivers/call').reply(200, {
      success: true,
      result: {
        uid: 'app-123',
        name: 'test-app',
        index_url: 'https://test-subdomain.puter.site'
      }
    });
    
    const response = await client.apps.updateAppWithSubdomain(app, 'test-subdomain');
    
    expect(response).toHaveProperty('success', true);
    
    // Verify the request payload
    const lastRequest = JSON.parse(mockAxios.history.post[0].data);
    expect(lastRequest).toEqual({
      interface: 'puter-apps',
      method: 'update',
      args: {
        id: { name: 'test-app' },
        object: {
          index_url: 'https://test-subdomain.puter.site',
          title: 'test-app'
        }
      }
    });
  });

  it('should handle errors when updating app with subdomain', async () => {
    const app = {
      uid: 'app-123',
      name: 'test-app',
      owner: { username: 'testuser' }
    };
    
    mockAxios.onPost('/drivers/call').reply(200, {
      success: false,
      error: {
        message: 'Failed to update app'
      }
    });
    
    await expect(client.apps.updateAppWithSubdomain(app, 'test-subdomain'))
      .rejects.toThrow('Failed to update app with subdomain URL');
  });

  // WIP
  it.skip('should successfully update an existing app', async () => {
    // Mock responses for the update flow
    mockAxios
      .onPost('/drivers/call')
      .reply(function(config) {
        const data = JSON.parse(config.data);
        
        if (data.method === 'read' && data.interface === 'puter-apps') {
          return [200, {
            success: true,
            result: {
              uid: 'app-123',
              name: 'test-app',
              owner: { username: 'testuser' }
            }
          }];
        }
        
        if (data.interface === 'puter-subdomains' && data.method === 'select') {
          return [200, {
            success: true,
            result: [{
              uid: 'sd-123',
              subdomain: 'test-app-123',
              root_dir: {
                path: '/testuser/AppData/app-123/app-dir',
                dirname: '/testuser/AppData/app-123'
              }
            }]
          }];
        }
        
        // For any other drivers/call request
        return [200, { success: true, result: {} }];
      });
      
    // Mock readdir
    mockAxios
      .onPost('/readdir')
      .reply(200, [
        { name: 'index.html', is_dir: false },
        { name: 'style.css', is_dir: false }
      ]);
      
    // Mock copy - this needs to return a proper success response
    mockAxios
      .onPost('/copy')
      .reply(200, { success: true, result: {} });
    
    const result = await client.apps.update('test-app', {
      directory: '/source/directory'
    });
    
    expect(result).toEqual({
      uid: 'app-123',
      name: 'test-app',
      owner: { username: 'testuser' }
    });
  });

  // WIP
  it.skip('should handle errors when app is not found', async () => {
    mockAxios
      .onPost('/drivers/call')
      .reply(function(config) {
        const data = JSON.parse(config.data);
        
        if (data.method === 'read' && data.interface === 'puter-apps') {
          // Return an error response that will be caught by the get() method
          return [404, {
            success: false,
            error: {
              message: 'App not found'
            }
          }];
        }
        
        return [200, { success: true }];
      });
    
    await expect(client.apps.update('non-existent-app'))
      .rejects.toThrow('App not found');
  });

  it('should handle errors when updating app files', async () => {
    // Mock successful app info retrieval
    mockAxios
      .onPost('/drivers/call', (data) => {
        const parsedData = JSON.parse(data);
        return parsedData.method === 'read' && parsedData.interface === 'puter-apps';
      })
      .reply(200, {
        success: true,
        result: {
          uid: 'app-123',
          name: 'test-app',
          owner: { username: 'testuser' }
        }
      })
      // But fail on hosting list
      .onPost('/drivers/call', (data) => {
        const parsedData = JSON.parse(data);
        return parsedData.interface === 'puter-subdomains';
      })
      .reply(500, {
        error: {
          message: 'Failed to list subdomains'
        }
      });
    
    await expect(client.apps.update('test-app', {
      directory: '/source/directory'
    })).rejects.toThrow('Failed to update app');
  });

  it('should update app without directory if not provided', async () => {
    mockAxios
      .onPost('/drivers/call')
      .reply(200, {
        success: true,
        result: {
          uid: 'app-123',
          name: 'test-app',
          owner: { username: 'testuser' }
        }
      });
    
    const result = await client.apps.update('test-app');
    
    expect(result).toEqual({
      uid: 'app-123',
      name: 'test-app',
      owner: { username: 'testuser' }
    });
    
    // Verify only one call was made (get app info)
    expect(mockAxios.history.post.length).toBe(1);
  });
});