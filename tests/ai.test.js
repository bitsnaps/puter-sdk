import { describe, expect, it, beforeEach } from 'vitest';
import PuterClient from '../src/index';
import { mockAxios } from './mocks/axios';
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
});