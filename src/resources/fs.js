export class PuterFileSystem {
  constructor(client) {
    this.client = client;
  }

  /**
   * @alias to `readdir()` function
   */
  async list(path) {
    return this.readdir(path)
  }

  /**
   * List objects in the path directory
   * @param {*} path 
   * @returns list of objects
   */
  async readdir(path) {
    const response = await this.client.http.post('/readdir', { path });
    return response;
  }

  /**
   * Create a directory
   * @param {object} options containing the path of the directory
   * @returns result of the operation
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
   * @returns {object} File/directory information
   */
  async getInfo(path) {
    const response = await this.client.http.post('/stat', { path });
    return response;
  }

  /**
   * Rename a file or directory
   * @param {string} oldPath - Current path of the file/directory
   * @param {string} newPath - New path for the file/directory
   * @returns {object} Result of the rename operation
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
   * @param {File} options.file - The file to upload
   * @param {string} options.path - Destination path
   * @param {string} options.name - Name of the file
   * @returns {object} Result of the upload operation
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
   * @returns {object} Result of the delete operation
   */
  async delete(path) {
    const response = await this.client.http.post('/delete', { path });
    return response;
  }
}
