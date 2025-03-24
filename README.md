# Puter SDK

<p align="center">
    <img alt="test" src="https://github.com/bitsnaps/puter-sdk/actions/workflows/package-test.yml/badge.svg">
    <img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/bitsnaps/puter-sdk">
    <a href="https://codecov.io/gh/bitsnaps/puter-sdk" > 
        <img src="https://codecov.io/gh/bitsnaps/puter-sdk/graph/badge.svg?token=cQYUqRKDrY"/> 
    </a>
    <a href="https://www.npmjs.com/package/puter-sdk"><img src="https://img.shields.io/npm/v/puter-sdk?color=729B1B&label="></a>
</p>

---

> 🚧 **Work in Progress**
>
> This project is currently in active development and not usable for production yet.
> This project includes certain functionalities that are inherently dangerous and not fully tested in production environments. Operations such as creating apps, creating sites, or deleting files are experimental and may cause instability, data loss, or even crash instances if misused or if unforeseen edge cases occur. While we strive to provide reliable package, these specific features are provided "as-is" and may not have undergone rigorous testing across all possible scenarios. Developers using these functionalities must exercise extreme caution and thoroughly test them in controlled environments before deploying them to production. By using this SDK, you acknowledge that you are doing so at your own risk, and the maintainers are not responsible for any damage, loss, or instability caused by its use. Proceed with caution and ensure you have proper safeguards in place.

The Unofficial JavaScript SDK for interacting with the **Puter Cloud Platform**. If you don't have an account you can [Signup](https://puter.com/?r=N5Y0ZYTF) from here for free (You'll get a free 1Gb from this link). This SDK provides a simple and consistent interface for working with Puter's APIs, including file management, app deployment, AI services, and more.

## Features

- **File Management**
  - List, upload, download, and manage files
  - Create and manage directories
  - File operations (copy, move, rename, delete)

- **App Management**
  - Create, update, and delete apps
  - Manage app configurations (WIP)
  - Deploy static sites

- **Key-Value Store**
    - Basic Operations: Set, get, and delete key/value pairs
    - Handle various data types (strings, numbers, objects, arrays)
    - Increment/Decrement: Atomic increment/decrement operations with support for custom amounts
    - upport for custom amounts: Flush all keys, list keys with glob pattern support

- **Sites Management**
  - Create, update, and delete sites
  - Deploy static sites from existing directory

- **AI Services**
  - Chat completions (streaming and non-streaming)
  - Image generation
  - Optical Character Recognition (OCR)
  - Text-to-Speech (TTS)

- **User Management**
  - Authentication (login/logout)
  - User information
  - Session management

- **Subdomain Management**
  - Create and manage hosting
  - Link hosting to directories
  - Manage static site hosting

## Installation

Using npm:
```bash
npm install puter-sdk
```

Using yarn:
```bash
yarn add puter-sdk
```

Using pnpm:
```bash
pnpm add puter-sdk
```

## Usage

### Basic Setup

```javascript
import PuterClient from 'puter-sdk';

// Initialize the client
const puter = new PuterClient({
  token: 'your-api-token', // Optional, can be set later
  baseURL: 'https://api.puter.com' // Optional
});
```

### Authentication

```javascript
// Login using your credentials:
const puter = await puter.auth.signIn('username', 'password');
console.log('Logged in with token:', puter.token);

// or just create a new instance:
const puter = new PuterClient();
// P.S. The client will look for `PUTER_API_KEY` in .env file name or provide as a variable environnement.

// Get current user
const userInfo = await puter.auth.getUser();
console.log('User info:', userInfo);

// Logout
await puter.auth.signOut();
```

### File Management

```javascript
// List directory contents
const files = await puter.fs.readdir('/');
console.log('Files:', files);

// Upload a file
const file = new Blob(['Hello, Puter!'], { type: 'text/plain' });
const uploadResult = await puter.fs.upload({
  file,
  path: '/uploads',
  name: 'hello.txt'
});
console.log('Upload result:', uploadResult);

// Create a directory
const dirResult = await puter.fs.mkdir({
  path: '/new-directory'
});
console.log('Directory created:', dirResult);
```

### App Management

```javascript
// List all apps
const apps = await puter.apps.list();
console.log('Apps:', apps);
```


### Key/Value Store

```javascript
// Create a key/value pair
const result = await puter.kv.set('testKey', 'testValue');
const value = await puter.kv.get('testKey');

console.log(`value set: ${value}`);

// Deleting by key
const result = await puter.kv.del('testKey');
console.log(`result of delete operation: ${result}`);
```

### AI Services

```javascript
// Basic chat completion
const chatResponse = await puter.ai.chat([{
  role: 'user',
  content: 'What is Puter?'
}]);
console.log('AI response:', chatResponse.message.content);

// Chat completion with parameters
const customResponse = await puter.ai.chat(
  [{
    role: 'user',
    content: 'Write a short poem about technology'
  }],
  {
    model: 'gpt-4o-mini', // Specify model
    temperature: 0.7, // Control randomness
    max_tokens: 150 // Limit response length
  }
);
console.log('Custom AI response:', customResponse.message.content);

// List available AI models
const models = await puter.ai.listModels();
console.log('Available models by provider:', models);
// Example output: { 'openai-completion': ['gpt-4o', 'gpt-4o-mini', ...], ... }

// List models for a specific provider
const openaiModels = await puter.ai.listModels('openai-completion');
console.log('OpenAI models:', openaiModels);

// List all available AI model providers
const providers = await puter.ai.listModelProviders();
console.log('Available providers:', providers);
// Example output: ['openai-completion', 'anthropic', 'openrouter', ...]

// Streaming chat completion
const stream = await puter.ai.chatCompleteStream(
  [{
    role: 'user',
    content: 'Explain quantum computing'
  }],
  {
    temperature: 0.5,
    max_tokens: 500
  }
);

// Process the stream
stream.on('data', (chunk) => {
  const data = JSON.parse(chunk.toString());
  if (data.success && data.result.message) {
    process.stdout.write(data.result.message.content);
  }
});

// Image generation
const image = await puter.ai.txt2img({
  prompt: 'A futuristic cityscape'
});
console.log('Generated image:', image.url);

// OCR
const ocrResult = await puter.ai.img2txt('file-id-123');
console.log('Extracted text:', ocrResult.text);

// Text-to-Speech
const audioStream = await puter.ai.txt2speech({
  text: 'Hello, world!',
  voice: 'voice-1'
});
// Handle the audio stream...
```


### Subdomain Management

```javascript
// List web sites
const sites = await puter.hosting.list();
console.log('sites:', sites);
```

## Error Handling

The SDK uses custom error classes for consistent error handling:

```javascript
try {
  await puter.fs.delete('/protected-file.txt');
} catch (error) {
  if (error.code === 'PERMISSION_DENIED') {
    console.error('Permission denied:', error.message);
  } else {
    console.error('An error occurred:', error.message);
  }
}
```

## Contributing

We welcome contributions! Please see our [Contribution Guidelines](CONTRIBUTING.md) for more information.

## Work in progress

Please note that we are still actively working on this project, and as such, there may be errors or incomplete features. We appreciate your understanding and welcome any feedback or contributions as we continue to improve and refine the SDK.


## Support

For support, please open an issue on our [GitHub repository](https://github.com/HeyPuter/puter-sdk) or contact [puter's team](mailto:hey@puter.com).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
