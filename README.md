# Puter SDK

<p align="center">
    <img alt="test" src="https://github.com/bitsnaps/puter-sdk/actions/workflows/package-test.yml/badge.svg">
    <img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/bitsnaps/puter-sdk">
    <a href="https://codecov.io/gh/bitsnaps/puter-sdk" > 
        <img src="https://codecov.io/gh/bitsnaps/puter-sdk/graph/badge.svg?token=cQYUqRKDrY"/> 
    </a>
</p>

---

The official JavaScript SDK for interacting with the **Puter Cloud Platform**. If you don't have an account you can [Signup](https://puter.com/?r=N5Y0ZYTF) from here for free (You'll get a free 1Gb from this link). This SDK provides a simple and consistent interface for working with Puter's APIs, including file management, app deployment, AI services, and more.

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
  - Create and manage subdomains
  - Link subdomains to directories
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
const client = new PuterClient({
  token: 'your-api-token', // Optional, can be set later
  baseURL: 'https://api.puter.com' // Optional
});
```

### Authentication

```javascript
// Login using your credentials:
const authResult = await client.auth.login('username', 'password');
console.log('Logged in with token:', authResult.token);

// Get current user
const userInfo = await client.auth.getCurrentUser();
console.log('User info:', userInfo);

// Logout
await client.auth.logout();
```

### File Management

```javascript
// List directory contents
const files = await client.fs.list('/');
console.log('Files:', files);

// Upload a file
const file = new Blob(['Hello, Puter!'], { type: 'text/plain' });
const uploadResult = await client.fs.upload({
  file,
  path: '/uploads',
  name: 'hello.txt'
});
console.log('Upload result:', uploadResult);

// Create a directory
const dirResult = await client.fs.createDirectory({
  path: '/new-directory'
});
console.log('Directory created:', dirResult);
```

### App Management

```javascript
// Create a new app
const app = await client.apps.create({
  name: 'my-app',
  url: 'https://my-app.com'
});
console.log('Created app:', app);

// List all apps
const apps = await client.apps.list();
console.log('Apps:', apps);
```


### Key/Value Store

```javascript
// Create a key/value pair
const result = await client.kv.set('testKey', 'testValue');
const value = await client.kv.get('testKey');

console.log(`value set: ${value}`);

// Deleting by key
const result = await client.kv.del('testKey');
console.log(`result of delete operation: ${result}`);
```

### AI Services

```javascript
// Chat completion
const chatResponse = await client.ai.chatComplete([{
  role: 'user',
  content: 'What is Puter?'
}]);
console.log('AI response:', chatResponse.message.content);

// Image generation
const image = await client.ai.generateImage({
  prompt: 'A futuristic cityscape'
});
console.log('Generated image:', image.url);

// OCR
const ocrResult = await client.ai.ocrRecognize('file-id-123');
console.log('Extracted text:', ocrResult.text);

// Text-to-Speech
const audioStream = await client.ai.synthesizeSpeech({
  text: 'Hello, world!',
  voice: 'voice-1'
});
// Handle the audio stream...
```

### Subdomain Management

```javascript
// Create a subdomain
const subdomain = await client.subdomains.create({
  subdomain: 'mysite',
  rootDir: '/my-site-files'
});
console.log('Created subdomain:', subdomain);

// List subdomains
const subdomains = await client.subdomains.list();
console.log('Subdomains:', subdomains);
```

## Error Handling

The SDK uses custom error classes for consistent error handling:

```javascript
try {
  await client.fs.delete('/protected-file.txt');
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
