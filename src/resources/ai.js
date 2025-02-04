import { PuterError } from '../errors.js';
import { INTERFACE_CHAT_COMPLETION, INTERFACE_OCR, INTERFACE_TTS, INTERFACE_IMGE_GENERATION } from '../constants.js';

export class PuterAI {
  constructor(client) {
    this.client = client;
  }

  /**
   * Get chat completion
   * @param {Array} messages - Array of chat messages
   * @returns {Promise<object>} Chat completion result
   */
  async chatComplete(messages) {
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
   * Get streaming chat completion
   * @param {Array} messages - Array of chat messages
   * @returns {Promise<ReadableStream>} Stream of chat completion
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
   * Perform OCR on an image
   * @param {string} fileId - ID of the file to process
   * @returns {Promise<object>} OCR result
   */
  async ocrRecognize(fileId) {
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
   * Generate an image from a prompt
   * @param {object} options
   * @param {string} options.prompt - Text prompt for image generation
   * @returns {Promise<object>} Generated image details
   */
  async generateImage(options) {
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
   * List available TTS voices
   * @returns {Promise<Array>} List of available voices
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
   * @param {object} options
   * @param {string} options.text - Text to synthesize
   * @param {string} options.voice - Voice ID to use
   * @returns {Promise<Stream>} Audio stream
   */
  async synthesizeSpeech(options) {
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