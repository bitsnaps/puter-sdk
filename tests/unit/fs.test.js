import { describe, expect, it, beforeEach } from 'vitest';
import PuterClient from '../../src/index';
import { mockAxios } from '../mocks/axios';

describe('File Operations', () => {
  let client;

  beforeEach(() => {
    client = new PuterClient({ token: 'test-token' });
    mockAxios.reset();
  });

  describe('Directory Operations', () => {
    it('should list directory contents', async () => {
      const mockData = [{
        name: 'test.txt',
        is_dir: false,
        size: 1234,
        path: '/test.txt'
      }];
      
      mockAxios.onPost('/readdir').reply(200, mockData);
      
      const contents = await client.fs.readdir('/');
      expect(contents).toEqual(mockData);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({ path: '/' }));
    });

    it('should create directory', async () => {
      const mockResponse = {
        uid: 'dir-123',
        path: '/new-directory'
      };

      mockAxios.onPost('/mkdir').reply(200, mockResponse);

      const result = await client.fs.mkdir({
        path: '/new-directory',
        overwrite: false,
        dedupeName: true,
        createParents: true
      });

      expect(result).toEqual(mockResponse);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        parent: '/',
        path: 'new-directory',
        overwrite: false,
        dedupe_name: true,
        create_missing_parents: true
      }));
    });

    it('should handle directory creation errors', async () => {
      mockAxios.onPost('/mkdir').reply(400, {
        error: {
          code: 'DIRECTORY_EXISTS',
          message: 'Directory already exists'
        }
      });

      await expect(client.fs.mkdir({
        path: '/existing-directory'
      })).rejects.toThrow('Directory already exists');
    });
  });

  describe('File Operations', () => {
    it('should get file info', async () => {
      const mockResponse = {
        uid: 'file-123',
        name: 'test.txt',
        is_dir: false,
        size: 1234,
        path: '/test.txt'
      };

      mockAxios.onPost('/stat').reply(200, mockResponse);

      const result = await client.fs.getInfo('/test.txt');
      expect(result).toEqual(mockResponse);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        path: '/test.txt'
      }));
    });

    it('should rename file', async () => {
      const mockStatResponse = {
        uid: 'file-123',
        path: '/old-name.txt'
      };

      const mockRenameResponse = {
        success: true
      };

      mockAxios.onPost('/stat')
        .reply(200, mockStatResponse)
        .onPost('/rename')
        .reply(200, mockRenameResponse);

      const result = await client.fs.rename('/old-name.txt', '/new-name.txt');
      expect(result).toEqual(mockRenameResponse);

      // Verify stat call
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        path: '/old-name.txt'
      }));

      // Verify rename call
      expect(mockAxios.history.post[1].data).toEqual(JSON.stringify({
        uid: 'file-123',
        new_name: 'new-name.txt'
      }));
    });

    it('should handle file uploads', async () => {
      const mockFile = new Blob(['content'], { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', mockFile, 'test.txt');
      
      const mockResponse = { results: [{ copied: { path: '/test.txt' } }] };
      
      mockAxios.onPost('/batch').reply(200, mockResponse);
      
      const result = await client.fs.upload({
        file: mockFile,
        path: '/uploads',
        name: 'test.txt'
      });
      
      expect(result).toEqual(mockResponse);
      
      // Verify the request headers
      const requestHeaders = mockAxios.history.post[0].headers;
      expect(requestHeaders['Content-Type']).toMatch(/application\/x-www-form-urlencoded/);
    });

    it('should delete file', async () => {
      const mockResponse = {
        success: true
      };

      mockAxios.onPost('/delete').reply(200, mockResponse);

      const result = await client.fs.delete('/test.txt');
      expect(result).toEqual(mockResponse);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        path: '/test.txt'
      }));
    });
  });

  describe('Error Handling', () => {
    it('should handle file not found error', async () => {
      mockAxios.onPost('/stat').reply(404, {
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found'
        }
      });

      await expect(client.fs.getInfo('/nonexistent.txt'))
        .rejects.toThrow('File not found');
    });

    it('should handle permission denied error', async () => {
      mockAxios.onPost('/readdir').reply(403, {
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Permission denied'
        }
      });

      await expect(client.fs.readdir('/restricted'))
        .rejects.toThrow('Permission denied');
    });
  });
});