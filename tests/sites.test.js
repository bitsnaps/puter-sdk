import { describe, expect, it, beforeEach } from 'vitest';
import PuterClient from '../src/index';
import { mockAxios } from './mocks/axios';

describe('Site Management', () => {
  let client;

  beforeEach(() => {
    client = new PuterClient({ token: 'test-token' });
    mockAxios.reset();
  });

  describe('List Sites', () => {
    it('should list all sites', async () => {
      const mockSites = [
        {
          uid: 'site-123',
          subdomain: 'mysite',
          created_at: '2023-01-01T00:00:00Z',
          protected: false,
          root_dir: {
            path: '/my/path'
          }
        }
      ];

      mockAxios.onPost('/drivers/call').reply(200, {
        result: mockSites
      });

      const sites = await client.sites.list();
      expect(sites).toEqual(mockSites);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: 'puter-subdomains',
        method: 'select',
        args: {}
      }));
    });

    it('should handle empty site list', async () => {
      mockAxios.onPost('/drivers/call').reply(200, {
        result: []
      });

      const sites = await client.sites.list();
      expect(sites).toEqual([]);
    });

    it('should handle listing errors', async () => {
      mockAxios.onPost('/drivers/call').reply(500, {
        error: {
          message: 'Failed to list sites'
        }
      });

      await expect(client.sites.list())
        .rejects.toThrow('Failed to list sites');
    });
  });

  describe('Get Site Info', () => {
    it('should get site information', async () => {
      const mockSite = {
        uid: 'site-123',
        subdomain: 'mysite',
        created_at: '2023-01-01T00:00:00Z',
        protected: false,
        root_dir: {
          path: '/my/path'
        }
      };

      mockAxios.onPost('/drivers/call').reply(200, {
        success: true,
        result: mockSite
      });

      const site = await client.sites.get('site-123');
      expect(site).toEqual(mockSite);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: 'puter-subdomains',
        method: 'read',
        args: { uid: 'site-123' }
      }));
    });

    it('should handle site not found', async () => {
      mockAxios.onPost('/drivers/call').reply(200, {
        success: false,
        error: {
          message: 'Failed to get site info'
        }
      });

      await expect(client.sites.get('nonexistent'))
        .rejects.toThrow('Failed to get site info');
    });
  });

  describe('Create Site', () => {
    it('should create a new site', async () => {
      const mockSite = {
        uid: 'site-123',
        subdomain: 'mysite',
        root_dir: {
          path: '/my/path'
        }
      };

      mockAxios
        .onPost('/drivers/call')
          .replyOnce(200, { // Check subdomain availability
            result: []
          })
        .onPost('/drivers/call')
          .replyOnce(200, { // Create subdomain
            success: true,
            result: mockSite
          });

      const result = await client.sites.create({
        name: 'mysite',
        directory: '/my/path'
      });

      expect(result).toEqual(mockSite);
      expect(mockAxios.history.post.length).toEqual(2);
    });

    it('should handle existing subdomain', async () => {
      mockAxios.onPost('/drivers/call').reply(200, {
        result: [{
          uid: 'existing-site',
          subdomain: 'mysite'
        }]
      });

      await expect(client.sites.create({
        name: 'mysite',
        directory: '/my/path'
      })).rejects.toThrow('Subdomain already exists');
    });
  });

  describe('Delete Site', () => {
    it('should delete a site', async () => {
      const mockSite = { uid: 'site-123' };
      const mockResponse = { success: true };

      mockAxios
        .onPost('/delete-site')
          .replyOnce(200, mockResponse)
        .onPost('/drivers/call')
          .replyOnce(200, mockResponse);

      const result = await client.sites.delete(mockSite.uid);
      expect(result).toBe(true);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        site_uuid: mockSite.uid
      }));
      expect(mockAxios.history.post.length).toEqual(2);
    });

    it('should handle deletion errors', async () => {
      mockAxios.onPost('/delete-site').reply(500, {
        error: {
          message: 'Failed to delete site'
        }
      });

      await expect(client.sites.delete('site-123'))
        .rejects.toThrow('Failed to delete site');
    });
  });
});