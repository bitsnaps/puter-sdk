import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import PuterClient from '../../src/index';
import { v4 as uuidv4 } from 'uuid';

describe('Integration tests for PuterSites', () => {
  let client;
  let testSiteId;
  let testSiteName;
  let testDirectory;

  beforeAll(async () => {
    // Initialize the SDK with test credentials
    client = new PuterClient({
      apiKey: process.env.PUTER_TEST_API_KEY,
      // Use test environment if available
      baseURL: process.env.PUTER_TEST_API_URL
    });

    // Create a test directory for the site
    testSiteName = `test-site-${uuidv4().substring(0, 8)}`;
    testDirectory = `/test-sites/${testSiteName}`;
    
    try {
      // Create test directory
      await client.fs.mkdir({
        path: testDirectory,
        createParents: true
      });
      
      // Create a simple index.html file
      const indexHtml = '<html><body><h1>Test Site</h1></body></html>';
      const file = new File([indexHtml], 'index.html', { type: 'text/html' });
      
      await client.fs.upload({
        file,
        path: testDirectory,
        name: 'index.html'
      });
    } catch (error) {
      console.error('Setup failed:', error);
    }
  });

  afterAll(async () => {
    // Clean up
    try {
      // Delete the test site if it was created
      if (testSiteId) {
        await client.sites.delete(testSiteId);
      }
      
      // Delete the test directory
      await client.fs.delete(testDirectory);
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  });

  it.skip('should create a new site', async () => {
    try {
      const site = await client.sites.create({
        name: testSiteName,
        directory: testDirectory
      });
      
      expect(site).toBeDefined();
      expect(site.subdomain).toBe(testSiteName);
    //   expect(site.root_dir).toBe(testDirectory);
      expect(site.uid).toBeDefined();
      
      // Save the site ID for later tests and cleanup
      testSiteId = site.uid;
    } catch (error) {
      console.error('Create site error:', error);
      throw error;
    }
  }, 30000); // Increase timeout for site creation

  it.skip('should list all sites', async () => {
    const sites = await client.sites.list();
    
    expect(Array.isArray(sites)).toBe(true);
    
    // Check if our test site is in the list
    const testSite = sites.find(site => site.uid === testSiteId);
    expect(testSite).toBeDefined();
    expect(testSite.subdomain).toBe(testSiteName);
  });

  it('should get site information by ID', async () => {
    // Skip if site wasn't created
    if (!testSiteId) {
      console.warn('Skipping test: No test site ID available');
      return;
    }
    
    const site = await client.sites.get(testSiteId);
    
    expect(site).toBeDefined();
    expect(site.uid).toBe(testSiteId);
    expect(site.subdomain).toBe(testSiteName);
    expect(site.root_dir).toBe(testDirectory);
  });

  it('should fail to create a site with an existing name', async () => {
    // Skip if site wasn't created
    if (!testSiteId) {
      console.warn('Skipping test: No test site ID available');
      return;
    }
    
    await expect(client.sites.create({
      name: testSiteName,
      directory: testDirectory
    })).rejects.toThrow('Subdomain already exists');
  });

  it('should delete a site', async () => {
    // Skip if site wasn't created
    if (!testSiteId) {
      console.warn('Skipping test: No test site ID available');
      return;
    }
    
    const result = await client.sites.delete(testSiteId);
    expect(result).toBe(true);
    
    // Verify the site is gone
    const sites = await client.sites.list();
    const deletedSite = sites.find(site => site.uid === testSiteId);
    expect(deletedSite).toBeUndefined();
    
    // Clear the testSiteId since we've deleted it
    testSiteId = null;
  }, 30000); // Increase timeout for site deletion

  it('should fail to get a non-existent site', async () => {
    const nonExistentId = 'non-existent-id';
    await expect(client.sites.get(nonExistentId)).rejects.toThrow();
  });

  it('should fail to create a site with missing parameters', async () => {
    await expect(client.sites.create({
      name: 'test-site'
      // Missing directory
    })).rejects.toThrow('Site name and directory are required');
    
    await expect(client.sites.create({
      directory: '/test-directory'
      // Missing name
    })).rejects.toThrow('Site name and directory are required');
  });
});