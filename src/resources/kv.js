import { PuterError } from '../errors.js';
import { INTERFACE_KVSTORE } from '../constants.js';

/**
 * PuterKV class for key-value storage operations
 * @class
 */
export class PuterKV {

  /**
   * Creates an instance of PuterKV
   * @param {object} client - The Puter client instance
   */
  constructor(client) {
    this.client = client;
  }

  /**
   * Set a value for a key
   * @param {string} key - The key to set (max 1024 characters)
   * @param {*} value - The value to store (can be any JSON-serializable value)
   * @returns {Promise<boolean>} True if successful
   * @throws {Error} If key is invalid or too large
   * @throws {PuterError} If the server returns an error
   * @example
   * // Store a string
   * await client.kv.set('greeting', 'Hello World');
   * 
   * // Store an object
   * await client.kv.set('user', { name: 'John', age: 30 });
   */
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

  /**
   * Get a value by key
   * @param {string} key - The key to retrieve
   * @returns {Promise<*>} The stored value, or null if key doesn't exist
   * @throws {Error} If key is invalid
   * @throws {PuterError} If the server returns an error
   * @example
   * // Get a simple value
   * const greeting = await client.kv.get('greeting');
   * 
   * // Get an object
   * const user = await client.kv.get('user');
   * console.log(user.name); // 'John'
   */
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

  /**
   * Delete a key
   * @param {string} key - The key to delete
   * @returns {Promise<boolean>} True if successful
   * @throws {Error} If key is invalid
   * @throws {PuterError} If the server returns an error
   * @example
   * // Delete a key
   * await client.kv.del('temporary-data');
   */
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

  /**
   * Increment a numeric value
   * @param {string} key - The key to increment
   * @param {number} [amount=1] - Amount to increment by
   * @returns {Promise<number>} The new value after incrementing
   * @throws {Error} If key is invalid or value is not numeric
   * @throws {PuterError} If the server returns an error
   * @example
   * // Increment by 1
   * const newCount = await client.kv.incr('visitor-count');
   * 
   * // Increment by custom amount
   * const newScore = await client.kv.incr('player-score', 10);
   */
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

  /**
   * Decrement a numeric value
   * @param {string} key - The key to decrement
   * @param {number} [amount=1] - Amount to decrement by
   * @returns {Promise<number>} The new value after decrementing
   * @throws {Error} If key is invalid or value is not numeric
   * @throws {PuterError} If the server returns an error
   * @example
   * // Decrement by 1
   * const newStock = await client.kv.decr('inventory-count');
   * 
   * // Decrement by custom amount
   * const newLevel = await client.kv.decr('fuel-level', 5);
   */
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

  /**
   * Delete all keys in the storage
   * @returns {Promise<boolean>} True if successful
   * @throws {PuterError} If the server returns an error
   * @example
   * // Clear all stored data
   * await client.kv.flush();
   */
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

  /**
   * List keys matching a pattern
   * @param {string} [pattern='*'] - Pattern to match keys (supports * wildcard)
   * @returns {Promise<Array<string>>} Array of matching keys
   * @throws {PuterError} If the server returns an error
   * @example
   * // Get all keys
   * const allKeys = await client.kv.list();
   * 
   * // Get keys with a specific prefix
   * const userKeys = await client.kv.list('user:*');
   * 
   * // Get keys matching a pattern
   * const sessionKeys = await client.kv.list('session:*:active');
   */
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