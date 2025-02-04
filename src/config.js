import dotenv from 'dotenv';

dotenv.config();

export default {
  apiKey: process.env.PUTER_API_KEY,
  apiBaseUrl: process.env.PUTER_BASE_URL
};