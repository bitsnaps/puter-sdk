import { PuterError } from '../errors.js';
import { INTERFACE_KVSTORE } from '../constants.js';

export class PuterKV {
  constructor(client) {
    this.client = client;
  }

  async set(key, value) {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid key');
    }
    if (key.length > 1024) {
      throw new Error('Key too large');
    }

    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: INTERFACE_KVSTORE,
        method: 'set',
        args: {
          key,
          value
        }
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to set value');
      }

      return true;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to set value');
    }
  }

  async get(key) {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid key');
    }

    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: INTERFACE_KVSTORE,
        method: 'get',
        args: { key }
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to get value');
      }

      return response.result;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to get value');
    }
  }

  async del(key) {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid key');
    }

    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: INTERFACE_KVSTORE,
        method: 'del',
        args: { key }
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete key');
      }

      return true;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to delete key');
    }
  }

  async incr(key, amount = 1) {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid key');
    }

    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: INTERFACE_KVSTORE,
        method: 'incr',
        args: { key, amount }
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to increment value');
      }

      return response.result;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to increment value');
    }
  }

  async decr(key, amount = 1) {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid key');
    }

    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: INTERFACE_KVSTORE,
        method: 'decr',
        args: { key, amount }
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to decrement value');
      }

      return response.result;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to decrement value');
    }
  }

  async flush() {
    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: INTERFACE_KVSTORE,
        method: 'flush'
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to flush storage');
      }

      return true;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to flush storage');
    }
  }

  async list(pattern = '*') {
    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: INTERFACE_KVSTORE,
        method: 'list',
        args: { pattern }
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to list keys');
      }

      return response.result;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to list keys');
    }
  }
}