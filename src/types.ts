export interface WardenConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  rateLimit?: RateLimitInfo;
  status?: string;
  type?: string;
  name?: string;
  id?: string;
}

export interface ServerLookupRequest {
  data: {
    type: 'id' | 'name';
    id?: string;
    name?: string;
  };
}

export interface BatchServerLookupRequest {
  data: {
    servers: Array<{
      id?: string;
      name?: string;
    }>;
  };
}

export interface UserLookupRequest {
  data: {
    type: 'id' | 'username';
    id?: string;
    username?: string;
  };
}

export interface ServerInfo {
  id: string;
  name: string;
  description?: string;
  type: string;
  category?: string;
  flags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserInfo {
  id: string;
  username: string;
  avatar?: string;
  type: 'OTHER' | 'LEAKER' | 'CHEATER' | 'SUPPORTER' | 'OWNER' | 'BOT';
  flags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ServerLookupResponse extends ApiResponse<ServerInfo> {}

export interface BatchServerLookupResponse extends ApiResponse<{
  found: number;
  servers: ServerInfo[];
}> {}

export interface UserLookupResponse extends ApiResponse<UserInfo> {}

export class WardenAPIError extends Error {
  public readonly statusCode?: number;
  public readonly responseData?: any;
  public readonly rateLimit?: RateLimitInfo;

  constructor(
    message: string,
    statusCode?: number,
    responseData?: any,
    rateLimit?: RateLimitInfo
  ) {
    super(message);
    this.name = 'WardenAPIError';
    this.statusCode = statusCode;
    this.responseData = responseData;
    this.rateLimit = rateLimit;
  }
} 