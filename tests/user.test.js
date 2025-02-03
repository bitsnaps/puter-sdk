import { describe, expect, it, beforeEach } from 'vitest';
import PuterClient from '../src/index';
import { mockAxios } from './mocks/axios';

describe('User Operations', () => {
  let client;
  const errorMessage = 'Failed to get user information';

  beforeEach(() => {
    client = new PuterClient({ token: 'test-token' });
    mockAxios.reset();
  });

  describe('Get User Information', () => {
    it('should display user information', async () => {
      const mockUserInfo = {
        username: 'admin',
        uuid: 'e31db073-fb41-a436-4f1d-8e78cb2c3240',
        email: 'admin@puter.com',
        email_confirmed: true,
        is_temp: false,
        feature_flags: {
          'temp-users-disabled': false,
          'user-signup-disabled': false,
          'public-folders': true,
          'share': true
        }
      };
      
      mockAxios.onGet('/whoami').reply(200, mockUserInfo);

      const response = await client.auth.getCurrentUser();
      expect(response).toEqual(mockUserInfo);
      expect(mockAxios.history.get.length).toEqual(1);
    });

    it('should handle unauthorized access', async () => {
      mockAxios.onGet('/whoami').reply(401, {
        error: {
          message: errorMessage
        }
      });

      await expect(client.auth.getCurrentUser())
        .rejects.toThrow(errorMessage);
    });

    it('should handle server errors', async () => {
      mockAxios.onGet('/whoami').reply(500, {
        error: {
          message: errorMessage
        }
      });

      await expect(client.auth.getCurrentUser())
        .rejects.toThrow(errorMessage);
    });

    it('should handle empty response', async () => {
      mockAxios.onGet('/whoami').reply(200, {});

      const response = await client.auth.getCurrentUser();
      expect(response).toEqual({});
    });
  });

  describe('User Authentication', () => {
    it('should login with valid credentials', async () => {
      const mockResponse = {
        proceed: true,
        token: 'test-token-123'
      };

      mockAxios.onPost('/login').reply(200, mockResponse);

      const result = await client.auth.login('admin', 'password');
      expect(result).toEqual(mockResponse);
      expect(client.token).toBe('test-token-123');
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        username: 'admin',
        password: 'password'
      }));
    });

    it('should handle invalid credentials', async () => {
      mockAxios.onPost('/login').reply(200, {
        proceed: false,
        token: null
      });

      await expect(client.auth.login('wrong', 'credentials'))
        .rejects.toThrow('Authentication failed');
    });

    it('should handle 2FA required', async () => {
      const firstResponse = {
        proceed: true,
        next_step: 'otp',
        otp_jwt_token: 'temp-token'
      };

      const secondResponse = {
        proceed: true,
        token: 'final-token'
      };

      mockAxios.onPost('/login').reply(200, firstResponse);
      mockAxios.onPost('/login').reply(200, secondResponse);

      const result = await client.auth.login('admin', 'password', '123456');
      expect(result).toEqual(secondResponse);
      expect(client.token).toBe('final-token');
    });

    it('should handle 2FA failure', async () => {
      mockAxios
      .onPost('/login')
        .reply(200, {
          proceed: true,
          next_step: 'otp',
          otp_jwt_token: 'temp-token'
        });

        mockAxios.onPost('/login')
          .reply(200, {
            proceed: false,
            error: {
              code: 'INVALID_OTP',
              message: 'Invalid OTP code'
            }
          });

      await expect(client.auth.login('admin', 'password', 'wrong-otp'))
        .rejects.toThrow('Invalid OTP code');
    });
  });

  describe('User Sessions', () => {
    it('should logout user', async () => {
      mockAxios.onPost('/logout').reply(200, {
        success: true
      });

      await client.auth.logout();
      expect(client.token).toBeNull();
      expect(mockAxios.history.post[0].data).toBeUndefined();
      // expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({}));
    });

    it('should handle logout errors', async () => {
      const failedErrorMessage = "Failed to logout";

      mockAxios.onPost('/logout').reply(500, {
        error: {
          message: failedErrorMessage
        }
      });

      await expect(client.auth.logout())
        .rejects.toThrow(failedErrorMessage);
    });
  });
});