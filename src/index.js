import axios from 'axios';
import { PuterAuth } from './resources/auth';
import { PuterFileSystem } from './resources/filesystem';
import { PuterApps } from './resources/apps';
import { PuterSubdomains } from './resources/subdomains';
import { PuterError } from './errors';
import { API_BASE_URL } from './constants';

export default class PuterClient {

  constructor(config = {}) {
    this.baseURL = config.baseURL || API_BASE_URL;
    this.token = config.token || null;
    this.http = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` })
      }
    });

    // Initialize resources
    this.auth = new PuterAuth(this);
    this.filesystem = new PuterFileSystem(this);
    this.apps = new PuterApps(this);
    this.subdomains = new PuterSubdomains(this);

    // Add response interceptor
    this.http.interceptors.response.use(
      response => response.data,
      error => {
        if (error.response?.data?.error) {
          return Promise.reject(new PuterError(error.response.data.error));
        }
        return Promise.reject(error);
      }
    );
  }


  /**
   * Upload a file to the given destination
   * @param {object} params to indicate where to upload files
   */
  uploadFile(params = {}) {
    
  }

  /**
   * List directories in given path
   * @param {string} path directory
   */
  listDirectory(path /*: string */) {
    
  }
}