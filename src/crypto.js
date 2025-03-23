import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a random UUID (v4)
 * @returns {string} A randomly generated UUID v4 string
 * @example
 * // Generate a random UUID
 * const id = randomUUID();
 * // Result: '123e4567-e89b-12d3-a456-426614174000' (example format)
 */
const randomUUID = () => {
  return uuidv4();
};

/**
 * Cryptographic utility functions for the Puter SDK
 * @namespace
 */
export default {
  randomUUID,
};