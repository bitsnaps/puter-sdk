import { describe, expect, it, beforeEach } from 'vitest';
import PuterClient from '../../src/index';
import { mockAxios } from '../mocks/axios';
import { PassThrough } from 'stream';
import { EventEmitter } from 'events';

// Helper function to create a mock stream for chat completion
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

// Helper function to create a mock stream for audio streaming
function createMockAudioStream(audioData = Buffer.from([0x00, 0x01, 0x02])) {
    const passThrough = new PassThrough();
    const emitter = new EventEmitter();
  
    // Simulate streaming behavior
    setTimeout(() => {
      passThrough.write(audioData);
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

      const result = await client.ai.chat([{
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

      await expect(client.ai.chat([{
        role: 'user',
        content: 'What is Puter?'
      }])).rejects.toThrow('AI service unavailable');
    });

    it('should handle empty messages', async () => {
      await expect(client.ai.chat([]))
        .rejects.toThrow('At least one message is required');
    });

    it('should handle invalid message format', async () => {
      await expect(client.ai.chat([{
        text: 'Invalid format'
      }])).rejects.toThrow('Invalid message format');
    });

    it('should get chat completion with temperature and max_tokens', async () => {
      const mockResponse = {
        success: true,
        result: {
          message: {
            role: 'assistant',
            content: 'This is a controlled response...',
          },
          usage: {
            input_tokens: 20,
            output_tokens: 50
          }
        }
      };

      mockAxios.onPost('/drivers/call').reply(200, mockResponse);

      const result = await client.ai.chat([{
        role: 'user',
        content: 'Write something creative'
      }], {
        temperature: 0.7,
        max_tokens: 100
      });

      expect(result).toEqual(mockResponse.result);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: 'puter-chat-completion',
        driver: 'openai-completion',
        test_mode: false,
        method: 'complete',
        args: {
          messages: [{
            role: 'user',
            content: 'Write something creative'
          }],
          temperature: 0.7,
          max_tokens: 100
        }
      }));
    });

    it('should get chat completion with model parameter', async () => {
      const mockResponse = {
        success: true,
        result: {
          message: {
            role: 'assistant',
            content: 'Response from specific model...',
          },
          usage: {
            input_tokens: 15,
            output_tokens: 40
          }
        }
      };

      mockAxios.onPost('/drivers/call').reply(200, mockResponse);

      const result = await client.ai.chat([{
        role: 'user',
        content: 'Hello'
      }], {
        model: 'gpt-4',
        temperature: 0.5
      });

      expect(result).toEqual(mockResponse.result);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: 'puter-chat-completion',
        driver: 'openai-completion',
        test_mode: false,
        method: 'complete',
        args: {
          messages: [{
            role: 'user',
            content: 'Hello'
          }],
          model: 'gpt-4',
          temperature: 0.5
        }
      }));
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

        const stream = await client.ai.chat([{
            role: 'user',
            content: 'What is Puter?'
          }], {
            stream: true
          });
        
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

    it('should stream chat completion with temperature and max_tokens', async () => {
      const mockResponse = {
        success: true,
        result: {
          message: {
            role: 'assistant',
            content: 'Streaming response with parameters...',
          },
          usage: {
            input_tokens: 20,
            output_tokens: 60
          }
        }
      };

      mockAxios.onPost('/drivers/call').reply(200, createMockStream(mockResponse));

      const stream = await client.ai.chat([{
        role: 'user',
        content: 'Write a short story'
      }], {
        stream: true,
        temperature: 0.8,
        max_tokens: 200
      });
      
      expect(stream).toBeDefined();
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: 'puter-chat-completion',
        driver: 'openai-completion',
        test_mode: false,
        method: 'complete',
        args: {
          messages: [{
            role: 'user',
            content: 'Write a short story'
          }],
          stream: true,
          temperature: 0.8,
          max_tokens: 200
        }
      }));

      // Verify stream properties
      expect(typeof stream.on).toBe('function');
      expect(typeof stream.pipe).toBe('function');

      // Test stream events
      let dataReceived = false;
      stream.on('data', (chunk) => {
        const data = JSON.parse(chunk.toString());
        expect(data.success).toBe(true);
        dataReceived = true;
      });
      
      // Wait for stream to complete
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(dataReceived).toBe(true);      
    });
  });

  describe('OCR Operations', () => {
    it('should perform OCR on an image', async () => {
      const mockResponse = {
        success: true,
        result: {
          text: 'Extracted text',
          confidence: 0.95
        }
      };

      mockAxios.onPost('/drivers/call').reply(200, mockResponse);

      const result = await client.ai.img2txt('file-id-123');
      expect(result).toEqual(mockResponse.result);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: 'puter-ocr',
        method: 'recognize',
        args: {
          source: 'file-id-123'
        }
      }));
    });

    it('should handle OCR errors', async () => {
      mockAxios.onPost('/drivers/call').reply(500, {
        error: {
          code: 'OCR_FAILED',
          message: 'OCR processing failed'
        }
      });

      await expect(client.ai.img2txt('file-id-123'))
        .rejects.toThrow('OCR processing failed');
    });
  });

  describe('Image Generation', () => {
    it('should generate an image from prompt', async () => {
      const mockResponse = {
        success: true,
        result: {
          url: 'https://example.com/generated-image.png'
        }
      };

      mockAxios.onPost('/drivers/call').reply(200, mockResponse);

      const result = await client.ai.txt2img({
        prompt: 'A beautiful landscape'
      });

      expect(result).toEqual(mockResponse.result);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: 'puter-image-generation',
        method: 'generate',
        args: {
          prompt: 'A beautiful landscape'
        }
      }));
    });

    it('should handle image generation errors', async () => {
      const errorMessage = 'Prompt is required';
      mockAxios.onPost('/drivers/call').reply(400, {
        error: {
          message: errorMessage
        }
      });

      await expect(client.ai.txt2img({
        prompt: ''
      })).rejects.toThrow(errorMessage);
    });
  });

  describe('Text-to-Speech', () => {
    it('should list available voices', async () => {
      const mockResponse = {
        success: true,
        result: [
          { id: 'voice-1', name: 'Alice', language: 'en-US' },
          { id: 'voice-2', name: 'Bob', language: 'en-UK' }
        ]
      };

      mockAxios.onPost('/drivers/call').reply(200, mockResponse);

      const result = await client.ai.listVoices();
      expect(result).toEqual(mockResponse.result);
    });

    it('should synthesize speech from text', async () => {
        const mockStream = createMockAudioStream();
        mockAxios.onPost('/drivers/call').reply(200, mockStream);
  
        const result = await client.ai.txt2speech({
          text: 'Hello world',
          voice: 'voice-1'
        });
  
        expect(result).toBeInstanceOf(PassThrough);
        
        // Verify stream properties
        expect(result.on).toBeDefined();
        expect(typeof result.on).toBe('function');
        expect(typeof result.pipe).toBe('function');
  
        // Test stream events
        let dataReceived = false;
        result.on('data', (chunk) => {
          expect(chunk).toBeInstanceOf(Buffer);
          dataReceived = true;
        });
  
        // Wait for stream to complete
        await new Promise(resolve => setTimeout(resolve, 150));
        expect(dataReceived).toBe(true);
      });

    it('should handle TTS errors', async () => {
      const errorMessage = 'Invalid voice selection';
      
      mockAxios.onPost('/drivers/call').reply(400, {
        error: {
          message: errorMessage
        }
      });

      await expect(client.ai.txt2speech({
        text: 'Hello',
        voice: 'invalid-voice'
      })).rejects.toThrow(errorMessage);
    });
  });

  describe('AI Models and Providers', () => {
    it('should list available AI models', async () => {
      const mockResponse = {
        success: true,
        result: [
          { id: 'gpt-4o', provider: 'openai-completion', cost: { currency: 'usd-cents', tokens: 1000000, input: 250, output: 500 } },
          { id: 'gpt-4o-mini', provider: 'openai-completion', cost: { currency: 'usd-cents', tokens: 1000000, input: 15, output: 30 } },
          { id: 'claude-3-opus', provider: 'anthropic', cost: { currency: 'usd-cents', tokens: 1000000, input: 150, output: 750 } }
        ]
      };

      mockAxios.onPost('/drivers/call').reply(200, mockResponse);

      const result = await client.ai.listModels();
      
      expect(result).toEqual({
        'openai-completion': ['gpt-4o', 'gpt-4o-mini'],
        'anthropic': ['claude-3-opus']
      });
      
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: 'puter-chat-completion',
        service: 'ai-chat',
        method: 'models',
        args: {}
      }));
    });

    it('should filter models by provider', async () => {
      const mockResponse = {
        success: true,
        result: [
          { id: 'gpt-4o', provider: 'openai-completion', cost: { currency: 'usd-cents', tokens: 1000000, input: 250, output: 500 } },
          { id: 'gpt-4o-mini', provider: 'openai-completion', cost: { currency: 'usd-cents', tokens: 1000000, input: 15, output: 30 } },
          { id: 'claude-3-opus', provider: 'anthropic', cost: { currency: 'usd-cents', tokens: 1000000, input: 150, output: 750 } }
        ]
      };

      mockAxios.onPost('/drivers/call').reply(200, mockResponse);

      const result = await client.ai.listModels('openai-completion');
      
      expect(result).toEqual({
        'openai-completion': ['gpt-4o', 'gpt-4o-mini']
      });
    });

    it('should handle empty model list', async () => {
      const mockResponse = {
        success: true,
        result: []
      };

      mockAxios.onPost('/drivers/call').reply(200, mockResponse);

      const result = await client.ai.listModels();
      expect(result).toEqual({});
    });

    it('should list available AI model providers', async () => {
      const mockResponse = {
        success: true,
        result: [
          { id: 'gpt-4o', provider: 'openai-completion' },
          { id: 'gpt-4o-mini', provider: 'openai-completion' },
          { id: 'claude-3-opus', provider: 'anthropic' },
          { id: 'llama-3', provider: 'meta' }
        ]
      };

      mockAxios.onPost('/drivers/call').reply(200, mockResponse);

      const result = await client.ai.listModelProviders();
      
      // Set is used internally, so order might vary - check for array contents
      expect(result).toHaveLength(3);
      expect(result).toContain('openai-completion');
      expect(result).toContain('anthropic');
      expect(result).toContain('meta');
      
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: 'puter-chat-completion',
        service: 'ai-chat',
        method: 'models',
        args: {}
      }));
    });

    it('should handle errors when listing models', async () => {
      mockAxios.onPost('/drivers/call').reply(500, {
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'AI service unavailable'
        }
      });

      await expect(client.ai.listModels())
        .rejects.toThrow('AI service unavailable');
    });

    it('should handle errors when listing providers', async () => {
      mockAxios.onPost('/drivers/call').reply(500, {
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'AI service unavailable'
        }
      });

      await expect(client.ai.listModelProviders())
        .rejects.toThrow('AI service unavailable');
    });
  });
  
  describe('Chat with Test Mode', () => {
    it('should accept a string prompt and set test_mode to false by default', async () => {
      const mockResponse = {
        success: true,
        result: {
          message: {
            role: 'assistant',
            content: 'Response to string prompt',
          },
          usage: {
            input_tokens: 10,
            output_tokens: 30
          }
        }
      };

      mockAxios.onPost('/drivers/call').reply(200, mockResponse);

      const result = await client.ai.chat('Tell me a joke');

      expect(result).toEqual(mockResponse.result);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: 'puter-chat-completion',
        driver: 'openai-completion',
        test_mode: false,
        method: 'complete',
        args: {
          messages: [{
            role: 'user',
            content: 'Tell me a joke'
          }]
        }
      }));
    });

    it('should accept a string prompt with test_mode set to true', async () => {
      const mockResponse = {
        success: true,
        result: {
          message: {
            role: 'assistant',
            content: 'Test mode response',
          },
          usage: {
            input_tokens: 10,
            output_tokens: 20
          }
        }
      };

      mockAxios.onPost('/drivers/call').reply(200, mockResponse);

      const result = await client.ai.chat('Tell me a joke', true);

      expect(result).toEqual(mockResponse.result);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: 'puter-chat-completion',
        driver: 'openai-completion',
        test_mode: true,
        method: 'complete',
        args: {
          messages: [{
            role: 'user',
            content: 'Tell me a joke'
          }]
        }
      }));
    });

    it('should accept a string prompt with test_mode and options', async () => {
      const mockResponse = {
        success: true,
        result: {
          message: {
            role: 'assistant',
            content: 'Test mode response with options',
          },
          usage: {
            input_tokens: 10,
            output_tokens: 25
          }
        }
      };

      mockAxios.onPost('/drivers/call').reply(200, mockResponse);

      const result = await client.ai.chat('Tell me a joke', true, {
        temperature: 0.8,
        max_tokens: 150
      });

      expect(result).toEqual(mockResponse.result);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: 'puter-chat-completion',
        driver: 'openai-completion',
        test_mode: true,
        method: 'complete',
        args: {
          messages: [{
            role: 'user',
            content: 'Tell me a joke'
          }],
          temperature: 0.8,
          max_tokens: 150
        }
      }));
    });

    it('should handle message array with test_mode set to true', async () => {
      const mockResponse = {
        success: true,
        result: {
          message: {
            role: 'assistant',
            content: 'Test mode response to message array',
          },
          usage: {
            input_tokens: 15,
            output_tokens: 35
          }
        }
      };

      mockAxios.onPost('/drivers/call').reply(200, mockResponse);

      const result = await client.ai.chat([
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Tell me a joke' }
      ], true);

      expect(result).toEqual(mockResponse.result);
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify({
        interface: 'puter-chat-completion',
        driver: 'openai-completion',
        test_mode: true,
        method: 'complete',
        args: {
          messages: [
            { role: 'system', content: 'You are a helpful assistant' },
            { role: 'user', content: 'Tell me a joke' }
          ]
        }
      }));
    });
  });
  
});