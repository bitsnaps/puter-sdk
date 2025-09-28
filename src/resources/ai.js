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
   * @param {Array<object>|string} messages - Array of chat messages or a string prompt
   * @param {boolean|object} [testMode=false] - Test mode flag or options object
   * @param {object} [options] - Additional options for the chat completion
   * @param {string} [options.model] - The model to use for completion
   * @param {number} [options.temperature] - Controls randomness (0-1, lower is more deterministic)
   * @param {number} [options.max_tokens] - Maximum number of tokens to generate
   * @returns {Promise<object>} Chat completion result containing the AI response
   * @throws {Error} If messages are invalid or API request fails
   * @example
   * // Get a chat completion with default settings
   * const result = await client.ai.chat([
   *   { role: 'system', content: 'You are a helpful assistant.' },
   *   { role: 'user', content: 'Hello, how are you?' }
   * ]);
   * 
   * // Get a chat completion with a simple prompt
   * const result = await client.ai.chat('Hello, how are you?');
   * 
   * // Get a chat completion with test mode enabled
   * const result = await client.ai.chat('Write a short poem', true);
   * 
   * // Get a chat completion with custom temperature and max_tokens
   * const result = await client.ai.chat(
   *   [
   *     { role: 'user', content: 'Write a short poem' }
   *   ],
   *   { temperature: 0.7, max_tokens: 100 }
   * );
   * // Get a streaming chat completion with custom settings
   * const stream = await client.ai.chat(
   *   [{ role: 'user', content: 'Explain quantum physics' }],
   *   { stream: true, temperature: 0.5, max_tokens: 500 }
   * );
   * // Process the stream...
   */
  async chat(prompt, arg2, arg3, arg4) {
    let messages;
    let options = {};
    let testMode = false;
    let imageUrls = [];

    // Signature: chat(prompt)
    // Signature: chat(messages)
    if (typeof prompt === 'string') {
      messages = [{ role: 'user', content: prompt }];
    } else if (Array.isArray(prompt)) {
      messages = prompt;
    } else {
      throw new Error('The first argument must be a string or an array of messages.');
    }

    const args = [arg2, arg3, arg4].filter(arg => arg !== undefined);

    for (const arg of args) {
      if (typeof arg === 'boolean') {
        testMode = arg;
      } else if (typeof arg === 'string') {
        imageUrls.push(arg);
      } else if (Array.isArray(arg) && arg.every(item => typeof item === 'string')) {
        imageUrls.push(...arg);
      } else if (typeof arg === 'object' && !Array.isArray(arg)) {
        options = { ...options, ...arg };
      }
    }

    // Determine streaming mode from options
    const isStream = !!(options && options.stream === true);

    // Since this is a Node.js environment, we assume image URLs are local file paths
    // and we need to upload them to get a file ID that the backend can use.
    if (imageUrls.length > 0) {
      const uploadPromises = imageUrls.map(url => this.client.fs.upload(url, '/'));
      const uploadResults = await Promise.all(uploadPromises);

      const visionContent = uploadResults.map(result => ({
        type: 'image_url',
        image_url: {
          // The backend expects a file UID
          url: `file://${result.uid}`,
        },
      }));
      
      // Add image content to the last user message
      const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');
      if (lastUserMessage) {
        if (typeof lastUserMessage.content === 'string') {
          lastUserMessage.content = [
            { type: 'text', text: lastUserMessage.content },
            ...visionContent,
          ];
        } else if (Array.isArray(lastUserMessage.content)) {
          lastUserMessage.content.push(...visionContent);
        }
      } else {
        // If no user message, create one
        messages.push({ role: 'user', content: visionContent });
      }
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('At least one message is required.');
    }

    // Validate message format
    for (const m of messages) {
      const hasValidRole = typeof m === 'object' && typeof m.role === 'string';
      const hasValidContent = typeof m.content === 'string' || Array.isArray(m.content);
      if (!hasValidRole || !hasValidContent) {
        throw new Error('Invalid message format');
      }
    }


    try {
      const payload = {
        interface: INTERFACE_CHAT_COMPLETION,
        driver: 'openai-completion',
        test_mode: isStream ? false : testMode,
        method: 'complete',
        // Ensure args key ordering: messages -> stream -> other options (excluding stream)
        args: (() => {
          const { stream: _streamFlag, ...restOptions } = options || {};
          return {
            messages,
            ...(isStream ? { stream: true } : {}),
            ...restOptions,
          };
        })(),
      };

      if (isStream) {
        const response = await this.client.http.post('/drivers/call', payload, { responseType: 'stream' });
        if (response && response.data && typeof response.data.on === 'function' && typeof response.data.pipe === 'function') {
          return response.data;
        }
        if (response && typeof response.on === 'function' && typeof response.pipe === 'function') {
          return response;
        }
        return response;
      } else {
        const response = await this.client.http.post('/drivers/call', payload);
        if (!response.success) {
          throw new PuterError(response.error?.message || 'Failed to get chat completion');
        }
        return response.result;
      }
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error.message || error.response.data.error, error.response.data.error.code);
      }
      throw new Error(error.message || 'Failed to get chat completion');
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
   * List all available AI models, optionally filtered by provider
   * @param {string} [provider] - The provider to filter the models returned
   * @returns {Promise<Object>} Object containing lists of available models by provider
   * @throws {Error} If the request fails
   * @example
   * // Get all available models
   * const allModels = await client.ai.listModels();
   * console.log(allModels);
   * 
   * // Get models from a specific provider
   * const openaiModels = await client.ai.listModels('openai');
   * console.log(openaiModels);
   */
  async listModels(provider) {
    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: INTERFACE_CHAT_COMPLETION,
        service: 'ai-chat',
        method: 'models',
        args: {}
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to list models');
      }

      const modelsByProvider = {};

      if (!response.result || !Array.isArray(response.result)) {
        return modelsByProvider;
      }

      response.result.forEach(item => {
        if (!item.provider || !item.id) return;
        if (provider && item.provider !== provider) return;
        if (!modelsByProvider[item.provider]) modelsByProvider[item.provider] = [];
        modelsByProvider[item.provider].push(item.id);
      });

      return modelsByProvider;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to list models');
    }
  }

  /**
   * List all available AI model providers
   * @returns {Promise<Array<string>>} Array of provider names
   * @throws {Error} If the request fails
   * @example
   * // Get all available model providers
   * const providers = await client.ai.listModelProviders();
   * console.log(providers); // ['openai', 'anthropic', ...]
   */
  async listModelProviders() {
    try {
      const response = await this.client.http.post('/drivers/call', {
        interface: INTERFACE_CHAT_COMPLETION,
        service: 'ai-chat',
        method: 'models',
        args: {}
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to list model providers');
      }

      if (!response.result || !Array.isArray(response.result)) {
        return [];
      }

      const providers = new Set();
      response.result.forEach(item => {
        if (item.provider) providers.add(item.provider);
      });

      return Array.from(providers);
    } catch (error) {
      if (error.response?.data?.error) {
        throw new PuterError(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to list model providers');
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