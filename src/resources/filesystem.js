export class PuterFileSystem {
    constructor(client) {
      this.client = client;
    }
  
    async listDirectory(path) {
      return this.client.http.post('/readdir', { path });
    }
  
    async uploadFile({ file, path, name, operationId = Date.now().toString() }) {
      const formData = new FormData();
      formData.append('operation_id', operationId);
      formData.append('fileinfo', JSON.stringify({ name, type: file.type, size: file.size }));
      formData.append('operation', JSON.stringify({ op: 'write', path, name }));
      formData.append('file', file);
  
      return this.client.http.post('/batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
  
    async delete(path) {
      return this.client.http.post('/delete', { path });
    }
  
    // Add other file operations (stat, copy, etc.)
  }