"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WardenAPI = void 0;
const types_1 = require("./types");
class WardenAPI {
    constructor(config) {
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
    async makeRequest(endpoint, options = {}) {
        const url = `${this.config.baseUrl}${endpoint}`;
        const timeout = options.timeout || this.config.timeout;
        const requestOptions = {
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
        let lastError;
        for (let attempt = 0; attempt <= this.config.retries; attempt++) {
            try {
                const response = await fetch(url, requestOptions);
                const rateLimit = this.extractRateLimit(response);
                if (!response.ok) {
                    const errorData = await this.safeJsonParse(response);
                    const errorMessage = (errorData === null || errorData === void 0 ? void 0 : errorData.error) || `HTTP ${response.status}: ${response.statusText}`;
                    if (response.status === 429 && attempt < this.config.retries) {
                        const retryAfter = parseInt(response.headers.get('Retry-After') || '1') * 1000;
                        await this.delay(retryAfter);
                        continue;
                    }
                    throw new types_1.WardenAPIError(errorMessage, response.status, errorData, rateLimit);
                }
                const data = await response.json();
                return { ...data, rateLimit };
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (error instanceof types_1.WardenAPIError || attempt === this.config.retries) {
                    throw error;
                }
                await this.delay(Math.pow(2, attempt) * 1000);
            }
        }
        throw lastError;
    }
    extractRateLimit(response) {
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
    async safeJsonParse(response) {
        try {
            return await response.json();
        }
        catch (_a) {
            return null;
        }
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async checkServerById(serverId) {
        const request = {
            data: {
                type: 'id',
                id: serverId
            }
        };
        try {
            return await this.makeRequest('/server', {
                method: 'POST',
                body: JSON.stringify(request)
            });
        }
        catch (error) {
            if (error instanceof types_1.WardenAPIError && error.statusCode === 404) {
                return { error: 'Server not found', data: undefined };
            }
            throw error;
        }
    }
    async checkServerByName(serverName) {
        const request = {
            data: {
                type: 'name',
                name: serverName
            }
        };
        try {
            return await this.makeRequest('/server', {
                method: 'POST',
                body: JSON.stringify(request)
            });
        }
        catch (error) {
            if (error instanceof types_1.WardenAPIError && error.statusCode === 404) {
                return { error: 'Server not found' };
            }
            throw error;
        }
    }
    async checkServers(servers) {
        const request = {
            data: { servers }
        };
        return await this.makeRequest('/servers', {
            method: 'POST',
            body: JSON.stringify(request)
        });
    }
    async checkUserById(userId) {
        const request = {
            data: {
                type: 'id',
                id: userId
            }
        };
        try {
            return await this.makeRequest('/user', {
                method: 'POST',
                body: JSON.stringify(request)
            });
        }
        catch (error) {
            if (error instanceof types_1.WardenAPIError && error.statusCode === 404) {
                return { error: 'User not found' };
            }
            throw error;
        }
    }
    async getServerInfo(serverId) {
        try {
            return await this.makeRequest(`/server/${serverId}`);
        }
        catch (error) {
            if (error instanceof types_1.WardenAPIError && error.statusCode === 404) {
                return { error: 'Server not found' };
            }
            throw error;
        }
    }
    async isServerFlagged(serverId) {
        const response = await this.getServerInfo(serverId);
        return !response.error && !!(response === null || response === void 0 ? void 0 : response.id);
    }
    async isUserFlagged(userId) {
        const response = await this.checkUserById(userId);
        return !response.error && !!(response === null || response === void 0 ? void 0 : response.id);
    }
}
exports.WardenAPI = WardenAPI;
//# sourceMappingURL=client.js.map