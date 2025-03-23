import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import PuterClient from '../../src/index';
import { v4 as uuidv4 } from 'uuid';
import { File } from 'node:buffer';

describe('Integration tests for PuterFileSystem', () => {
  let client;
  const testRootDir = `/test-fs-${uuidv4().substring(0, 8)}`;
  const testFile = new File(['Test file content'], 'test-file.txt', { type: 'text/plain' });
  let uploadedFileUid;

  beforeAll(async () => {
    // Initialize the SDK with test credentials
    client = new PuterClient({
      apiKey: process.env.PUTER_TEST_API_KEY,
      baseURL: process.env.PUTER_TEST_API_URL
    });
  });

  afterAll(async () => {
    // Clean up the test directory
    try {
      await client.fs.delete(testRootDir);
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  });

  it('should create a directory', async () => {
    const result = await client.fs.mkdir({
      path: testRootDir,
      overwrite: true,
      createParents: true
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.uid).toBeDefined();
  });

  it('should create nested directories', async () => {
    const nestedDir = `${testRootDir}/nested/subdirectory`;
    const result = await client.fs.mkdir({
      path: nestedDir,
      createParents: true
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.uid).toBeDefined();
  });

  it('should list directory contents', async () => {
    // Create a test file in the directory first
    const uploadResult = await client.fs.upload({
      file: testFile,
      path: testRootDir,
      name: testFile.name
    });
    uploadedFileUid = uploadResult.uid;

    // Test list method
    const listResult = await client.fs.list(testRootDir);
    expect(Array.isArray(listResult)).toBe(true);
    
    // Should contain the uploaded file
    const foundFile = listResult.find(item => item.name === testFile.name);
    expect(foundFile).toBeDefined();
    expect(foundFile.uid).toBe(uploadedFileUid);
    
    // Test readdir (alias)
    const readdirResult = await client.fs.readdir(testRootDir);
    expect(readdirResult).toEqual(listResult);
  });

  it('should get file information', async () => {
    const filePath = `${testRootDir}/${testFile.name}`;
    const fileInfo = await client.fs.getInfo(filePath);
    
    expect(fileInfo).toBeDefined();
    expect(fileInfo.name).toBe(testFile.name);
    expect(fileInfo.uid).toBe(uploadedFileUid);
    expect(fileInfo.size).toBe(testFile.size);
    expect(fileInfo.is_dir).toBe(false);
  });

  it('should rename a file', async () => {
    const oldPath = `${testRootDir}/${testFile.name}`;
    const newFileName = 'renamed-file.txt';
    const newPath = `${testRootDir}/${newFileName}`;
    
    const renameResult = await client.fs.rename(oldPath, newPath);
    expect(renameResult).toBeDefined();
    expect(renameResult.success).toBe(true);
    
    // Verify the file was renamed
    const dirContents = await client.fs.list(testRootDir);
    const foundFile = dirContents.find(item => item.name === newFileName);
    expect(foundFile).toBeDefined();
    
    // Original file should no longer exist
    const originalFile = dirContents.find(item => item.name === testFile.name);
    expect(originalFile).toBeUndefined();
  });

  it('should upload a file', async () => {
    const newFile = new File(['New test content'], 'new-test-file.txt', { type: 'text/plain' });
    const uploadResult = await client.fs.upload({
      file: newFile,
      path: testRootDir,
      name: newFile.name
    });
    
    expect(uploadResult).toBeDefined();
    expect(uploadResult.uid).toBeDefined();
    
    // Verify the file exists in the directory
    const dirContents = await client.fs.list(testRootDir);
    const foundFile = dirContents.find(item => item.name === newFile.name);
    expect(foundFile).toBeDefined();
    expect(foundFile.uid).toBe(uploadResult.uid);
  });

  it('should delete a file', async () => {
    const filePath = `${testRootDir}/new-test-file.txt`;
    const deleteResult = await client.fs.delete(filePath);
    
    expect(deleteResult).toBeDefined();
    expect(deleteResult.success).toBe(true);
    
    // Verify the file no longer exists
    const dirContents = await client.fs.list(testRootDir);
    const foundFile = dirContents.find(item => item.name === 'new-test-file.txt');
    expect(foundFile).toBeUndefined();
  });

  it('should handle errors for non-existent paths', async () => {
    const nonExistentPath = `${testRootDir}/non-existent-folder`;
    
    // Should throw when trying to get info on non-existent path
    await expect(client.fs.getInfo(nonExistentPath)).rejects.toThrow();
    
    // Should throw when trying to rename non-existent file
    await expect(client.fs.rename(nonExistentPath, `${nonExistentPath}-renamed`)).rejects.toThrow();
  });

  it('should delete a directory with contents', async () => {
    // Create a test directory with a file
    const testSubDir = `${testRootDir}/dir-to-delete`;
    await client.fs.mkdir({ path: testSubDir });
    
    const testSubFile = new File(['Content'], 'subfile.txt', { type: 'text/plain' });
    await client.fs.upload({
      file: testSubFile,
      path: testSubDir,
      name: testSubFile.name
    });
    
    // Delete the directory
    const deleteResult = await client.fs.delete(testSubDir);
    expect(deleteResult).toBeDefined();
    expect(deleteResult.success).toBe(true);
    
    // Verify the directory no longer exists
    const dirContents = await client.fs.list(testRootDir);
    const foundDir = dirContents.find(item => item.name === 'dir-to-delete');
    expect(foundDir).toBeUndefined();
  });
});