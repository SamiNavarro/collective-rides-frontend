"use strict";
/**
 * Authorization Middleware Tests - Phase 1.3
 *
 * Unit tests for authorization middleware and utilities.
 * Tests middleware functions, decorators, and utility functions.
 *
 * Compliance:
 * - Phase 1.3 Spec: .kiro/specs/phase-1.3.authorization.foundation.v1.md
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const authorization_middleware_1 = require("../authorization-middleware");
const types_1 = require("../types");
const user_1 = require("../../types/user");
const authorization_errors_1 = require("../authorization-errors");
describe('Authorization Middleware', () => {
    const adminAuthContext = {
        userId: 'test-admin',
        email: 'admin@example.com',
        systemRole: user_1.SystemRole.SITE_ADMIN,
        isAuthenticated: true,
        isSiteAdmin: true,
    };
    const userAuthContext = {
        userId: 'test-user',
        email: 'user@example.com',
        systemRole: user_1.SystemRole.USER,
        isAuthenticated: true,
        isSiteAdmin: false,
    };
    describe('requireCapability', () => {
        it('should allow SiteAdmin with required capability', async () => {
            const middleware = (0, authorization_middleware_1.requireCapability)(types_1.SystemCapability.MANAGE_PLATFORM);
            await expect(middleware(adminAuthContext)).resolves.not.toThrow();
        });
        it('should deny regular user without required capability', async () => {
            const middleware = (0, authorization_middleware_1.requireCapability)(types_1.SystemCapability.MANAGE_PLATFORM);
            await expect(middleware(userAuthContext)).rejects.toThrow(authorization_errors_1.InsufficientPrivilegesError);
        });
        it('should include resource in error', async () => {
            const middleware = (0, authorization_middleware_1.requireCapability)(types_1.SystemCapability.MANAGE_PLATFORM, 'user:123');
            try {
                await middleware(userAuthContext);
                fail('Expected InsufficientPrivilegesError');
            }
            catch (error) {
                expect(error).toBeInstanceOf(authorization_errors_1.InsufficientPrivilegesError);
                expect(error.resource).toBe('user:123');
            }
        });
    });
    describe('requirePlatformManagement', () => {
        it('should allow SiteAdmin', async () => {
            await expect((0, authorization_middleware_1.requirePlatformManagement)(adminAuthContext)).resolves.not.toThrow();
        });
        it('should deny regular user', async () => {
            await expect((0, authorization_middleware_1.requirePlatformManagement)(userAuthContext)).rejects.toThrow(authorization_errors_1.InsufficientPrivilegesError);
        });
    });
    describe('requireClubManagement', () => {
        it('should allow SiteAdmin', async () => {
            await expect((0, authorization_middleware_1.requireClubManagement)(adminAuthContext)).resolves.not.toThrow();
        });
        it('should deny regular user', async () => {
            await expect((0, authorization_middleware_1.requireClubManagement)(userAuthContext)).rejects.toThrow(authorization_errors_1.InsufficientPrivilegesError);
        });
    });
    describe('Authorize decorator', () => {
        class TestService {
            async adminMethod(data, authContext) {
                return 'success';
            }
            async adminMethodWithResource(data, authContext) {
                return 'success';
            }
        }
        __decorate([
            (0, authorization_middleware_1.Authorize)(types_1.SystemCapability.MANAGE_PLATFORM)
        ], TestService.prototype, "adminMethod", null);
        __decorate([
            (0, authorization_middleware_1.Authorize)(types_1.SystemCapability.MANAGE_PLATFORM, (data, authContext) => `user:${data.userId}`)
        ], TestService.prototype, "adminMethodWithResource", null);
        let service;
        beforeEach(() => {
            service = new TestService();
        });
        it('should allow authorized user', async () => {
            const result = await service.adminMethod({ test: 'data' }, adminAuthContext);
            expect(result).toBe('success');
        });
        it('should deny unauthorized user', async () => {
            await expect(service.adminMethod({ test: 'data' }, userAuthContext)).rejects.toThrow(authorization_errors_1.InsufficientPrivilegesError);
        });
        it('should extract resource from arguments', async () => {
            const result = await service.adminMethodWithResource({ userId: '123' }, adminAuthContext);
            expect(result).toBe('success');
        });
        it('should throw error if AuthContext not found', async () => {
            await expect(service.adminMethod({ test: 'data' })).rejects.toThrow('AuthContext not found in method arguments');
        });
    });
    describe('hasCapability', () => {
        it('should return true for SiteAdmin with platform capability', async () => {
            const result = await (0, authorization_middleware_1.hasCapability)(adminAuthContext, types_1.SystemCapability.MANAGE_PLATFORM);
            expect(result).toBe(true);
        });
        it('should return false for regular user with platform capability', async () => {
            const result = await (0, authorization_middleware_1.hasCapability)(userAuthContext, types_1.SystemCapability.MANAGE_PLATFORM);
            expect(result).toBe(false);
        });
    });
    describe('authorizeRequest', () => {
        it('should allow user with any required capability', async () => {
            await expect((0, authorization_middleware_1.authorizeRequest)(adminAuthContext, [types_1.SystemCapability.MANAGE_PLATFORM, types_1.SystemCapability.MANAGE_ALL_CLUBS])).resolves.not.toThrow();
        });
        it('should deny user without any required capability', async () => {
            await expect((0, authorization_middleware_1.authorizeRequest)(userAuthContext, [types_1.SystemCapability.MANAGE_PLATFORM, types_1.SystemCapability.MANAGE_ALL_CLUBS])).rejects.toThrow(authorization_errors_1.InsufficientPrivilegesError);
        });
        it('should allow request with no required capabilities', async () => {
            await expect((0, authorization_middleware_1.authorizeRequest)(userAuthContext, [])).resolves.not.toThrow();
        });
    });
    describe('authorizeIf', () => {
        it('should check authorization when condition is true', async () => {
            await expect((0, authorization_middleware_1.authorizeIf)(true, userAuthContext, types_1.SystemCapability.MANAGE_PLATFORM)).rejects.toThrow(authorization_errors_1.InsufficientPrivilegesError);
        });
        it('should skip authorization when condition is false', async () => {
            await expect((0, authorization_middleware_1.authorizeIf)(false, userAuthContext, types_1.SystemCapability.MANAGE_PLATFORM)).resolves.not.toThrow();
        });
    });
    describe('validateAuthContext', () => {
        it('should validate correct auth context', () => {
            expect(() => (0, authorization_middleware_1.validateAuthContext)(adminAuthContext)).not.toThrow();
        });
        it('should throw error for null context', () => {
            expect(() => (0, authorization_middleware_1.validateAuthContext)(null)).toThrow('AuthContext is required');
        });
        it('should throw error for unauthenticated user', () => {
            const unauthenticatedContext = { ...adminAuthContext, isAuthenticated: false };
            expect(() => (0, authorization_middleware_1.validateAuthContext)(unauthenticatedContext)).toThrow('User must be authenticated');
        });
        it('should throw error for missing user ID', () => {
            const contextWithoutUserId = { ...adminAuthContext, userId: '' };
            expect(() => (0, authorization_middleware_1.validateAuthContext)(contextWithoutUserId)).toThrow('User ID is required');
        });
        it('should throw error for missing system role', () => {
            const contextWithoutRole = { ...adminAuthContext, systemRole: null };
            expect(() => (0, authorization_middleware_1.validateAuthContext)(contextWithoutRole)).toThrow('System role is required');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aG9yaXphdGlvbi1taWRkbGV3YXJlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhdXRob3JpemF0aW9uLW1pZGRsZXdhcmUudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7Ozs7Ozs7O0FBRUgsMEVBU3FDO0FBQ3JDLG9DQUE0QztBQUM1QywyQ0FBOEM7QUFFOUMsa0VBQXNFO0FBRXRFLFFBQVEsQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7SUFDeEMsTUFBTSxnQkFBZ0IsR0FBZ0I7UUFDcEMsTUFBTSxFQUFFLFlBQVk7UUFDcEIsS0FBSyxFQUFFLG1CQUFtQjtRQUMxQixVQUFVLEVBQUUsaUJBQVUsQ0FBQyxVQUFVO1FBQ2pDLGVBQWUsRUFBRSxJQUFJO1FBQ3JCLFdBQVcsRUFBRSxJQUFJO0tBQ2xCLENBQUM7SUFFRixNQUFNLGVBQWUsR0FBZ0I7UUFDbkMsTUFBTSxFQUFFLFdBQVc7UUFDbkIsS0FBSyxFQUFFLGtCQUFrQjtRQUN6QixVQUFVLEVBQUUsaUJBQVUsQ0FBQyxJQUFJO1FBQzNCLGVBQWUsRUFBRSxJQUFJO1FBQ3JCLFdBQVcsRUFBRSxLQUFLO0tBQ25CLENBQUM7SUFFRixRQUFRLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1FBQ2pDLEVBQUUsQ0FBQyxpREFBaUQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMvRCxNQUFNLFVBQVUsR0FBRyxJQUFBLDRDQUFpQixFQUFDLHdCQUFnQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBRXZFLE1BQU0sTUFBTSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNwRSxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxzREFBc0QsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNwRSxNQUFNLFVBQVUsR0FBRyxJQUFBLDRDQUFpQixFQUFDLHdCQUFnQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBRXZFLE1BQU0sTUFBTSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsa0RBQTJCLENBQUMsQ0FBQztRQUN6RixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxrQ0FBa0MsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNoRCxNQUFNLFVBQVUsR0FBRyxJQUFBLDRDQUFpQixFQUFDLHdCQUFnQixDQUFDLGVBQWUsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUVuRixJQUFJO2dCQUNGLE1BQU0sVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUNsQyxJQUFJLENBQUMsc0NBQXNDLENBQUMsQ0FBQzthQUM5QztZQUFDLE9BQU8sS0FBSyxFQUFFO2dCQUNkLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxjQUFjLENBQUMsa0RBQTJCLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxDQUFFLEtBQXFDLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQzFFO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQywyQkFBMkIsRUFBRSxHQUFHLEVBQUU7UUFDekMsRUFBRSxDQUFDLHdCQUF3QixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3RDLE1BQU0sTUFBTSxDQUFDLElBQUEsb0RBQXlCLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbkYsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsMEJBQTBCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDeEMsTUFBTSxNQUFNLENBQUMsSUFBQSxvREFBeUIsRUFBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsa0RBQTJCLENBQUMsQ0FBQztRQUN4RyxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRTtRQUNyQyxFQUFFLENBQUMsd0JBQXdCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdEMsTUFBTSxNQUFNLENBQUMsSUFBQSxnREFBcUIsRUFBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMvRSxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQywwQkFBMEIsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN4QyxNQUFNLE1BQU0sQ0FBQyxJQUFBLGdEQUFxQixFQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxrREFBMkIsQ0FBQyxDQUFDO1FBQ3BHLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO1FBQ25DLE1BQU0sV0FBVztZQUVULEFBQU4sS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFTLEVBQUUsV0FBd0I7Z0JBQ25ELE9BQU8sU0FBUyxDQUFDO1lBQ25CLENBQUM7WUFHSyxBQUFOLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxJQUF3QixFQUFFLFdBQXdCO2dCQUM5RSxPQUFPLFNBQVMsQ0FBQztZQUNuQixDQUFDO1NBQ0Y7UUFSTztZQURMLElBQUEsb0NBQVMsRUFBQyx3QkFBZ0IsQ0FBQyxlQUFlLENBQUM7c0RBRzNDO1FBR0s7WUFETCxJQUFBLG9DQUFTLEVBQUMsd0JBQWdCLENBQUMsZUFBZSxFQUFFLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRSxFQUFFLENBQUMsUUFBUSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7a0VBR3pGO1FBR0gsSUFBSSxPQUFvQixDQUFDO1FBRXpCLFVBQVUsQ0FBQyxHQUFHLEVBQUU7WUFDZCxPQUFPLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQztRQUM5QixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw4QkFBOEIsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM1QyxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUM3RSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ2pDLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLCtCQUErQixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzdDLE1BQU0sTUFBTSxDQUNWLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUUsZUFBZSxDQUFDLENBQ3ZELENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxrREFBMkIsQ0FBQyxDQUFDO1FBQ2pELENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLHdDQUF3QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3RELE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTyxDQUFDLHVCQUF1QixDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDMUYsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNqQyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw2Q0FBNkMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMzRCxNQUFNLE1BQU0sQ0FDVCxPQUFlLENBQUMsV0FBVyxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQy9DLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQywyQ0FBMkMsQ0FBQyxDQUFDO1FBQ2pFLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtRQUM3QixFQUFFLENBQUMsMkRBQTJELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDekUsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHdDQUFhLEVBQUMsZ0JBQWdCLEVBQUUsd0JBQWdCLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDdkYsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1QixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQywrREFBK0QsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM3RSxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsd0NBQWEsRUFBQyxlQUFlLEVBQUUsd0JBQWdCLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDdEYsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM3QixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtRQUNoQyxFQUFFLENBQUMsZ0RBQWdELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDOUQsTUFBTSxNQUFNLENBQ1YsSUFBQSwyQ0FBZ0IsRUFBQyxnQkFBZ0IsRUFBRSxDQUFDLHdCQUFnQixDQUFDLGVBQWUsRUFBRSx3QkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQzFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMzQixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxrREFBa0QsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNoRSxNQUFNLE1BQU0sQ0FDVixJQUFBLDJDQUFnQixFQUFDLGVBQWUsRUFBRSxDQUFDLHdCQUFnQixDQUFDLGVBQWUsRUFBRSx3QkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQ3pHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxrREFBMkIsQ0FBQyxDQUFDO1FBQ2pELENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG9EQUFvRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2xFLE1BQU0sTUFBTSxDQUNWLElBQUEsMkNBQWdCLEVBQUMsZUFBZSxFQUFFLEVBQUUsQ0FBQyxDQUN0QyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0IsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFO1FBQzNCLEVBQUUsQ0FBQyxtREFBbUQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNqRSxNQUFNLE1BQU0sQ0FDVixJQUFBLHNDQUFXLEVBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRSx3QkFBZ0IsQ0FBQyxlQUFlLENBQUMsQ0FDckUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLGtEQUEyQixDQUFDLENBQUM7UUFDakQsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsbURBQW1ELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDakUsTUFBTSxNQUFNLENBQ1YsSUFBQSxzQ0FBVyxFQUFDLEtBQUssRUFBRSxlQUFlLEVBQUUsd0JBQWdCLENBQUMsZUFBZSxDQUFDLENBQ3RFLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMzQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtRQUNuQyxFQUFFLENBQUMsc0NBQXNDLEVBQUUsR0FBRyxFQUFFO1lBQzlDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFBLDhDQUFtQixFQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDcEUsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMscUNBQXFDLEVBQUUsR0FBRyxFQUFFO1lBQzdDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFBLDhDQUFtQixFQUFDLElBQVcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDcEYsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNkNBQTZDLEVBQUUsR0FBRyxFQUFFO1lBQ3JELE1BQU0sc0JBQXNCLEdBQUcsRUFBRSxHQUFHLGdCQUFnQixFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsQ0FBQztZQUMvRSxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBQSw4Q0FBbUIsRUFBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLDRCQUE0QixDQUFDLENBQUM7UUFDbEcsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsd0NBQXdDLEVBQUUsR0FBRyxFQUFFO1lBQ2hELE1BQU0sb0JBQW9CLEdBQUcsRUFBRSxHQUFHLGdCQUFnQixFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQztZQUNqRSxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBQSw4Q0FBbUIsRUFBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDekYsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNENBQTRDLEVBQUUsR0FBRyxFQUFFO1lBQ3BELE1BQU0sa0JBQWtCLEdBQUcsRUFBRSxHQUFHLGdCQUFnQixFQUFFLFVBQVUsRUFBRSxJQUFXLEVBQUUsQ0FBQztZQUM1RSxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBQSw4Q0FBbUIsRUFBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDM0YsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBdXRob3JpemF0aW9uIE1pZGRsZXdhcmUgVGVzdHMgLSBQaGFzZSAxLjNcbiAqIFxuICogVW5pdCB0ZXN0cyBmb3IgYXV0aG9yaXphdGlvbiBtaWRkbGV3YXJlIGFuZCB1dGlsaXRpZXMuXG4gKiBUZXN0cyBtaWRkbGV3YXJlIGZ1bmN0aW9ucywgZGVjb3JhdG9ycywgYW5kIHV0aWxpdHkgZnVuY3Rpb25zLlxuICogXG4gKiBDb21wbGlhbmNlOlxuICogLSBQaGFzZSAxLjMgU3BlYzogLmtpcm8vc3BlY3MvcGhhc2UtMS4zLmF1dGhvcml6YXRpb24uZm91bmRhdGlvbi52MS5tZFxuICovXG5cbmltcG9ydCB7XG4gIHJlcXVpcmVDYXBhYmlsaXR5LFxuICByZXF1aXJlUGxhdGZvcm1NYW5hZ2VtZW50LFxuICByZXF1aXJlQ2x1Yk1hbmFnZW1lbnQsXG4gIEF1dGhvcml6ZSxcbiAgaGFzQ2FwYWJpbGl0eSxcbiAgYXV0aG9yaXplUmVxdWVzdCxcbiAgYXV0aG9yaXplSWYsXG4gIHZhbGlkYXRlQXV0aENvbnRleHQsXG59IGZyb20gJy4uL2F1dGhvcml6YXRpb24tbWlkZGxld2FyZSc7XG5pbXBvcnQgeyBTeXN0ZW1DYXBhYmlsaXR5IH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgU3lzdGVtUm9sZSB9IGZyb20gJy4uLy4uL3R5cGVzL3VzZXInO1xuaW1wb3J0IHsgQXV0aENvbnRleHQgfSBmcm9tICcuLi8uLi90eXBlcy9hdXRoJztcbmltcG9ydCB7IEluc3VmZmljaWVudFByaXZpbGVnZXNFcnJvciB9IGZyb20gJy4uL2F1dGhvcml6YXRpb24tZXJyb3JzJztcblxuZGVzY3JpYmUoJ0F1dGhvcml6YXRpb24gTWlkZGxld2FyZScsICgpID0+IHtcbiAgY29uc3QgYWRtaW5BdXRoQ29udGV4dDogQXV0aENvbnRleHQgPSB7XG4gICAgdXNlcklkOiAndGVzdC1hZG1pbicsXG4gICAgZW1haWw6ICdhZG1pbkBleGFtcGxlLmNvbScsXG4gICAgc3lzdGVtUm9sZTogU3lzdGVtUm9sZS5TSVRFX0FETUlOLFxuICAgIGlzQXV0aGVudGljYXRlZDogdHJ1ZSxcbiAgICBpc1NpdGVBZG1pbjogdHJ1ZSxcbiAgfTtcblxuICBjb25zdCB1c2VyQXV0aENvbnRleHQ6IEF1dGhDb250ZXh0ID0ge1xuICAgIHVzZXJJZDogJ3Rlc3QtdXNlcicsXG4gICAgZW1haWw6ICd1c2VyQGV4YW1wbGUuY29tJyxcbiAgICBzeXN0ZW1Sb2xlOiBTeXN0ZW1Sb2xlLlVTRVIsXG4gICAgaXNBdXRoZW50aWNhdGVkOiB0cnVlLFxuICAgIGlzU2l0ZUFkbWluOiBmYWxzZSxcbiAgfTtcblxuICBkZXNjcmliZSgncmVxdWlyZUNhcGFiaWxpdHknLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBhbGxvdyBTaXRlQWRtaW4gd2l0aCByZXF1aXJlZCBjYXBhYmlsaXR5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbWlkZGxld2FyZSA9IHJlcXVpcmVDYXBhYmlsaXR5KFN5c3RlbUNhcGFiaWxpdHkuTUFOQUdFX1BMQVRGT1JNKTtcblxuICAgICAgYXdhaXQgZXhwZWN0KG1pZGRsZXdhcmUoYWRtaW5BdXRoQ29udGV4dCkpLnJlc29sdmVzLm5vdC50b1Rocm93KCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGRlbnkgcmVndWxhciB1c2VyIHdpdGhvdXQgcmVxdWlyZWQgY2FwYWJpbGl0eScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG1pZGRsZXdhcmUgPSByZXF1aXJlQ2FwYWJpbGl0eShTeXN0ZW1DYXBhYmlsaXR5Lk1BTkFHRV9QTEFURk9STSk7XG5cbiAgICAgIGF3YWl0IGV4cGVjdChtaWRkbGV3YXJlKHVzZXJBdXRoQ29udGV4dCkpLnJlamVjdHMudG9UaHJvdyhJbnN1ZmZpY2llbnRQcml2aWxlZ2VzRXJyb3IpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBpbmNsdWRlIHJlc291cmNlIGluIGVycm9yJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbWlkZGxld2FyZSA9IHJlcXVpcmVDYXBhYmlsaXR5KFN5c3RlbUNhcGFiaWxpdHkuTUFOQUdFX1BMQVRGT1JNLCAndXNlcjoxMjMnKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgbWlkZGxld2FyZSh1c2VyQXV0aENvbnRleHQpO1xuICAgICAgICBmYWlsKCdFeHBlY3RlZCBJbnN1ZmZpY2llbnRQcml2aWxlZ2VzRXJyb3InKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGV4cGVjdChlcnJvcikudG9CZUluc3RhbmNlT2YoSW5zdWZmaWNpZW50UHJpdmlsZWdlc0Vycm9yKTtcbiAgICAgICAgZXhwZWN0KChlcnJvciBhcyBJbnN1ZmZpY2llbnRQcml2aWxlZ2VzRXJyb3IpLnJlc291cmNlKS50b0JlKCd1c2VyOjEyMycpO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgncmVxdWlyZVBsYXRmb3JtTWFuYWdlbWVudCcsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGFsbG93IFNpdGVBZG1pbicsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IGV4cGVjdChyZXF1aXJlUGxhdGZvcm1NYW5hZ2VtZW50KGFkbWluQXV0aENvbnRleHQpKS5yZXNvbHZlcy5ub3QudG9UaHJvdygpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBkZW55IHJlZ3VsYXIgdXNlcicsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IGV4cGVjdChyZXF1aXJlUGxhdGZvcm1NYW5hZ2VtZW50KHVzZXJBdXRoQ29udGV4dCkpLnJlamVjdHMudG9UaHJvdyhJbnN1ZmZpY2llbnRQcml2aWxlZ2VzRXJyb3IpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgncmVxdWlyZUNsdWJNYW5hZ2VtZW50JywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgYWxsb3cgU2l0ZUFkbWluJywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgZXhwZWN0KHJlcXVpcmVDbHViTWFuYWdlbWVudChhZG1pbkF1dGhDb250ZXh0KSkucmVzb2x2ZXMubm90LnRvVGhyb3coKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZGVueSByZWd1bGFyIHVzZXInLCBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBleHBlY3QocmVxdWlyZUNsdWJNYW5hZ2VtZW50KHVzZXJBdXRoQ29udGV4dCkpLnJlamVjdHMudG9UaHJvdyhJbnN1ZmZpY2llbnRQcml2aWxlZ2VzRXJyb3IpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnQXV0aG9yaXplIGRlY29yYXRvcicsICgpID0+IHtcbiAgICBjbGFzcyBUZXN0U2VydmljZSB7XG4gICAgICBAQXV0aG9yaXplKFN5c3RlbUNhcGFiaWxpdHkuTUFOQUdFX1BMQVRGT1JNKVxuICAgICAgYXN5bmMgYWRtaW5NZXRob2QoZGF0YTogYW55LCBhdXRoQ29udGV4dDogQXV0aENvbnRleHQpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICByZXR1cm4gJ3N1Y2Nlc3MnO1xuICAgICAgfVxuXG4gICAgICBAQXV0aG9yaXplKFN5c3RlbUNhcGFiaWxpdHkuTUFOQUdFX1BMQVRGT1JNLCAoZGF0YSwgYXV0aENvbnRleHQpID0+IGB1c2VyOiR7ZGF0YS51c2VySWR9YClcbiAgICAgIGFzeW5jIGFkbWluTWV0aG9kV2l0aFJlc291cmNlKGRhdGE6IHsgdXNlcklkOiBzdHJpbmcgfSwgYXV0aENvbnRleHQ6IEF1dGhDb250ZXh0KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgcmV0dXJuICdzdWNjZXNzJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgc2VydmljZTogVGVzdFNlcnZpY2U7XG5cbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHNlcnZpY2UgPSBuZXcgVGVzdFNlcnZpY2UoKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWxsb3cgYXV0aG9yaXplZCB1c2VyJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VydmljZS5hZG1pbk1ldGhvZCh7IHRlc3Q6ICdkYXRhJyB9LCBhZG1pbkF1dGhDb250ZXh0KTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmUoJ3N1Y2Nlc3MnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZGVueSB1bmF1dGhvcml6ZWQgdXNlcicsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IGV4cGVjdChcbiAgICAgICAgc2VydmljZS5hZG1pbk1ldGhvZCh7IHRlc3Q6ICdkYXRhJyB9LCB1c2VyQXV0aENvbnRleHQpXG4gICAgICApLnJlamVjdHMudG9UaHJvdyhJbnN1ZmZpY2llbnRQcml2aWxlZ2VzRXJyb3IpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBleHRyYWN0IHJlc291cmNlIGZyb20gYXJndW1lbnRzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VydmljZS5hZG1pbk1ldGhvZFdpdGhSZXNvdXJjZSh7IHVzZXJJZDogJzEyMycgfSwgYWRtaW5BdXRoQ29udGV4dCk7XG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlKCdzdWNjZXNzJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHRocm93IGVycm9yIGlmIEF1dGhDb250ZXh0IG5vdCBmb3VuZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IGV4cGVjdChcbiAgICAgICAgKHNlcnZpY2UgYXMgYW55KS5hZG1pbk1ldGhvZCh7IHRlc3Q6ICdkYXRhJyB9KVxuICAgICAgKS5yZWplY3RzLnRvVGhyb3coJ0F1dGhDb250ZXh0IG5vdCBmb3VuZCBpbiBtZXRob2QgYXJndW1lbnRzJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdoYXNDYXBhYmlsaXR5JywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcmV0dXJuIHRydWUgZm9yIFNpdGVBZG1pbiB3aXRoIHBsYXRmb3JtIGNhcGFiaWxpdHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBoYXNDYXBhYmlsaXR5KGFkbWluQXV0aENvbnRleHQsIFN5c3RlbUNhcGFiaWxpdHkuTUFOQUdFX1BMQVRGT1JNKTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmUodHJ1ZSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBmYWxzZSBmb3IgcmVndWxhciB1c2VyIHdpdGggcGxhdGZvcm0gY2FwYWJpbGl0eScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGhhc0NhcGFiaWxpdHkodXNlckF1dGhDb250ZXh0LCBTeXN0ZW1DYXBhYmlsaXR5Lk1BTkFHRV9QTEFURk9STSk7XG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlKGZhbHNlKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2F1dGhvcml6ZVJlcXVlc3QnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBhbGxvdyB1c2VyIHdpdGggYW55IHJlcXVpcmVkIGNhcGFiaWxpdHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBleHBlY3QoXG4gICAgICAgIGF1dGhvcml6ZVJlcXVlc3QoYWRtaW5BdXRoQ29udGV4dCwgW1N5c3RlbUNhcGFiaWxpdHkuTUFOQUdFX1BMQVRGT1JNLCBTeXN0ZW1DYXBhYmlsaXR5Lk1BTkFHRV9BTExfQ0xVQlNdKVxuICAgICAgKS5yZXNvbHZlcy5ub3QudG9UaHJvdygpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBkZW55IHVzZXIgd2l0aG91dCBhbnkgcmVxdWlyZWQgY2FwYWJpbGl0eScsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IGV4cGVjdChcbiAgICAgICAgYXV0aG9yaXplUmVxdWVzdCh1c2VyQXV0aENvbnRleHQsIFtTeXN0ZW1DYXBhYmlsaXR5Lk1BTkFHRV9QTEFURk9STSwgU3lzdGVtQ2FwYWJpbGl0eS5NQU5BR0VfQUxMX0NMVUJTXSlcbiAgICAgICkucmVqZWN0cy50b1Rocm93KEluc3VmZmljaWVudFByaXZpbGVnZXNFcnJvcik7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFsbG93IHJlcXVlc3Qgd2l0aCBubyByZXF1aXJlZCBjYXBhYmlsaXRpZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBleHBlY3QoXG4gICAgICAgIGF1dGhvcml6ZVJlcXVlc3QodXNlckF1dGhDb250ZXh0LCBbXSlcbiAgICAgICkucmVzb2x2ZXMubm90LnRvVGhyb3coKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2F1dGhvcml6ZUlmJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgY2hlY2sgYXV0aG9yaXphdGlvbiB3aGVuIGNvbmRpdGlvbiBpcyB0cnVlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgZXhwZWN0KFxuICAgICAgICBhdXRob3JpemVJZih0cnVlLCB1c2VyQXV0aENvbnRleHQsIFN5c3RlbUNhcGFiaWxpdHkuTUFOQUdFX1BMQVRGT1JNKVxuICAgICAgKS5yZWplY3RzLnRvVGhyb3coSW5zdWZmaWNpZW50UHJpdmlsZWdlc0Vycm9yKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgc2tpcCBhdXRob3JpemF0aW9uIHdoZW4gY29uZGl0aW9uIGlzIGZhbHNlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgZXhwZWN0KFxuICAgICAgICBhdXRob3JpemVJZihmYWxzZSwgdXNlckF1dGhDb250ZXh0LCBTeXN0ZW1DYXBhYmlsaXR5Lk1BTkFHRV9QTEFURk9STSlcbiAgICAgICkucmVzb2x2ZXMubm90LnRvVGhyb3coKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3ZhbGlkYXRlQXV0aENvbnRleHQnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBjb3JyZWN0IGF1dGggY29udGV4dCcsICgpID0+IHtcbiAgICAgIGV4cGVjdCgoKSA9PiB2YWxpZGF0ZUF1dGhDb250ZXh0KGFkbWluQXV0aENvbnRleHQpKS5ub3QudG9UaHJvdygpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB0aHJvdyBlcnJvciBmb3IgbnVsbCBjb250ZXh0JywgKCkgPT4ge1xuICAgICAgZXhwZWN0KCgpID0+IHZhbGlkYXRlQXV0aENvbnRleHQobnVsbCBhcyBhbnkpKS50b1Rocm93KCdBdXRoQ29udGV4dCBpcyByZXF1aXJlZCcpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB0aHJvdyBlcnJvciBmb3IgdW5hdXRoZW50aWNhdGVkIHVzZXInLCAoKSA9PiB7XG4gICAgICBjb25zdCB1bmF1dGhlbnRpY2F0ZWRDb250ZXh0ID0geyAuLi5hZG1pbkF1dGhDb250ZXh0LCBpc0F1dGhlbnRpY2F0ZWQ6IGZhbHNlIH07XG4gICAgICBleHBlY3QoKCkgPT4gdmFsaWRhdGVBdXRoQ29udGV4dCh1bmF1dGhlbnRpY2F0ZWRDb250ZXh0KSkudG9UaHJvdygnVXNlciBtdXN0IGJlIGF1dGhlbnRpY2F0ZWQnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdGhyb3cgZXJyb3IgZm9yIG1pc3NpbmcgdXNlciBJRCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbnRleHRXaXRob3V0VXNlcklkID0geyAuLi5hZG1pbkF1dGhDb250ZXh0LCB1c2VySWQ6ICcnIH07XG4gICAgICBleHBlY3QoKCkgPT4gdmFsaWRhdGVBdXRoQ29udGV4dChjb250ZXh0V2l0aG91dFVzZXJJZCkpLnRvVGhyb3coJ1VzZXIgSUQgaXMgcmVxdWlyZWQnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdGhyb3cgZXJyb3IgZm9yIG1pc3Npbmcgc3lzdGVtIHJvbGUnLCAoKSA9PiB7XG4gICAgICBjb25zdCBjb250ZXh0V2l0aG91dFJvbGUgPSB7IC4uLmFkbWluQXV0aENvbnRleHQsIHN5c3RlbVJvbGU6IG51bGwgYXMgYW55IH07XG4gICAgICBleHBlY3QoKCkgPT4gdmFsaWRhdGVBdXRoQ29udGV4dChjb250ZXh0V2l0aG91dFJvbGUpKS50b1Rocm93KCdTeXN0ZW0gcm9sZSBpcyByZXF1aXJlZCcpO1xuICAgIH0pO1xuICB9KTtcbn0pOyJdfQ==