import { WardenConfig, ServerLookupResponse, BatchServerLookupResponse, UserLookupResponse } from './types';
export declare class WardenAPI {
    private readonly config;
    constructor(config: WardenConfig);
    private makeRequest;
    private extractRateLimit;
    private safeJsonParse;
    private delay;
    checkServerById(serverId: string): Promise<ServerLookupResponse>;
    checkServerByName(serverName: string): Promise<ServerLookupResponse>;
    checkServers(servers: Array<{
        id?: string;
        name?: string;
    }>): Promise<BatchServerLookupResponse>;
    checkUserById(userId: string): Promise<UserLookupResponse>;
    getServerInfo(serverId: string): Promise<ServerLookupResponse>;
    isServerFlagged(serverId: string): Promise<boolean>;
    isUserFlagged(userId: string): Promise<boolean>;
}
//# sourceMappingURL=client.d.ts.map