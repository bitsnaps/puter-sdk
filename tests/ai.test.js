import { describe, expect, it, beforeEach } from 'vitest';
import PuterClient from '../src/index';
import { mockAxios } from './mocks/axios';
import { PassThrough } from 'stream';
import { EventEmitter } from 'events';

// Helper function to create a mock stream
function createMockStream(data) {
  const passThrough = new PassThrough();
  const emitter = new EventEmitter();

  // Simulate streaming behavior
  setTimeout(() => {
    passThrough.write(JSON.stringify({
      ...data,
      status: 'success'
    }));
    passThrough.end();
  }, 100);

  return {
    data: passThrough,
    on: emitter.on.bind(emitter),
    pipe: passThrough.pipe.bind(passThrough)
  };
}

describe('AI Operations', () => {
  let client;

  beforeEach(() => {
    client = new PuterClient({ token: 'test-token' });
    mockAxios.reset();
  });

  describe('Chat Completion', () => {
    it('should get chat completion', async () => {
      const mockResponse = {
        success: true,
        result: {
          message: {
            role: 'assistant',
            content: 'Puter is a platform that...',
          },
          usage: {
            input_tokens: 25,
            output_tokens: 86
          }
        }
      };

      mockAxios.onPost('/drivers/call').reply(200, mockResponse);

      const result = await client.ai.chatComplete([{
        role: 'user',
        content: 'What is Puter?'
      }]);

      expect(result).toEqual(mockResponse.result);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: 'puter-chat-completion',
        driver: 'openai-completion',
        test_mode: false,
        method: 'complete',
        args: {
          messages: [{
            role: 'user',
            content: 'What is Puter?'
          }]
        }
      }));
    });

    it('should handle chat completion errors', async () => {
      mockAxios.onPost('/drivers/call').reply(500, {
        error: {
          code: 'AI_SERVICE_UNAVAILABLE',
          message: 'AI service unavailable'
        }
      });

      await expect(client.ai.chatComplete([{
        role: 'user',
        content: 'What is Puter?'
      }])).rejects.toThrow('AI service unavailable');
    });

    it('should handle empty messages', async () => {
      await expect(client.ai.chatComplete([]))
        .rejects.toThrow('At least one message is required');
    });

    it('should handle invalid message format', async () => {
      await expect(client.ai.chatComplete([{
        text: 'Invalid format'
      }])).rejects.toThrow('Invalid message format');
    });
  });

  describe('Streaming Chat Completion', () => {
    it('should stream chat completion', async () => {
        const mockResponse = {
            success: true,
            result: {
              message: {
                role: 'assistant',
                content: 'Puter is a platform that...',
              },
              usage: {
                input_tokens: 25,
                output_tokens: 86
              }
            }
          };

        // Configure mock adapter to return a stream
        mockAxios.onPost('/drivers/call').reply(200, createMockStream(mockResponse));

        const stream = await client.ai.chatCompleteStream([{
            role: 'user',
            content: 'What is Puter?'
          }]);
        
        expect(stream).toBeDefined();

        // Verify stream properties
        expect(typeof stream.on).toBe('function');
        expect(typeof stream.pipe).toBe('function');

        // Test stream events
        let dataReceived = false;
        stream.on('data', (chunk) => {
            const data = JSON.parse(chunk.toString());
            expect(data.success).toBe(true);
            expect(data.result.message.role).toBe('assistant');
            dataReceived = true;
        });
        
        // Wait for stream to complete
        await new Promise(resolve => setTimeout(resolve, 150));
        expect(dataReceived).toBe(true);      
    });
  });
});