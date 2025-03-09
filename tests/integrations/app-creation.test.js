import { describe, expect, it, beforeEach } from 'vitest';
import PuterClient from '../../src/index';
import { mockAxios } from '../mocks/axios';
import { API_BASE_URL } from '../../src/constants';

describe('App Creation Integration', () => {
  let client;

  beforeEach(() => {
    client = new PuterClient({ 
      baseURL: API_BASE_URL,
    });
    mockAxios.reset();
  });

  it('should successfully create a new app', async () => {
    // Simplified mock approach
    mockAxios.onPost('/drivers/call').reply(function(config) {
      const data = JSON.parse(config.data);
      
      if (data.method === 'create' && data.interface === 'puter-apps') {
        return [200, {
          success: true,
          result: {
            uid: 'app-123',
            name: 'test-app',
            owner: { username: 'testuser' }
          }
        }];
      }
      
      if (data.method === 'create' && data.interface === 'puter-subdomains') {
        return [200, {
          success: true,
          result: {
            uid: 'sub-123',
            subdomain: 'test-app-123'
          }
        }];
      }
      
      if (data.method === 'update' && data.interface === 'puter-apps') {
        return [200, { success: true }];
      }
      
      return [404, { error: 'Unexpected request' }];
    });
    
    mockAxios.onPost('/mkdir').reply(200, {
      uid: 'dir-123',
      path: '/testuser/AppData/app-123/app-dir'
    });

    const result = await client.apps.create({
      name: 'test-app',
      directory: '/my/path'
    });

    expect(result).toHaveProperty('uid', 'app-123');
    expect(result).toHaveProperty('name', 'test-app');
    expect(result).toHaveProperty('owner.username', 'testuser');
    expect(result).toHaveProperty('directory.uid', 'dir-123');
    expect(result).toHaveProperty('subdomain.subdomain', 'test-app-123');
  });

  it('should handle errors during app creation', async () => {
    mockAxios.onPost('/drivers/call').reply(200, {
      success: false,
      error: {
        code: 'APP_EXISTS',
        message: 'App already exists'
      }
    });

    await expect(client.apps.create({
      name: 'existing-app',
      directory: '/my/path'
    })).rejects.toThrow('App already exists');
  });

  it('should handle directory creation failure', async () => {
    // First allow app creation
    mockAxios.onPost('/drivers/call').reply(function(config) {
      const data = JSON.parse(config.data);
      
      if (data.method === 'create' && data.interface === 'puter-apps') {
        return [200, {
          success: true,
          result: {
            uid: 'app-123',
            name: 'test-app',
            owner: { username: 'testuser' }
          }
        }];
      }
      
      return [404, { error: 'Unexpected request' }];
    });
    
    // Then fail on directory creation
    mockAxios.onPost('/mkdir').reply(500, {
      error: {
        code: 'DIRECTORY_ERROR',
        message: 'Failed to create directory'
      }
    });

    await expect(client.apps.create({
      name: 'test-app',
      directory: '/my/path'
    })).rejects.toThrow('Failed to create directory');
  });

  it('should handle subdomain creation failure', async () => {
    // Allow app creation
    mockAxios.onPost('/drivers/call').reply(function(config) {
      const data = JSON.parse(config.data);
      
      if (data.method === 'create' && data.interface === 'puter-apps') {
        return [200, {
          success: true,
          result: {
            uid: 'app-123',
            name: 'test-app',
            owner: { username: 'testuser' }
          }
        }];
      }
      
      if (data.method === 'create' && data.interface === 'puter-subdomains') {
        return [200, {
          success: false,
          error: {
            code: 'SUBDOMAIN_ERROR',
            message: 'Failed to create subdomain'
          }
        }];
      }
      
      return [404, { error: 'Unexpected request' }];
    });
    
    // Allow directory creation
    mockAxios.onPost('/mkdir').reply(200, {
      uid: 'dir-123',
      path: '/testuser/AppData/app-123/app-dir'
    });

    await expect(client.apps.create({
      name: 'test-app',
      directory: '/my/path'
    })).rejects.toThrow('Failed to create subdomain');
  });
});