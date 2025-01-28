export class PuterAuth {
    constructor(client) {
      this.client = client;
    }
  
    async login(username, password) {
      try {
        const response = await this.client.http.post('/login', { username, password });
        if (response.proceed) {
          this.client.token = response.token;
          this.client.http.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
        }
        return response;
      } catch (error) {
        throw new Error('Authentication failed');
      }
    }
  
    async getCurrentUser() {
      return this.client.http.get('/whoami');
    }
  }