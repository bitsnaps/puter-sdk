import { describe, expect, it, beforeEach } from 'vitest';
import PuterClient from '../src/index';
import { mockAxios } from './mocks/axios';

describe('File Operations', () => {
  let client;

  beforeEach(() => {
    client = new PuterClient({ token: 'test-token' });
    mockAxios.reset();
  });

  it('should list directory contents', async () => {
    const mockData = [{
      name: 'test.txt',
      is_dir: false,
      size: 1234,
      path: '/test.txt'
    }];
    
    mockAxios.onPost('/readdir').reply(200, mockData);
    
    const contents = await client.listDirectory('/');
    expect(contents).toEqual(mockData);
    expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({ path: '/' }));
  });

  it('should handle file uploads', async () => {
    const mockFile = new Blob(['content'], { type: 'text/plain' });
    const mockResponse = { results: [{ copied: { path: '/test.txt' } }] };
    
    mockAxios.onPost('/batch').reply(200, mockResponse);
    
    const result = await client.uploadFile({
      file: mockFile,
      path: '/uploads',
      name: 'test.txt'
    });
    
    expect(result).toEqual(mockResponse);
    expect(mockAxios.history.post[0].headers['Content-Type']).toMatch(/multipart\/form-data/);
  });
});