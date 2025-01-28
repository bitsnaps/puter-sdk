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

    const result = await client.auth.login('user', 'pass');
    expect(result).toEqual({ proceed: true, token: 'test-token' });
    expect(client.token).toBe('test-token');
    expect(client.http.defaults.headers.common['Authorization']).toBe('Bearer test-token');
  });

  it('should throw error with invalid credentials', async () => {
    mockAxios.onPost('/login').reply(200, {
      proceed: false,
      token: null
    });

    await expect(client.auth.login('invalid', 'creds'))
      .rejects.toThrow('Authentication failed');
  });

  it('should throw error when username/password is missing', async () => {
    await expect(client.auth.login())
      .rejects.toThrow('Username and password are required');
  });

  it('should handle API errors', async () => {
    mockAxios.onPost('/login').reply(500, {
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error'
      }
    });

    await expect(client.auth.login('user', 'pass'))
      .rejects.toThrow('Internal server error');
  });

  it('should get current user when authenticated', async () => {
    const mockUser = {
      username: 'testuser',
      email: 'test@example.com'
    };

    mockAxios.onPost('/login').reply(200, {
      proceed: true,
      token: 'test-token'
    });

    mockAxios.onGet('/whoami').reply(200, mockUser);

    await client.auth.login('user', 'pass');
    const user = await client.auth.getCurrentUser();
    expect(user).toEqual(mockUser);
  });

  it('should throw error when getting user without authentication', async () => {
    await expect(client.auth.getCurrentUser())
      .rejects.toThrow('Not authenticated');
  });
});