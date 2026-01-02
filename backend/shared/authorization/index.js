"use strict";
/**
 * Authorization Service Foundation - Phase 1.3
 *
 * Main export file for the authorization service foundation.
 * Provides system-level authorization capabilities derived from user systemRole.
 *
 * Compliance:
 * - Phase 1.3 Spec: .kiro/specs/phase-1.3.authorization.foundation.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemRole = exports.validateAuthContext = exports.authorizeIf = exports.authorizeRequest = exports.hasCapability = exports.createAuthorizationContext = exports.Authorize = exports.requireClubManagement = exports.requirePlatformManagement = exports.requireCapability = exports.AuthorizationLogger = exports.AuthorizationLogEvent = exports.isAuthorizationError = exports.createAuthorizationErrorResponse = exports.UserDataUnavailableError = exports.AuthorizationServiceError = exports.CapabilityNotFoundError = exports.InsufficientPrivilegesError = exports.AuthorizationError = exports.AuthorizationErrorType = exports.CapabilityResolver = exports.authorizationService = exports.AuthorizationService = exports.SystemCapability = void 0;
// Core types and interfaces
var types_1 = require("./types");
Object.defineProperty(exports, "SystemCapability", { enumerable: true, get: function () { return types_1.SystemCapability; } });
// Authorization service
var authorization_service_1 = require("./authorization-service");
Object.defineProperty(exports, "AuthorizationService", { enumerable: true, get: function () { return authorization_service_1.AuthorizationService; } });
Object.defineProperty(exports, "authorizationService", { enumerable: true, get: function () { return authorization_service_1.authorizationService; } });
// Capability resolver
var capability_resolver_1 = require("./capability-resolver");
Object.defineProperty(exports, "CapabilityResolver", { enumerable: true, get: function () { return capability_resolver_1.CapabilityResolver; } });
// Error handling
var authorization_errors_1 = require("./authorization-errors");
Object.defineProperty(exports, "AuthorizationErrorType", { enumerable: true, get: function () { return authorization_errors_1.AuthorizationErrorType; } });
Object.defineProperty(exports, "AuthorizationError", { enumerable: true, get: function () { return authorization_errors_1.AuthorizationError; } });
Object.defineProperty(exports, "InsufficientPrivilegesError", { enumerable: true, get: function () { return authorization_errors_1.InsufficientPrivilegesError; } });
Object.defineProperty(exports, "CapabilityNotFoundError", { enumerable: true, get: function () { return authorization_errors_1.CapabilityNotFoundError; } });
Object.defineProperty(exports, "AuthorizationServiceError", { enumerable: true, get: function () { return authorization_errors_1.AuthorizationServiceError; } });
Object.defineProperty(exports, "UserDataUnavailableError", { enumerable: true, get: function () { return authorization_errors_1.UserDataUnavailableError; } });
Object.defineProperty(exports, "createAuthorizationErrorResponse", { enumerable: true, get: function () { return authorization_errors_1.createAuthorizationErrorResponse; } });
Object.defineProperty(exports, "isAuthorizationError", { enumerable: true, get: function () { return authorization_errors_1.isAuthorizationError; } });
// Logging
var authorization_logger_1 = require("./authorization-logger");
Object.defineProperty(exports, "AuthorizationLogEvent", { enumerable: true, get: function () { return authorization_logger_1.AuthorizationLogEvent; } });
Object.defineProperty(exports, "AuthorizationLogger", { enumerable: true, get: function () { return authorization_logger_1.AuthorizationLogger; } });
// Middleware and utilities
var authorization_middleware_1 = require("./authorization-middleware");
Object.defineProperty(exports, "requireCapability", { enumerable: true, get: function () { return authorization_middleware_1.requireCapability; } });
Object.defineProperty(exports, "requirePlatformManagement", { enumerable: true, get: function () { return authorization_middleware_1.requirePlatformManagement; } });
Object.defineProperty(exports, "requireClubManagement", { enumerable: true, get: function () { return authorization_middleware_1.requireClubManagement; } });
Object.defineProperty(exports, "Authorize", { enumerable: true, get: function () { return authorization_middleware_1.Authorize; } });
Object.defineProperty(exports, "createAuthorizationContext", { enumerable: true, get: function () { return authorization_middleware_1.createAuthorizationContext; } });
Object.defineProperty(exports, "hasCapability", { enumerable: true, get: function () { return authorization_middleware_1.hasCapability; } });
Object.defineProperty(exports, "authorizeRequest", { enumerable: true, get: function () { return authorization_middleware_1.authorizeRequest; } });
Object.defineProperty(exports, "authorizeIf", { enumerable: true, get: function () { return authorization_middleware_1.authorizeIf; } });
Object.defineProperty(exports, "validateAuthContext", { enumerable: true, get: function () { return authorization_middleware_1.validateAuthContext; } });
var user_1 = require("../types/user");
Object.defineProperty(exports, "SystemRole", { enumerable: true, get: function () { return user_1.SystemRole; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7OztBQUVILDRCQUE0QjtBQUM1QixpQ0FRaUI7QUFQZix5R0FBQSxnQkFBZ0IsT0FBQTtBQVNsQix3QkFBd0I7QUFDeEIsaUVBR2lDO0FBRi9CLDZIQUFBLG9CQUFvQixPQUFBO0FBQ3BCLDZIQUFBLG9CQUFvQixPQUFBO0FBR3RCLHNCQUFzQjtBQUN0Qiw2REFFK0I7QUFEN0IseUhBQUEsa0JBQWtCLE9BQUE7QUFHcEIsaUJBQWlCO0FBQ2pCLCtEQVNnQztBQVI5Qiw4SEFBQSxzQkFBc0IsT0FBQTtBQUN0QiwwSEFBQSxrQkFBa0IsT0FBQTtBQUNsQixtSUFBQSwyQkFBMkIsT0FBQTtBQUMzQiwrSEFBQSx1QkFBdUIsT0FBQTtBQUN2QixpSUFBQSx5QkFBeUIsT0FBQTtBQUN6QixnSUFBQSx3QkFBd0IsT0FBQTtBQUN4Qix3SUFBQSxnQ0FBZ0MsT0FBQTtBQUNoQyw0SEFBQSxvQkFBb0IsT0FBQTtBQUd0QixVQUFVO0FBQ1YsK0RBSWdDO0FBSDlCLDZIQUFBLHFCQUFxQixPQUFBO0FBRXJCLDJIQUFBLG1CQUFtQixPQUFBO0FBR3JCLDJCQUEyQjtBQUMzQix1RUFXb0M7QUFUbEMsNkhBQUEsaUJBQWlCLE9BQUE7QUFDakIscUlBQUEseUJBQXlCLE9BQUE7QUFDekIsaUlBQUEscUJBQXFCLE9BQUE7QUFDckIscUhBQUEsU0FBUyxPQUFBO0FBQ1Qsc0lBQUEsMEJBQTBCLE9BQUE7QUFDMUIseUhBQUEsYUFBYSxPQUFBO0FBQ2IsNEhBQUEsZ0JBQWdCLE9BQUE7QUFDaEIsdUhBQUEsV0FBVyxPQUFBO0FBQ1gsK0hBQUEsbUJBQW1CLE9BQUE7QUFLckIsc0NBQTJDO0FBQWxDLGtHQUFBLFVBQVUsT0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQXV0aG9yaXphdGlvbiBTZXJ2aWNlIEZvdW5kYXRpb24gLSBQaGFzZSAxLjNcbiAqIFxuICogTWFpbiBleHBvcnQgZmlsZSBmb3IgdGhlIGF1dGhvcml6YXRpb24gc2VydmljZSBmb3VuZGF0aW9uLlxuICogUHJvdmlkZXMgc3lzdGVtLWxldmVsIGF1dGhvcml6YXRpb24gY2FwYWJpbGl0aWVzIGRlcml2ZWQgZnJvbSB1c2VyIHN5c3RlbVJvbGUuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDEuMyBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0xLjMuYXV0aG9yaXphdGlvbi5mb3VuZGF0aW9uLnYxLm1kXG4gKi9cblxuLy8gQ29yZSB0eXBlcyBhbmQgaW50ZXJmYWNlc1xuZXhwb3J0IHtcbiAgU3lzdGVtQ2FwYWJpbGl0eSxcbiAgQXV0aG9yaXphdGlvbkNvbnRleHQsXG4gIEF1dGhvcml6YXRpb25SZXN1bHQsXG4gIEF1dGhvcml6YXRpb25SZXF1ZXN0LFxuICBDYXBhYmlsaXR5Q2FjaGVFbnRyeSxcbiAgSUF1dGhvcml6YXRpb25TZXJ2aWNlLFxuICBJQ2FwYWJpbGl0eVJlc29sdmVyLFxufSBmcm9tICcuL3R5cGVzJztcblxuLy8gQXV0aG9yaXphdGlvbiBzZXJ2aWNlXG5leHBvcnQge1xuICBBdXRob3JpemF0aW9uU2VydmljZSxcbiAgYXV0aG9yaXphdGlvblNlcnZpY2UsXG59IGZyb20gJy4vYXV0aG9yaXphdGlvbi1zZXJ2aWNlJztcblxuLy8gQ2FwYWJpbGl0eSByZXNvbHZlclxuZXhwb3J0IHtcbiAgQ2FwYWJpbGl0eVJlc29sdmVyLFxufSBmcm9tICcuL2NhcGFiaWxpdHktcmVzb2x2ZXInO1xuXG4vLyBFcnJvciBoYW5kbGluZ1xuZXhwb3J0IHtcbiAgQXV0aG9yaXphdGlvbkVycm9yVHlwZSxcbiAgQXV0aG9yaXphdGlvbkVycm9yLFxuICBJbnN1ZmZpY2llbnRQcml2aWxlZ2VzRXJyb3IsXG4gIENhcGFiaWxpdHlOb3RGb3VuZEVycm9yLFxuICBBdXRob3JpemF0aW9uU2VydmljZUVycm9yLFxuICBVc2VyRGF0YVVuYXZhaWxhYmxlRXJyb3IsXG4gIGNyZWF0ZUF1dGhvcml6YXRpb25FcnJvclJlc3BvbnNlLFxuICBpc0F1dGhvcml6YXRpb25FcnJvcixcbn0gZnJvbSAnLi9hdXRob3JpemF0aW9uLWVycm9ycyc7XG5cbi8vIExvZ2dpbmdcbmV4cG9ydCB7XG4gIEF1dGhvcml6YXRpb25Mb2dFdmVudCxcbiAgQXV0aG9yaXphdGlvbkxvZ0VudHJ5LFxuICBBdXRob3JpemF0aW9uTG9nZ2VyLFxufSBmcm9tICcuL2F1dGhvcml6YXRpb24tbG9nZ2VyJztcblxuLy8gTWlkZGxld2FyZSBhbmQgdXRpbGl0aWVzXG5leHBvcnQge1xuICBBdXRob3JpemF0aW9uTWlkZGxld2FyZSxcbiAgcmVxdWlyZUNhcGFiaWxpdHksXG4gIHJlcXVpcmVQbGF0Zm9ybU1hbmFnZW1lbnQsXG4gIHJlcXVpcmVDbHViTWFuYWdlbWVudCxcbiAgQXV0aG9yaXplLFxuICBjcmVhdGVBdXRob3JpemF0aW9uQ29udGV4dCxcbiAgaGFzQ2FwYWJpbGl0eSxcbiAgYXV0aG9yaXplUmVxdWVzdCxcbiAgYXV0aG9yaXplSWYsXG4gIHZhbGlkYXRlQXV0aENvbnRleHQsXG59IGZyb20gJy4vYXV0aG9yaXphdGlvbi1taWRkbGV3YXJlJztcblxuLy8gUmUtZXhwb3J0IGNvbW1vbmx5IHVzZWQgdHlwZXMgZnJvbSBvdGhlciBtb2R1bGVzXG5leHBvcnQgeyBBdXRoQ29udGV4dCB9IGZyb20gJy4uL3R5cGVzL2F1dGgnO1xuZXhwb3J0IHsgU3lzdGVtUm9sZSB9IGZyb20gJy4uL3R5cGVzL3VzZXInOyJdfQ==