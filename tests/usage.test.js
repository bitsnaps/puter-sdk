import { describe, expect, it, beforeEach } from 'vitest';
import PuterClient from '../src/index';
import { mockAxios } from './mocks/axios';

describe('Usage Information', () => {
  let client;

  beforeEach(() => {
    client = new PuterClient({ token: 'test-token' });
    mockAxios.reset();
  });

  describe('Disk Usage', () => {
    it('should get disk usage information', async () => {
      const mockResponse = {
        total: 10737418240, // 10GB
        used: 5368709120,   // 5GB
        free: 5368709120,   // 5GB
        usage_percentage: 50
      };

      mockAxios.onPost('/df').reply(200, mockResponse);

      const result = await client.usage.getDiskUsage();
      expect(result).toEqual(mockResponse);
    });

    it('should handle disk usage API errors', async () => {
      mockAxios.onPost('/df').reply(500, {
        error: {
          message: 'Failed to get disk usage information'
        }
      });

      await expect(client.usage.getDiskUsage())
        .rejects.toThrow('Failed to get disk usage information');
    });
  });

  describe('Usage Information', () => {
    it('should get usage information', async () => {
      const mockResponse = {
        user: [
          {
            service: {
              'driver.interface': 'storage',
              'driver.method': 'read',
              'driver.implementation': 'local'
            },
            month: 10,
            year: 2023,
            monthly_usage: 5368709120,
            monthly_limit: 10737418240,
            policy: {
              'rate-limit': {
                max: 1000,
                period: 3600
              }
            }
          }
        ],
        apps: {
          app1: {
            used: 2684354560,
            available: 5368709120
          }
        },
        usages: [
          {
            name: 'storage',
            used: 5368709120,
            available: 10737418240,
            refill: 'monthly'
          }
        ]
      };

      mockAxios.onGet('/drivers/usage').reply(200, mockResponse);

      const result = await client.usage.getUsageInfo();
      expect(result).toEqual(mockResponse);
    });

    it('should handle usage information API errors', async () => {
      mockAxios.onGet('/drivers/usage').reply(403, {
        error: {
          message: 'Failed to get usage information'
        }
      });

      await expect(client.usage.getUsageInfo())
        .rejects.toThrow('Failed to get usage information');
    });

    it('should handle empty usage information', async () => {
      mockAxios.onGet('/drivers/usage').reply(200, {
        user: [],
        apps: {},
        usages: []
      });

      const result = await client.usage.getUsageInfo();
      expect(result).toEqual({
        user: [],
        apps: {},
        usages: []
      });
    });
  });
});