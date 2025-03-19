import { PuterError } from '../errors.js';
import { INTERFACE_CHAT_COMPLETION, INTERFACE_OCR, INTERFACE_TTS, INTERFACE_IMGE_GENERATION } from '../constants.js';

/**
 * PuterAI class for accessing AI capabilities of the Puter platform
 * @class
 */
export class PuterAI {

  /**
   * Creates an instance of PuterAI
   * @param {object} client - The Puter client instance
   */
  constructor(client) {
    this.client = client;
  }

  /**
   * Get chat completion from AI
   * @param {Array<object>} messages - Array of chat messages
   * @param {string} messages[].role - Role of the message sender (e.g., 'user', 'assistant', 'system')
   * @param {string} messages[].content - Content of the message
   * @returns {Promise<object>} Chat completion result containing the AI response
   * @throws {Error} If messages are invalid or API request fails
   * @example
   * // Get a chat completion
   * const result = await client.ai.chat([
   *   { role: 'system', content: 'You are a helpful assistant.' },
   *   { role: 'user', content: 'Hello, how are you?' }
   * ]);
   */
  async chat(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('At least one message is required');
    }

    // Validate message format
    messages.forEach(msg => {
      if (!msg.role || !msg.content) {
        throw new Error('Invalid message format');
      }
    });

    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: INTERFACE_CHAT_COMPLETION,
        driver: 'openai-completion',
        test_mode: false,
        method: 'complete',
        args: { messages }
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to get chat completion');
      }

      return response.result;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to get chat completion');
    }
  }

  /**
   * Get streaming chat completion from AI
   * @param {Array<object>} messages - Array of chat messages
   * @param {string} messages[].role - Role of the message sender (e.g., 'user', 'assistant', 'system')
   * @param {string} messages[].content - Content of the message
   * @returns {Promise<ReadableStream>} Stream of chat completion chunks
   * @throws {Error} If messages are invalid or API request fails
   * @example
   * // Get a streaming chat completion
   * const stream = await client.ai.chatCompleteStream([
   *   { role: 'user', content: 'Write a poem about clouds' }
   * ]);
   * // Process the stream...
   */
  async chatCompleteStream(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('At least one message is required');
    }

    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: INTERFACE_CHAT_COMPLETION,
        driver: 'openai-completion',
        test_mode: false,
        method: 'complete_stream',
        args: { messages }
      }, {
        responseType: 'stream'
      });

      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to get streaming chat completion');
    }
  }

  /**
   * Perform Optical Character Recognition (OCR) on an image
   * @param {string} fileId - UID of the file to process
   * @returns {Promise<object>} OCR result containing extracted text
   * @throws {Error} If fileId is invalid or OCR processing fails
   * @example
   * // Extract text from an image
   * const result = await client.ai.img2txt('file-uid-123456');
   * console.log(result.text);
   */
  async img2txt(fileId) {
    if (!fileId) {
      throw new Error('File ID is required');
    }

    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: INTERFACE_OCR,
        method: 'recognize',
        args: {
          source: fileId
        }
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'OCR processing failed');
      }

      return response.result;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(error.message || 'OCR processing failed');
    }
  }

  /**
   * Generate an image from a text prompt
   * @param {object} options - Options for image generation
   * @param {string} options.prompt - Text prompt describing the desired image
   * @param {number} [options.width] - Width of the generated image
   * @param {number} [options.height] - Height of the generated image
   * @returns {Promise<object>} Generated image details including URL
   * @throws {Error} If prompt is missing or image generation fails
   * @example
   * // Generate an image
   * const result = await client.ai.txt2img({
   *   prompt: 'A beautiful sunset over mountains'
   * });
   * console.log(result.url);
   */
  async txt2img(options) {
    const { prompt } = options;

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: INTERFACE_IMGE_GENERATION,
        method: 'generate',
        args: {
          prompt
        }
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Image generation failed');
      }

      return response.result;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(error.message || 'Image generation failed');
    }
  }

  /**
   * List all available text-to-speech voices
   * @returns {Promise<Array<object>>} List of available voice options
   * @throws {Error} If the request fails
   * @example
   * // Get all available voices
   * const voices = await client.ai.listVoices();
   * console.log(voices);
   */
  async listVoices() {
    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: INTERFACE_TTS,
        method: 'list_voices'
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to list voices');
      }

      return response.result;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to list voices');
    }
  }

  /**
   * Synthesize speech from text
   * @param {object} options - Options for speech synthesis
   * @param {string} options.text - Text to convert to speech
   * @param {string} options.voice - Voice ID to use for synthesis
   * @param {number} [options.speed=1.0] - Speech speed multiplier
   * @param {string} [options.format='mp3'] - Audio format
   * @returns {Promise<Stream>} Audio stream of synthesized speech
   * @throws {Error} If required parameters are missing or synthesis fails
   * @example
   * // Convert text to speech
   * const audioStream = await client.ai.txt2speech({
   *   text: 'Hello world, this is a test of text to speech.',
   *   voice: 'en-US-Neural2-F'
   * });
   * // Process the audio stream...
   */
  async txt2speech(options) {
    const { text, voice } = options;

    if (!text || !voice) {
      throw new Error('Text and voice are required');
    }

    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: INTERFACE_TTS,
        method: 'synthesize',
        args: {
          text,
          voice
        }
      }, {
        responseType: 'stream'
      });

      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(error.message || 'Speech synthesis failed');
    }
  }
  
}