"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WardenAPIError = void 0;
class WardenAPIError extends Error {
    constructor(message, statusCode, responseData, rateLimit) {
        super(message);
        this.name = 'WardenAPIError';
        this.statusCode = statusCode;
        this.responseData = responseData;
        this.rateLimit = rateLimit;
    }
}
exports.WardenAPIError = WardenAPIError;
//# sourceMappingURL=types.js.map