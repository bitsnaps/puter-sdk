import { PuterError } from '../errors';

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
        interface: 'puter-chat-completion',
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
        interface: 'puter-chat-completion',
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
}