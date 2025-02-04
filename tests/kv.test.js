import { describe, expect, it, beforeEach } from 'vitest';
import PuterClient from '../src/index';
import { mockAxios } from './mocks/axios';

describe('Key/Value Storage', () => {
  let client;

  beforeEach(() => {
    client = new PuterClient({ token: 'test-token' });
    mockAxios.reset();
  });

  describe('Basic Operations', () => {
    it('should set and get a value', async () => {
      mockAxios
        .onPost('/drivers/call')
            .replyOnce(200, { success: true }) // set
        .onPost('/drivers/call')
            .replyOnce(200, { success: true, result: 'testValue' }); // get

      await client.kv.set('testKey', 'testValue');
      const value = await client.kv.get('testKey');
      expect(value).toBe('testValue');
    });

    it('should return null for non-existent key', async () => {
      mockAxios.onPost('/drivers/call').reply(200, {
        success: true,
        result: null
      });

      const value = await client.kv.get('nonexistentKey');
      expect(value).toBeNull();
    });

    it('should delete a key', async () => {
      mockAxios
        .onPost('/drivers/call')
          .replyOnce(200, { success: true }) // set
        .onPost('/drivers/call')
            .replyOnce(200, { success: true }); // delete

      await client.kv.set('deleteKey', 'value');
      const result = await client.kv.del('deleteKey');
      expect(result).toBe(true);
    });
  });

  describe('Data Types', () => {
    it('should handle objects', async () => {
      const testObj = { a: 1, b: 'test' };
      mockAxios
        .onPost('/drivers/call')
            .replyOnce(200, { success: true })
        .onPost('/drivers/call')
            .replyOnce(200, { success: true, result: testObj });

      await client.kv.set('objectKey', testObj);
      const value = await client.kv.get('objectKey');
      expect(value).toEqual(testObj);
    });

    it('should handle arrays', async () => {
      const testArray = [1, 2, 3];
      mockAxios
        .onPost('/drivers/call')
            .replyOnce(200, { success: true })
        .onPost('/drivers/call')
            .replyOnce(200, { success: true, result: testArray });

      await client.kv.set('arrayKey', testArray);
      const value = await client.kv.get('arrayKey');
      expect(value).toEqual(testArray);
    });

    it('should handle numbers', async () => {
      mockAxios
            .onPost('/drivers/call')
        .replyOnce(200, { success: true })
            .onPost('/drivers/call')
        .replyOnce(200, { success: true, result: 123 });

      await client.kv.set('numberKey', 123);
      const value = await client.kv.get('numberKey');
      expect(value).toBe(123);
    });

    it('should handle booleans', async () => {
      mockAxios
        .onPost('/drivers/call')
            .replyOnce(200, { success: true })
        .onPost('/drivers/call')
            .replyOnce(200, { success: true, result: true });

      await client.kv.set('booleanKey', true);
      const value = await client.kv.get('booleanKey');
      expect(value).toBe(true);
    });
  });

  describe('Increment/Decrement Operations', () => {
    it('should increment a key', async () => {
      mockAxios.onPost('/drivers/call')
        .replyOnce(200, { success: true, result: 1 });

      const result = await client.kv.incr('counterKey');
      expect(result).toBe(1);
    });

    it('should increment by specific amount', async () => {
      mockAxios.onPost('/drivers/call')
        .replyOnce(200, { success: true, result: 5 });

      const result = await client.kv.incr('counterKey', 5);
      expect(result).toBe(5);
    });

    it('should decrement a key', async () => {
      mockAxios.onPost('/drivers/call')
        .replyOnce(200, { success: true, result: -1 });

      const result = await client.kv.decr('counterKey');
      expect(result).toBe(-1);
    });

    it('should decrement by specific amount', async () => {
      mockAxios.onPost('/drivers/call')
        .replyOnce(200, { success: true, result: 5 });

      const result = await client.kv.decr('counterKey', 5);
      expect(result).toBe(5);
    });
  });

  describe('Bulk Operations', () => {
    it('should flush all keys', async () => {
      mockAxios.onPost('/drivers/call')
        .replyOnce(200, { success: true }); // flush

      const result = await client.kv.flush();
      expect(result).toBe(true);
    });

    it('should list keys', async () => {
      const keys = ['key1', 'key2', 'key3'];
      mockAxios.onPost('/drivers/call')
        .replyOnce(200, { success: true, result: keys });

      const result = await client.kv.list();
      expect(result).toEqual(keys);
    });

    it('should list keys with glob pattern', async () => {
      const keys = ['key1', 'key2'];
      mockAxios.onPost('/drivers/call')
        .replyOnce(200, { success: true, result: keys });

      const result = await client.kv.list('key*');
      expect(result).toEqual(keys);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid key', async () => {
      await expect(client.kv.set('', 'value'))
        .rejects.toThrow('Invalid key');
    });

    it('should throw error for large key', async () => {
      const largeKey = 'a'.repeat(1025);
      await expect(client.kv.set(largeKey, 'value'))
        .rejects.toThrow('Key too large');
    });

    it('should handle API errors', async () => {
      mockAxios.onPost('/drivers/call').reply(500, {
        error: {
          code: 'KV_ERROR',
          message: 'Storage error'
        }
      });

      await expect(client.kv.set('key', 'value'))
        .rejects.toThrow('Storage error');
    });
  });
});