"use strict";
/**
 * User Service - Phase 1.2
 *
 * Business logic service for user operations as defined in the
 * canonical Phase 1.2 specification.
 *
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 * - Domain Model: .kiro/specs/domain.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const errors_1 = require("../../../shared/utils/errors");
const validation_1 = require("../../../shared/utils/validation");
const user_1 = require("./user");
const authorization_1 = require("../../../shared/authorization");
/**
 * User service for business logic operations
 */
class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    /**
     * Get current user profile (lazy creation)
     *
     * @param authContext - Authentication context
     * @returns User profile
     */
    async getCurrentUser(authContext) {
        if (!authContext.isAuthenticated) {
            throw new errors_1.AuthenticationError('Authentication required');
        }
        // Try to get existing user
        let user = await this.userRepository.getUserById(authContext.userId);
        // Create user lazily if not found
        if (!user) {
            const createInput = {
                id: authContext.userId,
                email: authContext.email,
            };
            user = await this.userRepository.createUser(createInput);
        }
        return user;
    }
    /**
     * Get user by ID
     *
     * @param userId - User ID
     * @param authContext - Authentication context
     * @returns User profile
     */
    async getUserById(userId, authContext) {
        if (!authContext.isAuthenticated) {
            throw new errors_1.AuthenticationError('Authentication required');
        }
        // Authorization is now handled by the Lambda handler using the authorization service
        // This method assumes authorization has already been validated
        const user = await this.userRepository.getUserById(userId);
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        return user;
    }
    /**
     * Update user profile
     *
     * @param userId - User ID
     * @param input - Update input
     * @param authContext - Authentication context
     * @returns Updated user profile
     */
    async updateUser(userId, input, authContext) {
        if (!authContext.isAuthenticated) {
            throw new errors_1.AuthenticationError('Authentication required');
        }
        // Get existing user
        const existingUser = await this.userRepository.getUserById(userId);
        if (!existingUser) {
            throw new errors_1.NotFoundError('User not found');
        }
        const userEntity = (0, user_1.fromUserData)(existingUser);
        // Check if user can modify this profile
        if (!userEntity.canModifyUser(userId) && !authContext.isSiteAdmin) {
            throw new errors_1.AuthorizationError('Cannot modify this user profile');
        }
        // Check if user can modify system role using the new authorization service
        const canModifySystemRole = await (0, authorization_1.hasCapability)(authContext, authorization_1.SystemCapability.MANAGE_PLATFORM);
        // If trying to modify system role without permission, throw authorization error
        if (input.systemRole && !canModifySystemRole) {
            throw new authorization_1.InsufficientPrivilegesError(authorization_1.SystemCapability.MANAGE_PLATFORM, authContext.userId, `user:${userId}`);
        }
        // Validate input
        (0, validation_1.validateUpdateUserInput)(input, canModifySystemRole);
        // Update user through domain entity
        const updatedEntity = userEntity.update(input, canModifySystemRole);
        // Persist changes
        return await this.userRepository.updateUser(userId, {
            displayName: updatedEntity.displayName,
            avatarUrl: updatedEntity.avatarUrl,
            systemRole: updatedEntity.systemRole,
        });
    }
    /**
     * Check if user exists
     *
     * @param userId - User ID
     * @returns True if user exists
     */
    async userExists(userId) {
        return await this.userRepository.userExists(userId);
    }
}
exports.UserService = UserService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlci1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidXNlci1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7O0dBU0c7OztBQUlILHlEQUF1SDtBQUN2SCxpRUFBMkU7QUFFM0UsaUNBQThEO0FBQzlELGlFQUl1QztBQUV2Qzs7R0FFRztBQUNILE1BQWEsV0FBVztJQUN0QixZQUE2QixjQUErQjtRQUEvQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7SUFBRyxDQUFDO0lBRWhFOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLGNBQWMsQ0FBQyxXQUF3QjtRQUMzQyxJQUFJLENBQUMsV0FBVyxDQUFDLGVBQWUsRUFBRTtZQUNoQyxNQUFNLElBQUksNEJBQW1CLENBQUMseUJBQXlCLENBQUMsQ0FBQztTQUMxRDtRQUVELDJCQUEyQjtRQUMzQixJQUFJLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUVyRSxrQ0FBa0M7UUFDbEMsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNULE1BQU0sV0FBVyxHQUFvQjtnQkFDbkMsRUFBRSxFQUFFLFdBQVcsQ0FBQyxNQUFNO2dCQUN0QixLQUFLLEVBQUUsV0FBVyxDQUFDLEtBQUs7YUFDekIsQ0FBQztZQUVGLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQzFEO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFjLEVBQUUsV0FBd0I7UUFDeEQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFlLEVBQUU7WUFDaEMsTUFBTSxJQUFJLDRCQUFtQixDQUFDLHlCQUF5QixDQUFDLENBQUM7U0FDMUQ7UUFFRCxxRkFBcUY7UUFDckYsK0RBQStEO1FBRS9ELE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFM0QsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNULE1BQU0sSUFBSSxzQkFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7U0FDM0M7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFjLEVBQUUsS0FBc0IsRUFBRSxXQUF3QjtRQUMvRSxJQUFJLENBQUMsV0FBVyxDQUFDLGVBQWUsRUFBRTtZQUNoQyxNQUFNLElBQUksNEJBQW1CLENBQUMseUJBQXlCLENBQUMsQ0FBQztTQUMxRDtRQUVELG9CQUFvQjtRQUNwQixNQUFNLFlBQVksR0FBRyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRW5FLElBQUksQ0FBQyxZQUFZLEVBQUU7WUFDakIsTUFBTSxJQUFJLHNCQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztTQUMzQztRQUVELE1BQU0sVUFBVSxHQUFHLElBQUEsbUJBQVksRUFBQyxZQUFZLENBQUMsQ0FBQztRQUU5Qyx3Q0FBd0M7UUFDeEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFO1lBQ2pFLE1BQU0sSUFBSSwyQkFBa0IsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1NBQ2pFO1FBRUQsMkVBQTJFO1FBQzNFLE1BQU0sbUJBQW1CLEdBQUcsTUFBTSxJQUFBLDZCQUFhLEVBQUMsV0FBVyxFQUFFLGdDQUFnQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBRS9GLGdGQUFnRjtRQUNoRixJQUFJLEtBQUssQ0FBQyxVQUFVLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtZQUM1QyxNQUFNLElBQUksMkNBQTJCLENBQUMsZ0NBQWdCLENBQUMsZUFBZSxFQUFFLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1NBQy9HO1FBRUQsaUJBQWlCO1FBQ2pCLElBQUEsb0NBQXVCLEVBQUMsS0FBSyxFQUFFLG1CQUFtQixDQUFDLENBQUM7UUFFcEQsb0NBQW9DO1FBQ3BDLE1BQU0sYUFBYSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLG1CQUFtQixDQUFDLENBQUM7UUFFcEUsa0JBQWtCO1FBQ2xCLE9BQU8sTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUU7WUFDbEQsV0FBVyxFQUFFLGFBQWEsQ0FBQyxXQUFXO1lBQ3RDLFNBQVMsRUFBRSxhQUFhLENBQUMsU0FBUztZQUNsQyxVQUFVLEVBQUUsYUFBYSxDQUFDLFVBQVU7U0FDckMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFjO1FBQzdCLE9BQU8sTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN0RCxDQUFDO0NBQ0Y7QUFoSEQsa0NBZ0hDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBVc2VyIFNlcnZpY2UgLSBQaGFzZSAxLjJcbiAqIFxuICogQnVzaW5lc3MgbG9naWMgc2VydmljZSBmb3IgdXNlciBvcGVyYXRpb25zIGFzIGRlZmluZWQgaW4gdGhlXG4gKiBjYW5vbmljYWwgUGhhc2UgMS4yIHNwZWNpZmljYXRpb24uXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDEuMiBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0xLjIudXNlci1wcm9maWxlLnYxLm1kXG4gKiAtIERvbWFpbiBNb2RlbDogLmtpcm8vc3BlY3MvZG9tYWluLnYxLm1kXG4gKi9cblxuaW1wb3J0IHsgVXNlciwgQ3JlYXRlVXNlcklucHV0LCBVcGRhdGVVc2VySW5wdXQgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdHlwZXMvdXNlcic7XG5pbXBvcnQgeyBBdXRoQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC90eXBlcy9hdXRoJztcbmltcG9ydCB7IEF1dGhlbnRpY2F0aW9uRXJyb3IsIEF1dGhvcml6YXRpb25FcnJvciwgTm90Rm91bmRFcnJvciwgVmFsaWRhdGlvbkVycm9yIH0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2Vycm9ycyc7XG5pbXBvcnQgeyB2YWxpZGF0ZVVwZGF0ZVVzZXJJbnB1dCB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC91dGlscy92YWxpZGF0aW9uJztcbmltcG9ydCB7IElVc2VyUmVwb3NpdG9yeSB9IGZyb20gJy4vdXNlci1yZXBvc2l0b3J5JztcbmltcG9ydCB7IFVzZXJFbnRpdHksIGNyZWF0ZVVzZXIsIGZyb21Vc2VyRGF0YSB9IGZyb20gJy4vdXNlcic7XG5pbXBvcnQgeyBcbiAgU3lzdGVtQ2FwYWJpbGl0eSwgXG4gIGhhc0NhcGFiaWxpdHksXG4gIEluc3VmZmljaWVudFByaXZpbGVnZXNFcnJvciBcbn0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL2F1dGhvcml6YXRpb24nO1xuXG4vKipcbiAqIFVzZXIgc2VydmljZSBmb3IgYnVzaW5lc3MgbG9naWMgb3BlcmF0aW9uc1xuICovXG5leHBvcnQgY2xhc3MgVXNlclNlcnZpY2Uge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHVzZXJSZXBvc2l0b3J5OiBJVXNlclJlcG9zaXRvcnkpIHt9XG4gIFxuICAvKipcbiAgICogR2V0IGN1cnJlbnQgdXNlciBwcm9maWxlIChsYXp5IGNyZWF0aW9uKVxuICAgKiBcbiAgICogQHBhcmFtIGF1dGhDb250ZXh0IC0gQXV0aGVudGljYXRpb24gY29udGV4dFxuICAgKiBAcmV0dXJucyBVc2VyIHByb2ZpbGVcbiAgICovXG4gIGFzeW5jIGdldEN1cnJlbnRVc2VyKGF1dGhDb250ZXh0OiBBdXRoQ29udGV4dCk6IFByb21pc2U8VXNlcj4ge1xuICAgIGlmICghYXV0aENvbnRleHQuaXNBdXRoZW50aWNhdGVkKSB7XG4gICAgICB0aHJvdyBuZXcgQXV0aGVudGljYXRpb25FcnJvcignQXV0aGVudGljYXRpb24gcmVxdWlyZWQnKTtcbiAgICB9XG4gICAgXG4gICAgLy8gVHJ5IHRvIGdldCBleGlzdGluZyB1c2VyXG4gICAgbGV0IHVzZXIgPSBhd2FpdCB0aGlzLnVzZXJSZXBvc2l0b3J5LmdldFVzZXJCeUlkKGF1dGhDb250ZXh0LnVzZXJJZCk7XG4gICAgXG4gICAgLy8gQ3JlYXRlIHVzZXIgbGF6aWx5IGlmIG5vdCBmb3VuZFxuICAgIGlmICghdXNlcikge1xuICAgICAgY29uc3QgY3JlYXRlSW5wdXQ6IENyZWF0ZVVzZXJJbnB1dCA9IHtcbiAgICAgICAgaWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgICAgZW1haWw6IGF1dGhDb250ZXh0LmVtYWlsLFxuICAgICAgfTtcbiAgICAgIFxuICAgICAgdXNlciA9IGF3YWl0IHRoaXMudXNlclJlcG9zaXRvcnkuY3JlYXRlVXNlcihjcmVhdGVJbnB1dCk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB1c2VyO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHVzZXIgYnkgSURcbiAgICogXG4gICAqIEBwYXJhbSB1c2VySWQgLSBVc2VyIElEXG4gICAqIEBwYXJhbSBhdXRoQ29udGV4dCAtIEF1dGhlbnRpY2F0aW9uIGNvbnRleHRcbiAgICogQHJldHVybnMgVXNlciBwcm9maWxlXG4gICAqL1xuICBhc3luYyBnZXRVc2VyQnlJZCh1c2VySWQ6IHN0cmluZywgYXV0aENvbnRleHQ6IEF1dGhDb250ZXh0KTogUHJvbWlzZTxVc2VyPiB7XG4gICAgaWYgKCFhdXRoQ29udGV4dC5pc0F1dGhlbnRpY2F0ZWQpIHtcbiAgICAgIHRocm93IG5ldyBBdXRoZW50aWNhdGlvbkVycm9yKCdBdXRoZW50aWNhdGlvbiByZXF1aXJlZCcpO1xuICAgIH1cbiAgICBcbiAgICAvLyBBdXRob3JpemF0aW9uIGlzIG5vdyBoYW5kbGVkIGJ5IHRoZSBMYW1iZGEgaGFuZGxlciB1c2luZyB0aGUgYXV0aG9yaXphdGlvbiBzZXJ2aWNlXG4gICAgLy8gVGhpcyBtZXRob2QgYXNzdW1lcyBhdXRob3JpemF0aW9uIGhhcyBhbHJlYWR5IGJlZW4gdmFsaWRhdGVkXG4gICAgXG4gICAgY29uc3QgdXNlciA9IGF3YWl0IHRoaXMudXNlclJlcG9zaXRvcnkuZ2V0VXNlckJ5SWQodXNlcklkKTtcbiAgICBcbiAgICBpZiAoIXVzZXIpIHtcbiAgICAgIHRocm93IG5ldyBOb3RGb3VuZEVycm9yKCdVc2VyIG5vdCBmb3VuZCcpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdXNlcjtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFVwZGF0ZSB1c2VyIHByb2ZpbGVcbiAgICogXG4gICAqIEBwYXJhbSB1c2VySWQgLSBVc2VyIElEXG4gICAqIEBwYXJhbSBpbnB1dCAtIFVwZGF0ZSBpbnB1dFxuICAgKiBAcGFyYW0gYXV0aENvbnRleHQgLSBBdXRoZW50aWNhdGlvbiBjb250ZXh0XG4gICAqIEByZXR1cm5zIFVwZGF0ZWQgdXNlciBwcm9maWxlXG4gICAqL1xuICBhc3luYyB1cGRhdGVVc2VyKHVzZXJJZDogc3RyaW5nLCBpbnB1dDogVXBkYXRlVXNlcklucHV0LCBhdXRoQ29udGV4dDogQXV0aENvbnRleHQpOiBQcm9taXNlPFVzZXI+IHtcbiAgICBpZiAoIWF1dGhDb250ZXh0LmlzQXV0aGVudGljYXRlZCkge1xuICAgICAgdGhyb3cgbmV3IEF1dGhlbnRpY2F0aW9uRXJyb3IoJ0F1dGhlbnRpY2F0aW9uIHJlcXVpcmVkJyk7XG4gICAgfVxuICAgIFxuICAgIC8vIEdldCBleGlzdGluZyB1c2VyXG4gICAgY29uc3QgZXhpc3RpbmdVc2VyID0gYXdhaXQgdGhpcy51c2VyUmVwb3NpdG9yeS5nZXRVc2VyQnlJZCh1c2VySWQpO1xuICAgIFxuICAgIGlmICghZXhpc3RpbmdVc2VyKSB7XG4gICAgICB0aHJvdyBuZXcgTm90Rm91bmRFcnJvcignVXNlciBub3QgZm91bmQnKTtcbiAgICB9XG4gICAgXG4gICAgY29uc3QgdXNlckVudGl0eSA9IGZyb21Vc2VyRGF0YShleGlzdGluZ1VzZXIpO1xuICAgIFxuICAgIC8vIENoZWNrIGlmIHVzZXIgY2FuIG1vZGlmeSB0aGlzIHByb2ZpbGVcbiAgICBpZiAoIXVzZXJFbnRpdHkuY2FuTW9kaWZ5VXNlcih1c2VySWQpICYmICFhdXRoQ29udGV4dC5pc1NpdGVBZG1pbikge1xuICAgICAgdGhyb3cgbmV3IEF1dGhvcml6YXRpb25FcnJvcignQ2Fubm90IG1vZGlmeSB0aGlzIHVzZXIgcHJvZmlsZScpO1xuICAgIH1cbiAgICBcbiAgICAvLyBDaGVjayBpZiB1c2VyIGNhbiBtb2RpZnkgc3lzdGVtIHJvbGUgdXNpbmcgdGhlIG5ldyBhdXRob3JpemF0aW9uIHNlcnZpY2VcbiAgICBjb25zdCBjYW5Nb2RpZnlTeXN0ZW1Sb2xlID0gYXdhaXQgaGFzQ2FwYWJpbGl0eShhdXRoQ29udGV4dCwgU3lzdGVtQ2FwYWJpbGl0eS5NQU5BR0VfUExBVEZPUk0pO1xuICAgIFxuICAgIC8vIElmIHRyeWluZyB0byBtb2RpZnkgc3lzdGVtIHJvbGUgd2l0aG91dCBwZXJtaXNzaW9uLCB0aHJvdyBhdXRob3JpemF0aW9uIGVycm9yXG4gICAgaWYgKGlucHV0LnN5c3RlbVJvbGUgJiYgIWNhbk1vZGlmeVN5c3RlbVJvbGUpIHtcbiAgICAgIHRocm93IG5ldyBJbnN1ZmZpY2llbnRQcml2aWxlZ2VzRXJyb3IoU3lzdGVtQ2FwYWJpbGl0eS5NQU5BR0VfUExBVEZPUk0sIGF1dGhDb250ZXh0LnVzZXJJZCwgYHVzZXI6JHt1c2VySWR9YCk7XG4gICAgfVxuICAgIFxuICAgIC8vIFZhbGlkYXRlIGlucHV0XG4gICAgdmFsaWRhdGVVcGRhdGVVc2VySW5wdXQoaW5wdXQsIGNhbk1vZGlmeVN5c3RlbVJvbGUpO1xuICAgIFxuICAgIC8vIFVwZGF0ZSB1c2VyIHRocm91Z2ggZG9tYWluIGVudGl0eVxuICAgIGNvbnN0IHVwZGF0ZWRFbnRpdHkgPSB1c2VyRW50aXR5LnVwZGF0ZShpbnB1dCwgY2FuTW9kaWZ5U3lzdGVtUm9sZSk7XG4gICAgXG4gICAgLy8gUGVyc2lzdCBjaGFuZ2VzXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudXNlclJlcG9zaXRvcnkudXBkYXRlVXNlcih1c2VySWQsIHtcbiAgICAgIGRpc3BsYXlOYW1lOiB1cGRhdGVkRW50aXR5LmRpc3BsYXlOYW1lLFxuICAgICAgYXZhdGFyVXJsOiB1cGRhdGVkRW50aXR5LmF2YXRhclVybCxcbiAgICAgIHN5c3RlbVJvbGU6IHVwZGF0ZWRFbnRpdHkuc3lzdGVtUm9sZSxcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENoZWNrIGlmIHVzZXIgZXhpc3RzXG4gICAqIFxuICAgKiBAcGFyYW0gdXNlcklkIC0gVXNlciBJRFxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHVzZXIgZXhpc3RzXG4gICAqL1xuICBhc3luYyB1c2VyRXhpc3RzKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudXNlclJlcG9zaXRvcnkudXNlckV4aXN0cyh1c2VySWQpO1xuICB9XG59Il19