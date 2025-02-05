import { describe, expect, it, beforeEach } from 'vitest';
import PuterClient from '../src/index';
import { mockAxios } from './mocks/axios';

describe('Subdomain Management', () => {
  let client;

  beforeEach(() => {
    client = new PuterClient({ token: 'test-token' });
    mockAxios.reset();
  });

  describe('Create Subdomain', () => {
    it('should create a new subdomain', async () => {
      const mockResponse = {
        success: true,
        result: {
          uid: 'sub-123',
          subdomain: 'mysubdomain',
          root_dir: {
            id: 'dir-123',
            path: '/my/path'
          }
        }
      };

      mockAxios.onPost('/drivers/call').reply(200, mockResponse);

      const result = await client.hosting.create({
        subdomain: 'mysubdomain',
        rootDir: '/my/path'
      });

      expect(result).toEqual(mockResponse.result);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: 'puter-subdomains',
        method: 'create',
        args: {
          subdomain: 'mysubdomain',
          root_dir: '/my/path'
        }
      }));
    });

    it('should handle subdomain creation errors', async () => {
      mockAxios.onPost('/drivers/call').reply(200, {
        success: false,
        error: {
          code: 'SUBDOMAIN_EXISTS',
          message: 'Subdomain already exists'
        }
      });

      await expect(client.hosting.create({
        subdomain: 'existing',
        rootDir: '/path'
      })).rejects.toThrow('Subdomain already exists');
    });
  });

  describe('List Hosting', () => {
    it('should list hosting', async () => {
      const mockResponse = {
        result: [
          {
            uid: 'sub-123',
            subdomain: 'mysubdomain',
            root_dir: {
              id: 'dir-123',
              path: '/my/path'
            }
          }
        ]
      };

      mockAxios.onPost('/drivers/call').reply(200, mockResponse);

      const result = await client.hosting.list();
      expect(result).toEqual(mockResponse.result);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: 'puter-subdomains',
        method: 'select'
      }));
    });

    it('should handle empty subdomain list', async () => {
      mockAxios.onPost('/drivers/call').reply(200, {
        result: []
      });

      const result = await client.hosting.list();
      expect(result).toEqual([]);
    });

    it('should handle listing errors', async () => {
      mockAxios.onPost('/drivers/call').reply(500, {
        error: {
          message: 'Failed to list hosting'
        }
      });

      await expect(client.hosting.list())
        .rejects.toThrow('Failed to list hosting');
    });
  });

  describe('Delete Subdomain', () => {
    it('should delete a subdomain', async () => {
      const mockResponse = {
        success: true
      };

      mockAxios.onPost('/drivers/call').reply(200, mockResponse);

      const result = await client.hosting.delete('sub-123');
      expect(result).toEqual(mockResponse);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: 'puter-subdomains',
        method: 'delete',
        args: {
          id: { subdomain: 'sub-123' }
        }
      }));
    });

    it('should handle subdomain not found error', async () => {
      mockAxios.onPost('/drivers/call').reply(200, {
        success: false,
        error: {
          code: 'SUBDOMAIN_NOT_FOUND',
          message: 'Subdomain not found'
        }
      });

      await expect(client.hosting.delete('nonexistent'))
        .rejects.toThrow('Subdomain not found');
    });

    it('should handle deletion errors', async () => {
      mockAxios.onPost('/drivers/call').reply(500, {
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        }
      });

      await expect(client.hosting.delete('sub-123'))
        .rejects.toThrow('Internal server error');
    });
  });
});