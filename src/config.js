import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Configuration settings for the Puter SDK
 * @module config
 * @property {string} apiKey - API key for authentication, loaded from PUTER_API_KEY environment variable
 * @property {string} apiBaseUrl - Base URL for API requests, loaded from PUTER_BASE_URL environment variable
 */
export default {
  apiKey: process.env.PUTER_API_KEY,
  apiBaseUrl: process.env.PUTER_BASE_URL
};