import {
  WardenConfig,
  RequestOptions,
  RateLimitInfo,
  ServerLookupRequest,
  BatchServerLookupRequest,
  UserLookupRequest,
  ServerLookupResponse,
  BatchServerLookupResponse,
  UserLookupResponse,
  WardenAPIError
} from './types';

export class WardenAPI {
  private readonly config: Required<WardenConfig>;

  constructor(config: WardenConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }

    if (!config.apiKey.startsWith('wd_')) {
      throw new Error('API key must start with "wd_"');
    }

    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.iitranq.co.uk/api/v1',
      timeout: config.timeout || 10000,
      retries: config.retries || 3
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const timeout = options.timeout || this.config.timeout;

    const requestOptions: RequestInit = {
      method: options.method || 'GET',
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'WardenAPI-JS/1.0.0',
        ...options.headers
      },
      body: options.body,
      signal: AbortSignal.timeout(timeout)
    };

    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        
        const rateLimit = this.extractRateLimit(response);
        
        if (!response.ok) {
          const errorData = await this.safeJsonParse(response);
          const errorMessage = errorData?.error || `HTTP ${response.status}: ${response.statusText}`;
          
          if (response.status === 429 && attempt < this.config.retries) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '1') * 1000;
            await this.delay(retryAfter);
            continue;
          }
          
          throw new WardenAPIError(errorMessage, response.status, errorData, rateLimit);
        }

        const data = await response.json();
        return { ...data, rateLimit };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (error instanceof WardenAPIError || attempt === this.config.retries) {
          throw error;
        }
        
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
    
    throw lastError!;
  }

  private extractRateLimit(response: Response): RateLimitInfo | undefined {
    const limit = response.headers.get('X-RateLimit-Limit');
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');
    const retryAfter = response.headers.get('Retry-After');

    if (limit && remaining && reset) {
      return {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        reset: parseInt(reset),
        retryAfter: retryAfter ? parseInt(retryAfter) : undefined
      };
    }

    return undefined;
  }

  private async safeJsonParse(response: Response): Promise<any> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async checkServerById(serverId: string): Promise<ServerLookupResponse> {
    const request: ServerLookupRequest = {
      data: {
        type: 'id',
        id: serverId
      }
    };

    try {
      return await this.makeRequest<ServerLookupResponse>('/server', {
        method: 'POST',
        body: JSON.stringify(request)
      });
    } catch (error) {
      if (error instanceof WardenAPIError && error.statusCode === 404) {
        return { error: 'Server not found', data: undefined };
      }
      throw error;
    }
  }

  async checkServerByName(serverName: string): Promise<ServerLookupResponse> {
    const request: ServerLookupRequest = {
      data: {
        type: 'name',
        name: serverName
      }
    };

    try {
      return await this.makeRequest<ServerLookupResponse>('/server', {
        method: 'POST',
        body: JSON.stringify(request)
      });
    } catch (error) {
      if (error instanceof WardenAPIError && error.statusCode === 404) {
        return { error: 'Server not found' };
      }
      throw error;
    }
  }

  async checkServers(servers: Array<{ id?: string; name?: string }>): Promise<BatchServerLookupResponse> {
    const request: BatchServerLookupRequest = {
      data: { servers }
    };

    return await this.makeRequest<BatchServerLookupResponse>('/servers', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  async checkUserById(userId: string): Promise<UserLookupResponse> {
    const request: UserLookupRequest = {
      data: {
        type: 'id',
        id: userId
      }
    };

    try {
      return await this.makeRequest<UserLookupResponse>('/user', {
        method: 'POST',
        body: JSON.stringify(request)
      });
    } catch (error) {
      if (error instanceof WardenAPIError && error.statusCode === 404) {
        return { error: 'User not found' };
      }
      throw error;
    }
  }

  async getServerInfo(serverId: string): Promise<ServerLookupResponse> {
    try {
      return await this.makeRequest<ServerLookupResponse>(`/server/${serverId}`);
    } catch (error) {
      if (error instanceof WardenAPIError && error.statusCode === 404) {
        return { error: 'Server not found' };
      }
      throw error;
    }
  }

  async isServerFlagged(serverId: string): Promise<boolean> {
    const response = await this.getServerInfo(serverId);
    return !response.error && !!response?.id;
  }

  async isUserFlagged(userId: string): Promise<boolean> {
    const response = await this.checkUserById(userId);
    return !response.error && !!response?.id;
  }
} 