import { describe, expect, it, vi, beforeEach } from 'vitest';
import PuterClient from '../src/index';
import { mockAxios } from './mocks/axios';

describe('Authentication', () => {
  let client;
  
  beforeEach(() => {
    client = new PuterClient();
    mockAxios.reset();
  });

  it('should authenticate with valid credentials', async () => {
    mockAxios.onPost('/login').reply(200, {
      proceed: true,
      token: 'test-token'
    });

    const result = await client.login('user', 'pass');
    expect(result).toEqual({ proceed: true, token: 'test-token' });
    expect(client.token).toBe('test-token');
  });

  it('should throw error with invalid credentials', async () => {
    mockAxios.onPost('/login').reply(200, {
      proceed: false,
      token: null
    });

    await expect(client.login('invalid', 'creds'))
      .rejects.toThrow('Authentication failed');
  });
});