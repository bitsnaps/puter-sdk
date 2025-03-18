import { describe, expect, it } from 'vitest';
import crypto from '../../src/crypto.js';

describe('Crypto Polyfill', () => {

  describe('UUID', () => {
    it('should generate valid UUID', () => {
      const uuid = crypto.randomUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = crypto.randomUUID();
      const uuid2 = crypto.randomUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

});