import { describe, it, expect, beforeAll } from 'vitest';
import PuterClient from '../../src/index';
import PuterError from '../../src/errors';

describe('Integration tests for PuterUsage', () => {
  let client;

  beforeAll(async () => {
    // Initialize the SDK with test credentials
    client = new PuterClient({
      apiKey: process.env.PUTER_TEST_API_KEY,
      baseURL: process.env.PUTER_TEST_API_URL
    });
  });

  it('should get disk usage information using df()', async () => {
    const diskInfo = await client.usage.df();
    
    // Verify the structure of the response
    expect(diskInfo).toBeDefined();
    expect(typeof diskInfo.total).toBe('number');
    expect(typeof diskInfo.used).toBe('number');
    expect(typeof diskInfo.available).toBe('number');
    
    // Basic validation of values
    expect(diskInfo.total).toBeGreaterThan(0);
    expect(diskInfo.used).toBeGreaterThanOrEqual(0);
    expect(diskInfo.available).toBeGreaterThanOrEqual(0);
    expect(diskInfo.total).toBeGreaterThanOrEqual(diskInfo.used);
    
    // If usedPercentage is provided, validate it
    if (diskInfo.usedPercentage !== undefined) {
      expect(typeof diskInfo.usedPercentage).toBe('number');
      expect(diskInfo.usedPercentage).toBeGreaterThanOrEqual(0);
      expect(diskInfo.usedPercentage).toBeLessThanOrEqual(100);
    }
  });

  it('should get disk usage information using getDiskUsage()', async () => {
    const diskInfo = await client.usage.getDiskUsage();
    
    // Verify the structure of the response
    expect(diskInfo).toBeDefined();
    expect(typeof diskInfo.total).toBe('number');
    expect(typeof diskInfo.used).toBe('number');
    expect(typeof diskInfo.available).toBe('number');
    
    // Basic validation of values
    expect(diskInfo.total).toBeGreaterThan(0);
    expect(diskInfo.used).toBeGreaterThanOrEqual(0);
    expect(diskInfo.available).toBeGreaterThanOrEqual(0);
    
    // Verify that df() and getDiskUsage() return the same data
    const dfResult = await client.usage.df();
    expect(diskInfo).toEqual(dfResult);
  });

  it('should get general usage information using usage()', async () => {
    const usageInfo = await client.usage.usage();
    
    // Verify the response is defined
    expect(usageInfo).toBeDefined();
    
    // The exact structure may vary, but we can check for common properties
    // that are likely to be present in any usage information
    expect(usageInfo).toBeTypeOf('object');
  });

  it('should get detailed usage information using getUsageInfo()', async () => {
    const usageInfo = await client.usage.getUsageInfo();
    
    // Verify the response is defined
    expect(usageInfo).toBeDefined();
    expect(usageInfo).toBeTypeOf('object');
    
    // Verify that usage() and getUsageInfo() return the same data
    const usageResult = await client.usage.usage();
    expect(usageInfo).toEqual(usageResult);
  });

  it('should handle errors gracefully', async () => {
    // Mock the client's http.post method to simulate an error
    const originalPost = client.http.post;
    client.http.post = async () => {
      throw { response: { data: { error: { message: 'Test error' } } } };
    };
    
    // Test error handling in getDiskUsage
    await expect(client.usage.getDiskUsage()).rejects.toThrow(PuterError);
    
    // Restore the original method
    client.http.post = originalPost;
    
    // Mock the client's http.get method to simulate an error
    const originalGet = client.http.get;
    client.http.get = async () => {
      throw { response: { data: { error: { message: 'Test error' } } } };
    };
    
    // Test error handling in getUsageInfo
    await expect(client.usage.getUsageInfo()).rejects.toThrow(PuterError);
    
    // Restore the original method
    client.http.get = originalGet;
  });
});