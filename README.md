# WardenAPI - Official JavaScript/TypeScript Client

[![npm version](https://badge.fury.io/js/wardenapi.svg)](https://badge.fury.io/js/wardenapi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official JavaScript/TypeScript client for the Warden API - A powerful FiveM server verification service designed to help communities identify and protect against malicious servers, cheaters, and unauthorized resellers.

## Features

- 🚀 **Fast & Reliable**: Sub-100ms response times with 99.9% uptime
- 🔒 **Secure**: Rate-limited API with secure authentication
- 📦 **Simple**: Easy-to-use client with TypeScript support
- 🔄 **Automatic Retries**: Built-in retry logic with exponential backoff
- 📊 **Rate Limit Handling**: Automatic rate limit detection and retry
- ✅ **Type Safe**: Full TypeScript support with comprehensive types

## Installation

```bash
npm install wardenapi
```

## Quick Start

```javascript
import { WardenAPI } from 'wardenapi';

const client = new WardenAPI({
  apiKey: 'wd_your_api_key_here'
});

// Check if a server is flagged by Discord ID
const serverResult = await client.checkServerById('123456789012345678');
if (await client.isServerFlagged('123456789012345678') || serverResult.id /* also works with the result itself, but isServerFlags works standalone aswell */) {
  console.log('Server is flagged:', serverResult.data);
} else {
  console.log('Server is clean');
}

// Check if a user is flagged by Discord ID
const userResult = await client.checkUserById('123456789012345678');
if (await client.isUserFlagged('123456789012345678') || userResult.id /* same as server one. */) {
  console.log('User is flagged:', userResult.data);
} else {
  console.log('User is clean');
}
```

## Configuration

```javascript
const client = new WardenAPI({
  apiKey: 'wd_your_api_key_here',
  baseUrl: 'https://api.iitranq.co.uk/api/v1', // Optional, defaults to official API
  timeout: 10000, // Optional, request timeout in ms (default: 10000)
  retries: 3 // Optional, number of retries (default: 3)
});
```

## Environment Variables

You can also use environment variables:

```bash
WARDEN_API_KEY=wd_your_api_key_here
```

```javascript
const client = new WardenAPI({
  apiKey: process.env.WARDEN_API_KEY
});
```

## API Methods

### Server Methods

#### Check Server by ID
```javascript
const result = await client.checkServerById('123456789012345678');
```

#### Check Server by Name
```javascript
const result = await client.checkServerByName('My FiveM Server');
```

#### Get Server Info (Alternative endpoint)
```javascript
const result = await client.getServerInfo('123456789012345678');
```

#### Batch Server Check
```javascript
const result = await client.checkServers([
  { id: '123456789012345678' },
  { name: 'My FiveM Server' },
  { id: '987654321098765432' }
]);

console.log(`Found ${result.data.found} flagged servers`);
```

### User Methods

#### Check User by ID
```javascript
const result = await client.checkUserById('123456789012345678');
```

### Utility Methods

#### Check if Server is Flagged
```javascript
const isFlagged = await client.isServerFlagged('123456789012345678');
if (isFlagged) {
  console.log('Server is flagged!');
}
```

#### Check if User is Flagged
```javascript
const isFlagged = await client.isUserFlagged('123456789012345678');
if (isFlagged) {
  console.log('User is flagged!');
}
```

## Response Format

### Successful Server Response
```javascript
{
  id: "123456789012345678",
  name: "Malicious Server",
  description: "Known cheating server",
  type: "CHEATING",
  category: "FiveM",
  flags: ["CHEATING", "MODIFIED_CLIENT"],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  rateLimit: {
    limit: 100,
    remaining: 99,
    reset: 1640995200
  }
}
```

### Successful User Response
```javascript
{
  id: "123456789012345678",
  username: "malicious_user",
  avatar: "https://cdn.discordapp.com/avatars/...",
  type: "CHEATER",
  flags: ["CHEATING", "LEAKING"],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  rateLimit: {
    limit: 100,
    remaining: 99,
    reset: 1640995200
  }
}
```

### Not Found Response
```javascript
{
  error: "Server not found",
  rateLimit: {
    limit: 100,
    remaining: 99,
    reset: 1640995200
  }
}
```

### Batch Response
```javascript
{
  found: 2,
  servers: [
    {
      id: "123456789012345678",
      name: "Malicious Server 1",
      type: "CHEATING"
    },
    {
      id: "987654321098765432", 
      name: "Malicious Server 2",
      type: "LEAKING"
    }
  ],
  rateLimit: {
    limit: 100,
    remaining: 98,
    reset: 1640995200
  }
}
```

## Error Handling

```javascript
import { WardenAPI, WardenAPIError } from 'wardenapi';

const client = new WardenAPI({ apiKey: 'wd_your_key' });

try {
  const result = await client.checkServerById('123456789012345678');
  console.log(result);
} catch (error) {
  if (error instanceof WardenAPIError) {
    console.error('API Error:', error.message);
    console.error('Status Code:', error.statusCode);
    console.error('Rate Limit:', error.rateLimit);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Rate Limiting

The client automatically handles rate limits:

- Detects rate limit headers from API responses
- Automatically retries requests when rate limited
- Implements exponential backoff for retries
- Provides rate limit information in responses

```javascript
const result = await client.checkServerById('123456789012345678');
console.log('Rate limit remaining:', result.rateLimit?.remaining);
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import { WardenAPI, ServerLookupResponse, WardenAPIError } from 'wardenapi';

const client = new WardenAPI({
  apiKey: 'wd_your_api_key_here'
});

const result: ServerLookupResponse = await client.checkServerById('123456789012345678');
```

## Examples

### Basic Server Check
```javascript
import { WardenAPI } from 'wardenapi';

const client = new WardenAPI({
  apiKey: process.env.WARDEN_API_KEY
});

async function checkServer(serverId) {
  try {
    const result = await client.checkServerById(serverId);
    
    if (result.error) {
      console.log(`✅ Server ${serverId} is clean`);
      return false;
    } else {
      console.log(`⚠️  Server ${serverId} is flagged:`);
      console.log(`   Type: ${result.type}`);
      console.log(`   Flags: ${result.flags?.join(', ')}`);
      return true;
    }
  } catch (error) {
    console.error('Error checking server:', error.message);
    return null;
  }
}
```

### Batch Processing
```javascript
async function checkMultipleServers(serverIds) {
  const servers = serverIds.map(id => ({ id }));
  
  try {
    const result = await client.checkServers(servers);
    
    console.log(`Checked ${servers.length} servers`);
    console.log(`Found ${result.found} flagged servers`);
    
    result.servers.forEach(server => {
      console.log(`- ${server.name} (${server.id}): ${server.type}`);
    });
    
    return result.servers;
  } catch (error) {
    console.error('Batch check failed:', error.message);
    return [];
  }
}
```

### Discord Bot Integration
```javascript
// Example Discord.js integration
client.on('guildCreate', async (guild) => {
  try {
    const isFlagged = await wardenClient.isServerFlagged(guild.id);
    
    if (isFlagged) {
      console.log(`⚠️  Joined flagged server: ${guild.name}`);
      
      // Optionally leave the server
      await guild.leave();
    }
  } catch (error) {
    console.error('Error checking guild:', error);
  }
});
```

## Getting Your API Key

Getting an API Key is currently not available.

## Support

- 📖 [Documentation](https://api.iitranq.co.uk/docs)
- 🐛 [Report Issues](https://github.com/your-username/wardenapi/issues)
- 💬 [Discord Support](https://discord.gg/your-server)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs. 