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
const membership_errors_1 = require("../domain/membership/membership-errors");
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
            // Add status filter and entity type filter to avoid duplicates
            // Filter for USER_MEMBERSHIP records only (not CLUB_MEMBERSHIP records)
            if (status) {
                queryParams.FilterExpression = '#status = :status AND #entityType = :entityType';
                queryParams.ExpressionAttributeNames = {
                    '#status': 'status',
                    '#entityType': 'entityType',
                };
                queryParams.ExpressionAttributeValues[':status'] = status;
                queryParams.ExpressionAttributeValues[':entityType'] = 'USER_MEMBERSHIP';
            }
            else {
                queryParams.FilterExpression = '#entityType = :entityType';
                queryParams.ExpressionAttributeNames = {
                    '#entityType': 'entityType',
                };
                queryParams.ExpressionAttributeValues[':entityType'] = 'USER_MEMBERSHIP';
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
        const startTime = Date.now();
        try {
            // First, we need to find the membership by scanning for the membershipId
            // This is inefficient but works for MVP - in production, add a GSI on membershipId
            const scanCommand = new lib_dynamodb_1.QueryCommand({
                TableName: this.tableName,
                IndexName: 'GSI1',
                FilterExpression: 'membershipId = :membershipId',
                ExpressionAttributeValues: {
                    ':membershipId': membershipId,
                },
                Limit: 1,
            });
            // Try to find membership across all users
            // This is a workaround - ideally we'd have a GSI on membershipId
            // For now, we'll need the clubId and userId to be passed or stored differently
            throw new membership_errors_1.MembershipNotFoundError(`Cannot update membership ${membershipId} - requires clubId and userId`);
        }
        catch (error) {
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('ERROR', 'Failed to update membership status', {
                membershipId,
                status,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
                operation: 'update_membership_status',
            });
            throw error;
        }
    }
    /**
     * Update membership status by club and user (more efficient)
     */
    async updateMembershipStatusByClubAndUser(clubId, userId, status, processedBy, reason) {
        const startTime = Date.now();
        try {
            // Get existing membership
            const membership = await this.getMembershipByClubAndUser(clubId, userId);
            if (!membership) {
                throw new membership_errors_1.MembershipNotFoundError(`Membership not found for club ${clubId} and user ${userId}`);
            }
            const now = new Date().toISOString();
            const updatedMembership = {
                ...membership,
                status,
                updatedAt: now,
                processedBy,
                processedAt: processedBy ? now : membership.processedAt,
                reason: reason || membership.reason,
            };
            // Update all three items atomically
            const canonicalItem = this.membershipToCanonicalItem(updatedMembership);
            const userIndexItem = this.membershipToUserIndexItem(updatedMembership);
            const clubMemberIndexItem = this.membershipToClubMemberIndexItem(updatedMembership);
            const command = new lib_dynamodb_1.TransactWriteCommand({
                TransactItems: [
                    {
                        Put: {
                            TableName: this.tableName,
                            Item: canonicalItem,
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
            (0, lambda_utils_1.logStructured)('INFO', 'Membership status updated in DynamoDB', {
                clubId,
                userId,
                membershipId: membership.membershipId,
                oldStatus: membership.status,
                newStatus: status,
                processedBy,
                duration,
                operation: 'update_membership_status_by_club_and_user',
            });
            return updatedMembership;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('ERROR', 'Failed to update membership status by club and user', {
                clubId,
                userId,
                status,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
                operation: 'update_membership_status_by_club_and_user',
            });
            throw error;
        }
    }
    /**
     * Remove membership
     */
    async removeMembership(membershipId, removedBy, reason) {
        return this.updateMembershipStatus(membershipId, membership_1.MembershipStatus.REMOVED, removedBy, reason);
    }
    /**
     * Remove membership by club and user (more efficient)
     */
    async removeMembershipByClubAndUser(clubId, userId, removedBy, reason) {
        return this.updateMembershipStatusByClubAndUser(clubId, userId, membership_1.MembershipStatus.REMOVED, removedBy, reason);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHluYW1vZGItbWVtYmVyc2hpcC1yZXBvc2l0b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZHluYW1vZGItbWVtYmVyc2hpcC1yZXBvc2l0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBRUgsOERBQTBEO0FBQzFELHdEQU0rQjtBQUMvQixpRUFjMEM7QUFFMUMscUVBQW1FO0FBR25FLGdFQUF1RjtBQUN2Riw4RUFBaUY7QUFFakY7O0dBRUc7QUFDSCxNQUFhLDRCQUE0QjtJQUl2QyxZQUNFLFNBQWtCLEVBQ1YsY0FBZ0MsRUFDeEMsWUFBNkI7UUFEckIsbUJBQWMsR0FBZCxjQUFjLENBQWtCO1FBR3hDLE1BQU0sTUFBTSxHQUFHLFlBQVksSUFBSSxJQUFJLGdDQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdEQsSUFBSSxDQUFDLFlBQVksR0FBRyxxQ0FBc0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLElBQUksZ0NBQWdDLENBQUM7SUFDaEcsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLDBCQUEwQixDQUFDLE1BQWMsRUFBRSxNQUFjO1FBQzdELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUU3QixJQUFJO1lBQ0YsTUFBTSxPQUFPLEdBQUcsSUFBSSx5QkFBVSxDQUFDO2dCQUM3QixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7Z0JBQ3pCLEdBQUcsRUFBRTtvQkFDSCxFQUFFLEVBQUUsUUFBUSxNQUFNLEVBQUU7b0JBQ3BCLEVBQUUsRUFBRSxVQUFVLE1BQU0sRUFBRTtpQkFDdkI7YUFDRixDQUFDLENBQUM7WUFFSCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFD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Q2hDLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUE5cEJELG9FQThwQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIER5bmFtb0RCIE1lbWJlcnNoaXAgUmVwb3NpdG9yeSAtIFBoYXNlIDIuMlxuICogXG4gKiBEeW5hbW9EQiBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgbWVtYmVyc2hpcCByZXBvc2l0b3J5IGludGVyZmFjZS5cbiAqIFVzZXMgc2luZ2xlLXRhYmxlIGRlc2lnbiB3aXRoIG11bHRpcGxlIGluZGV4IGl0ZW1zIGZvciBlZmZpY2llbnQgcXVlcmllcy5cbiAqIFxuICogQ29tcGxpYW5jZTpcbiAqIC0gUGhhc2UgMi4yIFNwZWM6IC5raXJvL3NwZWNzL3BoYXNlLTIuMi5jbHViLW1lbWJlcnNoaXAtcm9sZXMudjEubWRcbiAqL1xuXG5pbXBvcnQgeyBEeW5hbW9EQkNsaWVudCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYic7XG5pbXBvcnQge1xuICBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LFxuICBHZXRDb21tYW5kLFxuICBRdWVyeUNvbW1hbmQsXG4gIFRyYW5zYWN0V3JpdGVDb21tYW5kLFxuICBCYXRjaEdldENvbW1hbmQsXG59IGZyb20gJ0Bhd3Mtc2RrL2xpYi1keW5hbW9kYic7XG5pbXBvcnQge1xuICBDbHViTWVtYmVyc2hpcCxcbiAgQ2x1YlJvbGUsXG4gIE1lbWJlcnNoaXBTdGF0dXMsXG4gIEpvaW5DbHViSW5wdXQsXG4gIFVwZGF0ZU1lbWJlcklucHV0LFxuICBMaXN0TWVtYmVyc09wdGlvbnMsXG4gIExpc3RNZW1iZXJzUmVzdWx0LFxuICBDbHViTWVtYmVySW5mbyxcbiAgVXNlck1lbWJlcnNoaXBTdW1tYXJ5LFxuICBNZW1iZXJzaGlwRHluYW1vSXRlbSxcbiAgVXNlck1lbWJlcnNoaXBEeW5hbW9JdGVtLFxuICBDbHViTWVtYmVyRHluYW1vSXRlbSxcbiAgTUVNQkVSU0hJUF9DT05TVFJBSU5UUyxcbn0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL3R5cGVzL21lbWJlcnNoaXAnO1xuaW1wb3J0IHsgTm90Rm91bmRFcnJvciB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC91dGlscy9lcnJvcnMnO1xuaW1wb3J0IHsgbG9nU3RydWN0dXJlZCB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC91dGlscy9sYW1iZGEtdXRpbHMnO1xuaW1wb3J0IHsgSU1lbWJlcnNoaXBSZXBvc2l0b3J5IH0gZnJvbSAnLi4vZG9tYWluL21lbWJlcnNoaXAvbWVtYmVyc2hpcC1yZXBvc2l0b3J5JztcbmltcG9ydCB7IElVc2VyUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL3VzZXItcHJvZmlsZS9kb21haW4vdXNlci1yZXBvc2l0b3J5JztcbmltcG9ydCB7IGNyZWF0ZU1lbWJlcnNoaXAsIGZyb21NZW1iZXJzaGlwRGF0YSB9IGZyb20gJy4uL2RvbWFpbi9tZW1iZXJzaGlwL21lbWJlcnNoaXAnO1xuaW1wb3J0IHsgTWVtYmVyc2hpcE5vdEZvdW5kRXJyb3IgfSBmcm9tICcuLi9kb21haW4vbWVtYmVyc2hpcC9tZW1iZXJzaGlwLWVycm9ycyc7XG5cbi8qKlxuICogRHluYW1vREIgbWVtYmVyc2hpcCByZXBvc2l0b3J5IGltcGxlbWVudGF0aW9uXG4gKi9cbmV4cG9ydCBjbGFzcyBEeW5hbW9EQk1lbWJlcnNoaXBSZXBvc2l0b3J5IGltcGxlbWVudHMgSU1lbWJlcnNoaXBSZXBvc2l0b3J5IHtcbiAgcHJpdmF0ZSBkeW5hbW9DbGllbnQ6IER5bmFtb0RCRG9jdW1lbnRDbGllbnQ7XG4gIHByaXZhdGUgdGFibGVOYW1lOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgdGFibGVOYW1lPzogc3RyaW5nLFxuICAgIHByaXZhdGUgdXNlclJlcG9zaXRvcnk/OiBJVXNlclJlcG9zaXRvcnksXG4gICAgZHluYW1vQ2xpZW50PzogRHluYW1vREJDbGllbnRcbiAgKSB7XG4gICAgY29uc3QgY2xpZW50ID0gZHluYW1vQ2xpZW50IHx8IG5ldyBEeW5hbW9EQkNsaWVudCh7fSk7XG4gICAgdGhpcy5keW5hbW9DbGllbnQgPSBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LmZyb20oY2xpZW50KTtcbiAgICB0aGlzLnRhYmxlTmFtZSA9IHRhYmxlTmFtZSB8fCBwcm9jZXNzLmVudi5NQUlOX1RBQkxFX05BTUUgfHwgJ3N5ZG5leS1jeWNsZXMtbWFpbi1kZXZlbG9wbWVudCc7XG4gIH1cblxuICAvKipcbiAgICogR2V0IG1lbWJlcnNoaXAgYnkgY2x1YiBhbmQgdXNlclxuICAgKi9cbiAgYXN5bmMgZ2V0TWVtYmVyc2hpcEJ5Q2x1YkFuZFVzZXIoY2x1YklkOiBzdHJpbmcsIHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxDbHViTWVtYmVyc2hpcCB8IG51bGw+IHtcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgR2V0Q29tbWFuZCh7XG4gICAgICAgIFRhYmxlTmFtZTogdGhpcy50YWJsZU5hbWUsXG4gICAgICAgIEtleToge1xuICAgICAgICAgIFBLOiBgQ0xVQiMke2NsdWJJZH1gLFxuICAgICAgICAgIFNLOiBgTUVNQkVSIyR7dXNlcklkfWAsXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5keW5hbW9DbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcblxuICAgICAgaWYgKCFyZXN1bHQuSXRlbSkge1xuICAgICAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ01lbWJlcnNoaXAgbm90IGZvdW5kJywge1xuICAgICAgICAgIGNsdWJJZCxcbiAgICAgICAgICB1c2VySWQsXG4gICAgICAgICAgZHVyYXRpb24sXG4gICAgICAgICAgb3BlcmF0aW9uOiAnZ2V0X21lbWJlcnNoaXBfYnlfY2x1Yl9hbmRfdXNlcicsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbWVtYmVyc2hpcCA9IHRoaXMuZHluYW1vSXRlbVRvTWVtYmVyc2hpcChyZXN1bHQuSXRlbSBhcyBNZW1iZXJzaGlwRHluYW1vSXRlbSk7XG5cbiAgICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnTWVtYmVyc2hpcCByZXRyaWV2ZWQgZnJvbSBEeW5hbW9EQicsIHtcbiAgICAgICAgY2x1YklkLFxuICAgICAgICB1c2VySWQsXG4gICAgICAgIG1lbWJlcnNoaXBJZDogbWVtYmVyc2hpcC5tZW1iZXJzaGlwSWQsXG4gICAgICAgIHJvbGU6IG1lbWJlcnNoaXAucm9sZSxcbiAgICAgICAgc3RhdHVzOiBtZW1iZXJzaGlwLnN0YXR1cyxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIG9wZXJhdGlvbjogJ2dldF9tZW1iZXJzaGlwX2J5X2NsdWJfYW5kX3VzZXInLFxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBtZW1iZXJzaGlwO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdGYWlsZWQgdG8gZ2V0IG1lbWJlcnNoaXAgYnkgY2x1YiBhbmQgdXNlcicsIHtcbiAgICAgICAgY2x1YklkLFxuICAgICAgICB1c2VySWQsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIG9wZXJhdGlvbjogJ2dldF9tZW1iZXJzaGlwX2J5X2NsdWJfYW5kX3VzZXInLFxuICAgICAgfSk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IG1lbWJlcnNoaXAgYnkgSURcbiAgICovXG4gIGFzeW5jIGdldE1lbWJlcnNoaXBCeUlkKG1lbWJlcnNoaXBJZDogc3RyaW5nKTogUHJvbWlzZTxDbHViTWVtYmVyc2hpcCB8IG51bGw+IHtcbiAgICAvLyBGb3IgUGhhc2UgMi4yLCB3ZSBuZWVkIHRvIHNjYW4gb3IgbWFpbnRhaW4gYSBHU0kgZm9yIG1lbWJlcnNoaXAgSUQgbG9va3Vwc1xuICAgIC8vIFRoaXMgaXMgYSBzaW1wbGlmaWVkIGltcGxlbWVudGF0aW9uIC0gaW4gcHJvZHVjdGlvbiwgY29uc2lkZXIgYWRkaW5nIGEgR1NJXG4gICAgdGhyb3cgbmV3IEVycm9yKCdnZXRNZW1iZXJzaGlwQnlJZCBub3QgaW1wbGVtZW50ZWQgLSByZXF1aXJlcyBHU0kgb3Igc2NhbiBvcGVyYXRpb24nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGNsdWIgbWVtYmVycyB3aXRoIHBhZ2luYXRpb24gYW5kIGZpbHRlcmluZ1xuICAgKi9cbiAgYXN5bmMgbGlzdENsdWJNZW1iZXJzKGNsdWJJZDogc3RyaW5nLCBvcHRpb25zOiBMaXN0TWVtYmVyc09wdGlvbnMpOiBQcm9taXNlPExpc3RNZW1iZXJzUmVzdWx0PiB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCBsaW1pdCA9IG9wdGlvbnMubGltaXQgfHwgTUVNQkVSU0hJUF9DT05TVFJBSU5UUy5ERUZBVUxUX0xJU1RfTElNSVQ7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcXVlcnlQYXJhbXM6IGFueSA9IHtcbiAgICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgICAgSW5kZXhOYW1lOiAnR1NJMicsXG4gICAgICAgIEtleUNvbmRpdGlvbkV4cHJlc3Npb246ICdHU0kyUEsgPSA6Z3NpMnBrJyxcbiAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xuICAgICAgICAgICc6Z3NpMnBrJzogYENMVUIjJHtjbHViSWR9I01FTUJFUlNgLFxuICAgICAgICB9LFxuICAgICAgICBMaW1pdDogbGltaXQgKyAxLCAvLyBHZXQgb25lIGV4dHJhIHRvIGRldGVybWluZSBpZiB0aGVyZSBhcmUgbW9yZSByZXN1bHRzXG4gICAgICAgIFNjYW5JbmRleEZvcndhcmQ6IHRydWUsXG4gICAgICB9O1xuXG4gICAgICAvLyBBZGQgcm9sZSBmaWx0ZXJcbiAgICAgIGlmIChvcHRpb25zLnJvbGUpIHtcbiAgICAgICAgcXVlcnlQYXJhbXMuS2V5Q29uZGl0aW9uRXhwcmVzc2lvbiArPSAnIEFORCBiZWdpbnNfd2l0aChHU0kyU0ssIDpyb2xlUHJlZml4KSc7XG4gICAgICAgIHF1ZXJ5UGFyYW1zLkV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXNbJzpyb2xlUHJlZml4J10gPSBgUk9MRSMke29wdGlvbnMucm9sZX0jYDtcbiAgICAgIH1cblxuICAgICAgLy8gQWRkIHN0YXR1cyBmaWx0ZXJcbiAgICAgIGlmIChvcHRpb25zLnN0YXR1cykge1xuICAgICAgICBxdWVyeVBhcmFtcy5GaWx0ZXJFeHByZXNzaW9uID0gJyNzdGF0dXMgPSA6c3RhdHVzJztcbiAgICAgICAgcXVlcnlQYXJhbXMuRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzID0ge1xuICAgICAgICAgICcjc3RhdHVzJzogJ3N0YXR1cycsXG4gICAgICAgIH07XG4gICAgICAgIHF1ZXJ5UGFyYW1zLkV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXNbJzpzdGF0dXMnXSA9IG9wdGlvbnMuc3RhdHVzO1xuICAgICAgfVxuXG4gICAgICAvLyBBZGQgY3Vyc29yIGZvciBwYWdpbmF0aW9uXG4gICAgICBpZiAob3B0aW9ucy5jdXJzb3IpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBkZWNvZGVkQ3Vyc29yID0gSlNPTi5wYXJzZShCdWZmZXIuZnJvbShvcHRpb25zLmN1cnNvciwgJ2Jhc2U2NCcpLnRvU3RyaW5nKCkpO1xuICAgICAgICAgIHF1ZXJ5UGFyYW1zLkV4Y2x1c2l2ZVN0YXJ0S2V5ID0ge1xuICAgICAgICAgICAgR1NJMlBLOiBgQ0xVQiMke2NsdWJJZH0jTUVNQkVSU2AsXG4gICAgICAgICAgICBHU0kyU0s6IGBST0xFIyR7ZGVjb2RlZEN1cnNvci5yb2xlfSNVU0VSIyR7ZGVjb2RlZEN1cnNvci51c2VySWR9YCxcbiAgICAgICAgICAgIFBLOiBgQ0xVQiMke2NsdWJJZH0jTUVNQkVSU2AsXG4gICAgICAgICAgICBTSzogYFJPTEUjJHtkZWNvZGVkQ3Vyc29yLnJvbGV9I1VTRVIjJHtkZWNvZGVkQ3Vyc29yLnVzZXJJZH1gLFxuICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGN1cnNvciBmb3JtYXQnKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBjb21tYW5kID0gbmV3IFF1ZXJ5Q29tbWFuZChxdWVyeVBhcmFtcyk7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmR5bmFtb0NsaWVudC5zZW5kKGNvbW1hbmQpO1xuICAgICAgY29uc3QgZHVyYXRpb24gPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuXG4gICAgICBjb25zdCBpdGVtcyA9IHJlc3VsdC5JdGVtcyB8fCBbXTtcbiAgICAgIGNvbnN0IGhhc01vcmUgPSBpdGVtcy5sZW5ndGggPiBsaW1pdDtcbiAgICAgIGNvbnN0IG1lbWJlckl0ZW1zID0gaXRlbXMuc2xpY2UoMCwgbGltaXQpO1xuXG4gICAgICAvLyBFbnJpY2ggd2l0aCB1c2VyIGRhdGFcbiAgICAgIGNvbnN0IG1lbWJlcnM6IENsdWJNZW1iZXJJbmZvW10gPSBbXTtcbiAgICAgIGlmICh0aGlzLnVzZXJSZXBvc2l0b3J5ICYmIG1lbWJlckl0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgdXNlcklkcyA9IG1lbWJlckl0ZW1zLm1hcChpdGVtID0+IChpdGVtIGFzIENsdWJNZW1iZXJEeW5hbW9JdGVtKS51c2VySWQpO1xuICAgICAgICBjb25zdCB1c2VycyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICAgIHVzZXJJZHMubWFwKHVzZXJJZCA9PiB0aGlzLnVzZXJSZXBvc2l0b3J5IS5nZXRVc2VyQnlJZCh1c2VySWQpKVxuICAgICAgICApO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWVtYmVySXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBtZW1iZXJJdGVtID0gbWVtYmVySXRlbXNbaV0gYXMgQ2x1Yk1lbWJlckR5bmFtb0l0ZW07XG4gICAgICAgICAgY29uc3QgdXNlciA9IHVzZXJzW2ldO1xuICAgICAgICAgIFxuICAgICAgICAgIG1lbWJlcnMucHVzaCh7XG4gICAgICAgICAgICBtZW1iZXJzaGlwSWQ6IG1lbWJlckl0ZW0ubWVtYmVyc2hpcElkLFxuICAgICAgICAgICAgdXNlcklkOiBtZW1iZXJJdGVtLnVzZXJJZCxcbiAgICAgICAgICAgIGRpc3BsYXlOYW1lOiB1c2VyPy5kaXNwbGF5TmFtZSB8fCAnVW5rbm93biBVc2VyJyxcbiAgICAgICAgICAgIGVtYWlsOiB1c2VyPy5lbWFpbCB8fCAnJyxcbiAgICAgICAgICAgIGF2YXRhclVybDogdXNlcj8uYXZhdGFyVXJsLFxuICAgICAgICAgICAgcm9sZTogbWVtYmVySXRlbS5yb2xlLFxuICAgICAgICAgICAgc3RhdHVzOiBtZW1iZXJJdGVtLnN0YXR1cyxcbiAgICAgICAgICAgIGpvaW5lZEF0OiBtZW1iZXJJdGVtLmpvaW5lZEF0LFxuICAgICAgICAgICAgdXBkYXRlZEF0OiBtZW1iZXJJdGVtLnVwZGF0ZWRBdCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRmFsbGJhY2sgd2l0aG91dCB1c2VyIGVucmljaG1lbnRcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIG1lbWJlckl0ZW1zKSB7XG4gICAgICAgICAgY29uc3QgbWVtYmVySXRlbSA9IGl0ZW0gYXMgQ2x1Yk1lbWJlckR5bmFtb0l0ZW07XG4gICAgICAgICAgbWVtYmVycy5wdXNoKHtcbiAgICAgICAgICAgIG1lbWJlcnNoaXBJZDogbWVtYmVySXRlbS5tZW1iZXJzaGlwSWQsXG4gICAgICAgICAgICB1c2VySWQ6IG1lbWJlckl0ZW0udXNlcklkLFxuICAgICAgICAgICAgZGlzcGxheU5hbWU6ICdVbmtub3duIFVzZXInLFxuICAgICAgICAgICAgZW1haWw6ICcnLFxuICAgICAgICAgICAgcm9sZTogbWVtYmVySXRlbS5yb2xlLFxuICAgICAgICAgICAgc3RhdHVzOiBtZW1iZXJJdGVtLnN0YXR1cyxcbiAgICAgICAgICAgIGpvaW5lZEF0OiBtZW1iZXJJdGVtLmpvaW5lZEF0LFxuICAgICAgICAgICAgdXBkYXRlZEF0OiBtZW1iZXJJdGVtLnVwZGF0ZWRBdCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBsZXQgbmV4dEN1cnNvcjogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgICAgaWYgKGhhc01vcmUgJiYgbWVtYmVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IGxhc3RNZW1iZXIgPSBtZW1iZXJJdGVtc1ttZW1iZXJJdGVtcy5sZW5ndGggLSAxXSBhcyBDbHViTWVtYmVyRHluYW1vSXRlbTtcbiAgICAgICAgY29uc3QgY3Vyc29yRGF0YSA9IHtcbiAgICAgICAgICByb2xlOiBsYXN0TWVtYmVyLnJvbGUsXG4gICAgICAgICAgdXNlcklkOiBsYXN0TWVtYmVyLnVzZXJJZCxcbiAgICAgICAgfTtcbiAgICAgICAgbmV4dEN1cnNvciA9IEJ1ZmZlci5mcm9tKEpTT04uc3RyaW5naWZ5KGN1cnNvckRhdGEpKS50b1N0cmluZygnYmFzZTY0Jyk7XG4gICAgICB9XG5cbiAgICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnQ2x1YiBtZW1iZXJzIGxpc3RlZCBmcm9tIER5bmFtb0RCJywge1xuICAgICAgICBjbHViSWQsXG4gICAgICAgIHJlc3VsdENvdW50OiBtZW1iZXJzLmxlbmd0aCxcbiAgICAgICAgaGFzTW9yZSxcbiAgICAgICAgcm9sZTogb3B0aW9ucy5yb2xlLFxuICAgICAgICBzdGF0dXM6IG9wdGlvbnMuc3RhdHVzLFxuICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgb3BlcmF0aW9uOiAnbGlzdF9jbHViX21lbWJlcnMnLFxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIG1lbWJlcnMsXG4gICAgICAgIG5leHRDdXJzb3IsXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdGYWlsZWQgdG8gbGlzdCBjbHViIG1lbWJlcnMnLCB7XG4gICAgICAgIGNsdWJJZCxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgb3BlcmF0aW9uOiAnbGlzdF9jbHViX21lbWJlcnMnLFxuICAgICAgfSk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTGlzdCB1c2VyJ3MgY2x1YiBtZW1iZXJzaGlwc1xuICAgKi9cbiAgYXN5bmMgbGlzdFVzZXJNZW1iZXJzaGlwcyh1c2VySWQ6IHN0cmluZywgc3RhdHVzPzogTWVtYmVyc2hpcFN0YXR1cyk6IFByb21pc2U8VXNlck1lbWJlcnNoaXBTdW1tYXJ5W10+IHtcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHF1ZXJ5UGFyYW1zOiBhbnkgPSB7XG4gICAgICAgIFRhYmxlTmFtZTogdGhpcy50YWJsZU5hbWUsXG4gICAgICAgIEluZGV4TmFtZTogJ0dTSTEnLFxuICAgICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiAnR1NJMVBLID0gOmdzaTFwayBBTkQgYmVnaW5zX3dpdGgoR1NJMVNLLCA6bWVtYmVyc2hpcFByZWZpeCknLFxuICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAgICAgJzpnc2kxcGsnOiBgVVNFUiMke3VzZXJJZH1gLFxuICAgICAgICAgICc6bWVtYmVyc2hpcFByZWZpeCc6ICdNRU1CRVJTSElQIycsXG4gICAgICAgIH0sXG4gICAgICB9O1xuXG4gICAgICAvLyBBZGQgc3RhdHVzIGZpbHRlciBhbmQgZW50aXR5IHR5cGUgZmlsdGVyIHRvIGF2b2lkIGR1cGxpY2F0ZXNcbiAgICAgIC8vIEZpbHRlciBmb3IgVVNFUl9NRU1CRVJTSElQIHJlY29yZHMgb25seSAobm90IENMVUJfTUVNQkVSU0hJUCByZWNvcmRzKVxuICAgICAgaWYgKHN0YXR1cykge1xuICAgICAgICBxdWVyeVBhcmFtcy5GaWx0ZXJFeHByZXNzaW9uID0gJyNzdGF0dXMgPSA6c3RhdHVzIEFORCAjZW50aXR5VHlwZSA9IDplbnRpdHlUeXBlJztcbiAgICAgICAgcXVlcnlQYXJhbXMuRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzID0ge1xuICAgICAgICAgICcjc3RhdHVzJzogJ3N0YXR1cycsXG4gICAgICAgICAgJyNlbnRpdHlUeXBlJzogJ2VudGl0eVR5cGUnLFxuICAgICAgICB9O1xuICAgICAgICBxdWVyeVBhcmFtcy5FeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzWyc6c3RhdHVzJ10gPSBzdGF0dXM7XG4gICAgICAgIHF1ZXJ5UGFyYW1zLkV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXNbJzplbnRpdHlUeXBlJ10gPSAnVVNFUl9NRU1CRVJTSElQJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXJ5UGFyYW1zLkZpbHRlckV4cHJlc3Npb24gPSAnI2VudGl0eVR5cGUgPSA6ZW50aXR5VHlwZSc7XG4gICAgICAgIHF1ZXJ5UGFyYW1zLkV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lcyA9IHtcbiAgICAgICAgICAnI2VudGl0eVR5cGUnOiAnZW50aXR5VHlwZScsXG4gICAgICAgIH07XG4gICAgICAgIHF1ZXJ5UGFyYW1zLkV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXNbJzplbnRpdHlUeXBlJ10gPSAnVVNFUl9NRU1CRVJTSElQJztcbiAgICAgIH1cblxuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBRdWVyeUNvbW1hbmQocXVlcnlQYXJhbXMpO1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5keW5hbW9DbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcblxuICAgICAgY29uc3QgaXRlbXMgPSByZXN1bHQuSXRlbXMgfHwgW107XG4gICAgICBjb25zdCBtZW1iZXJzaGlwczogVXNlck1lbWJlcnNoaXBTdW1tYXJ5W10gPSBpdGVtcy5tYXAoaXRlbSA9PiB7XG4gICAgICAgIGNvbnN0IG1lbWJlcnNoaXBJdGVtID0gaXRlbSBhcyBVc2VyTWVtYmVyc2hpcER5bmFtb0l0ZW07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbWVtYmVyc2hpcElkOiBtZW1iZXJzaGlwSXRlbS5tZW1iZXJzaGlwSWQsXG4gICAgICAgICAgY2x1YklkOiBtZW1iZXJzaGlwSXRlbS5jbHViSWQsXG4gICAgICAgICAgY2x1Yk5hbWU6ICdVbmtub3duIENsdWInLCAvLyBXb3VsZCBuZWVkIGNsdWIgZGF0YSBlbnJpY2htZW50XG4gICAgICAgICAgcm9sZTogbWVtYmVyc2hpcEl0ZW0ucm9sZSxcbiAgICAgICAgICBzdGF0dXM6IG1lbWJlcnNoaXBJdGVtLnN0YXR1cyxcbiAgICAgICAgICBqb2luZWRBdDogbWVtYmVyc2hpcEl0ZW0uam9pbmVkQXQsXG4gICAgICAgIH07XG4gICAgICB9KTtcblxuICAgICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdVc2VyIG1lbWJlcnNoaXBzIGxpc3RlZCBmcm9tIER5bmFtb0RCJywge1xuICAgICAgICB1c2VySWQsXG4gICAgICAgIHJlc3VsdENvdW50OiBtZW1iZXJzaGlwcy5sZW5ndGgsXG4gICAgICAgIHN0YXR1cyxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIG9wZXJhdGlvbjogJ2xpc3RfdXNlcl9tZW1iZXJzaGlwcycsXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIG1lbWJlcnNoaXBzO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdGYWlsZWQgdG8gbGlzdCB1c2VyIG1lbWJlcnNoaXBzJywge1xuICAgICAgICB1c2VySWQsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIG9wZXJhdGlvbjogJ2xpc3RfdXNlcl9tZW1iZXJzaGlwcycsXG4gICAgICB9KTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgbWVtYmVyc2hpcFxuICAgKi9cbiAgYXN5bmMgY3JlYXRlTWVtYmVyc2hpcChcbiAgICBjbHViSWQ6IHN0cmluZyxcbiAgICB1c2VySWQ6IHN0cmluZyxcbiAgICBpbnB1dDogSm9pbkNsdWJJbnB1dCxcbiAgICByb2xlOiBDbHViUm9sZSA9IENsdWJSb2xlLk1FTUJFUixcbiAgICBzdGF0dXM6IE1lbWJlcnNoaXBTdGF0dXMgPSBNZW1iZXJzaGlwU3RhdHVzLlBFTkRJTkdcbiAgKTogUHJvbWlzZTxDbHViTWVtYmVyc2hpcD4ge1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cbiAgICB0cnkge1xuICAgICAgLy8gQ3JlYXRlIG1lbWJlcnNoaXAgZW50aXR5XG4gICAgICBjb25zdCBtZW1iZXJzaGlwRW50aXR5ID0gY3JlYXRlTWVtYmVyc2hpcChjbHViSWQsIHVzZXJJZCwgcm9sZSwgc3RhdHVzLCBpbnB1dC5tZXNzYWdlKTtcbiAgICAgIGNvbnN0IG1lbWJlcnNoaXAgPSBtZW1iZXJzaGlwRW50aXR5LnRvTWVtYmVyc2hpcCgpO1xuXG4gICAgICAvLyBDcmVhdGUgRHluYW1vREIgaXRlbXNcbiAgICAgIGNvbnN0IGNhbm9uaWNhbEl0ZW0gPSB0aGlzLm1lbWJlcnNoaXBUb0Nhbm9uaWNhbEl0ZW0obWVtYmVyc2hpcCk7XG4gICAgICBjb25zdCB1c2VySW5kZXhJdGVtID0gdGhpcy5tZW1iZXJzaGlwVG9Vc2VySW5kZXhJdGVtKG1lbWJlcnNoaXApO1xuICAgICAgY29uc3QgY2x1Yk1lbWJlckluZGV4SXRlbSA9IHRoaXMubWVtYmVyc2hpcFRvQ2x1Yk1lbWJlckluZGV4SXRlbShtZW1iZXJzaGlwKTtcblxuICAgICAgLy8gVXNlIFRyYW5zYWN0V3JpdGUgdG8gZW5zdXJlIGFsbCBpdGVtcyBhcmUgY3JlYXRlZCBhdG9taWNhbGx5XG4gICAgICBjb25zdCBjb21tYW5kID0gbmV3IFRyYW5zYWN0V3JpdGVDb21tYW5kKHtcbiAgICAgICAgVHJhbnNhY3RJdGVtczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIFB1dDoge1xuICAgICAgICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICAgICAgICBJdGVtOiBjYW5vbmljYWxJdGVtLFxuICAgICAgICAgICAgICBDb25kaXRpb25FeHByZXNzaW9uOiAnYXR0cmlidXRlX25vdF9leGlzdHMoUEspJywgLy8gRW5zdXJlIG1lbWJlcnNoaXAgZG9lc24ndCBhbHJlYWR5IGV4aXN0XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgUHV0OiB7XG4gICAgICAgICAgICAgIFRhYmxlTmFtZTogdGhpcy50YWJsZU5hbWUsXG4gICAgICAgICAgICAgIEl0ZW06IHVzZXJJbmRleEl0ZW0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgUHV0OiB7XG4gICAgICAgICAgICAgIFRhYmxlTmFtZTogdGhpcy50YWJsZU5hbWUsXG4gICAgICAgICAgICAgIEl0ZW06IGNsdWJNZW1iZXJJbmRleEl0ZW0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9KTtcblxuICAgICAgYXdhaXQgdGhpcy5keW5hbW9DbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcblxuICAgICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdNZW1iZXJzaGlwIGNyZWF0ZWQgaW4gRHluYW1vREInLCB7XG4gICAgICAgIGNsdWJJZCxcbiAgICAgICAgdXNlcklkLFxuICAgICAgICBtZW1iZXJzaGlwSWQ6IG1lbWJlcnNoaXAubWVtYmVyc2hpcElkLFxuICAgICAgICByb2xlOiBtZW1iZXJzaGlwLnJvbGUsXG4gICAgICAgIHN0YXR1czogbWVtYmVyc2hpcC5zdGF0dXMsXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgICBvcGVyYXRpb246ICdjcmVhdGVfbWVtYmVyc2hpcCcsXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIG1lbWJlcnNoaXA7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICAgIGxvZ1N0cnVjdHVyZWQoJ0VSUk9SJywgJ0ZhaWxlZCB0byBjcmVhdGUgbWVtYmVyc2hpcCcsIHtcbiAgICAgICAgY2x1YklkLFxuICAgICAgICB1c2VySWQsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIG9wZXJhdGlvbjogJ2NyZWF0ZV9tZW1iZXJzaGlwJyxcbiAgICAgIH0pO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBtZW1iZXJzaGlwIHJvbGVcbiAgICovXG4gIGFzeW5jIHVwZGF0ZU1lbWJlcnNoaXBSb2xlKG1lbWJlcnNoaXBJZDogc3RyaW5nLCBpbnB1dDogVXBkYXRlTWVtYmVySW5wdXQsIHVwZGF0ZWRCeTogc3RyaW5nKTogUHJvbWlzZTxDbHViTWVtYmVyc2hpcD4ge1xuICAgIC8vIFRoaXMgd291bGQgcmVxdWlyZSBpbXBsZW1lbnRpbmcgbWVtYmVyc2hpcCBsb29rdXAgYnkgSUQgYW5kIHVwZGF0ZSBsb2dpY1xuICAgIC8vIEZvciBQaGFzZSAyLjIgTVZQLCB3ZSdsbCBpbXBsZW1lbnQgYSBzaW1wbGlmaWVkIHZlcnNpb25cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3VwZGF0ZU1lbWJlcnNoaXBSb2xlIG5vdCBmdWxseSBpbXBsZW1lbnRlZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBtZW1iZXJzaGlwIHN0YXR1c1xuICAgKi9cbiAgYXN5bmMgdXBkYXRlTWVtYmVyc2hpcFN0YXR1cyhcbiAgICBtZW1iZXJzaGlwSWQ6IHN0cmluZyxcbiAgICBzdGF0dXM6IE1lbWJlcnNoaXBTdGF0dXMsXG4gICAgcHJvY2Vzc2VkQnk/OiBzdHJpbmcsXG4gICAgcmVhc29uPzogc3RyaW5nXG4gICk6IFByb21pc2U8Q2x1Yk1lbWJlcnNoaXA+IHtcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIEZpcnN0LCB3ZSBuZWVkIHRvIGZpbmQgdGhlIG1lbWJlcnNoaXAgYnkgc2Nhbm5pbmcgZm9yIHRoZSBtZW1iZXJzaGlwSWRcbiAgICAgIC8vIFRoaXMgaXMgaW5lZmZpY2llbnQgYnV0IHdvcmtzIGZvciBNVlAgLSBpbiBwcm9kdWN0aW9uLCBhZGQgYSBHU0kgb24gbWVtYmVyc2hpcElkXG4gICAgICBjb25zdCBzY2FuQ29tbWFuZCA9IG5ldyBRdWVyeUNvbW1hbmQoe1xuICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICBJbmRleE5hbWU6ICdHU0kxJyxcbiAgICAgICAgRmlsdGVyRXhwcmVzc2lvbjogJ21lbWJlcnNoaXBJZCA9IDptZW1iZXJzaGlwSWQnLFxuICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAgICAgJzptZW1iZXJzaGlwSWQnOiBtZW1iZXJzaGlwSWQsXG4gICAgICAgIH0sXG4gICAgICAgIExpbWl0OiAxLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIFRyeSB0byBmaW5kIG1lbWJlcnNoaXAgYWNyb3NzIGFsbCB1c2Vyc1xuICAgICAgLy8gVGhpcyBpcyBhIHdvcmthcm91bmQgLSBpZGVhbGx5IHdlJ2QgaGF2ZSBhIEdTSSBvbiBtZW1iZXJzaGlwSWRcbiAgICAgIC8vIEZvciBub3csIHdlJ2xsIG5lZWQgdGhlIGNsdWJJZCBhbmQgdXNlcklkIHRvIGJlIHBhc3NlZCBvciBzdG9yZWQgZGlmZmVyZW50bHlcbiAgICAgIHRocm93IG5ldyBNZW1iZXJzaGlwTm90Rm91bmRFcnJvcihgQ2Fubm90IHVwZGF0ZSBtZW1iZXJzaGlwICR7bWVtYmVyc2hpcElkfSAtIHJlcXVpcmVzIGNsdWJJZCBhbmQgdXNlcklkYCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICAgIGxvZ1N0cnVjdHVyZWQoJ0VSUk9SJywgJ0ZhaWxlZCB0byB1cGRhdGUgbWVtYmVyc2hpcCBzdGF0dXMnLCB7XG4gICAgICAgIG1lbWJlcnNoaXBJZCxcbiAgICAgICAgc3RhdHVzLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgICBvcGVyYXRpb246ICd1cGRhdGVfbWVtYmVyc2hpcF9zdGF0dXMnLFxuICAgICAgfSk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIG1lbWJlcnNoaXAgc3RhdHVzIGJ5IGNsdWIgYW5kIHVzZXIgKG1vcmUgZWZmaWNpZW50KVxuICAgKi9cbiAgYXN5bmMgdXBkYXRlTWVtYmVyc2hpcFN0YXR1c0J5Q2x1YkFuZFVzZXIoXG4gICAgY2x1YklkOiBzdHJpbmcsXG4gICAgdXNlcklkOiBzdHJpbmcsXG4gICAgc3RhdHVzOiBNZW1iZXJzaGlwU3RhdHVzLFxuICAgIHByb2Nlc3NlZEJ5Pzogc3RyaW5nLFxuICAgIHJlYXNvbj86IHN0cmluZ1xuICApOiBQcm9taXNlPENsdWJNZW1iZXJzaGlwPiB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgIHRyeSB7XG4gICAgICAvLyBHZXQgZXhpc3RpbmcgbWVtYmVyc2hpcFxuICAgICAgY29uc3QgbWVtYmVyc2hpcCA9IGF3YWl0IHRoaXMuZ2V0TWVtYmVyc2hpcEJ5Q2x1YkFuZFVzZXIoY2x1YklkLCB1c2VySWQpO1xuICAgICAgaWYgKCFtZW1iZXJzaGlwKSB7XG4gICAgICAgIHRocm93IG5ldyBNZW1iZXJzaGlwTm90Rm91bmRFcnJvcihgTWVtYmVyc2hpcCBub3QgZm91bmQgZm9yIGNsdWIgJHtjbHViSWR9IGFuZCB1c2VyICR7dXNlcklkfWApO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICBjb25zdCB1cGRhdGVkTWVtYmVyc2hpcDogQ2x1Yk1lbWJlcnNoaXAgPSB7XG4gICAgICAgIC4uLm1lbWJlcnNoaXAsXG4gICAgICAgIHN0YXR1cyxcbiAgICAgICAgdXBkYXRlZEF0OiBub3csXG4gICAgICAgIHByb2Nlc3NlZEJ5LFxuICAgICAgICBwcm9jZXNzZWRBdDogcHJvY2Vzc2VkQnkgPyBub3cgOiBtZW1iZXJzaGlwLnByb2Nlc3NlZEF0LFxuICAgICAgICByZWFzb246IHJlYXNvbiB8fCBtZW1iZXJzaGlwLnJlYXNvbixcbiAgICAgIH07XG5cbiAgICAgIC8vIFVwZGF0ZSBhbGwgdGhyZWUgaXRlbXMgYXRvbWljYWxseVxuICAgICAgY29uc3QgY2Fub25pY2FsSXRlbSA9IHRoaXMubWVtYmVyc2hpcFRvQ2Fub25pY2FsSXRlbSh1cGRhdGVkTWVtYmVyc2hpcCk7XG4gICAgICBjb25zdCB1c2VySW5kZXhJdGVtID0gdGhpcy5tZW1iZXJzaGlwVG9Vc2VySW5kZXhJdGVtKHVwZGF0ZWRNZW1iZXJzaGlwKTtcbiAgICAgIGNvbnN0IGNsdWJNZW1iZXJJbmRleEl0ZW0gPSB0aGlzLm1lbWJlcnNoaXBUb0NsdWJNZW1iZXJJbmRleEl0ZW0odXBkYXRlZE1lbWJlcnNoaXApO1xuXG4gICAgICBjb25zdCBjb21tYW5kID0gbmV3IFRyYW5zYWN0V3JpdGVDb21tYW5kKHtcbiAgICAgICAgVHJhbnNhY3RJdGVtczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIFB1dDoge1xuICAgICAgICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICAgICAgICBJdGVtOiBjYW5vbmljYWxJdGVtLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFB1dDoge1xuICAgICAgICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICAgICAgICBJdGVtOiB1c2VySW5kZXhJdGVtLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFB1dDoge1xuICAgICAgICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICAgICAgICBJdGVtOiBjbHViTWVtYmVySW5kZXhJdGVtLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSk7XG5cbiAgICAgIGF3YWl0IHRoaXMuZHluYW1vQ2xpZW50LnNlbmQoY29tbWFuZCk7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG5cbiAgICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnTWVtYmVyc2hpcCBzdGF0dXMgdXBkYXRlZCBpbiBEeW5hbW9EQicsIHtcbiAgICAgICAgY2x1YklkLFxuICAgICAgICB1c2VySWQsXG4gICAgICAgIG1lbWJlcnNoaXBJZDogbWVtYmVyc2hpcC5tZW1iZXJzaGlwSWQsXG4gICAgICAgIG9sZFN0YXR1czogbWVtYmVyc2hpcC5zdGF0dXMsXG4gICAgICAgIG5ld1N0YXR1czogc3RhdHVzLFxuICAgICAgICBwcm9jZXNzZWRCeSxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIG9wZXJhdGlvbjogJ3VwZGF0ZV9tZW1iZXJzaGlwX3N0YXR1c19ieV9jbHViX2FuZF91c2VyJyxcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdXBkYXRlZE1lbWJlcnNoaXA7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICAgIGxvZ1N0cnVjdHVyZWQoJ0VSUk9SJywgJ0ZhaWxlZCB0byB1cGRhdGUgbWVtYmVyc2hpcCBzdGF0dXMgYnkgY2x1YiBhbmQgdXNlcicsIHtcbiAgICAgICAgY2x1YklkLFxuICAgICAgICB1c2VySWQsXG4gICAgICAgIHN0YXR1cyxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgb3BlcmF0aW9uOiAndXBkYXRlX21lbWJlcnNoaXBfc3RhdHVzX2J5X2NsdWJfYW5kX3VzZXInLFxuICAgICAgfSk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIG1lbWJlcnNoaXBcbiAgICovXG4gIGFzeW5jIHJlbW92ZU1lbWJlcnNoaXAobWVtYmVyc2hpcElkOiBzdHJpbmcsIHJlbW92ZWRCeTogc3RyaW5nLCByZWFzb24/OiBzdHJpbmcpOiBQcm9taXNlPENsdWJNZW1iZXJzaGlwPiB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlTWVtYmVyc2hpcFN0YXR1cyhtZW1iZXJzaGlwSWQsIE1lbWJlcnNoaXBTdGF0dXMuUkVNT1ZFRCwgcmVtb3ZlZEJ5LCByZWFzb24pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBtZW1iZXJzaGlwIGJ5IGNsdWIgYW5kIHVzZXIgKG1vcmUgZWZmaWNpZW50KVxuICAgKi9cbiAgYXN5bmMgcmVtb3ZlTWVtYmVyc2hpcEJ5Q2x1YkFuZFVzZXIoY2x1YklkOiBzdHJpbmcsIHVzZXJJZDogc3RyaW5nLCByZW1vdmVkQnk6IHN0cmluZywgcmVhc29uPzogc3RyaW5nKTogUHJvbWlzZTxDbHViTWVtYmVyc2hpcD4ge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZU1lbWJlcnNoaXBTdGF0dXNCeUNsdWJBbmRVc2VyKGNsdWJJZCwgdXNlcklkLCBNZW1iZXJzaGlwU3RhdHVzLlJFTU9WRUQsIHJlbW92ZWRCeSwgcmVhc29uKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB1c2VyIGlzIGEgbWVtYmVyIG9mIGNsdWJcbiAgICovXG4gIGFzeW5jIGlzVXNlck1lbWJlcihjbHViSWQ6IHN0cmluZywgdXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBtZW1iZXJzaGlwID0gYXdhaXQgdGhpcy5nZXRNZW1iZXJzaGlwQnlDbHViQW5kVXNlcihjbHViSWQsIHVzZXJJZCk7XG4gICAgcmV0dXJuIG1lbWJlcnNoaXAgIT09IG51bGwgJiYgbWVtYmVyc2hpcC5zdGF0dXMgPT09IE1lbWJlcnNoaXBTdGF0dXMuQUNUSVZFO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB1c2VyJ3Mgcm9sZSBpbiBjbHViXG4gICAqL1xuICBhc3luYyBnZXRVc2VyUm9sZUluQ2x1YihjbHViSWQ6IHN0cmluZywgdXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPENsdWJSb2xlIHwgbnVsbD4ge1xuICAgIGNvbnN0IG1lbWJlcnNoaXAgPSBhd2FpdCB0aGlzLmdldE1lbWJlcnNoaXBCeUNsdWJBbmRVc2VyKGNsdWJJZCwgdXNlcklkKTtcbiAgICByZXR1cm4gbWVtYmVyc2hpcCAmJiBtZW1iZXJzaGlwLnN0YXR1cyA9PT0gTWVtYmVyc2hpcFN0YXR1cy5BQ1RJVkUgPyBtZW1iZXJzaGlwLnJvbGUgOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIENvdW50IGNsdWIgbWVtYmVycyBieSBzdGF0dXNcbiAgICovXG4gIGFzeW5jIGNvdW50Q2x1Yk1lbWJlcnMoY2x1YklkOiBzdHJpbmcsIHN0YXR1czogTWVtYmVyc2hpcFN0YXR1cyA9IE1lbWJlcnNoaXBTdGF0dXMuQUNUSVZFKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICAvLyBUaGlzIHdvdWxkIHJlcXVpcmUgYSBjb3VudCBxdWVyeSBvciBhZ2dyZWdhdGlvblxuICAgIC8vIEZvciBQaGFzZSAyLjIgTVZQLCB3ZSdsbCBpbXBsZW1lbnQgYSBzaW1wbGlmaWVkIHZlcnNpb25cbiAgICBjb25zdCBtZW1iZXJzID0gYXdhaXQgdGhpcy5saXN0Q2x1Yk1lbWJlcnMoY2x1YklkLCB7IHN0YXR1cywgbGltaXQ6IDEwMDAgfSk7XG4gICAgcmV0dXJuIG1lbWJlcnMubWVtYmVycy5sZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGNsdWIgb3duZXJcbiAgICovXG4gIGFzeW5jIGdldENsdWJPd25lcihjbHViSWQ6IHN0cmluZyk6IFByb21pc2U8Q2x1Yk1lbWJlcnNoaXAgfCBudWxsPiB7XG4gICAgY29uc3QgbWVtYmVycyA9IGF3YWl0IHRoaXMubGlzdENsdWJNZW1iZXJzKGNsdWJJZCwgeyByb2xlOiBDbHViUm9sZS5PV05FUiwgc3RhdHVzOiBNZW1iZXJzaGlwU3RhdHVzLkFDVElWRSB9KTtcbiAgICByZXR1cm4gbWVtYmVycy5tZW1iZXJzLmxlbmd0aCA+IDAgPyB0aGlzLm1lbWJlckluZm9Ub01lbWJlcnNoaXAobWVtYmVycy5tZW1iZXJzWzBdKSA6IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGNsdWIgYWRtaW5zIChpbmNsdWRpbmcgb3duZXIpXG4gICAqL1xuICBhc3luYyBnZXRDbHViQWRtaW5zKGNsdWJJZDogc3RyaW5nKTogUHJvbWlzZTxDbHViTWVtYmVyc2hpcFtdPiB7XG4gICAgY29uc3QgW2FkbWlucywgb3duZXJzXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIHRoaXMubGlzdENsdWJNZW1iZXJzKGNsdWJJZCwgeyByb2xlOiBDbHViUm9sZS5BRE1JTiwgc3RhdHVzOiBNZW1iZXJzaGlwU3RhdHVzLkFDVElWRSB9KSxcbiAgICAgIHRoaXMubGlzdENsdWJNZW1iZXJzKGNsdWJJZCwgeyByb2xlOiBDbHViUm9sZS5PV05FUiwgc3RhdHVzOiBNZW1iZXJzaGlwU3RhdHVzLkFDVElWRSB9KSxcbiAgICBdKTtcblxuICAgIHJldHVybiBbXG4gICAgICAuLi5hZG1pbnMubWVtYmVycy5tYXAobWVtYmVyID0+IHRoaXMubWVtYmVySW5mb1RvTWVtYmVyc2hpcChtZW1iZXIpKSxcbiAgICAgIC4uLm93bmVycy5tZW1iZXJzLm1hcChtZW1iZXIgPT4gdGhpcy5tZW1iZXJJbmZvVG9NZW1iZXJzaGlwKG1lbWJlcikpLFxuICAgIF07XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgdXNlciBoYXMgcGVuZGluZyBtZW1iZXJzaGlwIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIGhhc1BlbmRpbmdNZW1iZXJzaGlwUmVxdWVzdChjbHViSWQ6IHN0cmluZywgdXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBtZW1iZXJzaGlwID0gYXdhaXQgdGhpcy5nZXRNZW1iZXJzaGlwQnlDbHViQW5kVXNlcihjbHViSWQsIHVzZXJJZCk7XG4gICAgcmV0dXJuIG1lbWJlcnNoaXAgIT09IG51bGwgJiYgbWVtYmVyc2hpcC5zdGF0dXMgPT09IE1lbWJlcnNoaXBTdGF0dXMuUEVORElORztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgY2x1YiBtZW1iZXIgY291bnQgKGFjdGl2ZSBtZW1iZXJzIG9ubHkpXG4gICAqL1xuICBhc3luYyBnZXRDbHViTWVtYmVyQ291bnQoY2x1YklkOiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHJldHVybiB0aGlzLmNvdW50Q2x1Yk1lbWJlcnMoY2x1YklkLCBNZW1iZXJzaGlwU3RhdHVzLkFDVElWRSk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydCBEeW5hbW9EQiBjYW5vbmljYWwgaXRlbSB0byBNZW1iZXJzaGlwXG4gICAqL1xuICBwcml2YXRlIGR5bmFtb0l0ZW1Ub01lbWJlcnNoaXAoaXRlbTogTWVtYmVyc2hpcER5bmFtb0l0ZW0pOiBDbHViTWVtYmVyc2hpcCB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1lbWJlcnNoaXBJZDogaXRlbS5tZW1iZXJzaGlwSWQsXG4gICAgICBjbHViSWQ6IGl0ZW0uY2x1YklkLFxuICAgICAgdXNlcklkOiBpdGVtLnVzZXJJZCxcbiAgICAgIHJvbGU6IGl0ZW0ucm9sZSxcbiAgICAgIHN0YXR1czogaXRlbS5zdGF0dXMsXG4gICAgICBqb2luZWRBdDogaXRlbS5qb2luZWRBdCxcbiAgICAgIHVwZGF0ZWRBdDogaXRlbS51cGRhdGVkQXQsXG4gICAgICBqb2luTWVzc2FnZTogaXRlbS5qb2luTWVzc2FnZSxcbiAgICAgIGludml0ZWRCeTogaXRlbS5pbnZpdGVkQnksXG4gICAgICBwcm9jZXNzZWRCeTogaXRlbS5wcm9jZXNzZWRCeSxcbiAgICAgIHByb2Nlc3NlZEF0OiBpdGVtLnByb2Nlc3NlZEF0LFxuICAgICAgcmVhc29uOiBpdGVtLnJlYXNvbixcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgQ2x1Yk1lbWJlckluZm8gdG8gQ2x1Yk1lbWJlcnNoaXBcbiAgICovXG4gIHByaXZhdGUgbWVtYmVySW5mb1RvTWVtYmVyc2hpcChtZW1iZXJJbmZvOiBDbHViTWVtYmVySW5mbyk6IENsdWJNZW1iZXJzaGlwIHtcbiAgICByZXR1cm4ge1xuICAgICAgbWVtYmVyc2hpcElkOiBtZW1iZXJJbmZvLm1lbWJlcnNoaXBJZCxcbiAgICAgIGNsdWJJZDogJycsIC8vIFdvdWxkIG5lZWQgdG8gYmUgcHJvdmlkZWQgb3IgbG9va2VkIHVwXG4gICAgICB1c2VySWQ6IG1lbWJlckluZm8udXNlcklkLFxuICAgICAgcm9sZTogbWVtYmVySW5mby5yb2xlLFxuICAgICAgc3RhdHVzOiBtZW1iZXJJbmZvLnN0YXR1cyxcbiAgICAgIGpvaW5lZEF0OiBtZW1iZXJJbmZvLmpvaW5lZEF0LFxuICAgICAgdXBkYXRlZEF0OiBtZW1iZXJJbmZvLnVwZGF0ZWRBdCB8fCBtZW1iZXJJbmZvLmpvaW5lZEF0LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydCBNZW1iZXJzaGlwIHRvIER5bmFtb0RCIGNhbm9uaWNhbCBpdGVtXG4gICAqL1xuICBwcml2YXRlIG1lbWJlcnNoaXBUb0Nhbm9uaWNhbEl0ZW0obWVtYmVyc2hpcDogQ2x1Yk1lbWJlcnNoaXApOiBNZW1iZXJzaGlwRHluYW1vSXRlbSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIFBLOiBgQ0xVQiMke21lbWJlcnNoaXAuY2x1YklkfWAsXG4gICAgICBTSzogYE1FTUJFUiMke21lbWJlcnNoaXAudXNlcklkfWAsXG4gICAgICBlbnRpdHlUeXBlOiAnQ0xVQl9NRU1CRVJTSElQJyxcbiAgICAgIG1lbWJlcnNoaXBJZDogbWVtYmVyc2hpcC5tZW1iZXJzaGlwSWQsXG4gICAgICBjbHViSWQ6IG1lbWJlcnNoaXAuY2x1YklkLFxuICAgICAgdXNlcklkOiBtZW1iZXJzaGlwLnVzZXJJZCxcbiAgICAgIHJvbGU6IG1lbWJlcnNoaXAucm9sZSxcbiAgICAgIHN0YXR1czogbWVtYmVyc2hpcC5zdGF0dXMsXG4gICAgICBqb2luZWRBdDogbWVtYmVyc2hpcC5qb2luZWRBdCxcbiAgICAgIHVwZGF0ZWRBdDogbWVtYmVyc2hpcC51cGRhdGVkQXQsXG4gICAgICBqb2luTWVzc2FnZTogbWVtYmVyc2hpcC5qb2luTWVzc2FnZSxcbiAgICAgIGludml0ZWRCeTogbWVtYmVyc2hpcC5pbnZpdGVkQnksXG4gICAgICBwcm9jZXNzZWRCeTogbWVtYmVyc2hpcC5wcm9jZXNzZWRCeSxcbiAgICAgIHByb2Nlc3NlZEF0OiBtZW1iZXJzaGlwLnByb2Nlc3NlZEF0LFxuICAgICAgcmVhc29uOiBtZW1iZXJzaGlwLnJlYXNvbixcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgTWVtYmVyc2hpcCB0byBEeW5hbW9EQiB1c2VyIGluZGV4IGl0ZW1cbiAgICovXG4gIHByaXZhdGUgbWVtYmVyc2hpcFRvVXNlckluZGV4SXRlbShtZW1iZXJzaGlwOiBDbHViTWVtYmVyc2hpcCk6IFVzZXJNZW1iZXJzaGlwRHluYW1vSXRlbSB7XG4gICAgY29uc3Qgc2sgPSBgTUVNQkVSU0hJUCMke21lbWJlcnNoaXAuY2x1YklkfWA7XG4gICAgcmV0dXJuIHtcbiAgICAgIFBLOiBgVVNFUiMke21lbWJlcnNoaXAudXNlcklkfWAsXG4gICAgICBTSzogc2ssXG4gICAgICBHU0kxUEs6IGBVU0VSIyR7bWVtYmVyc2hpcC51c2VySWR9YCxcbiAgICAgIEdTSTFTSzogc2ssXG4gICAgICBlbnRpdHlUeXBlOiAnVVNFUl9NRU1CRVJTSElQJyxcbiAgICAgIG1lbWJlcnNoaXBJZDogbWVtYmVyc2hpcC5tZW1iZXJzaGlwSWQsXG4gICAgICBjbHViSWQ6IG1lbWJlcnNoaXAuY2x1YklkLFxuICAgICAgdXNlcklkOiBtZW1iZXJzaGlwLnVzZXJJZCxcbiAgICAgIHJvbGU6IG1lbWJlcnNoaXAucm9sZSxcbiAgICAgIHN0YXR1czogbWVtYmVyc2hpcC5zdGF0dXMsXG4gICAgICBqb2luZWRBdDogbWVtYmVyc2hpcC5qb2luZWRBdCxcbiAgICAgIHVwZGF0ZWRBdDogbWVtYmVyc2hpcC51cGRhdGVkQXQsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0IE1lbWJlcnNoaXAgdG8gRHluYW1vREIgY2x1YiBtZW1iZXIgaW5kZXggaXRlbVxuICAgKi9cbiAgcHJpdmF0ZSBtZW1iZXJzaGlwVG9DbHViTWVtYmVySW5kZXhJdGVtKG1lbWJlcnNoaXA6IENsdWJNZW1iZXJzaGlwKTogQ2x1Yk1lbWJlckR5bmFtb0l0ZW0ge1xuICAgIGNvbnN0IHNrID0gYFJPTEUjJHttZW1iZXJzaGlwLnJvbGV9I1VTRVIjJHttZW1iZXJzaGlwLnVzZXJJZH1gO1xuICAgIHJldHVybiB7XG4gICAgICBQSzogYENMVUIjJHttZW1iZXJzaGlwLmNsdWJJZH0jTUVNQkVSU2AsXG4gICAgICBTSzogc2ssXG4gICAgICBHU0kyUEs6IGBDTFVCIyR7bWVtYmVyc2hpcC5jbHViSWR9I01FTUJFUlNgLFxuICAgICAgR1NJMlNLOiBzayxcbiAgICAgIGVudGl0eVR5cGU6ICdDTFVCX01FTUJFUl9JTkRFWCcsXG4gICAgICBtZW1iZXJzaGlwSWQ6IG1lbWJlcnNoaXAubWVtYmVyc2hpcElkLFxuICAgICAgdXNlcklkOiBtZW1iZXJzaGlwLnVzZXJJZCxcbiAgICAgIHJvbGU6IG1lbWJlcnNoaXAucm9sZSxcbiAgICAgIHN0YXR1czogbWVtYmVyc2hpcC5zdGF0dXMsXG4gICAgICBqb2luZWRBdDogbWVtYmVyc2hpcC5qb2luZWRBdCxcbiAgICAgIHVwZGF0ZWRBdDogbWVtYmVyc2hpcC51cGRhdGVkQXQsXG4gICAgfTtcbiAgfVxufSJdfQ==