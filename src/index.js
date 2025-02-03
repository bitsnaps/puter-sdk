import axios from 'axios';
import { PuterUsage } from './resources/usage';
import { PuterAuth } from './resources/auth';
import { PuterFileSystem } from './resources/filesystem';
import { PuterApps } from './resources/apps';
import { PuterSites } from './resources/sites';
import { PuterSubdomains } from './resources/subdomains';
import { PuterAI } from './resources/ai';
import { PuterError } from './errors';
import config from './config';

export default class PuterClient {
  
  constructor(clientConfig = {}) {
    this.baseURL = clientConfig.baseURL || config.apiBaseUrl;
    this.token = clientConfig.token || config.apiKey;
    
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
    this.sites = new PuterSites(this);
    this.subdomains = new PuterSubdomains(this);
    this.usage = new PuterUsage(this);
    this.subdomains = new PuterSubdomains(this);
    this.ai = new PuterAI(this);

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
   * Check if 2FA is required for the user
   * @param {string} username
   * @returns {Promise<boolean>}
   */
  async isTwoFactorRequired(username) {
    try {
      const response = await this.http.post('/login', {
        username,
        password: 'dummy' // Server should respond with 2FA requirement without validating password
      });
      return response.next_step === 'otp';
    } catch (error) {
      return false;
    }
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