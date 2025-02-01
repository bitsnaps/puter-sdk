import { describe, expect, it, beforeEach } from 'vitest';
import PuterClient from '../src/index';
import { mockAxios } from './mocks/axios';

describe('File Operations', () => {
  let client;

  beforeEach(() => {
    client = new PuterClient({ token: 'test-token' });
    mockAxios.reset();
  });

  it('should dispaly user information', async () => {
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

});