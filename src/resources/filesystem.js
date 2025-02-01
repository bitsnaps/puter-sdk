export class PuterFileSystem {
  constructor(client) {
    this.client = client;
  }

  async list(path) {
    const response = await this.client.http.post('/readdir', { path });
    return response;
  }

  async createDirectory(options) {
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

  async getInfo(path) {
    const response = await this.client.http.post('/stat', { path });
    return response;
  }

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

    const response = await this.client.http.post('/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return response;
  }

  async delete(path) {
    const response = await this.client.http.post('/delete', { path });
    return response;
  }
}