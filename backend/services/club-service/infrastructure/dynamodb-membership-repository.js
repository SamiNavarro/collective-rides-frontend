"use strict";
/**
 * DynamoDB Membership Repository - Phase 2.2
 *
 * DynamoDB implementation of the membership repository interface.
 * Uses single-table design with multiple index items for efficient queries.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBMembershipRepository = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const membership_1 = require("../../../shared/types/membership");
const lambda_utils_1 = require("../../../shared/utils/lambda-utils");
const membership_2 = require("../domain/membership/membership");
/**
 * DynamoDB membership repository implementation
 */
class DynamoDBMembershipRepository {
    constructor(tableName, userRepository, dynamoClient) {
        this.userRepository = userRepository;
        const client = dynamoClient || new client_dynamodb_1.DynamoDBClient({});
        this.dynamoClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
        this.tableName = tableName || process.env.MAIN_TABLE_NAME || 'sydney-cycles-main-development';
    }
    /**
     * Get membership by club and user
     */
    async getMembershipByClubAndUser(clubId, userId) {
        const startTime = Date.now();
        try {
            const command = new lib_dynamodb_1.GetCommand({
                TableName: this.tableName,
                Key: {
                    PK: `CLUB#${clubId}`,
                    SK: `MEMBER#${userId}`,
                },
            });
            const result = await this.dynamoClient.send(command);
            const duration = Date.now() - startTime;
            if (!result.Item) {
                (0, lambda_utils_1.logStructured)('INFO', 'Membership not found', {
                    clubId,
                    userId,
                    duration,
                    operation: 'get_membership_by_club_and_user',
                });
                return null;
            }
            const membership = this.dynamoItemToMembership(result.Item);
            (0, lambda_utils_1.logStructured)('INFO', 'Membership retrieved from DynamoDB', {
                clubId,
                userId,
                membershipId: membership.membershipId,
                role: membership.role,
                status: membership.status,
                duration,
                operation: 'get_membership_by_club_and_user',
            });
            return membership;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('ERROR', 'Failed to get membership by club and user', {
                clubId,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
                operation: 'get_membership_by_club_and_user',
            });
            throw error;
        }
    }
    /**
     * Get membership by ID
     */
    async getMembershipById(membershipId) {
        // For Phase 2.2, we need to scan or maintain a GSI for membership ID lookups
        // This is a simplified implementation - in production, consider adding a GSI
        throw new Error('getMembershipById not implemented - requires GSI or scan operation');
    }
    /**
     * List club members with pagination and filtering
     */
    async listClubMembers(clubId, options) {
        const startTime = Date.now();
        const limit = options.limit || membership_1.MEMBERSHIP_CONSTRAINTS.DEFAULT_LIST_LIMIT;
        try {
            const queryParams = {
                TableName: this.tableName,
                IndexName: 'GSI2',
                KeyConditionExpression: 'GSI2PK = :gsi2pk',
                ExpressionAttributeValues: {
                    ':gsi2pk': `CLUB#${clubId}#MEMBERS`,
                },
                Limit: limit + 1,
                ScanIndexForward: true,
            };
            // Add role filter
            if (options.role) {
                queryParams.KeyConditionExpression += ' AND begins_with(GSI2SK, :rolePrefix)';
                queryParams.ExpressionAttributeValues[':rolePrefix'] = `ROLE#${options.role}#`;
            }
            // Add status filter
            if (options.status) {
                queryParams.FilterExpression = '#status = :status';
                queryParams.ExpressionAttributeNames = {
                    '#status': 'status',
                };
                queryParams.ExpressionAttributeValues[':status'] = options.status;
            }
            // Add cursor for pagination
            if (options.cursor) {
                try {
                    const decodedCursor = JSON.parse(Buffer.from(options.cursor, 'base64').toString());
                    queryParams.ExclusiveStartKey = {
                        GSI2PK: `CLUB#${clubId}#MEMBERS`,
                        GSI2SK: `ROLE#${decodedCursor.role}#USER#${decodedCursor.userId}`,
                        PK: `CLUB#${clubId}#MEMBERS`,
                        SK: `ROLE#${decodedCursor.role}#USER#${decodedCursor.userId}`,
                    };
                }
                catch (error) {
                    throw new Error('Invalid cursor format');
                }
            }
            const command = new lib_dynamodb_1.QueryCommand(queryParams);
            const result = await this.dynamoClient.send(command);
            const duration = Date.now() - startTime;
            const items = result.Items || [];
            const hasMore = items.length > limit;
            const memberItems = items.slice(0, limit);
            // Enrich with user data
            const members = [];
            if (this.userRepository && memberItems.length > 0) {
                const userIds = memberItems.map(item => item.userId);
                const users = await Promise.all(userIds.map(userId => this.userRepository.getUserById(userId)));
                for (let i = 0; i < memberItems.length; i++) {
                    const memberItem = memberItems[i];
                    const user = users[i];
                    members.push({
                        membershipId: memberItem.membershipId,
                        userId: memberItem.userId,
                        displayName: user?.displayName || 'Unknown User',
                        email: user?.email || '',
                        avatarUrl: user?.avatarUrl,
                        role: memberItem.role,
                        status: memberItem.status,
                        joinedAt: memberItem.joinedAt,
                        updatedAt: memberItem.updatedAt,
                    });
                }
            }
            else {
                // Fallback without user enrichment
                for (const item of memberItems) {
                    const memberItem = item;
                    members.push({
                        membershipId: memberItem.membershipId,
                        userId: memberItem.userId,
                        displayName: 'Unknown User',
                        email: '',
                        role: memberItem.role,
                        status: memberItem.status,
                        joinedAt: memberItem.joinedAt,
                        updatedAt: memberItem.updatedAt,
                    });
                }
            }
            let nextCursor;
            if (hasMore && members.length > 0) {
                const lastMember = memberItems[memberItems.length - 1];
                const cursorData = {
                    role: lastMember.role,
                    userId: lastMember.userId,
                };
                nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
            }
            (0, lambda_utils_1.logStructured)('INFO', 'Club members listed from DynamoDB', {
                clubId,
                resultCount: members.length,
                hasMore,
                role: options.role,
                status: options.status,
                duration,
                operation: 'list_club_members',
            });
            return {
                members,
                nextCursor,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('ERROR', 'Failed to list club members', {
                clubId,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
                operation: 'list_club_members',
            });
            throw error;
        }
    }
    /**
     * List user's club memberships
     */
    async listUserMemberships(userId, status) {
        const startTime = Date.now();
        try {
            const queryParams = {
                TableName: this.tableName,
                IndexName: 'GSI1',
                KeyConditionExpression: 'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :membershipPrefix)',
                ExpressionAttributeValues: {
                    ':gsi1pk': `USER#${userId}`,
                    ':membershipPrefix': 'MEMBERSHIP#',
                },
            };
            // Add status filter
            if (status) {
                queryParams.FilterExpression = '#status = :status';
                queryParams.ExpressionAttributeNames = {
                    '#status': 'status',
                };
                queryParams.ExpressionAttributeValues[':status'] = status;
            }
            const command = new lib_dynamodb_1.QueryCommand(queryParams);
            const result = await this.dynamoClient.send(command);
            const duration = Date.now() - startTime;
            const items = result.Items || [];
            const memberships = items.map(item => {
                const membershipItem = item;
                return {
                    membershipId: membershipItem.membershipId,
                    clubId: membershipItem.clubId,
                    clubName: 'Unknown Club',
                    role: membershipItem.role,
                    status: membershipItem.status,
                    joinedAt: membershipItem.joinedAt,
                };
            });
            (0, lambda_utils_1.logStructured)('INFO', 'User memberships listed from DynamoDB', {
                userId,
                resultCount: memberships.length,
                status,
                duration,
                operation: 'list_user_memberships',
            });
            return memberships;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('ERROR', 'Failed to list user memberships', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
                operation: 'list_user_memberships',
            });
            throw error;
        }
    }
    /**
     * Create a new membership
     */
    async createMembership(clubId, userId, input, role = membership_1.ClubRole.MEMBER, status = membership_1.MembershipStatus.PENDING) {
        const startTime = Date.now();
        try {
            // Create membership entity
            const membershipEntity = (0, membership_2.createMembership)(clubId, userId, role, status, input.message);
            const membership = membershipEntity.toMembership();
            // Create DynamoDB items
            const canonicalItem = this.membershipToCanonicalItem(membership);
            const userIndexItem = this.membershipToUserIndexItem(membership);
            const clubMemberIndexItem = this.membershipToClubMemberIndexItem(membership);
            // Use TransactWrite to ensure all items are created atomically
            const command = new lib_dynamodb_1.TransactWriteCommand({
                TransactItems: [
                    {
                        Put: {
                            TableName: this.tableName,
                            Item: canonicalItem,
                            ConditionExpression: 'attribute_not_exists(PK)', // Ensure membership doesn't already exist
                        },
                    },
                    {
                        Put: {
                            TableName: this.tableName,
                            Item: userIndexItem,
                        },
                    },
                    {
                        Put: {
                            TableName: this.tableName,
                            Item: clubMemberIndexItem,
                        },
                    },
                ],
            });
            await this.dynamoClient.send(command);
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('INFO', 'Membership created in DynamoDB', {
                clubId,
                userId,
                membershipId: membership.membershipId,
                role: membership.role,
                status: membership.status,
                duration,
                operation: 'create_membership',
            });
            return membership;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('ERROR', 'Failed to create membership', {
                clubId,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
                operation: 'create_membership',
            });
            throw error;
        }
    }
    /**
     * Update membership role
     */
    async updateMembershipRole(membershipId, input, updatedBy) {
        // This would require implementing membership lookup by ID and update logic
        // For Phase 2.2 MVP, we'll implement a simplified version
        throw new Error('updateMembershipRole not fully implemented');
    }
    /**
     * Update membership status
     */
    async updateMembershipStatus(membershipId, status, processedBy, reason) {
        // This would require implementing membership lookup by ID and update logic
        // For Phase 2.2 MVP, we'll implement a simplified version
        throw new Error('updateMembershipStatus not fully implemented');
    }
    /**
     * Remove membership
     */
    async removeMembership(membershipId, removedBy, reason) {
        return this.updateMembershipStatus(membershipId, membership_1.MembershipStatus.REMOVED, removedBy, reason);
    }
    /**
     * Check if user is a member of club
     */
    async isUserMember(clubId, userId) {
        const membership = await this.getMembershipByClubAndUser(clubId, userId);
        return membership !== null && membership.status === membership_1.MembershipStatus.ACTIVE;
    }
    /**
     * Get user's role in club
     */
    async getUserRoleInClub(clubId, userId) {
        const membership = await this.getMembershipByClubAndUser(clubId, userId);
        return membership && membership.status === membership_1.MembershipStatus.ACTIVE ? membership.role : null;
    }
    /**
     * Count club members by status
     */
    async countClubMembers(clubId, status = membership_1.MembershipStatus.ACTIVE) {
        // This would require a count query or aggregation
        // For Phase 2.2 MVP, we'll implement a simplified version
        const members = await this.listClubMembers(clubId, { status, limit: 1000 });
        return members.members.length;
    }
    /**
     * Get club owner
     */
    async getClubOwner(clubId) {
        const members = await this.listClubMembers(clubId, { role: membership_1.ClubRole.OWNER, status: membership_1.MembershipStatus.ACTIVE });
        return members.members.length > 0 ? this.memberInfoToMembership(members.members[0]) : null;
    }
    /**
     * Get club admins (including owner)
     */
    async getClubAdmins(clubId) {
        const [admins, owners] = await Promise.all([
            this.listClubMembers(clubId, { role: membership_1.ClubRole.ADMIN, status: membership_1.MembershipStatus.ACTIVE }),
            this.listClubMembers(clubId, { role: membership_1.ClubRole.OWNER, status: membership_1.MembershipStatus.ACTIVE }),
        ]);
        return [
            ...admins.members.map(member => this.memberInfoToMembership(member)),
            ...owners.members.map(member => this.memberInfoToMembership(member)),
        ];
    }
    /**
     * Check if user has pending membership request
     */
    async hasPendingMembershipRequest(clubId, userId) {
        const membership = await this.getMembershipByClubAndUser(clubId, userId);
        return membership !== null && membership.status === membership_1.MembershipStatus.PENDING;
    }
    /**
     * Get club member count (active members only)
     */
    async getClubMemberCount(clubId) {
        return this.countClubMembers(clubId, membership_1.MembershipStatus.ACTIVE);
    }
    /**
     * Convert DynamoDB canonical item to Membership
     */
    dynamoItemToMembership(item) {
        return {
            membershipId: item.membershipId,
            clubId: item.clubId,
            userId: item.userId,
            role: item.role,
            status: item.status,
            joinedAt: item.joinedAt,
            updatedAt: item.updatedAt,
            joinMessage: item.joinMessage,
            invitedBy: item.invitedBy,
            processedBy: item.processedBy,
            processedAt: item.processedAt,
            reason: item.reason,
        };
    }
    /**
     * Convert ClubMemberInfo to ClubMembership
     */
    memberInfoToMembership(memberInfo) {
        return {
            membershipId: memberInfo.membershipId,
            clubId: '',
            userId: memberInfo.userId,
            role: memberInfo.role,
            status: memberInfo.status,
            joinedAt: memberInfo.joinedAt,
            updatedAt: memberInfo.updatedAt || memberInfo.joinedAt,
        };
    }
    /**
     * Convert Membership to DynamoDB canonical item
     */
    membershipToCanonicalItem(membership) {
        return {
            PK: `CLUB#${membership.clubId}`,
            SK: `MEMBER#${membership.userId}`,
            entityType: 'CLUB_MEMBERSHIP',
            membershipId: membership.membershipId,
            clubId: membership.clubId,
            userId: membership.userId,
            role: membership.role,
            status: membership.status,
            joinedAt: membership.joinedAt,
            updatedAt: membership.updatedAt,
            joinMessage: membership.joinMessage,
            invitedBy: membership.invitedBy,
            processedBy: membership.processedBy,
            processedAt: membership.processedAt,
            reason: membership.reason,
        };
    }
    /**
     * Convert Membership to DynamoDB user index item
     */
    membershipToUserIndexItem(membership) {
        const sk = `MEMBERSHIP#${membership.clubId}`;
        return {
            PK: `USER#${membership.userId}`,
            SK: sk,
            GSI1PK: `USER#${membership.userId}`,
            GSI1SK: sk,
            entityType: 'USER_MEMBERSHIP',
            membershipId: membership.membershipId,
            clubId: membership.clubId,
            userId: membership.userId,
            role: membership.role,
            status: membership.status,
            joinedAt: membership.joinedAt,
            updatedAt: membership.updatedAt,
        };
    }
    /**
     * Convert Membership to DynamoDB club member index item
     */
    membershipToClubMemberIndexItem(membership) {
        const sk = `ROLE#${membership.role}#USER#${membership.userId}`;
        return {
            PK: `CLUB#${membership.clubId}#MEMBERS`,
            SK: sk,
            GSI2PK: `CLUB#${membership.clubId}#MEMBERS`,
            GSI2SK: sk,
            entityType: 'CLUB_MEMBER_INDEX',
            membershipId: membership.membershipId,
            userId: membership.userId,
            role: membership.role,
            status: membership.status,
            joinedAt: membership.joinedAt,
            updatedAt: membership.updatedAt,
        };
    }
}
exports.DynamoDBMembershipRepository = DynamoDBMembershipRepository;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHluYW1vZGItbWVtYmVyc2hpcC1yZXBvc2l0b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZHluYW1vZGItbWVtYmVyc2hpcC1yZXBvc2l0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBRUgsOERBQTBEO0FBQzFELHdEQU0rQjtBQUMvQixpRUFjMEM7QUFFMUMscUVBQW1FO0FBR25FLGdFQUF1RjtBQUd2Rjs7R0FFRztBQUNILE1BQWEsNEJBQTRCO0lBSXZDLFlBQ0UsU0FBa0IsRUFDVixjQUFnQyxFQUN4QyxZQUE2QjtRQURyQixtQkFBYyxHQUFkLGNBQWMsQ0FBa0I7UUFHeEMsTUFBTSxNQUFNLEdBQUcsWUFBWSxJQUFJLElBQUksZ0NBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN0RCxJQUFJLENBQUMsWUFBWSxHQUFHLHFDQUFzQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN4RCxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSxnQ0FBZ0MsQ0FBQztJQUNoRyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsMEJBQTBCLENBQUMsTUFBYyxFQUFFLE1BQWM7UUFDN0QsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRTdCLElBQUk7WUFDRixNQUFNLE9BQU8sR0FBRyxJQUFJLHlCQUFVLENBQUM7Z0JBQzdCLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztnQkFDekIsR0FBRyxFQUFFO29CQUNILEVBQUUsRUFBRSxRQUFRLE1BQU0sRUFBRTtvQkFDcEIsRUFBRSxFQUFFLFVBQVUsTUFBTSxFQUFFO2lCQUN2QjthQUNGLENBQUMsQ0FBQztZQUVILE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckQsTUFBTSxR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O1lBQ25DLE1BQU0sRUFBRSxFQUFFO1lBQ1YsVUFBVSxFQUFFLGlCQUFpQjtZQUM3QixZQUFZLEVBQUUsVUFBVSxDQUFDLFlBQVk7WUFDckMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxNQUFNO1lBQ3pCLE1BQU0sRUFBRSxVQUFVLENBQUMsTUFBTTtZQUN6QixJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUk7WUFDckIsTUFBTSxFQUFFLFVBQVUsQ0FBQyxNQUFNO1lBQ3pCLFFBQVEsRUFBRSxVQUFVLENBQUMsUUFBUTtZQUM3QixTQUFTLEVBQUUsVUFBVSxDQUFDLFNBQVM7U0FDaEMsQ0FBQztJQUNKLENBQUM7SUFFRDs7T0FFRztJQUNLLCtCQUErQixDQUFDLFVBQTBCO1FBQ2hFLE1BQU0sRUFBRSxHQUFHLFFBQVEsVUFBVSxDQUFDLElBQUksU0FBUyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDL0QsT0FBTztZQUNMLEVBQUUsRUFBRSxRQUFRLFVBQVUsQ0FBQyxNQUFNLFVBQVU7WUFDdkMsRUFBRSxFQUFFLEVBQUU7WUFDTixNQUFNLEVBQUUsUUFBUSxVQUFVLENBQUMsTUFBTSxVQUFVO1lBQzNDLE1BQU0sRUFBRSxFQUFFO1lBQ1YsVUFBVSxFQUFFLG1CQUFtQjtZQUMvQixZQUFZLEVBQUUsVUFBVSxDQUFDLFlBQVk7WUFDckMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxNQUFNO1lBQ3pCLElBQUksRUFBRSxVQUFVLENBQUMsSUFBSTtZQUNyQixNQUFNLEVBQUUsVUFBVSxDQUFDLE1BQU07WUFDekIsUUFBUSxFQUFFLFVBQVUsQ0FBQyxRQUFRO1lBQzdCLFNBQVMsRUFBRSxVQUFVLENBQUMsU0FBUztTQUNoQyxDQUFDO0lBQ0osQ0FBQztDQUNGO0FBN2hCRCxvRUE2aEJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBEeW5hbW9EQiBNZW1iZXJzaGlwIFJlcG9zaXRvcnkgLSBQaGFzZSAyLjJcbiAqIFxuICogRHluYW1vREIgaW1wbGVtZW50YXRpb24gb2YgdGhlIG1lbWJlcnNoaXAgcmVwb3NpdG9yeSBpbnRlcmZhY2UuXG4gKiBVc2VzIHNpbmdsZS10YWJsZSBkZXNpZ24gd2l0aCBtdWx0aXBsZSBpbmRleCBpdGVtcyBmb3IgZWZmaWNpZW50IHF1ZXJpZXMuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDIuMiBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0yLjIuY2x1Yi1tZW1iZXJzaGlwLXJvbGVzLnYxLm1kXG4gKi9cblxuaW1wb3J0IHsgRHluYW1vREJDbGllbnQgfSBmcm9tICdAYXdzLXNkay9jbGllbnQtZHluYW1vZGInO1xuaW1wb3J0IHtcbiAgRHluYW1vREJEb2N1bWVudENsaWVudCxcbiAgR2V0Q29tbWFuZCxcbiAgUXVlcnlDb21tYW5kLFxuICBUcmFuc2FjdFdyaXRlQ29tbWFuZCxcbiAgQmF0Y2hHZXRDb21tYW5kLFxufSBmcm9tICdAYXdzLXNkay9saWItZHluYW1vZGInO1xuaW1wb3J0IHtcbiAgQ2x1Yk1lbWJlcnNoaXAsXG4gIENsdWJSb2xlLFxuICBNZW1iZXJzaGlwU3RhdHVzLFxuICBKb2luQ2x1YklucHV0LFxuICBVcGRhdGVNZW1iZXJJbnB1dCxcbiAgTGlzdE1lbWJlcnNPcHRpb25zLFxuICBMaXN0TWVtYmVyc1Jlc3VsdCxcbiAgQ2x1Yk1lbWJlckluZm8sXG4gIFVzZXJNZW1iZXJzaGlwU3VtbWFyeSxcbiAgTWVtYmVyc2hpcER5bmFtb0l0ZW0sXG4gIFVzZXJNZW1iZXJzaGlwRHluYW1vSXRlbSxcbiAgQ2x1Yk1lbWJlckR5bmFtb0l0ZW0sXG4gIE1FTUJFUlNISVBfQ09OU1RSQUlOVFMsXG59IGZyb20gJy4uLy4uLy4uL3NoYXJlZC90eXBlcy9tZW1iZXJzaGlwJztcbmltcG9ydCB7IE5vdEZvdW5kRXJyb3IgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdXRpbHMvZXJyb3JzJztcbmltcG9ydCB7IGxvZ1N0cnVjdHVyZWQgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdXRpbHMvbGFtYmRhLXV0aWxzJztcbmltcG9ydCB7IElNZW1iZXJzaGlwUmVwb3NpdG9yeSB9IGZyb20gJy4uL2RvbWFpbi9tZW1iZXJzaGlwL21lbWJlcnNoaXAtcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBJVXNlclJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi91c2VyLXByb2ZpbGUvZG9tYWluL3VzZXItcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBjcmVhdGVNZW1iZXJzaGlwLCBmcm9tTWVtYmVyc2hpcERhdGEgfSBmcm9tICcuLi9kb21haW4vbWVtYmVyc2hpcC9tZW1iZXJzaGlwJztcbmltcG9ydCB7IE1lbWJlcnNoaXBOb3RGb3VuZEVycm9yIH0gZnJvbSAnLi4vZG9tYWluL21lbWJlcnNoaXAvbWVtYmVyc2hpcC1lcnJvcnMnO1xuXG4vKipcbiAqIER5bmFtb0RCIG1lbWJlcnNoaXAgcmVwb3NpdG9yeSBpbXBsZW1lbnRhdGlvblxuICovXG5leHBvcnQgY2xhc3MgRHluYW1vREJNZW1iZXJzaGlwUmVwb3NpdG9yeSBpbXBsZW1lbnRzIElNZW1iZXJzaGlwUmVwb3NpdG9yeSB7XG4gIHByaXZhdGUgZHluYW1vQ2xpZW50OiBEeW5hbW9EQkRvY3VtZW50Q2xpZW50O1xuICBwcml2YXRlIHRhYmxlTmFtZTogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHRhYmxlTmFtZT86IHN0cmluZyxcbiAgICBwcml2YXRlIHVzZXJSZXBvc2l0b3J5PzogSVVzZXJSZXBvc2l0b3J5LFxuICAgIGR5bmFtb0NsaWVudD86IER5bmFtb0RCQ2xpZW50XG4gICkge1xuICAgIGNvbnN0IGNsaWVudCA9IGR5bmFtb0NsaWVudCB8fCBuZXcgRHluYW1vREJDbGllbnQoe30pO1xuICAgIHRoaXMuZHluYW1vQ2xpZW50ID0gRHluYW1vREJEb2N1bWVudENsaWVudC5mcm9tKGNsaWVudCk7XG4gICAgdGhpcy50YWJsZU5hbWUgPSB0YWJsZU5hbWUgfHwgcHJvY2Vzcy5lbnYuTUFJTl9UQUJMRV9OQU1FIHx8ICdzeWRuZXktY3ljbGVzLW1haW4tZGV2ZWxvcG1lbnQnO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBtZW1iZXJzaGlwIGJ5IGNsdWIgYW5kIHVzZXJcbiAgICovXG4gIGFzeW5jIGdldE1lbWJlcnNoaXBCeUNsdWJBbmRVc2VyKGNsdWJJZDogc3RyaW5nLCB1c2VySWQ6IHN0cmluZyk6IFByb21pc2U8Q2x1Yk1lbWJlcnNoaXAgfCBudWxsPiB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb21tYW5kID0gbmV3IEdldENvbW1hbmQoe1xuICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICBLZXk6IHtcbiAgICAgICAgICBQSzogYENMVUIjJHtjbHViSWR9YCxcbiAgICAgICAgICBTSzogYE1FTUJFUiMke3VzZXJJZH1gLFxuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZHluYW1vQ2xpZW50LnNlbmQoY29tbWFuZCk7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG5cbiAgICAgIGlmICghcmVzdWx0Lkl0ZW0pIHtcbiAgICAgICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdNZW1iZXJzaGlwIG5vdCBmb3VuZCcsIHtcbiAgICAgICAgICBjbHViSWQsXG4gICAgICAgICAgdXNlcklkLFxuICAgICAgICAgIGR1cmF0aW9uLFxuICAgICAgICAgIG9wZXJhdGlvbjogJ2dldF9tZW1iZXJzaGlwX2J5X2NsdWJfYW5kX3VzZXInLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1lbWJlcnNoaXAgPSB0aGlzLmR5bmFtb0l0ZW1Ub01lbWJlcnNoaXAocmVzdWx0Lkl0ZW0gYXMgTWVtYmVyc2hpcER5bmFtb0l0ZW0pO1xuXG4gICAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ01lbWJlcnNoaXAgcmV0cmlldmVkIGZyb20gRHluYW1vREInLCB7XG4gICAgICAgIGNsdWJJZCxcbiAgICAgICAgdXNlcklkLFxuICAgICAgICBtZW1iZXJzaGlwSWQ6IG1lbWJlcnNoaXAubWVtYmVyc2hpcElkLFxuICAgICAgICByb2xlOiBtZW1iZXJzaGlwLnJvbGUsXG4gICAgICAgIHN0YXR1czogbWVtYmVyc2hpcC5zdGF0dXMsXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgICBvcGVyYXRpb246ICdnZXRfbWVtYmVyc2hpcF9ieV9jbHViX2FuZF91c2VyJyxcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gbWVtYmVyc2hpcDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgZHVyYXRpb24gPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgICAgbG9nU3RydWN0dXJlZCgnRVJST1InLCAnRmFpbGVkIHRvIGdldCBtZW1iZXJzaGlwIGJ5IGNsdWIgYW5kIHVzZXInLCB7XG4gICAgICAgIGNsdWJJZCxcbiAgICAgICAgdXNlcklkLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgICBvcGVyYXRpb246ICdnZXRfbWVtYmVyc2hpcF9ieV9jbHViX2FuZF91c2VyJyxcbiAgICAgIH0pO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBtZW1iZXJzaGlwIGJ5IElEXG4gICAqL1xuICBhc3luYyBnZXRNZW1iZXJzaGlwQnlJZChtZW1iZXJzaGlwSWQ6IHN0cmluZyk6IFByb21pc2U8Q2x1Yk1lbWJlcnNoaXAgfCBudWxsPiB7XG4gICAgLy8gRm9yIFBoYXNlIDIuMiwgd2UgbmVlZCB0byBzY2FuIG9yIG1haW50YWluIGEgR1NJIGZvciBtZW1iZXJzaGlwIElEIGxvb2t1cHNcbiAgICAvLyBUaGlzIGlzIGEgc2ltcGxpZmllZCBpbXBsZW1lbnRhdGlvbiAtIGluIHByb2R1Y3Rpb24sIGNvbnNpZGVyIGFkZGluZyBhIEdTSVxuICAgIHRocm93IG5ldyBFcnJvcignZ2V0TWVtYmVyc2hpcEJ5SWQgbm90IGltcGxlbWVudGVkIC0gcmVxdWlyZXMgR1NJIG9yIHNjYW4gb3BlcmF0aW9uJyk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBjbHViIG1lbWJlcnMgd2l0aCBwYWdpbmF0aW9uIGFuZCBmaWx0ZXJpbmdcbiAgICovXG4gIGFzeW5jIGxpc3RDbHViTWVtYmVycyhjbHViSWQ6IHN0cmluZywgb3B0aW9uczogTGlzdE1lbWJlcnNPcHRpb25zKTogUHJvbWlzZTxMaXN0TWVtYmVyc1Jlc3VsdD4ge1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgY29uc3QgbGltaXQgPSBvcHRpb25zLmxpbWl0IHx8IE1FTUJFUlNISVBfQ09OU1RSQUlOVFMuREVGQVVMVF9MSVNUX0xJTUlUO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHF1ZXJ5UGFyYW1zOiBhbnkgPSB7XG4gICAgICAgIFRhYmxlTmFtZTogdGhpcy50YWJsZU5hbWUsXG4gICAgICAgIEluZGV4TmFtZTogJ0dTSTInLFxuICAgICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiAnR1NJMlBLID0gOmdzaTJwaycsXG4gICAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IHtcbiAgICAgICAgICAnOmdzaTJwayc6IGBDTFVCIyR7Y2x1YklkfSNNRU1CRVJTYCxcbiAgICAgICAgfSxcbiAgICAgICAgTGltaXQ6IGxpbWl0ICsgMSwgLy8gR2V0IG9uZSBleHRyYSB0byBkZXRlcm1pbmUgaWYgdGhlcmUgYXJlIG1vcmUgcmVzdWx0c1xuICAgICAgICBTY2FuSW5kZXhGb3J3YXJkOiB0cnVlLFxuICAgICAgfTtcblxuICAgICAgLy8gQWRkIHJvbGUgZmlsdGVyXG4gICAgICBpZiAob3B0aW9ucy5yb2xlKSB7XG4gICAgICAgIHF1ZXJ5UGFyYW1zLktleUNvbmRpdGlvbkV4cHJlc3Npb24gKz0gJyBBTkQgYmVnaW5zX3dpdGgoR1NJMlNLLCA6cm9sZVByZWZpeCknO1xuICAgICAgICBxdWVyeVBhcmFtcy5FeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzWyc6cm9sZVByZWZpeCddID0gYFJPTEUjJHtvcHRpb25zLnJvbGV9I2A7XG4gICAgICB9XG5cbiAgICAgIC8vIEFkZCBzdGF0dXMgZmlsdGVyXG4gICAgICBpZiAob3B0aW9ucy5zdGF0dXMpIHtcbiAgICAgICAgcXVlcnlQYXJhbXMuRmlsdGVyRXhwcmVzc2lvbiA9ICcjc3RhdHVzID0gOnN0YXR1cyc7XG4gICAgICAgIHF1ZXJ5UGFyYW1zLkV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lcyA9IHtcbiAgICAgICAgICAnI3N0YXR1cyc6ICdzdGF0dXMnLFxuICAgICAgICB9O1xuICAgICAgICBxdWVyeVBhcmFtcy5FeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzWyc6c3RhdHVzJ10gPSBvcHRpb25zLnN0YXR1cztcbiAgICAgIH1cblxuICAgICAgLy8gQWRkIGN1cnNvciBmb3IgcGFnaW5hdGlvblxuICAgICAgaWYgKG9wdGlvbnMuY3Vyc29yKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgZGVjb2RlZEN1cnNvciA9IEpTT04ucGFyc2UoQnVmZmVyLmZyb20ob3B0aW9ucy5jdXJzb3IsICdiYXNlNjQnKS50b1N0cmluZygpKTtcbiAgICAgICAgICBxdWVyeVBhcmFtcy5FeGNsdXNpdmVTdGFydEtleSA9IHtcbiAgICAgICAgICAgIEdTSTJQSzogYENMVUIjJHtjbHViSWR9I01FTUJFUlNgLFxuICAgICAgICAgICAgR1NJMlNLOiBgUk9MRSMke2RlY29kZWRDdXJzb3Iucm9sZX0jVVNFUiMke2RlY29kZWRDdXJzb3IudXNlcklkfWAsXG4gICAgICAgICAgICBQSzogYENMVUIjJHtjbHViSWR9I01FTUJFUlNgLFxuICAgICAgICAgICAgU0s6IGBST0xFIyR7ZGVjb2RlZEN1cnNvci5yb2xlfSNVU0VSIyR7ZGVjb2RlZEN1cnNvci51c2VySWR9YCxcbiAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjdXJzb3IgZm9ybWF0Jyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBRdWVyeUNvbW1hbmQocXVlcnlQYXJhbXMpO1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5keW5hbW9DbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcblxuICAgICAgY29uc3QgaXRlbXMgPSByZXN1bHQuSXRlbXMgfHwgW107XG4gICAgICBjb25zdCBoYXNNb3JlID0gaXRlbXMubGVuZ3RoID4gbGltaXQ7XG4gICAgICBjb25zdCBtZW1iZXJJdGVtcyA9IGl0ZW1zLnNsaWNlKDAsIGxpbWl0KTtcblxuICAgICAgLy8gRW5yaWNoIHdpdGggdXNlciBkYXRhXG4gICAgICBjb25zdCBtZW1iZXJzOiBDbHViTWVtYmVySW5mb1tdID0gW107XG4gICAgICBpZiAodGhpcy51c2VyUmVwb3NpdG9yeSAmJiBtZW1iZXJJdGVtcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IHVzZXJJZHMgPSBtZW1iZXJJdGVtcy5tYXAoaXRlbSA9PiAoaXRlbSBhcyBDbHViTWVtYmVyRHluYW1vSXRlbSkudXNlcklkKTtcbiAgICAgICAgY29uc3QgdXNlcnMgPSBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgICB1c2VySWRzLm1hcCh1c2VySWQgPT4gdGhpcy51c2VyUmVwb3NpdG9yeSEuZ2V0VXNlckJ5SWQodXNlcklkKSlcbiAgICAgICAgKTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1lbWJlckl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgbWVtYmVySXRlbSA9IG1lbWJlckl0ZW1zW2ldIGFzIENsdWJNZW1iZXJEeW5hbW9JdGVtO1xuICAgICAgICAgIGNvbnN0IHVzZXIgPSB1c2Vyc1tpXTtcbiAgICAgICAgICBcbiAgICAgICAgICBtZW1iZXJzLnB1c2goe1xuICAgICAgICAgICAgbWVtYmVyc2hpcElkOiBtZW1iZXJJdGVtLm1lbWJlcnNoaXBJZCxcbiAgICAgICAgICAgIHVzZXJJZDogbWVtYmVySXRlbS51c2VySWQsXG4gICAgICAgICAgICBkaXNwbGF5TmFtZTogdXNlcj8uZGlzcGxheU5hbWUgfHwgJ1Vua25vd24gVXNlcicsXG4gICAgICAgICAgICBlbWFpbDogdXNlcj8uZW1haWwgfHwgJycsXG4gICAgICAgICAgICBhdmF0YXJVcmw6IHVzZXI/LmF2YXRhclVybCxcbiAgICAgICAgICAgIHJvbGU6IG1lbWJlckl0ZW0ucm9sZSxcbiAgICAgICAgICAgIHN0YXR1czogbWVtYmVySXRlbS5zdGF0dXMsXG4gICAgICAgICAgICBqb2luZWRBdDogbWVtYmVySXRlbS5qb2luZWRBdCxcbiAgICAgICAgICAgIHVwZGF0ZWRBdDogbWVtYmVySXRlbS51cGRhdGVkQXQsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEZhbGxiYWNrIHdpdGhvdXQgdXNlciBlbnJpY2htZW50XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBtZW1iZXJJdGVtcykge1xuICAgICAgICAgIGNvbnN0IG1lbWJlckl0ZW0gPSBpdGVtIGFzIENsdWJNZW1iZXJEeW5hbW9JdGVtO1xuICAgICAgICAgIG1lbWJlcnMucHVzaCh7XG4gICAgICAgICAgICBtZW1iZXJzaGlwSWQ6IG1lbWJlckl0ZW0ubWVtYmVyc2hpcElkLFxuICAgICAgICAgICAgdXNlcklkOiBtZW1iZXJJdGVtLnVzZXJJZCxcbiAgICAgICAgICAgIGRpc3BsYXlOYW1lOiAnVW5rbm93biBVc2VyJyxcbiAgICAgICAgICAgIGVtYWlsOiAnJyxcbiAgICAgICAgICAgIHJvbGU6IG1lbWJlckl0ZW0ucm9sZSxcbiAgICAgICAgICAgIHN0YXR1czogbWVtYmVySXRlbS5zdGF0dXMsXG4gICAgICAgICAgICBqb2luZWRBdDogbWVtYmVySXRlbS5qb2luZWRBdCxcbiAgICAgICAgICAgIHVwZGF0ZWRBdDogbWVtYmVySXRlbS51cGRhdGVkQXQsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbGV0IG5leHRDdXJzb3I6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgIGlmIChoYXNNb3JlICYmIG1lbWJlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBsYXN0TWVtYmVyID0gbWVtYmVySXRlbXNbbWVtYmVySXRlbXMubGVuZ3RoIC0gMV0gYXMgQ2x1Yk1lbWJlckR5bmFtb0l0ZW07XG4gICAgICAgIGNvbnN0IGN1cnNvckRhdGEgPSB7XG4gICAgICAgICAgcm9sZTogbGFzdE1lbWJlci5yb2xlLFxuICAgICAgICAgIHVzZXJJZDogbGFzdE1lbWJlci51c2VySWQsXG4gICAgICAgIH07XG4gICAgICAgIG5leHRDdXJzb3IgPSBCdWZmZXIuZnJvbShKU09OLnN0cmluZ2lmeShjdXJzb3JEYXRhKSkudG9TdHJpbmcoJ2Jhc2U2NCcpO1xuICAgICAgfVxuXG4gICAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0NsdWIgbWVtYmVycyBsaXN0ZWQgZnJvbSBEeW5hbW9EQicsIHtcbiAgICAgICAgY2x1YklkLFxuICAgICAgICByZXN1bHRDb3VudDogbWVtYmVycy5sZW5ndGgsXG4gICAgICAgIGhhc01vcmUsXG4gICAgICAgIHJvbGU6IG9wdGlvbnMucm9sZSxcbiAgICAgICAgc3RhdHVzOiBvcHRpb25zLnN0YXR1cyxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIG9wZXJhdGlvbjogJ2xpc3RfY2x1Yl9tZW1iZXJzJyxcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBtZW1iZXJzLFxuICAgICAgICBuZXh0Q3Vyc29yLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgZHVyYXRpb24gPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgICAgbG9nU3RydWN0dXJlZCgnRVJST1InLCAnRmFpbGVkIHRvIGxpc3QgY2x1YiBtZW1iZXJzJywge1xuICAgICAgICBjbHViSWQsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIG9wZXJhdGlvbjogJ2xpc3RfY2x1Yl9tZW1iZXJzJyxcbiAgICAgIH0pO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgdXNlcidzIGNsdWIgbWVtYmVyc2hpcHNcbiAgICovXG4gIGFzeW5jIGxpc3RVc2VyTWVtYmVyc2hpcHModXNlcklkOiBzdHJpbmcsIHN0YXR1cz86IE1lbWJlcnNoaXBTdGF0dXMpOiBQcm9taXNlPFVzZXJNZW1iZXJzaGlwU3VtbWFyeVtdPiB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBxdWVyeVBhcmFtczogYW55ID0ge1xuICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICBJbmRleE5hbWU6ICdHU0kxJyxcbiAgICAgICAgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbjogJ0dTSTFQSyA9IDpnc2kxcGsgQU5EIGJlZ2luc193aXRoKEdTSTFTSywgOm1lbWJlcnNoaXBQcmVmaXgpJyxcbiAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xuICAgICAgICAgICc6Z3NpMXBrJzogYFVTRVIjJHt1c2VySWR9YCxcbiAgICAgICAgICAnOm1lbWJlcnNoaXBQcmVmaXgnOiAnTUVNQkVSU0hJUCMnLFxuICAgICAgICB9LFxuICAgICAgfTtcblxuICAgICAgLy8gQWRkIHN0YXR1cyBmaWx0ZXJcbiAgICAgIGlmIChzdGF0dXMpIHtcbiAgICAgICAgcXVlcnlQYXJhbXMuRmlsdGVyRXhwcmVzc2lvbiA9ICcjc3RhdHVzID0gOnN0YXR1cyc7XG4gICAgICAgIHF1ZXJ5UGFyYW1zLkV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lcyA9IHtcbiAgICAgICAgICAnI3N0YXR1cyc6ICdzdGF0dXMnLFxuICAgICAgICB9O1xuICAgICAgICBxdWVyeVBhcmFtcy5FeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzWyc6c3RhdHVzJ10gPSBzdGF0dXM7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgUXVlcnlDb21tYW5kKHF1ZXJ5UGFyYW1zKTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZHluYW1vQ2xpZW50LnNlbmQoY29tbWFuZCk7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG5cbiAgICAgIGNvbnN0IGl0ZW1zID0gcmVzdWx0Lkl0ZW1zIHx8IFtdO1xuICAgICAgY29uc3QgbWVtYmVyc2hpcHM6IFVzZXJNZW1iZXJzaGlwU3VtbWFyeVtdID0gaXRlbXMubWFwKGl0ZW0gPT4ge1xuICAgICAgICBjb25zdCBtZW1iZXJzaGlwSXRlbSA9IGl0ZW0gYXMgVXNlck1lbWJlcnNoaXBEeW5hbW9JdGVtO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG1lbWJlcnNoaXBJZDogbWVtYmVyc2hpcEl0ZW0ubWVtYmVyc2hpcElkLFxuICAgICAgICAgIGNsdWJJZDogbWVtYmVyc2hpcEl0ZW0uY2x1YklkLFxuICAgICAgICAgIGNsdWJOYW1lOiAnVW5rbm93biBDbHViJywgLy8gV291bGQgbmVlZCBjbHViIGRhdGEgZW5yaWNobWVudFxuICAgICAgICAgIHJvbGU6IG1lbWJlcnNoaXBJdGVtLnJvbGUsXG4gICAgICAgICAgc3RhdHVzOiBtZW1iZXJzaGlwSXRlbS5zdGF0dXMsXG4gICAgICAgICAgam9pbmVkQXQ6IG1lbWJlcnNoaXBJdGVtLmpvaW5lZEF0LFxuICAgICAgICB9O1xuICAgICAgfSk7XG5cbiAgICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnVXNlciBtZW1iZXJzaGlwcyBsaXN0ZWQgZnJvbSBEeW5hbW9EQicsIHtcbiAgICAgICAgdXNlcklkLFxuICAgICAgICByZXN1bHRDb3VudDogbWVtYmVyc2hpcHMubGVuZ3RoLFxuICAgICAgICBzdGF0dXMsXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgICBvcGVyYXRpb246ICdsaXN0X3VzZXJfbWVtYmVyc2hpcHMnLFxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBtZW1iZXJzaGlwcztcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgZHVyYXRpb24gPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgICAgbG9nU3RydWN0dXJlZCgnRVJST1InLCAnRmFpbGVkIHRvIGxpc3QgdXNlciBtZW1iZXJzaGlwcycsIHtcbiAgICAgICAgdXNlcklkLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgICBvcGVyYXRpb246ICdsaXN0X3VzZXJfbWVtYmVyc2hpcHMnLFxuICAgICAgfSk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IG1lbWJlcnNoaXBcbiAgICovXG4gIGFzeW5jIGNyZWF0ZU1lbWJlcnNoaXAoXG4gICAgY2x1YklkOiBzdHJpbmcsXG4gICAgdXNlcklkOiBzdHJpbmcsXG4gICAgaW5wdXQ6IEpvaW5DbHViSW5wdXQsXG4gICAgcm9sZTogQ2x1YlJvbGUgPSBDbHViUm9sZS5NRU1CRVIsXG4gICAgc3RhdHVzOiBNZW1iZXJzaGlwU3RhdHVzID0gTWVtYmVyc2hpcFN0YXR1cy5QRU5ESU5HXG4gICk6IFByb21pc2U8Q2x1Yk1lbWJlcnNoaXA+IHtcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIENyZWF0ZSBtZW1iZXJzaGlwIGVudGl0eVxuICAgICAgY29uc3QgbWVtYmVyc2hpcEVudGl0eSA9IGNyZWF0ZU1lbWJlcnNoaXAoY2x1YklkLCB1c2VySWQsIHJvbGUsIHN0YXR1cywgaW5wdXQubWVzc2FnZSk7XG4gICAgICBjb25zdCBtZW1iZXJzaGlwID0gbWVtYmVyc2hpcEVudGl0eS50b01lbWJlcnNoaXAoKTtcblxuICAgICAgLy8gQ3JlYXRlIER5bmFtb0RCIGl0ZW1zXG4gICAgICBjb25zdCBjYW5vbmljYWxJdGVtID0gdGhpcy5tZW1iZXJzaGlwVG9DYW5vbmljYWxJdGVtKG1lbWJlcnNoaXApO1xuICAgICAgY29uc3QgdXNlckluZGV4SXRlbSA9IHRoaXMubWVtYmVyc2hpcFRvVXNlckluZGV4SXRlbShtZW1iZXJzaGlwKTtcbiAgICAgIGNvbnN0IGNsdWJNZW1iZXJJbmRleEl0ZW0gPSB0aGlzLm1lbWJlcnNoaXBUb0NsdWJNZW1iZXJJbmRleEl0ZW0obWVtYmVyc2hpcCk7XG5cbiAgICAgIC8vIFVzZSBUcmFuc2FjdFdyaXRlIHRvIGVuc3VyZSBhbGwgaXRlbXMgYXJlIGNyZWF0ZWQgYXRvbWljYWxseVxuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBUcmFuc2FjdFdyaXRlQ29tbWFuZCh7XG4gICAgICAgIFRyYW5zYWN0SXRlbXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBQdXQ6IHtcbiAgICAgICAgICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgICAgICAgICAgSXRlbTogY2Fub25pY2FsSXRlbSxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uRXhwcmVzc2lvbjogJ2F0dHJpYnV0ZV9ub3RfZXhpc3RzKFBLKScsIC8vIEVuc3VyZSBtZW1iZXJzaGlwIGRvZXNuJ3QgYWxyZWFkeSBleGlzdFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFB1dDoge1xuICAgICAgICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICAgICAgICBJdGVtOiB1c2VySW5kZXhJdGVtLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFB1dDoge1xuICAgICAgICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICAgICAgICBJdGVtOiBjbHViTWVtYmVySW5kZXhJdGVtLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSk7XG5cbiAgICAgIGF3YWl0IHRoaXMuZHluYW1vQ2xpZW50LnNlbmQoY29tbWFuZCk7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG5cbiAgICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnTWVtYmVyc2hpcCBjcmVhdGVkIGluIER5bmFtb0RCJywge1xuICAgICAgICBjbHViSWQsXG4gICAgICAgIHVzZXJJZCxcbiAgICAgICAgbWVtYmVyc2hpcElkOiBtZW1iZXJzaGlwLm1lbWJlcnNoaXBJZCxcbiAgICAgICAgcm9sZTogbWVtYmVyc2hpcC5yb2xlLFxuICAgICAgICBzdGF0dXM6IG1lbWJlcnNoaXAuc3RhdHVzLFxuICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgb3BlcmF0aW9uOiAnY3JlYXRlX21lbWJlcnNoaXAnLFxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBtZW1iZXJzaGlwO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdGYWlsZWQgdG8gY3JlYXRlIG1lbWJlcnNoaXAnLCB7XG4gICAgICAgIGNsdWJJZCxcbiAgICAgICAgdXNlcklkLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgICBvcGVyYXRpb246ICdjcmVhdGVfbWVtYmVyc2hpcCcsXG4gICAgICB9KTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgbWVtYmVyc2hpcCByb2xlXG4gICAqL1xuICBhc3luYyB1cGRhdGVNZW1iZXJzaGlwUm9sZShtZW1iZXJzaGlwSWQ6IHN0cmluZywgaW5wdXQ6IFVwZGF0ZU1lbWJlcklucHV0LCB1cGRhdGVkQnk6IHN0cmluZyk6IFByb21pc2U8Q2x1Yk1lbWJlcnNoaXA+IHtcbiAgICAvLyBUaGlzIHdvdWxkIHJlcXVpcmUgaW1wbGVtZW50aW5nIG1lbWJlcnNoaXAgbG9va3VwIGJ5IElEIGFuZCB1cGRhdGUgbG9naWNcbiAgICAvLyBGb3IgUGhhc2UgMi4yIE1WUCwgd2UnbGwgaW1wbGVtZW50IGEgc2ltcGxpZmllZCB2ZXJzaW9uXG4gICAgdGhyb3cgbmV3IEVycm9yKCd1cGRhdGVNZW1iZXJzaGlwUm9sZSBub3QgZnVsbHkgaW1wbGVtZW50ZWQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgbWVtYmVyc2hpcCBzdGF0dXNcbiAgICovXG4gIGFzeW5jIHVwZGF0ZU1lbWJlcnNoaXBTdGF0dXMoXG4gICAgbWVtYmVyc2hpcElkOiBzdHJpbmcsXG4gICAgc3RhdHVzOiBNZW1iZXJzaGlwU3RhdHVzLFxuICAgIHByb2Nlc3NlZEJ5Pzogc3RyaW5nLFxuICAgIHJlYXNvbj86IHN0cmluZ1xuICApOiBQcm9taXNlPENsdWJNZW1iZXJzaGlwPiB7XG4gICAgLy8gVGhpcyB3b3VsZCByZXF1aXJlIGltcGxlbWVudGluZyBtZW1iZXJzaGlwIGxvb2t1cCBieSBJRCBhbmQgdXBkYXRlIGxvZ2ljXG4gICAgLy8gRm9yIFBoYXNlIDIuMiBNVlAsIHdlJ2xsIGltcGxlbWVudCBhIHNpbXBsaWZpZWQgdmVyc2lvblxuICAgIHRocm93IG5ldyBFcnJvcigndXBkYXRlTWVtYmVyc2hpcFN0YXR1cyBub3QgZnVsbHkgaW1wbGVtZW50ZWQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgbWVtYmVyc2hpcFxuICAgKi9cbiAgYXN5bmMgcmVtb3ZlTWVtYmVyc2hpcChtZW1iZXJzaGlwSWQ6IHN0cmluZywgcmVtb3ZlZEJ5OiBzdHJpbmcsIHJlYXNvbj86IHN0cmluZyk6IFByb21pc2U8Q2x1Yk1lbWJlcnNoaXA+IHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVNZW1iZXJzaGlwU3RhdHVzKG1lbWJlcnNoaXBJZCwgTWVtYmVyc2hpcFN0YXR1cy5SRU1PVkVELCByZW1vdmVkQnksIHJlYXNvbik7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgdXNlciBpcyBhIG1lbWJlciBvZiBjbHViXG4gICAqL1xuICBhc3luYyBpc1VzZXJNZW1iZXIoY2x1YklkOiBzdHJpbmcsIHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgbWVtYmVyc2hpcCA9IGF3YWl0IHRoaXMuZ2V0TWVtYmVyc2hpcEJ5Q2x1YkFuZFVzZXIoY2x1YklkLCB1c2VySWQpO1xuICAgIHJldHVybiBtZW1iZXJzaGlwICE9PSBudWxsICYmIG1lbWJlcnNoaXAuc3RhdHVzID09PSBNZW1iZXJzaGlwU3RhdHVzLkFDVElWRTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdXNlcidzIHJvbGUgaW4gY2x1YlxuICAgKi9cbiAgYXN5bmMgZ2V0VXNlclJvbGVJbkNsdWIoY2x1YklkOiBzdHJpbmcsIHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxDbHViUm9sZSB8IG51bGw+IHtcbiAgICBjb25zdCBtZW1iZXJzaGlwID0gYXdhaXQgdGhpcy5nZXRNZW1iZXJzaGlwQnlDbHViQW5kVXNlcihjbHViSWQsIHVzZXJJZCk7XG4gICAgcmV0dXJuIG1lbWJlcnNoaXAgJiYgbWVtYmVyc2hpcC5zdGF0dXMgPT09IE1lbWJlcnNoaXBTdGF0dXMuQUNUSVZFID8gbWVtYmVyc2hpcC5yb2xlIDogbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb3VudCBjbHViIG1lbWJlcnMgYnkgc3RhdHVzXG4gICAqL1xuICBhc3luYyBjb3VudENsdWJNZW1iZXJzKGNsdWJJZDogc3RyaW5nLCBzdGF0dXM6IE1lbWJlcnNoaXBTdGF0dXMgPSBNZW1iZXJzaGlwU3RhdHVzLkFDVElWRSk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgLy8gVGhpcyB3b3VsZCByZXF1aXJlIGEgY291bnQgcXVlcnkgb3IgYWdncmVnYXRpb25cbiAgICAvLyBGb3IgUGhhc2UgMi4yIE1WUCwgd2UnbGwgaW1wbGVtZW50IGEgc2ltcGxpZmllZCB2ZXJzaW9uXG4gICAgY29uc3QgbWVtYmVycyA9IGF3YWl0IHRoaXMubGlzdENsdWJNZW1iZXJzKGNsdWJJZCwgeyBzdGF0dXMsIGxpbWl0OiAxMDAwIH0pO1xuICAgIHJldHVybiBtZW1iZXJzLm1lbWJlcnMubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBjbHViIG93bmVyXG4gICAqL1xuICBhc3luYyBnZXRDbHViT3duZXIoY2x1YklkOiBzdHJpbmcpOiBQcm9taXNlPENsdWJNZW1iZXJzaGlwIHwgbnVsbD4ge1xuICAgIGNvbnN0IG1lbWJlcnMgPSBhd2FpdCB0aGlzLmxpc3RDbHViTWVtYmVycyhjbHViSWQsIHsgcm9sZTogQ2x1YlJvbGUuT1dORVIsIHN0YXR1czogTWVtYmVyc2hpcFN0YXR1cy5BQ1RJVkUgfSk7XG4gICAgcmV0dXJuIG1lbWJlcnMubWVtYmVycy5sZW5ndGggPiAwID8gdGhpcy5tZW1iZXJJbmZvVG9NZW1iZXJzaGlwKG1lbWJlcnMubWVtYmVyc1swXSkgOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBjbHViIGFkbWlucyAoaW5jbHVkaW5nIG93bmVyKVxuICAgKi9cbiAgYXN5bmMgZ2V0Q2x1YkFkbWlucyhjbHViSWQ6IHN0cmluZyk6IFByb21pc2U8Q2x1Yk1lbWJlcnNoaXBbXT4ge1xuICAgIGNvbnN0IFthZG1pbnMsIG93bmVyc10gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICB0aGlzLmxpc3RDbHViTWVtYmVycyhjbHViSWQsIHsgcm9sZTogQ2x1YlJvbGUuQURNSU4sIHN0YXR1czogTWVtYmVyc2hpcFN0YXR1cy5BQ1RJVkUgfSksXG4gICAgICB0aGlzLmxpc3RDbHViTWVtYmVycyhjbHViSWQsIHsgcm9sZTogQ2x1YlJvbGUuT1dORVIsIHN0YXR1czogTWVtYmVyc2hpcFN0YXR1cy5BQ1RJVkUgfSksXG4gICAgXSk7XG5cbiAgICByZXR1cm4gW1xuICAgICAgLi4uYWRtaW5zLm1lbWJlcnMubWFwKG1lbWJlciA9PiB0aGlzLm1lbWJlckluZm9Ub01lbWJlcnNoaXAobWVtYmVyKSksXG4gICAgICAuLi5vd25lcnMubWVtYmVycy5tYXAobWVtYmVyID0+IHRoaXMubWVtYmVySW5mb1RvTWVtYmVyc2hpcChtZW1iZXIpKSxcbiAgICBdO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHVzZXIgaGFzIHBlbmRpbmcgbWVtYmVyc2hpcCByZXF1ZXN0XG4gICAqL1xuICBhc3luYyBoYXNQZW5kaW5nTWVtYmVyc2hpcFJlcXVlc3QoY2x1YklkOiBzdHJpbmcsIHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgbWVtYmVyc2hpcCA9IGF3YWl0IHRoaXMuZ2V0TWVtYmVyc2hpcEJ5Q2x1YkFuZFVzZXIoY2x1YklkLCB1c2VySWQpO1xuICAgIHJldHVybiBtZW1iZXJzaGlwICE9PSBudWxsICYmIG1lbWJlcnNoaXAuc3RhdHVzID09PSBNZW1iZXJzaGlwU3RhdHVzLlBFTkRJTkc7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGNsdWIgbWVtYmVyIGNvdW50IChhY3RpdmUgbWVtYmVycyBvbmx5KVxuICAgKi9cbiAgYXN5bmMgZ2V0Q2x1Yk1lbWJlckNvdW50KGNsdWJJZDogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICByZXR1cm4gdGhpcy5jb3VudENsdWJNZW1iZXJzKGNsdWJJZCwgTWVtYmVyc2hpcFN0YXR1cy5BQ1RJVkUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgRHluYW1vREIgY2Fub25pY2FsIGl0ZW0gdG8gTWVtYmVyc2hpcFxuICAgKi9cbiAgcHJpdmF0ZSBkeW5hbW9JdGVtVG9NZW1iZXJzaGlwKGl0ZW06IE1lbWJlcnNoaXBEeW5hbW9JdGVtKTogQ2x1Yk1lbWJlcnNoaXAge1xuICAgIHJldHVybiB7XG4gICAgICBtZW1iZXJzaGlwSWQ6IGl0ZW0ubWVtYmVyc2hpcElkLFxuICAgICAgY2x1YklkOiBpdGVtLmNsdWJJZCxcbiAgICAgIHVzZXJJZDogaXRlbS51c2VySWQsXG4gICAgICByb2xlOiBpdGVtLnJvbGUsXG4gICAgICBzdGF0dXM6IGl0ZW0uc3RhdHVzLFxuICAgICAgam9pbmVkQXQ6IGl0ZW0uam9pbmVkQXQsXG4gICAgICB1cGRhdGVkQXQ6IGl0ZW0udXBkYXRlZEF0LFxuICAgICAgam9pbk1lc3NhZ2U6IGl0ZW0uam9pbk1lc3NhZ2UsXG4gICAgICBpbnZpdGVkQnk6IGl0ZW0uaW52aXRlZEJ5LFxuICAgICAgcHJvY2Vzc2VkQnk6IGl0ZW0ucHJvY2Vzc2VkQnksXG4gICAgICBwcm9jZXNzZWRBdDogaXRlbS5wcm9jZXNzZWRBdCxcbiAgICAgIHJlYXNvbjogaXRlbS5yZWFzb24sXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0IENsdWJNZW1iZXJJbmZvIHRvIENsdWJNZW1iZXJzaGlwXG4gICAqL1xuICBwcml2YXRlIG1lbWJlckluZm9Ub01lbWJlcnNoaXAobWVtYmVySW5mbzogQ2x1Yk1lbWJlckluZm8pOiBDbHViTWVtYmVyc2hpcCB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1lbWJlcnNoaXBJZDogbWVtYmVySW5mby5tZW1iZXJzaGlwSWQsXG4gICAgICBjbHViSWQ6ICcnLCAvLyBXb3VsZCBuZWVkIHRvIGJlIHByb3ZpZGVkIG9yIGxvb2tlZCB1cFxuICAgICAgdXNlcklkOiBtZW1iZXJJbmZvLnVzZXJJZCxcbiAgICAgIHJvbGU6IG1lbWJlckluZm8ucm9sZSxcbiAgICAgIHN0YXR1czogbWVtYmVySW5mby5zdGF0dXMsXG4gICAgICBqb2luZWRBdDogbWVtYmVySW5mby5qb2luZWRBdCxcbiAgICAgIHVwZGF0ZWRBdDogbWVtYmVySW5mby51cGRhdGVkQXQgfHwgbWVtYmVySW5mby5qb2luZWRBdCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgTWVtYmVyc2hpcCB0byBEeW5hbW9EQiBjYW5vbmljYWwgaXRlbVxuICAgKi9cbiAgcHJpdmF0ZSBtZW1iZXJzaGlwVG9DYW5vbmljYWxJdGVtKG1lbWJlcnNoaXA6IENsdWJNZW1iZXJzaGlwKTogTWVtYmVyc2hpcER5bmFtb0l0ZW0ge1xuICAgIHJldHVybiB7XG4gICAgICBQSzogYENMVUIjJHttZW1iZXJzaGlwLmNsdWJJZH1gLFxuICAgICAgU0s6IGBNRU1CRVIjJHttZW1iZXJzaGlwLnVzZXJJZH1gLFxuICAgICAgZW50aXR5VHlwZTogJ0NMVUJfTUVNQkVSU0hJUCcsXG4gICAgICBtZW1iZXJzaGlwSWQ6IG1lbWJlcnNoaXAubWVtYmVyc2hpcElkLFxuICAgICAgY2x1YklkOiBtZW1iZXJzaGlwLmNsdWJJZCxcbiAgICAgIHVzZXJJZDogbWVtYmVyc2hpcC51c2VySWQsXG4gICAgICByb2xlOiBtZW1iZXJzaGlwLnJvbGUsXG4gICAgICBzdGF0dXM6IG1lbWJlcnNoaXAuc3RhdHVzLFxuICAgICAgam9pbmVkQXQ6IG1lbWJlcnNoaXAuam9pbmVkQXQsXG4gICAgICB1cGRhdGVkQXQ6IG1lbWJlcnNoaXAudXBkYXRlZEF0LFxuICAgICAgam9pbk1lc3NhZ2U6IG1lbWJlcnNoaXAuam9pbk1lc3NhZ2UsXG4gICAgICBpbnZpdGVkQnk6IG1lbWJlcnNoaXAuaW52aXRlZEJ5LFxuICAgICAgcHJvY2Vzc2VkQnk6IG1lbWJlcnNoaXAucHJvY2Vzc2VkQnksXG4gICAgICBwcm9jZXNzZWRBdDogbWVtYmVyc2hpcC5wcm9jZXNzZWRBdCxcbiAgICAgIHJlYXNvbjogbWVtYmVyc2hpcC5yZWFzb24sXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0IE1lbWJlcnNoaXAgdG8gRHluYW1vREIgdXNlciBpbmRleCBpdGVtXG4gICAqL1xuICBwcml2YXRlIG1lbWJlcnNoaXBUb1VzZXJJbmRleEl0ZW0obWVtYmVyc2hpcDogQ2x1Yk1lbWJlcnNoaXApOiBVc2VyTWVtYmVyc2hpcER5bmFtb0l0ZW0ge1xuICAgIGNvbnN0IHNrID0gYE1FTUJFUlNISVAjJHttZW1iZXJzaGlwLmNsdWJJZH1gO1xuICAgIHJldHVybiB7XG4gICAgICBQSzogYFVTRVIjJHttZW1iZXJzaGlwLnVzZXJJZH1gLFxuICAgICAgU0s6IHNrLFxuICAgICAgR1NJMVBLOiBgVVNFUiMke21lbWJlcnNoaXAudXNlcklkfWAsXG4gICAgICBHU0kxU0s6IHNrLFxuICAgICAgZW50aXR5VHlwZTogJ1VTRVJfTUVNQkVSU0hJUCcsXG4gICAgICBtZW1iZXJzaGlwSWQ6IG1lbWJlcnNoaXAubWVtYmVyc2hpcElkLFxuICAgICAgY2x1YklkOiBtZW1iZXJzaGlwLmNsdWJJZCxcbiAgICAgIHVzZXJJZDogbWVtYmVyc2hpcC51c2VySWQsXG4gICAgICByb2xlOiBtZW1iZXJzaGlwLnJvbGUsXG4gICAgICBzdGF0dXM6IG1lbWJlcnNoaXAuc3RhdHVzLFxuICAgICAgam9pbmVkQXQ6IG1lbWJlcnNoaXAuam9pbmVkQXQsXG4gICAgICB1cGRhdGVkQXQ6IG1lbWJlcnNoaXAudXBkYXRlZEF0LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydCBNZW1iZXJzaGlwIHRvIER5bmFtb0RCIGNsdWIgbWVtYmVyIGluZGV4IGl0ZW1cbiAgICovXG4gIHByaXZhdGUgbWVtYmVyc2hpcFRvQ2x1Yk1lbWJlckluZGV4SXRlbShtZW1iZXJzaGlwOiBDbHViTWVtYmVyc2hpcCk6IENsdWJNZW1iZXJEeW5hbW9JdGVtIHtcbiAgICBjb25zdCBzayA9IGBST0xFIyR7bWVtYmVyc2hpcC5yb2xlfSNVU0VSIyR7bWVtYmVyc2hpcC51c2VySWR9YDtcbiAgICByZXR1cm4ge1xuICAgICAgUEs6IGBDTFVCIyR7bWVtYmVyc2hpcC5jbHViSWR9I01FTUJFUlNgLFxuICAgICAgU0s6IHNrLFxuICAgICAgR1NJMlBLOiBgQ0xVQiMke21lbWJlcnNoaXAuY2x1YklkfSNNRU1CRVJTYCxcbiAgICAgIEdTSTJTSzogc2ssXG4gICAgICBlbnRpdHlUeXBlOiAnQ0xVQl9NRU1CRVJfSU5ERVgnLFxuICAgICAgbWVtYmVyc2hpcElkOiBtZW1iZXJzaGlwLm1lbWJlcnNoaXBJZCxcbiAgICAgIHVzZXJJZDogbWVtYmVyc2hpcC51c2VySWQsXG4gICAgICByb2xlOiBtZW1iZXJzaGlwLnJvbGUsXG4gICAgICBzdGF0dXM6IG1lbWJlcnNoaXAuc3RhdHVzLFxuICAgICAgam9pbmVkQXQ6IG1lbWJlcnNoaXAuam9pbmVkQXQsXG4gICAgICB1cGRhdGVkQXQ6IG1lbWJlcnNoaXAudXBkYXRlZEF0LFxuICAgIH07XG4gIH1cbn0iXX0=