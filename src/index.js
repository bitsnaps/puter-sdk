import axios from 'axios';
import { PuterUsage } from './resources/usage.js';
import { PuterAuth } from './resources/auth.js';
import { PuterFileSystem } from './resources/fs.js';
import { PuterKV } from './resources/kv.js';
import { PuterApps } from './resources/apps.js';
import { PuterSites } from './resources/sites.js';
import { PuterSubdomains } from './resources/subdomains.js';
import { PuterAI } from './resources/ai.js';
import { PuterError } from './errors.js';
import config from './config.js';

export default class PuterClient {
  
  constructor(clientConfig = {}) {
    this.baseURL = clientConfig.baseURL || config.apiBaseUrl;
    this.token = clientConfig.token || config.apiKey;
  
    // Create the base HTTP client
    this.http = axios.create({
      baseURL: this.baseURL,
      headers: this.getDefaultHeaders()
    });
  
    // Initialize resources
    this.auth = new PuterAuth(this);
    this.fs = new PuterFileSystem(this);
    this.kv = new PuterKV(this);
    this.apps = new PuterApps(this);
    this.sites = new PuterSites(this);
    this.subdomains = new PuterSubdomains(this);
    this.usage = new PuterUsage(this);
    this.ai = new PuterAI(this);
  
    // Add request interceptor for dynamic headers
    this.http.interceptors.request.use(config => {
      // Add authorization header if token exists
      if (this.token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
  
      // Handle multipart/form-data for file uploads
      if (config.data instanceof FormData) {

        // config.headers['Content-Type'] = `multipart/form-data; boundary=${config.data['boundary']}`;

        // Remove the existing Content-Type header
        delete config.headers['Content-Type'];
        // We let the browser set the Content-Type with the correct boundary
        // This is handled automatically by the browser's FormData implementation
      }
  
      return config;
    });
  
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
   * Get default headers for API requests
   * @returns {object} Default headers
   */
  getDefaultHeaders() {
    return {
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Connection': 'keep-alive',
      'Content-Type': 'application/json',
      'Origin': this.baseURL,
      'Referer': `${this.baseURL}/`,
      'User-Agent': 'Puter-SDK/1.0.0',
      'X-Requested-With': 'XMLHttpRequest'
    };
  }
  
  /**
   * Update the authentication token
   * @param {string} token - New authentication token
   */
  setToken(token) {
    this.token = token;
    this.http.defaults.headers['Authorization'] = `Bearer ${token}`;
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

}