import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import PuterClient from '../../src/index';
import { v4 as uuidv4 } from 'uuid';

describe('Integration tests for PuterApps', () => {
  let client;
  let createdAppName;
  let createdAppUid;
  let testDir;

  beforeAll(async () => {
    // Initialize the SDK with test credentials
    client = new PuterClient({
      token: process.env.PUTER_TEST_API_KEY,
      baseURL: process.env.PUTER_TEST_API_URL || 'https://api.puter.com'
    });

    // Generate unique app name to avoid conflicts
    createdAppName = `test-app-${uuidv4().substring(0, 8)}`;
    
    // Create a test directory for app files
    const username = (await client.auth.getUser()).username;
    testDir = `/${username}/Public/test-app-files-${Date.now()}`;
    await client.fs.mkdir({ path: testDir });
  });

  afterAll(async () => {
    // Clean up
    try {
      // Delete the app if it was created
      if (createdAppUid) {
        await client.apps.delete(createdAppUid);
      }
      
      // Delete test directory
      if (testDir) {
        await client.fs.delete(testDir);
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  });

  it('should create a new app', async () => {
    // Skip if no API key is provided
    if (!process.env.PUTER_TEST_API_KEY) {
      console.warn('Skipping integration test: No API key provided');
      return;
    }

    const result = await client.apps.create({
      name: createdAppName,
      directory: testDir
    });

    expect(result).toBeDefined();
    expect(result.name).toBe(createdAppName);
    expect(result.uid).toBeDefined();
    
    // Store the app UID for later tests and cleanup
    createdAppUid = result.uid;
    
    // Verify app has a subdomain
    expect(result.subdomain).toBeDefined();
    expect(result.subdomain.subdomain).toBeDefined();
    
    // Verify app has a directory
    expect(result.directory).toBeDefined();
    expect(result.directory.path).toContain(createdAppName);
  });

  it('should list apps and include the created app', async () => {
    // Skip if no API key is provided or if app wasn't created
    if (!process.env.PUTER_TEST_API_KEY || !createdAppUid) {
      console.warn('Skipping integration test: No API key provided or app not created');
      return;
    }

    const apps = await client.apps.list();
    
    expect(apps).toBeInstanceOf(Array);
    
    // Find our created app in the list
    const foundApp = apps.find(app => app.uid === createdAppUid);
    expect(foundApp).toBeDefined();
    expect(foundApp.name).toBe(createdAppName);
  });

  it('should get app details by name', async () => {
    // Skip if no API key is provided or if app wasn't created
    if (!process.env.PUTER_TEST_API_KEY || !createdAppUid) {
      console.warn('Skipping integration test: No API key provided or app not created');
      return;
    }

    const app = await client.apps.get(createdAppName);
    
    expect(app).toBeDefined();
    expect(app.uid).toBe(createdAppUid);
    expect(app.name).toBe(createdAppName);
  });

  it('should update app with a new subdomain', async () => {
    // Skip if no API key is provided or if app wasn't created
    if (!process.env.PUTER_TEST_API_KEY || !createdAppUid) {
      console.warn('Skipping integration test: No API key provided or app not created');
      return;
    }

    const newSubdomain = `${createdAppName}-updated`;
    
    const updatedApp = await client.apps.update(createdAppName, {
      subdomain: newSubdomain
    });
    
    expect(updatedApp).toBeDefined();
    
    // Verify the app was updated with the new subdomain
    const app = await client.apps.get(createdAppName);
    expect(app.index_url).toContain(newSubdomain);
  });

  it('should update app files', async () => {
    // Skip if no API key is provided or if app wasn't created
    if (!process.env.PUTER_TEST_API_KEY || !createdAppUid) {
      console.warn('Skipping integration test: No API key provided or app not created');
      return;
    }

    // Create a test file in the app directory
    const testContent = '<html><body>Test App</body></html>';
    const testFile = new Blob([testContent], { type: 'text/html' });
    
    await client.fs.upload({
      file: testFile,
      path: testDir,
      name: 'index.html'
    });
    
    // Update the app with the new directory
    const updatedApp = await client.apps.update(createdAppName, {
      directory: testDir
    });
    
    expect(updatedApp).toBeDefined();
    
    // Verify the app directory was updated
    const app = await client.apps.get(createdAppName);
    expect(app.directory).toBeDefined();
  });

  it('should delete the app', async () => {
    // Skip if no API key is provided or if app wasn't created
    if (!process.env.PUTER_TEST_API_KEY || !createdAppUid) {
      console.warn('Skipping integration test: No API key provided or app not created');
      return;
    }

    const result = await client.apps.delete(createdAppUid);
    expect(result).toBe(true);
    
    // Verify the app was deleted
    try {
      await client.apps.get(createdAppName);
      // If we get here, the app still exists
      expect(true).toBe(false); // This should fail
    } catch (error) {
      // We expect an error because the app should be deleted
      expect(error.message).toContain('not found');
    }
    
    // Clear the app UID since we've deleted it
    createdAppUid = null;
  });
});