/**
 * PuterFileSystem class for file system operations
 * @class
 */
export class PuterFileSystem {
  /**
   * Creates an instance of PuterFileSystem
   * @param {object} client - The Puter client instance
   */
  constructor(client) {
    this.client = client;
  }

  /**
   * List objects in a directory (alias to readdir)
   * @param {string} path - Path to the directory
   * @returns {Promise<Array>} Array of directory contents
   * @throws {Error} If the directory cannot be read
   * @example
   * // List files in a directory
   * const files = await client.fs.list('/Documents');
   */
  async list(path) {
    return this.readdir(path)
  }

  /**
   * List objects in a directory
   * @param {string} path - Path to the directory
   * @returns {Promise<Array>} Array of directory contents with file metadata
   * @throws {Error} If the directory cannot be read
   * @example
   * // Read directory contents
   * const files = await client.fs.readdir('/Documents');
   */
  async readdir(path) {
    const response = await this.client.http.post('/readdir', { path });
    return response;
  }

  /**
   * Create a directory
   * @param {object} options - Directory creation options
   * @param {string} options.path - Path of the directory to create
   * @param {boolean} [options.overwrite=false] - Whether to overwrite existing directory
   * @param {boolean} [options.dedupeName=true] - Whether to deduplicate directory name if it exists
   * @param {boolean} [options.createParents=true] - Whether to create parent directories if they don't exist
   * @returns {Promise<object>} Result of the directory creation operation
   * @throws {Error} If the directory cannot be created
   * @example
   * // Create a directory
   * const result = await client.fs.mkdir({
   *   path: '/Documents/Projects',
   *   overwrite: false,
   *   dedupeName: true,
   *   createParents: true
   * });
   */
  async mkdir(options) {
    const { path, overwrite = false, dedupeName = true, createParents = true } = options;
    const parent = path.split('/').slice(0, -1).join('/') || '/';
    const dirName = path.split('/').pop();

    const response = await this.client.http.post('/mkdir', {
      parent,
      path: dirName,
      overwrite,
      dedupe_name: dedupeName,
      create_missing_parents: createParents
    });

    return response;
  }

  /**
   * Get information about a file or directory
   * @param {string} path - Path to the file/directory
   * @returns {Promise<object>} File/directory metadata including size, type, and timestamps
   * @throws {Error} If the file/directory information cannot be retrieved
   * @example
   * // Get file information
   * const fileInfo = await client.fs.getInfo('/Documents/report.pdf');
   * console.log(`File size: ${fileInfo.size} bytes`);
   */
  async getInfo(path) {
    const response = await this.client.http.post('/stat', { path });
    return response;
  }

  /**
   * Rename a file or directory
   * @param {string} oldPath - Current path of the file/directory
   * @param {string} newPath - New path for the file/directory
   * @returns {Promise<object>} Result of the rename operation
   * @throws {Error} If the file/directory cannot be renamed
   * @example
   * // Rename a file
   * const result = await client.fs.rename('/Documents/old.txt', '/Documents/new.txt');
   */
  async rename(oldPath, newPath) {
    // Get file UID
    const statResponse = await this.getInfo(oldPath);
    
    // Perform rename
    const response = await this.client.http.post('/rename', {
      uid: statResponse.uid,
      new_name: newPath.split('/').pop()
    });

    return response;
  }

  /**
   * Upload a file to the specified path
   * @param {object} options - Upload options
   * @param {File|Blob} options.file - The file to upload
   * @param {string} options.path - Destination directory path
   * @param {string} options.name - Name to give the uploaded file
   * @returns {Promise<object>} Result of the upload operation with file metadata
   * @throws {Error} If the file cannot be uploaded
   * @example
   * // Upload a file
   * const fileInput = document.querySelector('input[type="file"]');
   * const result = await client.fs.upload({
   *   file: fileInput.files[0],
   *   path: '/Documents',
   *   name: 'uploaded-file.pdf'
   * });
   */
  async upload({ file, path, name }) {
    const formData = new FormData();
    formData.append('operation_id', Date.now().toString());
    formData.append('fileinfo', JSON.stringify({ 
      name, 
      type: file.type, 
      size: file.size 
    }));
    formData.append('operation', JSON.stringify({ 
      op: 'write', 
      path, 
      name 
    }));
    formData.append('file', file);
  
    return this.client.http.post('/batch', formData);
  }

  /**
   * Delete a file or directory
   * @param {string} path - Path to the file/directory to delete
   * @returns {Promise<object>} Result of the delete operation
   * @throws {Error} If the file/directory cannot be deleted
   * @example
   * // Delete a file
   * const result = await client.fs.delete('/Documents/unwanted-file.txt');
   */
  async delete(path) {
    const response = await this.client.http.post('/delete', { path });
    return response;
  }
}