"use strict";
/**
 * Capability Resolver - Phase 1.3
 *
 * Derives system-level capabilities from user systemRole.
 * Implements the capability matrix defined in the specification.
 *
 * Compliance:
 * - Phase 1.3 Spec: .kiro/specs/phase-1.3.authorization.foundation.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapabilityResolver = void 0;
const user_1 = require("../types/user");
const types_1 = require("./types");
const lambda_utils_1 = require("../utils/lambda-utils");
/**
 * System capability matrix mapping roles to capabilities
 */
const CAPABILITY_MATRIX = {
    [user_1.SystemRole.USER]: [],
    [user_1.SystemRole.SITE_ADMIN]: [
        types_1.SystemCapability.MANAGE_PLATFORM,
        types_1.SystemCapability.MANAGE_ALL_CLUBS,
    ],
};
/**
 * Capability resolver implementation
 */
class CapabilityResolver {
    /**
     * Derive system capabilities from user authentication context
     *
     * @param authContext - User authentication context
     * @returns Array of system capabilities
     */
    async deriveCapabilities(authContext) {
        const startTime = Date.now();
        try {
            // Get capabilities for user's system role
            const capabilities = this.getCapabilitiesForRole(authContext.systemRole);
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('INFO', 'Capabilities derived', {
                userId: authContext.userId,
                systemRole: authContext.systemRole,
                capabilities: capabilities,
                duration,
            });
            return capabilities;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('ERROR', 'Failed to derive capabilities', {
                userId: authContext.userId,
                systemRole: authContext.systemRole,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
            });
            // Fail-safe: return empty capabilities on error
            return [];
        }
    }
    /**
     * Check if system role grants specific capability
     *
     * @param systemRole - User's system role
     * @param capability - Capability to check
     * @returns True if role grants capability
     */
    hasCapability(systemRole, capability) {
        const roleCapabilities = this.getCapabilitiesForRole(systemRole);
        return roleCapabilities.includes(capability);
    }
    /**
     * Get all capabilities for a system role
     *
     * @param systemRole - System role
     * @returns Array of capabilities
     */
    getCapabilitiesForRole(systemRole) {
        return CAPABILITY_MATRIX[systemRole] || [];
    }
    /**
     * Validate that a capability exists in the system
     *
     * @param capability - Capability to validate
     * @returns True if capability is valid
     */
    isValidCapability(capability) {
        return Object.values(types_1.SystemCapability).includes(capability);
    }
    /**
     * Get all available system capabilities
     *
     * @returns Array of all system capabilities
     */
    getAllCapabilities() {
        return Object.values(types_1.SystemCapability);
    }
    /**
     * Get capability matrix for debugging/documentation
     *
     * @returns Complete capability matrix
     */
    getCapabilityMatrix() {
        return { ...CAPABILITY_MATRIX };
    }
}
exports.CapabilityResolver = CapabilityResolver;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FwYWJpbGl0eS1yZXNvbHZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNhcGFiaWxpdHktcmVzb2x2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7QUFHSCx3Q0FBMkM7QUFDM0MsbUNBQWdFO0FBQ2hFLHdEQUFzRDtBQUV0RDs7R0FFRztBQUNILE1BQU0saUJBQWlCLEdBQTJDO0lBQ2hFLENBQUMsaUJBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFO0lBQ3JCLENBQUMsaUJBQVUsQ0FBQyxVQUFVLENBQUMsRUFBRTtRQUN2Qix3QkFBZ0IsQ0FBQyxlQUFlO1FBQ2hDLHdCQUFnQixDQUFDLGdCQUFnQjtLQUNsQztDQUNGLENBQUM7QUFFRjs7R0FFRztBQUNILE1BQWEsa0JBQWtCO0lBQzdCOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLGtCQUFrQixDQUFDLFdBQXdCO1FBQy9DLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUU3QixJQUFJO1lBQ0YsMENBQTBDO1lBQzFDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFekUsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQztZQUV4QyxJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLHNCQUFzQixFQUFFO2dCQUM1QyxNQUFNLEVBQUUsV0FBVyxDQUFDLE1BQU07Z0JBQzFCLFVBQVUsRUFBRSxXQUFXLENBQUMsVUFBVTtnQkFDbEMsWUFBWSxFQUFFLFlBQVk7Z0JBQzFCLFFBQVE7YUFDVCxDQUFDLENBQUM7WUFFSCxPQUFPLFlBQVksQ0FBQztTQUNyQjtRQUFDLE9BQU8sS0FBSyxFQUFFO1lBQ2QsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQztZQUV4QyxJQUFBLDRCQUFhLEVBQUMsT0FBTyxFQUFFLCtCQUErQixFQUFFO2dCQUN0RCxNQUFNLEVBQUUsV0FBVyxDQUFDLE1BQU07Z0JBQzFCLFVBQVUsRUFBRSxXQUFXLENBQUMsVUFBVTtnQkFDbEMsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWU7Z0JBQy9ELFFBQVE7YUFDVCxDQUFDLENBQUM7WUFFSCxnREFBZ0Q7WUFDaEQsT0FBTyxFQUFFLENBQUM7U0FDWDtJQUNILENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxhQUFhLENBQUMsVUFBc0IsRUFBRSxVQUE0QjtRQUNoRSxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNqRSxPQUFPLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSyxzQkFBc0IsQ0FBQyxVQUFzQjtRQUNuRCxPQUFPLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUM3QyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxpQkFBaUIsQ0FBQyxVQUFrQjtRQUNsQyxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsd0JBQWdCLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBOEIsQ0FBQyxDQUFDO0lBQ2xGLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsa0JBQWtCO1FBQ2hCLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyx3QkFBZ0IsQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsbUJBQW1CO1FBQ2pCLE9BQU8sRUFBRSxHQUFHLGlCQUFpQixFQUFFLENBQUM7SUFDbEMsQ0FBQztDQUNGO0FBeEZELGdEQXdGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ2FwYWJpbGl0eSBSZXNvbHZlciAtIFBoYXNlIDEuM1xuICogXG4gKiBEZXJpdmVzIHN5c3RlbS1sZXZlbCBjYXBhYmlsaXRpZXMgZnJvbSB1c2VyIHN5c3RlbVJvbGUuXG4gKiBJbXBsZW1lbnRzIHRoZSBjYXBhYmlsaXR5IG1hdHJpeCBkZWZpbmVkIGluIHRoZSBzcGVjaWZpY2F0aW9uLlxuICogXG4gKiBDb21wbGlhbmNlOlxuICogLSBQaGFzZSAxLjMgU3BlYzogLmtpcm8vc3BlY3MvcGhhc2UtMS4zLmF1dGhvcml6YXRpb24uZm91bmRhdGlvbi52MS5tZFxuICovXG5cbmltcG9ydCB7IEF1dGhDb250ZXh0IH0gZnJvbSAnLi4vdHlwZXMvYXV0aCc7XG5pbXBvcnQgeyBTeXN0ZW1Sb2xlIH0gZnJvbSAnLi4vdHlwZXMvdXNlcic7XG5pbXBvcnQgeyBTeXN0ZW1DYXBhYmlsaXR5LCBJQ2FwYWJpbGl0eVJlc29sdmVyIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBsb2dTdHJ1Y3R1cmVkIH0gZnJvbSAnLi4vdXRpbHMvbGFtYmRhLXV0aWxzJztcblxuLyoqXG4gKiBTeXN0ZW0gY2FwYWJpbGl0eSBtYXRyaXggbWFwcGluZyByb2xlcyB0byBjYXBhYmlsaXRpZXNcbiAqL1xuY29uc3QgQ0FQQUJJTElUWV9NQVRSSVg6IFJlY29yZDxTeXN0ZW1Sb2xlLCBTeXN0ZW1DYXBhYmlsaXR5W10+ID0ge1xuICBbU3lzdGVtUm9sZS5VU0VSXTogW10sXG4gIFtTeXN0ZW1Sb2xlLlNJVEVfQURNSU5dOiBbXG4gICAgU3lzdGVtQ2FwYWJpbGl0eS5NQU5BR0VfUExBVEZPUk0sXG4gICAgU3lzdGVtQ2FwYWJpbGl0eS5NQU5BR0VfQUxMX0NMVUJTLFxuICBdLFxufTtcblxuLyoqXG4gKiBDYXBhYmlsaXR5IHJlc29sdmVyIGltcGxlbWVudGF0aW9uXG4gKi9cbmV4cG9ydCBjbGFzcyBDYXBhYmlsaXR5UmVzb2x2ZXIgaW1wbGVtZW50cyBJQ2FwYWJpbGl0eVJlc29sdmVyIHtcbiAgLyoqXG4gICAqIERlcml2ZSBzeXN0ZW0gY2FwYWJpbGl0aWVzIGZyb20gdXNlciBhdXRoZW50aWNhdGlvbiBjb250ZXh0XG4gICAqIFxuICAgKiBAcGFyYW0gYXV0aENvbnRleHQgLSBVc2VyIGF1dGhlbnRpY2F0aW9uIGNvbnRleHRcbiAgICogQHJldHVybnMgQXJyYXkgb2Ygc3lzdGVtIGNhcGFiaWxpdGllc1xuICAgKi9cbiAgYXN5bmMgZGVyaXZlQ2FwYWJpbGl0aWVzKGF1dGhDb250ZXh0OiBBdXRoQ29udGV4dCk6IFByb21pc2U8U3lzdGVtQ2FwYWJpbGl0eVtdPiB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgLy8gR2V0IGNhcGFiaWxpdGllcyBmb3IgdXNlcidzIHN5c3RlbSByb2xlXG4gICAgICBjb25zdCBjYXBhYmlsaXRpZXMgPSB0aGlzLmdldENhcGFiaWxpdGllc0ZvclJvbGUoYXV0aENvbnRleHQuc3lzdGVtUm9sZSk7XG4gICAgICBcbiAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICAgIFxuICAgICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdDYXBhYmlsaXRpZXMgZGVyaXZlZCcsIHtcbiAgICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICAgIHN5c3RlbVJvbGU6IGF1dGhDb250ZXh0LnN5c3RlbVJvbGUsXG4gICAgICAgIGNhcGFiaWxpdGllczogY2FwYWJpbGl0aWVzLFxuICAgICAgICBkdXJhdGlvbixcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICByZXR1cm4gY2FwYWJpbGl0aWVzO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgICBcbiAgICAgIGxvZ1N0cnVjdHVyZWQoJ0VSUk9SJywgJ0ZhaWxlZCB0byBkZXJpdmUgY2FwYWJpbGl0aWVzJywge1xuICAgICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgICAgc3lzdGVtUm9sZTogYXV0aENvbnRleHQuc3lzdGVtUm9sZSxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgICAgICBkdXJhdGlvbixcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyBGYWlsLXNhZmU6IHJldHVybiBlbXB0eSBjYXBhYmlsaXRpZXMgb24gZXJyb3JcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDaGVjayBpZiBzeXN0ZW0gcm9sZSBncmFudHMgc3BlY2lmaWMgY2FwYWJpbGl0eVxuICAgKiBcbiAgICogQHBhcmFtIHN5c3RlbVJvbGUgLSBVc2VyJ3Mgc3lzdGVtIHJvbGVcbiAgICogQHBhcmFtIGNhcGFiaWxpdHkgLSBDYXBhYmlsaXR5IHRvIGNoZWNrXG4gICAqIEByZXR1cm5zIFRydWUgaWYgcm9sZSBncmFudHMgY2FwYWJpbGl0eVxuICAgKi9cbiAgaGFzQ2FwYWJpbGl0eShzeXN0ZW1Sb2xlOiBTeXN0ZW1Sb2xlLCBjYXBhYmlsaXR5OiBTeXN0ZW1DYXBhYmlsaXR5KTogYm9vbGVhbiB7XG4gICAgY29uc3Qgcm9sZUNhcGFiaWxpdGllcyA9IHRoaXMuZ2V0Q2FwYWJpbGl0aWVzRm9yUm9sZShzeXN0ZW1Sb2xlKTtcbiAgICByZXR1cm4gcm9sZUNhcGFiaWxpdGllcy5pbmNsdWRlcyhjYXBhYmlsaXR5KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhbGwgY2FwYWJpbGl0aWVzIGZvciBhIHN5c3RlbSByb2xlXG4gICAqIFxuICAgKiBAcGFyYW0gc3lzdGVtUm9sZSAtIFN5c3RlbSByb2xlXG4gICAqIEByZXR1cm5zIEFycmF5IG9mIGNhcGFiaWxpdGllc1xuICAgKi9cbiAgcHJpdmF0ZSBnZXRDYXBhYmlsaXRpZXNGb3JSb2xlKHN5c3RlbVJvbGU6IFN5c3RlbVJvbGUpOiBTeXN0ZW1DYXBhYmlsaXR5W10ge1xuICAgIHJldHVybiBDQVBBQklMSVRZX01BVFJJWFtzeXN0ZW1Sb2xlXSB8fCBbXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoYXQgYSBjYXBhYmlsaXR5IGV4aXN0cyBpbiB0aGUgc3lzdGVtXG4gICAqIFxuICAgKiBAcGFyYW0gY2FwYWJpbGl0eSAtIENhcGFiaWxpdHkgdG8gdmFsaWRhdGVcbiAgICogQHJldHVybnMgVHJ1ZSBpZiBjYXBhYmlsaXR5IGlzIHZhbGlkXG4gICAqL1xuICBpc1ZhbGlkQ2FwYWJpbGl0eShjYXBhYmlsaXR5OiBzdHJpbmcpOiBjYXBhYmlsaXR5IGlzIFN5c3RlbUNhcGFiaWxpdHkge1xuICAgIHJldHVybiBPYmplY3QudmFsdWVzKFN5c3RlbUNhcGFiaWxpdHkpLmluY2x1ZGVzKGNhcGFiaWxpdHkgYXMgU3lzdGVtQ2FwYWJpbGl0eSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYWxsIGF2YWlsYWJsZSBzeXN0ZW0gY2FwYWJpbGl0aWVzXG4gICAqIFxuICAgKiBAcmV0dXJucyBBcnJheSBvZiBhbGwgc3lzdGVtIGNhcGFiaWxpdGllc1xuICAgKi9cbiAgZ2V0QWxsQ2FwYWJpbGl0aWVzKCk6IFN5c3RlbUNhcGFiaWxpdHlbXSB7XG4gICAgcmV0dXJuIE9iamVjdC52YWx1ZXMoU3lzdGVtQ2FwYWJpbGl0eSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgY2FwYWJpbGl0eSBtYXRyaXggZm9yIGRlYnVnZ2luZy9kb2N1bWVudGF0aW9uXG4gICAqIFxuICAgKiBAcmV0dXJucyBDb21wbGV0ZSBjYXBhYmlsaXR5IG1hdHJpeFxuICAgKi9cbiAgZ2V0Q2FwYWJpbGl0eU1hdHJpeCgpOiBSZWNvcmQ8U3lzdGVtUm9sZSwgU3lzdGVtQ2FwYWJpbGl0eVtdPiB7XG4gICAgcmV0dXJuIHsgLi4uQ0FQQUJJTElUWV9NQVRSSVggfTtcbiAgfVxufSJdfQ==