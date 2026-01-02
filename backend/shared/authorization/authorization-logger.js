"use strict";
/**
 * Authorization Logger - Phase 1.3
 *
 * Structured logging for authorization decisions and events.
 * Provides audit trail and debugging information.
 *
 * Compliance:
 * - Phase 1.3 Spec: .kiro/specs/phase-1.3.authorization.foundation.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationLogger = exports.AuthorizationLogEvent = void 0;
const lambda_utils_1 = require("../utils/lambda-utils");
/**
 * Authorization log event types
 */
var AuthorizationLogEvent;
(function (AuthorizationLogEvent) {
    AuthorizationLogEvent["AUTHORIZATION_CHECK"] = "authorization_check";
    AuthorizationLogEvent["AUTHORIZATION_GRANTED"] = "authorization_granted";
    AuthorizationLogEvent["AUTHORIZATION_DENIED"] = "authorization_denied";
    AuthorizationLogEvent["CAPABILITY_DERIVED"] = "capability_derived";
    AuthorizationLogEvent["AUTHORIZATION_ERROR"] = "authorization_error";
})(AuthorizationLogEvent = exports.AuthorizationLogEvent || (exports.AuthorizationLogEvent = {}));
/**
 * Authorization logger class
 */
class AuthorizationLogger {
    /**
     * Log authorization check initiation
     */
    static logAuthorizationCheck(userId, systemRole, capability, resource, requestId) {
        (0, lambda_utils_1.logStructured)('INFO', 'Authorization check initiated', {
            event: AuthorizationLogEvent.AUTHORIZATION_CHECK,
            userId,
            systemRole,
            capability,
            resource,
            requestId,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Log successful authorization
     */
    static logAuthorizationGranted(userId, systemRole, capability, resource, requestId, duration) {
        (0, lambda_utils_1.logStructured)('INFO', 'Authorization granted', {
            event: AuthorizationLogEvent.AUTHORIZATION_GRANTED,
            userId,
            systemRole,
            capability,
            resource,
            granted: true,
            requestId,
            duration,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Log denied authorization
     */
    static logAuthorizationDenied(userId, systemRole, capability, reason, resource, requestId, duration) {
        (0, lambda_utils_1.logStructured)('WARN', 'Authorization denied', {
            event: AuthorizationLogEvent.AUTHORIZATION_DENIED,
            userId,
            systemRole,
            capability,
            resource,
            granted: false,
            reason,
            requestId,
            duration,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Log capability derivation
     */
    static logCapabilityDerived(userId, systemRole, capabilities, duration) {
        (0, lambda_utils_1.logStructured)('INFO', 'Capabilities derived', {
            event: AuthorizationLogEvent.CAPABILITY_DERIVED,
            userId,
            systemRole,
            capabilities,
            duration,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Log authorization error
     */
    static logAuthorizationError(userId, systemRole, error, capability, resource, requestId, duration) {
        (0, lambda_utils_1.logStructured)('ERROR', 'Authorization error', {
            event: AuthorizationLogEvent.AUTHORIZATION_ERROR,
            userId,
            systemRole,
            capability,
            resource,
            error: error.message,
            requestId,
            duration,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Log performance metrics
     */
    static logPerformanceMetrics(operation, duration, userId, capability) {
        (0, lambda_utils_1.logStructured)('INFO', 'Authorization performance metrics', {
            operation,
            duration,
            userId,
            capability,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Log cache hit/miss for debugging
     */
    static logCacheEvent(event, userId, systemRole, capabilities) {
        (0, lambda_utils_1.logStructured)('INFO', `Authorization cache ${event}`, {
            event: `cache_${event}`,
            userId,
            systemRole,
            capabilities,
            timestamp: new Date().toISOString(),
        });
    }
}
exports.AuthorizationLogger = AuthorizationLogger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aG9yaXphdGlvbi1sb2dnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhdXRob3JpemF0aW9uLWxvZ2dlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7OztBQUlILHdEQUFzRDtBQUV0RDs7R0FFRztBQUNILElBQVkscUJBTVg7QUFORCxXQUFZLHFCQUFxQjtJQUMvQixvRUFBMkMsQ0FBQTtJQUMzQyx3RUFBK0MsQ0FBQTtJQUMvQyxzRUFBNkMsQ0FBQTtJQUM3QyxrRUFBeUMsQ0FBQTtJQUN6QyxvRUFBMkMsQ0FBQTtBQUM3QyxDQUFDLEVBTlcscUJBQXFCLEdBQXJCLDZCQUFxQixLQUFyQiw2QkFBcUIsUUFNaEM7QUFvQkQ7O0dBRUc7QUFDSCxNQUFhLG1CQUFtQjtJQUM5Qjs7T0FFRztJQUNILE1BQU0sQ0FBQyxxQkFBcUIsQ0FDMUIsTUFBYyxFQUNkLFVBQXNCLEVBQ3RCLFVBQTRCLEVBQzVCLFFBQWlCLEVBQ2pCLFNBQWtCO1FBRWxCLElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsK0JBQStCLEVBQUU7WUFDckQsS0FBSyxFQUFFLHFCQUFxQixDQUFDLG1CQUFtQjtZQUNoRCxNQUFNO1lBQ04sVUFBVTtZQUNWLFVBQVU7WUFDVixRQUFRO1lBQ1IsU0FBUztZQUNULFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtTQUNwQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxNQUFNLENBQUMsdUJBQXVCLENBQzVCLE1BQWMsRUFDZCxVQUFzQixFQUN0QixVQUE0QixFQUM1QixRQUFpQixFQUNqQixTQUFrQixFQUNsQixRQUFpQjtRQUVqQixJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLHVCQUF1QixFQUFFO1lBQzdDLEtBQUssRUFBRSxxQkFBcUIsQ0FBQyxxQkFBcUI7WUFDbEQsTUFBTTtZQUNOLFVBQVU7WUFDVixVQUFVO1lBQ1YsUUFBUTtZQUNSLE9BQU8sRUFBRSxJQUFJO1lBQ2IsU0FBUztZQUNULFFBQVE7WUFDUixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7U0FDcEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOztPQUVHO0lBQ0gsTUFBTSxDQUFDLHNCQUFzQixDQUMzQixNQUFjLEVBQ2QsVUFBc0IsRUFDdEIsVUFBNEIsRUFDNUIsTUFBYyxFQUNkLFFBQWlCLEVBQ2pCLFNBQWtCLEVBQ2xCLFFBQWlCO1FBRWpCLElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsc0JBQXNCLEVBQUU7WUFDNUMsS0FBSyxFQUFFLHFCQUFxQixDQUFDLG9CQUFvQjtZQUNqRCxNQUFNO1lBQ04sVUFBVTtZQUNWLFVBQVU7WUFDVixRQUFRO1lBQ1IsT0FBTyxFQUFFLEtBQUs7WUFDZCxNQUFNO1lBQ04sU0FBUztZQUNULFFBQVE7WUFDUixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7U0FDcEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOztPQUVHO0lBQ0gsTUFBTSxDQUFDLG9CQUFvQixDQUN6QixNQUFjLEVBQ2QsVUFBc0IsRUFDdEIsWUFBZ0MsRUFDaEMsUUFBaUI7UUFFakIsSUFBQSw0QkFBYSxFQUFDLE1BQU0sRUFBRSxzQkFBc0IsRUFBRTtZQUM1QyxLQUFLLEVBQUUscUJBQXFCLENBQUMsa0JBQWtCO1lBQy9DLE1BQU07WUFDTixVQUFVO1lBQ1YsWUFBWTtZQUNaLFFBQVE7WUFDUixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7U0FDcEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOztPQUVHO0lBQ0gsTUFBTSxDQUFDLHFCQUFxQixDQUMxQixNQUFjLEVBQ2QsVUFBc0IsRUFDdEIsS0FBWSxFQUNaLFVBQTZCLEVBQzdCLFFBQWlCLEVBQ2pCLFNBQWtCLEVBQ2xCLFFBQWlCO1FBRWpCLElBQUEsNEJBQWEsRUFBQyxPQUFPLEVBQUUscUJBQXFCLEVBQUU7WUFDNUMsS0FBSyxFQUFFLHFCQUFxQixDQUFDLG1CQUFtQjtZQUNoRCxNQUFNO1lBQ04sVUFBVTtZQUNWLFVBQVU7WUFDVixRQUFRO1lBQ1IsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPO1lBQ3BCLFNBQVM7WUFDVCxRQUFRO1lBQ1IsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1NBQ3BDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7T0FFRztJQUNILE1BQU0sQ0FBQyxxQkFBcUIsQ0FDMUIsU0FBaUIsRUFDakIsUUFBZ0IsRUFDaEIsTUFBZSxFQUNmLFVBQTZCO1FBRTdCLElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsbUNBQW1DLEVBQUU7WUFDekQsU0FBUztZQUNULFFBQVE7WUFDUixNQUFNO1lBQ04sVUFBVTtZQUNWLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtTQUNwQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxNQUFNLENBQUMsYUFBYSxDQUNsQixLQUF1QyxFQUN2QyxNQUFjLEVBQ2QsVUFBc0IsRUFDdEIsWUFBaUM7UUFFakMsSUFBQSw0QkFBYSxFQUFDLE1BQU0sRUFBRSx1QkFBdUIsS0FBSyxFQUFFLEVBQUU7WUFDcEQsS0FBSyxFQUFFLFNBQVMsS0FBSyxFQUFFO1lBQ3ZCLE1BQU07WUFDTixVQUFVO1lBQ1YsWUFBWTtZQUNaLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtTQUNwQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF2SkQsa0RBdUpDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBdXRob3JpemF0aW9uIExvZ2dlciAtIFBoYXNlIDEuM1xuICogXG4gKiBTdHJ1Y3R1cmVkIGxvZ2dpbmcgZm9yIGF1dGhvcml6YXRpb24gZGVjaXNpb25zIGFuZCBldmVudHMuXG4gKiBQcm92aWRlcyBhdWRpdCB0cmFpbCBhbmQgZGVidWdnaW5nIGluZm9ybWF0aW9uLlxuICogXG4gKiBDb21wbGlhbmNlOlxuICogLSBQaGFzZSAxLjMgU3BlYzogLmtpcm8vc3BlY3MvcGhhc2UtMS4zLmF1dGhvcml6YXRpb24uZm91bmRhdGlvbi52MS5tZFxuICovXG5cbmltcG9ydCB7IFN5c3RlbVJvbGUgfSBmcm9tICcuLi90eXBlcy91c2VyJztcbmltcG9ydCB7IFN5c3RlbUNhcGFiaWxpdHkgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IGxvZ1N0cnVjdHVyZWQgfSBmcm9tICcuLi91dGlscy9sYW1iZGEtdXRpbHMnO1xuXG4vKipcbiAqIEF1dGhvcml6YXRpb24gbG9nIGV2ZW50IHR5cGVzXG4gKi9cbmV4cG9ydCBlbnVtIEF1dGhvcml6YXRpb25Mb2dFdmVudCB7XG4gIEFVVEhPUklaQVRJT05fQ0hFQ0sgPSAnYXV0aG9yaXphdGlvbl9jaGVjaycsXG4gIEFVVEhPUklaQVRJT05fR1JBTlRFRCA9ICdhdXRob3JpemF0aW9uX2dyYW50ZWQnLFxuICBBVVRIT1JJWkFUSU9OX0RFTklFRCA9ICdhdXRob3JpemF0aW9uX2RlbmllZCcsXG4gIENBUEFCSUxJVFlfREVSSVZFRCA9ICdjYXBhYmlsaXR5X2Rlcml2ZWQnLFxuICBBVVRIT1JJWkFUSU9OX0VSUk9SID0gJ2F1dGhvcml6YXRpb25fZXJyb3InLFxufVxuXG4vKipcbiAqIEF1dGhvcml6YXRpb24gbG9nIGVudHJ5IHN0cnVjdHVyZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEF1dGhvcml6YXRpb25Mb2dFbnRyeSB7XG4gIHRpbWVzdGFtcDogc3RyaW5nO1xuICBsZXZlbDogJ0lORk8nIHwgJ1dBUk4nIHwgJ0VSUk9SJztcbiAgZXZlbnQ6IEF1dGhvcml6YXRpb25Mb2dFdmVudDtcbiAgdXNlcklkOiBzdHJpbmc7XG4gIHN5c3RlbVJvbGU6IFN5c3RlbVJvbGU7XG4gIGNhcGFiaWxpdHk/OiBTeXN0ZW1DYXBhYmlsaXR5O1xuICByZXNvdXJjZT86IHN0cmluZztcbiAgZ3JhbnRlZD86IGJvb2xlYW47XG4gIHJlYXNvbj86IHN0cmluZztcbiAgcmVxdWVzdElkPzogc3RyaW5nO1xuICBkdXJhdGlvbj86IG51bWJlcjsgLy8gbWlsbGlzZWNvbmRzXG4gIGVycm9yPzogc3RyaW5nO1xufVxuXG4vKipcbiAqIEF1dGhvcml6YXRpb24gbG9nZ2VyIGNsYXNzXG4gKi9cbmV4cG9ydCBjbGFzcyBBdXRob3JpemF0aW9uTG9nZ2VyIHtcbiAgLyoqXG4gICAqIExvZyBhdXRob3JpemF0aW9uIGNoZWNrIGluaXRpYXRpb25cbiAgICovXG4gIHN0YXRpYyBsb2dBdXRob3JpemF0aW9uQ2hlY2soXG4gICAgdXNlcklkOiBzdHJpbmcsXG4gICAgc3lzdGVtUm9sZTogU3lzdGVtUm9sZSxcbiAgICBjYXBhYmlsaXR5OiBTeXN0ZW1DYXBhYmlsaXR5LFxuICAgIHJlc291cmNlPzogc3RyaW5nLFxuICAgIHJlcXVlc3RJZD86IHN0cmluZ1xuICApOiB2b2lkIHtcbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0F1dGhvcml6YXRpb24gY2hlY2sgaW5pdGlhdGVkJywge1xuICAgICAgZXZlbnQ6IEF1dGhvcml6YXRpb25Mb2dFdmVudC5BVVRIT1JJWkFUSU9OX0NIRUNLLFxuICAgICAgdXNlcklkLFxuICAgICAgc3lzdGVtUm9sZSxcbiAgICAgIGNhcGFiaWxpdHksXG4gICAgICByZXNvdXJjZSxcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogTG9nIHN1Y2Nlc3NmdWwgYXV0aG9yaXphdGlvblxuICAgKi9cbiAgc3RhdGljIGxvZ0F1dGhvcml6YXRpb25HcmFudGVkKFxuICAgIHVzZXJJZDogc3RyaW5nLFxuICAgIHN5c3RlbVJvbGU6IFN5c3RlbVJvbGUsXG4gICAgY2FwYWJpbGl0eTogU3lzdGVtQ2FwYWJpbGl0eSxcbiAgICByZXNvdXJjZT86IHN0cmluZyxcbiAgICByZXF1ZXN0SWQ/OiBzdHJpbmcsXG4gICAgZHVyYXRpb24/OiBudW1iZXJcbiAgKTogdm9pZCB7XG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdBdXRob3JpemF0aW9uIGdyYW50ZWQnLCB7XG4gICAgICBldmVudDogQXV0aG9yaXphdGlvbkxvZ0V2ZW50LkFVVEhPUklaQVRJT05fR1JBTlRFRCxcbiAgICAgIHVzZXJJZCxcbiAgICAgIHN5c3RlbVJvbGUsXG4gICAgICBjYXBhYmlsaXR5LFxuICAgICAgcmVzb3VyY2UsXG4gICAgICBncmFudGVkOiB0cnVlLFxuICAgICAgcmVxdWVzdElkLFxuICAgICAgZHVyYXRpb24sXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIExvZyBkZW5pZWQgYXV0aG9yaXphdGlvblxuICAgKi9cbiAgc3RhdGljIGxvZ0F1dGhvcml6YXRpb25EZW5pZWQoXG4gICAgdXNlcklkOiBzdHJpbmcsXG4gICAgc3lzdGVtUm9sZTogU3lzdGVtUm9sZSxcbiAgICBjYXBhYmlsaXR5OiBTeXN0ZW1DYXBhYmlsaXR5LFxuICAgIHJlYXNvbjogc3RyaW5nLFxuICAgIHJlc291cmNlPzogc3RyaW5nLFxuICAgIHJlcXVlc3RJZD86IHN0cmluZyxcbiAgICBkdXJhdGlvbj86IG51bWJlclxuICApOiB2b2lkIHtcbiAgICBsb2dTdHJ1Y3R1cmVkKCdXQVJOJywgJ0F1dGhvcml6YXRpb24gZGVuaWVkJywge1xuICAgICAgZXZlbnQ6IEF1dGhvcml6YXRpb25Mb2dFdmVudC5BVVRIT1JJWkFUSU9OX0RFTklFRCxcbiAgICAgIHVzZXJJZCxcbiAgICAgIHN5c3RlbVJvbGUsXG4gICAgICBjYXBhYmlsaXR5LFxuICAgICAgcmVzb3VyY2UsXG4gICAgICBncmFudGVkOiBmYWxzZSxcbiAgICAgIHJlYXNvbixcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIGR1cmF0aW9uLFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBMb2cgY2FwYWJpbGl0eSBkZXJpdmF0aW9uXG4gICAqL1xuICBzdGF0aWMgbG9nQ2FwYWJpbGl0eURlcml2ZWQoXG4gICAgdXNlcklkOiBzdHJpbmcsXG4gICAgc3lzdGVtUm9sZTogU3lzdGVtUm9sZSxcbiAgICBjYXBhYmlsaXRpZXM6IFN5c3RlbUNhcGFiaWxpdHlbXSxcbiAgICBkdXJhdGlvbj86IG51bWJlclxuICApOiB2b2lkIHtcbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0NhcGFiaWxpdGllcyBkZXJpdmVkJywge1xuICAgICAgZXZlbnQ6IEF1dGhvcml6YXRpb25Mb2dFdmVudC5DQVBBQklMSVRZX0RFUklWRUQsXG4gICAgICB1c2VySWQsXG4gICAgICBzeXN0ZW1Sb2xlLFxuICAgICAgY2FwYWJpbGl0aWVzLFxuICAgICAgZHVyYXRpb24sXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIExvZyBhdXRob3JpemF0aW9uIGVycm9yXG4gICAqL1xuICBzdGF0aWMgbG9nQXV0aG9yaXphdGlvbkVycm9yKFxuICAgIHVzZXJJZDogc3RyaW5nLFxuICAgIHN5c3RlbVJvbGU6IFN5c3RlbVJvbGUsXG4gICAgZXJyb3I6IEVycm9yLFxuICAgIGNhcGFiaWxpdHk/OiBTeXN0ZW1DYXBhYmlsaXR5LFxuICAgIHJlc291cmNlPzogc3RyaW5nLFxuICAgIHJlcXVlc3RJZD86IHN0cmluZyxcbiAgICBkdXJhdGlvbj86IG51bWJlclxuICApOiB2b2lkIHtcbiAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdBdXRob3JpemF0aW9uIGVycm9yJywge1xuICAgICAgZXZlbnQ6IEF1dGhvcml6YXRpb25Mb2dFdmVudC5BVVRIT1JJWkFUSU9OX0VSUk9SLFxuICAgICAgdXNlcklkLFxuICAgICAgc3lzdGVtUm9sZSxcbiAgICAgIGNhcGFiaWxpdHksXG4gICAgICByZXNvdXJjZSxcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxuICAgICAgcmVxdWVzdElkLFxuICAgICAgZHVyYXRpb24sXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIExvZyBwZXJmb3JtYW5jZSBtZXRyaWNzXG4gICAqL1xuICBzdGF0aWMgbG9nUGVyZm9ybWFuY2VNZXRyaWNzKFxuICAgIG9wZXJhdGlvbjogc3RyaW5nLFxuICAgIGR1cmF0aW9uOiBudW1iZXIsXG4gICAgdXNlcklkPzogc3RyaW5nLFxuICAgIGNhcGFiaWxpdHk/OiBTeXN0ZW1DYXBhYmlsaXR5XG4gICk6IHZvaWQge1xuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnQXV0aG9yaXphdGlvbiBwZXJmb3JtYW5jZSBtZXRyaWNzJywge1xuICAgICAgb3BlcmF0aW9uLFxuICAgICAgZHVyYXRpb24sXG4gICAgICB1c2VySWQsXG4gICAgICBjYXBhYmlsaXR5LFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBMb2cgY2FjaGUgaGl0L21pc3MgZm9yIGRlYnVnZ2luZ1xuICAgKi9cbiAgc3RhdGljIGxvZ0NhY2hlRXZlbnQoXG4gICAgZXZlbnQ6ICdoaXQnIHwgJ21pc3MnIHwgJ3NldCcgfCAnZXZpY3QnLFxuICAgIHVzZXJJZDogc3RyaW5nLFxuICAgIHN5c3RlbVJvbGU6IFN5c3RlbVJvbGUsXG4gICAgY2FwYWJpbGl0aWVzPzogU3lzdGVtQ2FwYWJpbGl0eVtdXG4gICk6IHZvaWQge1xuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCBgQXV0aG9yaXphdGlvbiBjYWNoZSAke2V2ZW50fWAsIHtcbiAgICAgIGV2ZW50OiBgY2FjaGVfJHtldmVudH1gLFxuICAgICAgdXNlcklkLFxuICAgICAgc3lzdGVtUm9sZSxcbiAgICAgIGNhcGFiaWxpdGllcyxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH0pO1xuICB9XG59Il19