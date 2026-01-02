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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHluYW1vZGItbWVtYmVyc2hpcC1yZXBvc2l0b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZHluYW1vZGItbWVtYmVyc2hpcC1yZXBvc2l0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBRUgsOERBQTBEO0FBQzFELHdEQU0rQjtBQUMvQixpRUFjMEM7QUFFMUMscUVBQW1FO0FBR25FLGdFQUF1RjtBQUd2Rjs7R0FFRztBQUNILE1BQWEsNEJBQTRCO0lBSXZDLFlBQ0UsU0FBa0IsRUFDVixjQUFnQyxFQUN4QyxZQUE2QjtRQURyQixtQkFBYyxHQUFkLGNBQWMsQ0FBa0I7UUFHeEMsTUFBTSxNQUFNLEdBQUcsWUFBWSxJQUFJLElBQUksZ0NBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN0RCxJQUFJLENBQUMsWUFBWSxHQUFHLHFDQUFzQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN4RCxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSxnQ0FBZ0MsQ0FBQztJQUNoRyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsMEJBQTBCLENBQUMsTUFBYyxFQUFFLE1BQWM7UUFDN0QsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRTdCLElBQUk7WUFDRixNQUFNLE9BQU8sR0FBRyxJQUFJLHlCQUFVLENBQUM7Z0JBQzdCLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztnQkFDekIsR0FBRyxFQUFFO29CQUNILEVBQUUsRUFBRSxRQUFRLE1BQU0sRUFBRTtvQkFDcEIsRUFBRSxFQUFFLFVBQVUsTUFBTSxFQUFFO2lCQUN2QjthQUNGLENBQUMsQ0FBQztZQUVILE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckQsTUFBTSxR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QVUsQ0FBQyxNQUFNO1lBQ3pCLElBQUksRUFBRSxVQUFVLENBQUMsSUFBSTtZQUNyQixNQUFNLEVBQUUsVUFBVSxDQUFDLE1BQU07WUFDekIsUUFBUSxFQUFFLFVBQVUsQ0FBQyxRQUFRO1lBQzdCLFNBQVMsRUFBRSxVQUFVLENBQUMsU0FBUztTQUNoQyxDQUFDO0lBQ0osQ0FBQztJQUVEOztPQUVHO0lBQ0ssK0JBQStCLENBQUMsVUFBMEI7UUFDaEUsTUFBTSxFQUFFLEdBQUcsUUFBUSxVQUFVLENBQUMsSUFBSSxTQUFTLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUMvRCxPQUFPO1lBQ0wsRUFBRSxFQUFFLFFBQVEsVUFBVSxDQUFDLE1BQU0sVUFBVTtZQUN2QyxFQUFFLEVBQUUsRUFBRTtZQUNOLE1BQU0sRUFBRSxRQUFRLFVBQVUsQ0FBQyxNQUFNLFVBQVU7WUFDM0MsTUFBTSxFQUFFLEVBQUU7WUFDVixVQUFVLEVBQUUsbUJBQW1CO1lBQy9CLFlBQVksRUFBRSxVQUFVLENBQUMsWUFBWTtZQUNyQyxNQUFNLEVBQUUsVUFBVSxDQUFDLE1BQU07WUFDekIsSUFBSSxFQUFFLFVBQVUsQ0FBQyxJQUFJO1lBQ3JCLE1BQU0sRUFBRSxVQUFVLENBQUMsTUFBTTtZQUN6QixRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVE7WUFDN0IsU0FBUyxFQUFFLFVBQVUsQ0FBQyxTQUFTO1NBQ2hDLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUF0aEJELG9FQXNoQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIER5bmFtb0RCIE1lbWJlcnNoaXAgUmVwb3NpdG9yeSAtIFBoYXNlIDIuMlxuICogXG4gKiBEeW5hbW9EQiBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgbWVtYmVyc2hpcCByZXBvc2l0b3J5IGludGVyZmFjZS5cbiAqIFVzZXMgc2luZ2xlLXRhYmxlIGRlc2lnbiB3aXRoIG11bHRpcGxlIGluZGV4IGl0ZW1zIGZvciBlZmZpY2llbnQgcXVlcmllcy5cbiAqIFxuICogQ29tcGxpYW5jZTpcbiAqIC0gUGhhc2UgMi4yIFNwZWM6IC5raXJvL3NwZWNzL3BoYXNlLTIuMi5jbHViLW1lbWJlcnNoaXAtcm9sZXMudjEubWRcbiAqL1xuXG5pbXBvcnQgeyBEeW5hbW9EQkNsaWVudCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYic7XG5pbXBvcnQge1xuICBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LFxuICBHZXRDb21tYW5kLFxuICBRdWVyeUNvbW1hbmQsXG4gIFRyYW5zYWN0V3JpdGVDb21tYW5kLFxuICBCYXRjaEdldENvbW1hbmQsXG59IGZyb20gJ0Bhd3Mtc2RrL2xpYi1keW5hbW9kYic7XG5pbXBvcnQge1xuICBDbHViTWVtYmVyc2hpcCxcbiAgQ2x1YlJvbGUsXG4gIE1lbWJlcnNoaXBTdGF0dXMsXG4gIEpvaW5DbHViSW5wdXQsXG4gIFVwZGF0ZU1lbWJlcklucHV0LFxuICBMaXN0TWVtYmVyc09wdGlvbnMsXG4gIExpc3RNZW1iZXJzUmVzdWx0LFxuICBDbHViTWVtYmVySW5mbyxcbiAgVXNlck1lbWJlcnNoaXBTdW1tYXJ5LFxuICBNZW1iZXJzaGlwRHluYW1vSXRlbSxcbiAgVXNlck1lbWJlcnNoaXBEeW5hbW9JdGVtLFxuICBDbHViTWVtYmVyRHluYW1vSXRlbSxcbiAgTUVNQkVSU0hJUF9DT05TVFJBSU5UUyxcbn0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL3R5cGVzL21lbWJlcnNoaXAnO1xuaW1wb3J0IHsgTm90Rm91bmRFcnJvciB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC91dGlscy9lcnJvcnMnO1xuaW1wb3J0IHsgbG9nU3RydWN0dXJlZCB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC91dGlscy9sYW1iZGEtdXRpbHMnO1xuaW1wb3J0IHsgSU1lbWJlcnNoaXBSZXBvc2l0b3J5IH0gZnJvbSAnLi4vZG9tYWluL21lbWJlcnNoaXAvbWVtYmVyc2hpcC1yZXBvc2l0b3J5JztcbmltcG9ydCB7IElVc2VyUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL3VzZXItcHJvZmlsZS9kb21haW4vdXNlci1yZXBvc2l0b3J5JztcbmltcG9ydCB7IGNyZWF0ZU1lbWJlcnNoaXAsIGZyb21NZW1iZXJzaGlwRGF0YSB9IGZyb20gJy4uL2RvbWFpbi9tZW1iZXJzaGlwL21lbWJlcnNoaXAnO1xuaW1wb3J0IHsgTWVtYmVyc2hpcE5vdEZvdW5kRXJyb3IgfSBmcm9tICcuLi9kb21haW4vbWVtYmVyc2hpcC9tZW1iZXJzaGlwLWVycm9ycyc7XG5cbi8qKlxuICogRHluYW1vREIgbWVtYmVyc2hpcCByZXBvc2l0b3J5IGltcGxlbWVudGF0aW9uXG4gKi9cbmV4cG9ydCBjbGFzcyBEeW5hbW9EQk1lbWJlcnNoaXBSZXBvc2l0b3J5IGltcGxlbWVudHMgSU1lbWJlcnNoaXBSZXBvc2l0b3J5IHtcbiAgcHJpdmF0ZSBkeW5hbW9DbGllbnQ6IER5bmFtb0RCRG9jdW1lbnRDbGllbnQ7XG4gIHByaXZhdGUgdGFibGVOYW1lOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgdGFibGVOYW1lPzogc3RyaW5nLFxuICAgIHByaXZhdGUgdXNlclJlcG9zaXRvcnk/OiBJVXNlclJlcG9zaXRvcnksXG4gICAgZHluYW1vQ2xpZW50PzogRHluYW1vREJDbGllbnRcbiAgKSB7XG4gICAgY29uc3QgY2xpZW50ID0gZHluYW1vQ2xpZW50IHx8IG5ldyBEeW5hbW9EQkNsaWVudCh7fSk7XG4gICAgdGhpcy5keW5hbW9DbGllbnQgPSBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LmZyb20oY2xpZW50KTtcbiAgICB0aGlzLnRhYmxlTmFtZSA9IHRhYmxlTmFtZSB8fCBwcm9jZXNzLmVudi5NQUlOX1RBQkxFX05BTUUgfHwgJ3N5ZG5leS1jeWNsZXMtbWFpbi1kZXZlbG9wbWVudCc7XG4gIH1cblxuICAvKipcbiAgICogR2V0IG1lbWJlcnNoaXAgYnkgY2x1YiBhbmQgdXNlclxuICAgKi9cbiAgYXN5bmMgZ2V0TWVtYmVyc2hpcEJ5Q2x1YkFuZFVzZXIoY2x1YklkOiBzdHJpbmcsIHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxDbHViTWVtYmVyc2hpcCB8IG51bGw+IHtcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgR2V0Q29tbWFuZCh7XG4gICAgICAgIFRhYmxlTmFtZTogdGhpcy50YWJsZU5hbWUsXG4gICAgICAgIEtleToge1xuICAgICAgICAgIFBLOiBgQ0xVQiMke2NsdWJJZH1gLFxuICAgICAgICAgIFNLOiBgTUVNQkVSIyR7dXNlcklkfWAsXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5keW5hbW9DbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcblxuICAgICAgaWYgKCFyZXN1bHQuSXRlbSkge1xuICAgICAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ01lbWJlcnNoaXAgbm90IGZvdW5kJywge1xuICAgICAgICAgIGNsdWJJZCxcbiAgICAgICAgICB1c2VySWQsXG4gICAgICAgICAgZHVyYXRpb24sXG4gICAgICAgICAgb3BlcmF0aW9uOiAnZ2V0X21lbWJlcnNoaXBfYnlfY2x1Yl9hbmRfdXNlcicsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbWVtYmVyc2hpcCA9IHRoaXMuZHluYW1vSXRlbVRvTWVtYmVyc2hpcChyZXN1bHQuSXRlbSBhcyBNZW1iZXJzaGlwRHluYW1vSXRlbSk7XG5cbiAgICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnTWVtYmVyc2hpcCByZXRyaWV2ZWQgZnJvbSBEeW5hbW9EQicsIHtcbiAgICAgICAgY2x1YklkLFxuICAgICAgICB1c2VySWQsXG4gICAgICAgIG1lbWJlcnNoaXBJZDogbWVtYmVyc2hpcC5tZW1iZXJzaGlwSWQsXG4gICAgICAgIHJvbGU6IG1lbWJlcnNoaXAucm9sZSxcbiAgICAgICAgc3RhdHVzOiBtZW1iZXJzaGlwLnN0YXR1cyxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIG9wZXJhdGlvbjogJ2dldF9tZW1iZXJzaGlwX2J5X2NsdWJfYW5kX3VzZXInLFxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBtZW1iZXJzaGlwO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdGYWlsZWQgdG8gZ2V0IG1lbWJlcnNoaXAgYnkgY2x1YiBhbmQgdXNlcicsIHtcbiAgICAgICAgY2x1YklkLFxuICAgICAgICB1c2VySWQsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIG9wZXJhdGlvbjogJ2dldF9tZW1iZXJzaGlwX2J5X2NsdWJfYW5kX3VzZXInLFxuICAgICAgfSk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IG1lbWJlcnNoaXAgYnkgSURcbiAgICovXG4gIGFzeW5jIGdldE1lbWJlcnNoaXBCeUlkKG1lbWJlcnNoaXBJZDogc3RyaW5nKTogUHJvbWlzZTxDbHViTWVtYmVyc2hpcCB8IG51bGw+IHtcbiAgICAvLyBGb3IgUGhhc2UgMi4yLCB3ZSBuZWVkIHRvIHNjYW4gb3IgbWFpbnRhaW4gYSBHU0kgZm9yIG1lbWJlcnNoaXAgSUQgbG9va3Vwc1xuICAgIC8vIFRoaXMgaXMgYSBzaW1wbGlmaWVkIGltcGxlbWVudGF0aW9uIC0gaW4gcHJvZHVjdGlvbiwgY29uc2lkZXIgYWRkaW5nIGEgR1NJXG4gICAgdGhyb3cgbmV3IEVycm9yKCdnZXRNZW1iZXJzaGlwQnlJZCBub3QgaW1wbGVtZW50ZWQgLSByZXF1aXJlcyBHU0kgb3Igc2NhbiBvcGVyYXRpb24nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGNsdWIgbWVtYmVycyB3aXRoIHBhZ2luYXRpb24gYW5kIGZpbHRlcmluZ1xuICAgKi9cbiAgYXN5bmMgbGlzdENsdWJNZW1iZXJzKGNsdWJJZDogc3RyaW5nLCBvcHRpb25zOiBMaXN0TWVtYmVyc09wdGlvbnMpOiBQcm9taXNlPExpc3RNZW1iZXJzUmVzdWx0PiB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCBsaW1pdCA9IG9wdGlvbnMubGltaXQgfHwgTUVNQkVSU0hJUF9DT05TVFJBSU5UUy5ERUZBVUxUX0xJU1RfTElNSVQ7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcXVlcnlQYXJhbXM6IGFueSA9IHtcbiAgICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgICAgSW5kZXhOYW1lOiAnR1NJMicsXG4gICAgICAgIEtleUNvbmRpdGlvbkV4cHJlc3Npb246ICdHU0kyUEsgPSA6Z3NpMnBrJyxcbiAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xuICAgICAgICAgICc6Z3NpMnBrJzogYENMVUIjJHtjbHViSWR9I01FTUJFUlNgLFxuICAgICAgICB9LFxuICAgICAgICBMaW1pdDogbGltaXQgKyAxLCAvLyBHZXQgb25lIGV4dHJhIHRvIGRldGVybWluZSBpZiB0aGVyZSBhcmUgbW9yZSByZXN1bHRzXG4gICAgICAgIFNjYW5JbmRleEZvcndhcmQ6IHRydWUsXG4gICAgICB9O1xuXG4gICAgICAvLyBBZGQgcm9sZSBmaWx0ZXJcbiAgICAgIGlmIChvcHRpb25zLnJvbGUpIHtcbiAgICAgICAgcXVlcnlQYXJhbXMuS2V5Q29uZGl0aW9uRXhwcmVzc2lvbiArPSAnIEFORCBiZWdpbnNfd2l0aChHU0kyU0ssIDpyb2xlUHJlZml4KSc7XG4gICAgICAgIHF1ZXJ5UGFyYW1zLkV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXNbJzpyb2xlUHJlZml4J10gPSBgUk9MRSMke29wdGlvbnMucm9sZX0jYDtcbiAgICAgIH1cblxuICAgICAgLy8gQWRkIHN0YXR1cyBmaWx0ZXJcbiAgICAgIGlmIChvcHRpb25zLnN0YXR1cykge1xuICAgICAgICBxdWVyeVBhcmFtcy5GaWx0ZXJFeHByZXNzaW9uID0gJyNzdGF0dXMgPSA6c3RhdHVzJztcbiAgICAgICAgcXVlcnlQYXJhbXMuRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzID0ge1xuICAgICAgICAgICcjc3RhdHVzJzogJ3N0YXR1cycsXG4gICAgICAgIH07XG4gICAgICAgIHF1ZXJ5UGFyYW1zLkV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXNbJzpzdGF0dXMnXSA9IG9wdGlvbnMuc3RhdHVzO1xuICAgICAgfVxuXG4gICAgICAvLyBBZGQgY3Vyc29yIGZvciBwYWdpbmF0aW9uXG4gICAgICBpZiAob3B0aW9ucy5jdXJzb3IpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBkZWNvZGVkQ3Vyc29yID0gSlNPTi5wYXJzZShCdWZmZXIuZnJvbShvcHRpb25zLmN1cnNvciwgJ2Jhc2U2NCcpLnRvU3RyaW5nKCkpO1xuICAgICAgICAgIHF1ZXJ5UGFyYW1zLkV4Y2x1c2l2ZVN0YXJ0S2V5ID0ge1xuICAgICAgICAgICAgR1NJMlBLOiBgQ0xVQiMke2NsdWJJZH0jTUVNQkVSU2AsXG4gICAgICAgICAgICBHU0kyU0s6IGBST0xFIyR7ZGVjb2RlZEN1cnNvci5yb2xlfSNVU0VSIyR7ZGVjb2RlZEN1cnNvci51c2VySWR9YCxcbiAgICAgICAgICAgIFBLOiBgQ0xVQiMke2NsdWJJZH0jTUVNQkVSU2AsXG4gICAgICAgICAgICBTSzogYFJPTEUjJHtkZWNvZGVkQ3Vyc29yLnJvbGV9I1VTRVIjJHtkZWNvZGVkQ3Vyc29yLnVzZXJJZH1gLFxuICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGN1cnNvciBmb3JtYXQnKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBjb21tYW5kID0gbmV3IFF1ZXJ5Q29tbWFuZChxdWVyeVBhcmFtcyk7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmR5bmFtb0NsaWVudC5zZW5kKGNvbW1hbmQpO1xuICAgICAgY29uc3QgZHVyYXRpb24gPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuXG4gICAgICBjb25zdCBpdGVtcyA9IHJlc3VsdC5JdGVtcyB8fCBbXTtcbiAgICAgIGNvbnN0IGhhc01vcmUgPSBpdGVtcy5sZW5ndGggPiBsaW1pdDtcbiAgICAgIGNvbnN0IG1lbWJlckl0ZW1zID0gaXRlbXMuc2xpY2UoMCwgbGltaXQpO1xuXG4gICAgICAvLyBFbnJpY2ggd2l0aCB1c2VyIGRhdGFcbiAgICAgIGNvbnN0IG1lbWJlcnM6IENsdWJNZW1iZXJJbmZvW10gPSBbXTtcbiAgICAgIGlmICh0aGlzLnVzZXJSZXBvc2l0b3J5ICYmIG1lbWJlckl0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgdXNlcklkcyA9IG1lbWJlckl0ZW1zLm1hcChpdGVtID0+IChpdGVtIGFzIENsdWJNZW1iZXJEeW5hbW9JdGVtKS51c2VySWQpO1xuICAgICAgICBjb25zdCB1c2VycyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICAgIHVzZXJJZHMubWFwKHVzZXJJZCA9PiB0aGlzLnVzZXJSZXBvc2l0b3J5IS5nZXRVc2VyQnlJZCh1c2VySWQpKVxuICAgICAgICApO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWVtYmVySXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBtZW1iZXJJdGVtID0gbWVtYmVySXRlbXNbaV0gYXMgQ2x1Yk1lbWJlckR5bmFtb0l0ZW07XG4gICAgICAgICAgY29uc3QgdXNlciA9IHVzZXJzW2ldO1xuICAgICAgICAgIFxuICAgICAgICAgIG1lbWJlcnMucHVzaCh7XG4gICAgICAgICAgICBtZW1iZXJzaGlwSWQ6IG1lbWJlckl0ZW0ubWVtYmVyc2hpcElkLFxuICAgICAgICAgICAgdXNlcklkOiBtZW1iZXJJdGVtLnVzZXJJZCxcbiAgICAgICAgICAgIGRpc3BsYXlOYW1lOiB1c2VyPy5kaXNwbGF5TmFtZSB8fCAnVW5rbm93biBVc2VyJyxcbiAgICAgICAgICAgIGVtYWlsOiB1c2VyPy5lbWFpbCB8fCAnJyxcbiAgICAgICAgICAgIGF2YXRhclVybDogdXNlcj8uYXZhdGFyVXJsLFxuICAgICAgICAgICAgcm9sZTogbWVtYmVySXRlbS5yb2xlLFxuICAgICAgICAgICAgc3RhdHVzOiBtZW1iZXJJdGVtLnN0YXR1cyxcbiAgICAgICAgICAgIGpvaW5lZEF0OiBtZW1iZXJJdGVtLmpvaW5lZEF0LFxuICAgICAgICAgICAgdXBkYXRlZEF0OiBtZW1iZXJJdGVtLnVwZGF0ZWRBdCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRmFsbGJhY2sgd2l0aG91dCB1c2VyIGVucmljaG1lbnRcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIG1lbWJlckl0ZW1zKSB7XG4gICAgICAgICAgY29uc3QgbWVtYmVySXRlbSA9IGl0ZW0gYXMgQ2x1Yk1lbWJlckR5bmFtb0l0ZW07XG4gICAgICAgICAgbWVtYmVycy5wdXNoKHtcbiAgICAgICAgICAgIG1lbWJlcnNoaXBJZDogbWVtYmVySXRlbS5tZW1iZXJzaGlwSWQsXG4gICAgICAgICAgICB1c2VySWQ6IG1lbWJlckl0ZW0udXNlcklkLFxuICAgICAgICAgICAgZGlzcGxheU5hbWU6ICdVbmtub3duIFVzZXInLFxuICAgICAgICAgICAgZW1haWw6ICcnLFxuICAgICAgICAgICAgcm9sZTogbWVtYmVySXRlbS5yb2xlLFxuICAgICAgICAgICAgc3RhdHVzOiBtZW1iZXJJdGVtLnN0YXR1cyxcbiAgICAgICAgICAgIGpvaW5lZEF0OiBtZW1iZXJJdGVtLmpvaW5lZEF0LFxuICAgICAgICAgICAgdXBkYXRlZEF0OiBtZW1iZXJJdGVtLnVwZGF0ZWRBdCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBsZXQgbmV4dEN1cnNvcjogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgICAgaWYgKGhhc01vcmUgJiYgbWVtYmVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IGxhc3RNZW1iZXIgPSBtZW1iZXJJdGVtc1ttZW1iZXJJdGVtcy5sZW5ndGggLSAxXSBhcyBDbHViTWVtYmVyRHluYW1vSXRlbTtcbiAgICAgICAgY29uc3QgY3Vyc29yRGF0YSA9IHtcbiAgICAgICAgICByb2xlOiBsYXN0TWVtYmVyLnJvbGUsXG4gICAgICAgICAgdXNlcklkOiBsYXN0TWVtYmVyLnVzZXJJZCxcbiAgICAgICAgfTtcbiAgICAgICAgbmV4dEN1cnNvciA9IEJ1ZmZlci5mcm9tKEpTT04uc3RyaW5naWZ5KGN1cnNvckRhdGEpKS50b1N0cmluZygnYmFzZTY0Jyk7XG4gICAgICB9XG5cbiAgICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnQ2x1YiBtZW1iZXJzIGxpc3RlZCBmcm9tIER5bmFtb0RCJywge1xuICAgICAgICBjbHViSWQsXG4gICAgICAgIHJlc3VsdENvdW50OiBtZW1iZXJzLmxlbmd0aCxcbiAgICAgICAgaGFzTW9yZSxcbiAgICAgICAgcm9sZTogb3B0aW9ucy5yb2xlLFxuICAgICAgICBzdGF0dXM6IG9wdGlvbnMuc3RhdHVzLFxuICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgb3BlcmF0aW9uOiAnbGlzdF9jbHViX21lbWJlcnMnLFxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIG1lbWJlcnMsXG4gICAgICAgIG5leHRDdXJzb3IsXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdGYWlsZWQgdG8gbGlzdCBjbHViIG1lbWJlcnMnLCB7XG4gICAgICAgIGNsdWJJZCxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgb3BlcmF0aW9uOiAnbGlzdF9jbHViX21lbWJlcnMnLFxuICAgICAgfSk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTGlzdCB1c2VyJ3MgY2x1YiBtZW1iZXJzaGlwc1xuICAgKi9cbiAgYXN5bmMgbGlzdFVzZXJNZW1iZXJzaGlwcyh1c2VySWQ6IHN0cmluZywgc3RhdHVzPzogTWVtYmVyc2hpcFN0YXR1cyk6IFByb21pc2U8VXNlck1lbWJlcnNoaXBTdW1tYXJ5W10+IHtcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHF1ZXJ5UGFyYW1zOiBhbnkgPSB7XG4gICAgICAgIFRhYmxlTmFtZTogdGhpcy50YWJsZU5hbWUsXG4gICAgICAgIEluZGV4TmFtZTogJ0dTSTEnLFxuICAgICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiAnR1NJMVBLID0gOmdzaTFwayBBTkQgYmVnaW5zX3dpdGgoR1NJMVNLLCA6bWVtYmVyc2hpcFByZWZpeCknLFxuICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAgICAgJzpnc2kxcGsnOiBgVVNFUiMke3VzZXJJZH1gLFxuICAgICAgICAgICc6bWVtYmVyc2hpcFByZWZpeCc6ICdNRU1CRVJTSElQIycsXG4gICAgICAgIH0sXG4gICAgICB9O1xuXG4gICAgICAvLyBBZGQgc3RhdHVzIGZpbHRlclxuICAgICAgaWYgKHN0YXR1cykge1xuICAgICAgICBxdWVyeVBhcmFtcy5GaWx0ZXJFeHByZXNzaW9uID0gJyNzdGF0dXMgPSA6c3RhdHVzJztcbiAgICAgICAgcXVlcnlQYXJhbXMuRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzID0ge1xuICAgICAgICAgICcjc3RhdHVzJzogJ3N0YXR1cycsXG4gICAgICAgIH07XG4gICAgICAgIHF1ZXJ5UGFyYW1zLkV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXNbJzpzdGF0dXMnXSA9IHN0YXR1cztcbiAgICAgIH1cblxuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBRdWVyeUNvbW1hbmQocXVlcnlQYXJhbXMpO1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5keW5hbW9DbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcblxuICAgICAgY29uc3QgaXRlbXMgPSByZXN1bHQuSXRlbXMgfHwgW107XG4gICAgICBjb25zdCBtZW1iZXJzaGlwczogVXNlck1lbWJlcnNoaXBTdW1tYXJ5W10gPSBpdGVtcy5tYXAoaXRlbSA9PiB7XG4gICAgICAgIGNvbnN0IG1lbWJlcnNoaXBJdGVtID0gaXRlbSBhcyBVc2VyTWVtYmVyc2hpcER5bmFtb0l0ZW07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbWVtYmVyc2hpcElkOiBtZW1iZXJzaGlwSXRlbS5tZW1iZXJzaGlwSWQsXG4gICAgICAgICAgY2x1YklkOiBtZW1iZXJzaGlwSXRlbS5jbHViSWQsXG4gICAgICAgICAgY2x1Yk5hbWU6ICdVbmtub3duIENsdWInLCAvLyBXb3VsZCBuZWVkIGNsdWIgZGF0YSBlbnJpY2htZW50XG4gICAgICAgICAgcm9sZTogbWVtYmVyc2hpcEl0ZW0ucm9sZSxcbiAgICAgICAgICBzdGF0dXM6IG1lbWJlcnNoaXBJdGVtLnN0YXR1cyxcbiAgICAgICAgICBqb2luZWRBdDogbWVtYmVyc2hpcEl0ZW0uam9pbmVkQXQsXG4gICAgICAgIH07XG4gICAgICB9KTtcblxuICAgICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdVc2VyIG1lbWJlcnNoaXBzIGxpc3RlZCBmcm9tIER5bmFtb0RCJywge1xuICAgICAgICB1c2VySWQsXG4gICAgICAgIHJlc3VsdENvdW50OiBtZW1iZXJzaGlwcy5sZW5ndGgsXG4gICAgICAgIHN0YXR1cyxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIG9wZXJhdGlvbjogJ2xpc3RfdXNlcl9tZW1iZXJzaGlwcycsXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIG1lbWJlcnNoaXBzO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdGYWlsZWQgdG8gbGlzdCB1c2VyIG1lbWJlcnNoaXBzJywge1xuICAgICAgICB1c2VySWQsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIG9wZXJhdGlvbjogJ2xpc3RfdXNlcl9tZW1iZXJzaGlwcycsXG4gICAgICB9KTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgbWVtYmVyc2hpcFxuICAgKi9cbiAgYXN5bmMgY3JlYXRlTWVtYmVyc2hpcChcbiAgICBjbHViSWQ6IHN0cmluZyxcbiAgICB1c2VySWQ6IHN0cmluZyxcbiAgICBpbnB1dDogSm9pbkNsdWJJbnB1dCxcbiAgICByb2xlOiBDbHViUm9sZSA9IENsdWJSb2xlLk1FTUJFUixcbiAgICBzdGF0dXM6IE1lbWJlcnNoaXBTdGF0dXMgPSBNZW1iZXJzaGlwU3RhdHVzLlBFTkRJTkdcbiAgKTogUHJvbWlzZTxDbHViTWVtYmVyc2hpcD4ge1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cbiAgICB0cnkge1xuICAgICAgLy8gQ3JlYXRlIG1lbWJlcnNoaXAgZW50aXR5XG4gICAgICBjb25zdCBtZW1iZXJzaGlwRW50aXR5ID0gY3JlYXRlTWVtYmVyc2hpcChjbHViSWQsIHVzZXJJZCwgcm9sZSwgc3RhdHVzLCBpbnB1dC5tZXNzYWdlKTtcbiAgICAgIGNvbnN0IG1lbWJlcnNoaXAgPSBtZW1iZXJzaGlwRW50aXR5LnRvTWVtYmVyc2hpcCgpO1xuXG4gICAgICAvLyBDcmVhdGUgRHluYW1vREIgaXRlbXNcbiAgICAgIGNvbnN0IGNhbm9uaWNhbEl0ZW0gPSB0aGlzLm1lbWJlcnNoaXBUb0Nhbm9uaWNhbEl0ZW0obWVtYmVyc2hpcCk7XG4gICAgICBjb25zdCB1c2VySW5kZXhJdGVtID0gdGhpcy5tZW1iZXJzaGlwVG9Vc2VySW5kZXhJdGVtKG1lbWJlcnNoaXApO1xuICAgICAgY29uc3QgY2x1Yk1lbWJlckluZGV4SXRlbSA9IHRoaXMubWVtYmVyc2hpcFRvQ2x1Yk1lbWJlckluZGV4SXRlbShtZW1iZXJzaGlwKTtcblxuICAgICAgLy8gVXNlIFRyYW5zYWN0V3JpdGUgdG8gZW5zdXJlIGFsbCBpdGVtcyBhcmUgY3JlYXRlZCBhdG9taWNhbGx5XG4gICAgICBjb25zdCBjb21tYW5kID0gbmV3IFRyYW5zYWN0V3JpdGVDb21tYW5kKHtcbiAgICAgICAgVHJhbnNhY3RJdGVtczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIFB1dDoge1xuICAgICAgICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICAgICAgICBJdGVtOiBjYW5vbmljYWxJdGVtLFxuICAgICAgICAgICAgICBDb25kaXRpb25FeHByZXNzaW9uOiAnYXR0cmlidXRlX25vdF9leGlzdHMoUEspJywgLy8gRW5zdXJlIG1lbWJlcnNoaXAgZG9lc24ndCBhbHJlYWR5IGV4aXN0XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgUHV0OiB7XG4gICAgICAgICAgICAgIFRhYmxlTmFtZTogdGhpcy50YWJsZU5hbWUsXG4gICAgICAgICAgICAgIEl0ZW06IHVzZXJJbmRleEl0ZW0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgUHV0OiB7XG4gICAgICAgICAgICAgIFRhYmxlTmFtZTogdGhpcy50YWJsZU5hbWUsXG4gICAgICAgICAgICAgIEl0ZW06IGNsdWJNZW1iZXJJbmRleEl0ZW0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9KTtcblxuICAgICAgYXdhaXQgdGhpcy5keW5hbW9DbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcblxuICAgICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdNZW1iZXJzaGlwIGNyZWF0ZWQgaW4gRHluYW1vREInLCB7XG4gICAgICAgIGNsdWJJZCxcbiAgICAgICAgdXNlcklkLFxuICAgICAgICBtZW1iZXJzaGlwSWQ6IG1lbWJlcnNoaXAubWVtYmVyc2hpcElkLFxuICAgICAgICByb2xlOiBtZW1iZXJzaGlwLnJvbGUsXG4gICAgICAgIHN0YXR1czogbWVtYmVyc2hpcC5zdGF0dXMsXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgICBvcGVyYXRpb246ICdjcmVhdGVfbWVtYmVyc2hpcCcsXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIG1lbWJlcnNoaXA7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICAgIGxvZ1N0cnVjdHVyZWQoJ0VSUk9SJywgJ0ZhaWxlZCB0byBjcmVhdGUgbWVtYmVyc2hpcCcsIHtcbiAgICAgICAgY2x1YklkLFxuICAgICAgICB1c2VySWQsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIG9wZXJhdGlvbjogJ2NyZWF0ZV9tZW1iZXJzaGlwJyxcbiAgICAgIH0pO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBtZW1iZXJzaGlwIHJvbGVcbiAgICovXG4gIGFzeW5jIHVwZGF0ZU1lbWJlcnNoaXBSb2xlKG1lbWJlcnNoaXBJZDogc3RyaW5nLCBpbnB1dDogVXBkYXRlTWVtYmVySW5wdXQsIHVwZGF0ZWRCeTogc3RyaW5nKTogUHJvbWlzZTxDbHViTWVtYmVyc2hpcD4ge1xuICAgIC8vIFRoaXMgd291bGQgcmVxdWlyZSBpbXBsZW1lbnRpbmcgbWVtYmVyc2hpcCBsb29rdXAgYnkgSUQgYW5kIHVwZGF0ZSBsb2dpY1xuICAgIC8vIEZvciBQaGFzZSAyLjIgTVZQLCB3ZSdsbCBpbXBsZW1lbnQgYSBzaW1wbGlmaWVkIHZlcnNpb25cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3VwZGF0ZU1lbWJlcnNoaXBSb2xlIG5vdCBmdWxseSBpbXBsZW1lbnRlZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBtZW1iZXJzaGlwIHN0YXR1c1xuICAgKi9cbiAgYXN5bmMgdXBkYXRlTWVtYmVyc2hpcFN0YXR1cyhcbiAgICBtZW1iZXJzaGlwSWQ6IHN0cmluZyxcbiAgICBzdGF0dXM6IE1lbWJlcnNoaXBTdGF0dXMsXG4gICAgcHJvY2Vzc2VkQnk/OiBzdHJpbmcsXG4gICAgcmVhc29uPzogc3RyaW5nXG4gICk6IFByb21pc2U8Q2x1Yk1lbWJlcnNoaXA+IHtcbiAgICAvLyBUaGlzIHdvdWxkIHJlcXVpcmUgaW1wbGVtZW50aW5nIG1lbWJlcnNoaXAgbG9va3VwIGJ5IElEIGFuZCB1cGRhdGUgbG9naWNcbiAgICAvLyBGb3IgUGhhc2UgMi4yIE1WUCwgd2UnbGwgaW1wbGVtZW50IGEgc2ltcGxpZmllZCB2ZXJzaW9uXG4gICAgdGhyb3cgbmV3IEVycm9yKCd1cGRhdGVNZW1iZXJzaGlwU3RhdHVzIG5vdCBmdWxseSBpbXBsZW1lbnRlZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBtZW1iZXJzaGlwXG4gICAqL1xuICBhc3luYyByZW1vdmVNZW1iZXJzaGlwKG1lbWJlcnNoaXBJZDogc3RyaW5nLCByZW1vdmVkQnk6IHN0cmluZywgcmVhc29uPzogc3RyaW5nKTogUHJvbWlzZTxDbHViTWVtYmVyc2hpcD4ge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZU1lbWJlcnNoaXBTdGF0dXMobWVtYmVyc2hpcElkLCBNZW1iZXJzaGlwU3RhdHVzLlJFTU9WRUQsIHJlbW92ZWRCeSwgcmVhc29uKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB1c2VyIGlzIGEgbWVtYmVyIG9mIGNsdWJcbiAgICovXG4gIGFzeW5jIGlzVXNlck1lbWJlcihjbHViSWQ6IHN0cmluZywgdXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBtZW1iZXJzaGlwID0gYXdhaXQgdGhpcy5nZXRNZW1iZXJzaGlwQnlDbHViQW5kVXNlcihjbHViSWQsIHVzZXJJZCk7XG4gICAgcmV0dXJuIG1lbWJlcnNoaXAgIT09IG51bGwgJiYgbWVtYmVyc2hpcC5zdGF0dXMgPT09IE1lbWJlcnNoaXBTdGF0dXMuQUNUSVZFO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB1c2VyJ3Mgcm9sZSBpbiBjbHViXG4gICAqL1xuICBhc3luYyBnZXRVc2VyUm9sZUluQ2x1YihjbHViSWQ6IHN0cmluZywgdXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPENsdWJSb2xlIHwgbnVsbD4ge1xuICAgIGNvbnN0IG1lbWJlcnNoaXAgPSBhd2FpdCB0aGlzLmdldE1lbWJlcnNoaXBCeUNsdWJBbmRVc2VyKGNsdWJJZCwgdXNlcklkKTtcbiAgICByZXR1cm4gbWVtYmVyc2hpcCAmJiBtZW1iZXJzaGlwLnN0YXR1cyA9PT0gTWVtYmVyc2hpcFN0YXR1cy5BQ1RJVkUgPyBtZW1iZXJzaGlwLnJvbGUgOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIENvdW50IGNsdWIgbWVtYmVycyBieSBzdGF0dXNcbiAgICovXG4gIGFzeW5jIGNvdW50Q2x1Yk1lbWJlcnMoY2x1YklkOiBzdHJpbmcsIHN0YXR1czogTWVtYmVyc2hpcFN0YXR1cyA9IE1lbWJlcnNoaXBTdGF0dXMuQUNUSVZFKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICAvLyBUaGlzIHdvdWxkIHJlcXVpcmUgYSBjb3VudCBxdWVyeSBvciBhZ2dyZWdhdGlvblxuICAgIC8vIEZvciBQaGFzZSAyLjIgTVZQLCB3ZSdsbCBpbXBsZW1lbnQgYSBzaW1wbGlmaWVkIHZlcnNpb25cbiAgICBjb25zdCBtZW1iZXJzID0gYXdhaXQgdGhpcy5saXN0Q2x1Yk1lbWJlcnMoY2x1YklkLCB7IHN0YXR1cywgbGltaXQ6IDEwMDAgfSk7XG4gICAgcmV0dXJuIG1lbWJlcnMubWVtYmVycy5sZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGNsdWIgb3duZXJcbiAgICovXG4gIGFzeW5jIGdldENsdWJPd25lcihjbHViSWQ6IHN0cmluZyk6IFByb21pc2U8Q2x1Yk1lbWJlcnNoaXAgfCBudWxsPiB7XG4gICAgY29uc3QgbWVtYmVycyA9IGF3YWl0IHRoaXMubGlzdENsdWJNZW1iZXJzKGNsdWJJZCwgeyByb2xlOiBDbHViUm9sZS5PV05FUiwgc3RhdHVzOiBNZW1iZXJzaGlwU3RhdHVzLkFDVElWRSB9KTtcbiAgICByZXR1cm4gbWVtYmVycy5tZW1iZXJzLmxlbmd0aCA+IDAgPyB0aGlzLm1lbWJlckluZm9Ub01lbWJlcnNoaXAobWVtYmVycy5tZW1iZXJzWzBdKSA6IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGNsdWIgYWRtaW5zIChpbmNsdWRpbmcgb3duZXIpXG4gICAqL1xuICBhc3luYyBnZXRDbHViQWRtaW5zKGNsdWJJZDogc3RyaW5nKTogUHJvbWlzZTxDbHViTWVtYmVyc2hpcFtdPiB7XG4gICAgY29uc3QgW2FkbWlucywgb3duZXJzXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIHRoaXMubGlzdENsdWJNZW1iZXJzKGNsdWJJZCwgeyByb2xlOiBDbHViUm9sZS5BRE1JTiwgc3RhdHVzOiBNZW1iZXJzaGlwU3RhdHVzLkFDVElWRSB9KSxcbiAgICAgIHRoaXMubGlzdENsdWJNZW1iZXJzKGNsdWJJZCwgeyByb2xlOiBDbHViUm9sZS5PV05FUiwgc3RhdHVzOiBNZW1iZXJzaGlwU3RhdHVzLkFDVElWRSB9KSxcbiAgICBdKTtcblxuICAgIHJldHVybiBbXG4gICAgICAuLi5hZG1pbnMubWVtYmVycy5tYXAobWVtYmVyID0+IHRoaXMubWVtYmVySW5mb1RvTWVtYmVyc2hpcChtZW1iZXIpKSxcbiAgICAgIC4uLm93bmVycy5tZW1iZXJzLm1hcChtZW1iZXIgPT4gdGhpcy5tZW1iZXJJbmZvVG9NZW1iZXJzaGlwKG1lbWJlcikpLFxuICAgIF07XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgdXNlciBoYXMgcGVuZGluZyBtZW1iZXJzaGlwIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIGhhc1BlbmRpbmdNZW1iZXJzaGlwUmVxdWVzdChjbHViSWQ6IHN0cmluZywgdXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBtZW1iZXJzaGlwID0gYXdhaXQgdGhpcy5nZXRNZW1iZXJzaGlwQnlDbHViQW5kVXNlcihjbHViSWQsIHVzZXJJZCk7XG4gICAgcmV0dXJuIG1lbWJlcnNoaXAgIT09IG51bGwgJiYgbWVtYmVyc2hpcC5zdGF0dXMgPT09IE1lbWJlcnNoaXBTdGF0dXMuUEVORElORztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0IER5bmFtb0RCIGNhbm9uaWNhbCBpdGVtIHRvIE1lbWJlcnNoaXBcbiAgICovXG4gIHByaXZhdGUgZHluYW1vSXRlbVRvTWVtYmVyc2hpcChpdGVtOiBNZW1iZXJzaGlwRHluYW1vSXRlbSk6IENsdWJNZW1iZXJzaGlwIHtcbiAgICByZXR1cm4ge1xuICAgICAgbWVtYmVyc2hpcElkOiBpdGVtLm1lbWJlcnNoaXBJZCxcbiAgICAgIGNsdWJJZDogaXRlbS5jbHViSWQsXG4gICAgICB1c2VySWQ6IGl0ZW0udXNlcklkLFxuICAgICAgcm9sZTogaXRlbS5yb2xlLFxuICAgICAgc3RhdHVzOiBpdGVtLnN0YXR1cyxcbiAgICAgIGpvaW5lZEF0OiBpdGVtLmpvaW5lZEF0LFxuICAgICAgdXBkYXRlZEF0OiBpdGVtLnVwZGF0ZWRBdCxcbiAgICAgIGpvaW5NZXNzYWdlOiBpdGVtLmpvaW5NZXNzYWdlLFxuICAgICAgaW52aXRlZEJ5OiBpdGVtLmludml0ZWRCeSxcbiAgICAgIHByb2Nlc3NlZEJ5OiBpdGVtLnByb2Nlc3NlZEJ5LFxuICAgICAgcHJvY2Vzc2VkQXQ6IGl0ZW0ucHJvY2Vzc2VkQXQsXG4gICAgICByZWFzb246IGl0ZW0ucmVhc29uLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydCBDbHViTWVtYmVySW5mbyB0byBDbHViTWVtYmVyc2hpcFxuICAgKi9cbiAgcHJpdmF0ZSBtZW1iZXJJbmZvVG9NZW1iZXJzaGlwKG1lbWJlckluZm86IENsdWJNZW1iZXJJbmZvKTogQ2x1Yk1lbWJlcnNoaXAge1xuICAgIHJldHVybiB7XG4gICAgICBtZW1iZXJzaGlwSWQ6IG1lbWJlckluZm8ubWVtYmVyc2hpcElkLFxuICAgICAgY2x1YklkOiAnJywgLy8gV291bGQgbmVlZCB0byBiZSBwcm92aWRlZCBvciBsb29rZWQgdXBcbiAgICAgIHVzZXJJZDogbWVtYmVySW5mby51c2VySWQsXG4gICAgICByb2xlOiBtZW1iZXJJbmZvLnJvbGUsXG4gICAgICBzdGF0dXM6IG1lbWJlckluZm8uc3RhdHVzLFxuICAgICAgam9pbmVkQXQ6IG1lbWJlckluZm8uam9pbmVkQXQsXG4gICAgICB1cGRhdGVkQXQ6IG1lbWJlckluZm8udXBkYXRlZEF0IHx8IG1lbWJlckluZm8uam9pbmVkQXQsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0IE1lbWJlcnNoaXAgdG8gRHluYW1vREIgY2Fub25pY2FsIGl0ZW1cbiAgICovXG4gIHByaXZhdGUgbWVtYmVyc2hpcFRvQ2Fub25pY2FsSXRlbShtZW1iZXJzaGlwOiBDbHViTWVtYmVyc2hpcCk6IE1lbWJlcnNoaXBEeW5hbW9JdGVtIHtcbiAgICByZXR1cm4ge1xuICAgICAgUEs6IGBDTFVCIyR7bWVtYmVyc2hpcC5jbHViSWR9YCxcbiAgICAgIFNLOiBgTUVNQkVSIyR7bWVtYmVyc2hpcC51c2VySWR9YCxcbiAgICAgIGVudGl0eVR5cGU6ICdDTFVCX01FTUJFUlNISVAnLFxuICAgICAgbWVtYmVyc2hpcElkOiBtZW1iZXJzaGlwLm1lbWJlcnNoaXBJZCxcbiAgICAgIGNsdWJJZDogbWVtYmVyc2hpcC5jbHViSWQsXG4gICAgICB1c2VySWQ6IG1lbWJlcnNoaXAudXNlcklkLFxuICAgICAgcm9sZTogbWVtYmVyc2hpcC5yb2xlLFxuICAgICAgc3RhdHVzOiBtZW1iZXJzaGlwLnN0YXR1cyxcbiAgICAgIGpvaW5lZEF0OiBtZW1iZXJzaGlwLmpvaW5lZEF0LFxuICAgICAgdXBkYXRlZEF0OiBtZW1iZXJzaGlwLnVwZGF0ZWRBdCxcbiAgICAgIGpvaW5NZXNzYWdlOiBtZW1iZXJzaGlwLmpvaW5NZXNzYWdlLFxuICAgICAgaW52aXRlZEJ5OiBtZW1iZXJzaGlwLmludml0ZWRCeSxcbiAgICAgIHByb2Nlc3NlZEJ5OiBtZW1iZXJzaGlwLnByb2Nlc3NlZEJ5LFxuICAgICAgcHJvY2Vzc2VkQXQ6IG1lbWJlcnNoaXAucHJvY2Vzc2VkQXQsXG4gICAgICByZWFzb246IG1lbWJlcnNoaXAucmVhc29uLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydCBNZW1iZXJzaGlwIHRvIER5bmFtb0RCIHVzZXIgaW5kZXggaXRlbVxuICAgKi9cbiAgcHJpdmF0ZSBtZW1iZXJzaGlwVG9Vc2VySW5kZXhJdGVtKG1lbWJlcnNoaXA6IENsdWJNZW1iZXJzaGlwKTogVXNlck1lbWJlcnNoaXBEeW5hbW9JdGVtIHtcbiAgICBjb25zdCBzayA9IGBNRU1CRVJTSElQIyR7bWVtYmVyc2hpcC5jbHViSWR9YDtcbiAgICByZXR1cm4ge1xuICAgICAgUEs6IGBVU0VSIyR7bWVtYmVyc2hpcC51c2VySWR9YCxcbiAgICAgIFNLOiBzayxcbiAgICAgIEdTSTFQSzogYFVTRVIjJHttZW1iZXJzaGlwLnVzZXJJZH1gLFxuICAgICAgR1NJMVNLOiBzayxcbiAgICAgIGVudGl0eVR5cGU6ICdVU0VSX01FTUJFUlNISVAnLFxuICAgICAgbWVtYmVyc2hpcElkOiBtZW1iZXJzaGlwLm1lbWJlcnNoaXBJZCxcbiAgICAgIGNsdWJJZDogbWVtYmVyc2hpcC5jbHViSWQsXG4gICAgICB1c2VySWQ6IG1lbWJlcnNoaXAudXNlcklkLFxuICAgICAgcm9sZTogbWVtYmVyc2hpcC5yb2xlLFxuICAgICAgc3RhdHVzOiBtZW1iZXJzaGlwLnN0YXR1cyxcbiAgICAgIGpvaW5lZEF0OiBtZW1iZXJzaGlwLmpvaW5lZEF0LFxuICAgICAgdXBkYXRlZEF0OiBtZW1iZXJzaGlwLnVwZGF0ZWRBdCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgTWVtYmVyc2hpcCB0byBEeW5hbW9EQiBjbHViIG1lbWJlciBpbmRleCBpdGVtXG4gICAqL1xuICBwcml2YXRlIG1lbWJlcnNoaXBUb0NsdWJNZW1iZXJJbmRleEl0ZW0obWVtYmVyc2hpcDogQ2x1Yk1lbWJlcnNoaXApOiBDbHViTWVtYmVyRHluYW1vSXRlbSB7XG4gICAgY29uc3Qgc2sgPSBgUk9MRSMke21lbWJlcnNoaXAucm9sZX0jVVNFUiMke21lbWJlcnNoaXAudXNlcklkfWA7XG4gICAgcmV0dXJuIHtcbiAgICAgIFBLOiBgQ0xVQiMke21lbWJlcnNoaXAuY2x1YklkfSNNRU1CRVJTYCxcbiAgICAgIFNLOiBzayxcbiAgICAgIEdTSTJQSzogYENMVUIjJHttZW1iZXJzaGlwLmNsdWJJZH0jTUVNQkVSU2AsXG4gICAgICBHU0kyU0s6IHNrLFxuICAgICAgZW50aXR5VHlwZTogJ0NMVUJfTUVNQkVSX0lOREVYJyxcbiAgICAgIG1lbWJlcnNoaXBJZDogbWVtYmVyc2hpcC5tZW1iZXJzaGlwSWQsXG4gICAgICB1c2VySWQ6IG1lbWJlcnNoaXAudXNlcklkLFxuICAgICAgcm9sZTogbWVtYmVyc2hpcC5yb2xlLFxuICAgICAgc3RhdHVzOiBtZW1iZXJzaGlwLnN0YXR1cyxcbiAgICAgIGpvaW5lZEF0OiBtZW1iZXJzaGlwLmpvaW5lZEF0LFxuICAgICAgdXBkYXRlZEF0OiBtZW1iZXJzaGlwLnVwZGF0ZWRBdCxcbiAgICB9O1xuICB9XG59Il19