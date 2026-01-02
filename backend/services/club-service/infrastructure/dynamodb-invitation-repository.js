"use strict";
/**
 * DynamoDB Invitation Repository - Phase 2.2
 *
 * DynamoDB implementation of the invitation repository interface.
 * Uses single-table design with dual invitation system support.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBInvitationRepository = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const invitation_1 = require("../../../shared/types/invitation");
const lambda_utils_1 = require("../../../shared/utils/lambda-utils");
const invitation_2 = require("../domain/invitation/invitation");
const invitation_errors_1 = require("../domain/invitation/invitation-errors");
/**
 * DynamoDB invitation repository implementation
 */
class DynamoDBInvitationRepository {
    constructor(tableName, dynamoClient) {
        const client = dynamoClient || new client_dynamodb_1.DynamoDBClient({});
        this.dynamoClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
        this.tableName = tableName || process.env.MAIN_TABLE_NAME || 'sydney-cycles-main-development';
    }
    /**
     * Get invitation by ID
     */
    async getInvitationById(invitationId) {
        const startTime = Date.now();
        try {
            const command = new lib_dynamodb_1.GetCommand({
                TableName: this.tableName,
                Key: {
                    PK: `INVITATION#${invitationId}`,
                    SK: 'METADATA',
                },
            });
            const result = await this.dynamoClient.send(command);
            const duration = Date.now() - startTime;
            if (!result.Item) {
                (0, lambda_utils_1.logStructured)('INFO', 'Invitation not found', {
                    invitationId,
                    duration,
                    operation: 'get_invitation_by_id',
                });
                return null;
            }
            const invitation = this.dynamoItemToInvitation(result.Item);
            (0, lambda_utils_1.logStructured)('INFO', 'Invitation retrieved from DynamoDB', {
                invitationId,
                type: invitation.type,
                status: invitation.status,
                clubId: invitation.clubId,
                duration,
                operation: 'get_invitation_by_id',
            });
            return invitation;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('ERROR', 'Failed to get invitation by ID', {
                invitationId,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
                operation: 'get_invitation_by_id',
            });
            throw error;
        }
    }
    /**
     * Get invitation by token (for email invitations)
     */
    async getInvitationByToken(token) {
        const startTime = Date.now();
        try {
            // For Phase 2.2 MVP, we'll need to scan or use a GSI for token lookups
            // This is a simplified implementation - in production, consider adding a GSI
            const command = new lib_dynamodb_1.QueryCommand({
                TableName: this.tableName,
                FilterExpression: '#token = :token AND #entityType = :entityType',
                ExpressionAttributeNames: {
                    '#token': 'token',
                    '#entityType': 'entityType',
                },
                ExpressionAttributeValues: {
                    ':token': token,
                    ':entityType': 'CLUB_INVITATION',
                },
            });
            const result = await this.dynamoClient.send(command);
            const duration = Date.now() - startTime;
            if (!result.Items || result.Items.length === 0) {
                (0, lambda_utils_1.logStructured)('INFO', 'Invitation not found by token', {
                    duration,
                    operation: 'get_invitation_by_token',
                });
                return null;
            }
            const invitation = this.dynamoItemToInvitation(result.Items[0]);
            (0, lambda_utils_1.logStructured)('INFO', 'Invitation retrieved by token from DynamoDB', {
                invitationId: invitation.invitationId,
                type: invitation.type,
                status: invitation.status,
                clubId: invitation.clubId,
                duration,
                operation: 'get_invitation_by_token',
            });
            return invitation;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('ERROR', 'Failed to get invitation by token', {
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
                operation: 'get_invitation_by_token',
            });
            throw error;
        }
    }
    /**
     * List user's pending invitations
     */
    async listUserInvitations(userId, options) {
        const startTime = Date.now();
        const limit = options.limit || invitation_1.INVITATION_CONSTRAINTS.DEFAULT_LIST_LIMIT;
        try {
            const queryParams = {
                TableName: this.tableName,
                IndexName: 'GSI1',
                KeyConditionExpression: 'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :invitationPrefix)',
                ExpressionAttributeValues: {
                    ':gsi1pk': `USER#${userId}`,
                    ':invitationPrefix': 'INVITATION#',
                },
                Limit: limit + 1,
                ScanIndexForward: false, // Most recent first
            };
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
                        GSI1PK: `USER#${userId}`,
                        GSI1SK: `INVITATION#${decodedCursor.invitationId}`,
                        PK: `USER#${userId}`,
                        SK: `INVITATION#${decodedCursor.invitationId}`,
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
            const invitationItems = items.slice(0, limit);
            const invitations = invitationItems.map(item => {
                const invitationItem = item;
                return {
                    invitationId: invitationItem.invitationId,
                    clubId: invitationItem.clubId,
                    clubName: invitationItem.clubName,
                    role: invitationItem.role,
                    status: invitationItem.status,
                    invitedBy: invitationItem.invitedBy,
                    invitedByName: invitationItem.invitedByName,
                    invitedAt: invitationItem.invitedAt,
                    expiresAt: invitationItem.expiresAt,
                    message: invitationItem.message,
                };
            });
            let nextCursor;
            if (hasMore && invitations.length > 0) {
                const lastInvitation = invitations[invitations.length - 1];
                const cursorData = {
                    invitationId: lastInvitation.invitationId,
                };
                nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
            }
            (0, lambda_utils_1.logStructured)('INFO', 'User invitations listed from DynamoDB', {
                userId,
                resultCount: invitations.length,
                hasMore,
                status: options.status,
                duration,
                operation: 'list_user_invitations',
            });
            return {
                invitations,
                nextCursor,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('ERROR', 'Failed to list user invitations', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
                operation: 'list_user_invitations',
            });
            throw error;
        }
    }
    /**
     * Create a new invitation
     */
    async createInvitation(input, clubId, invitedBy) {
        const startTime = Date.now();
        try {
            // Create invitation entity
            const invitationEntity = (0, invitation_2.createInvitation)(input, clubId, invitedBy);
            const invitation = invitationEntity.toInvitation();
            // Create DynamoDB items
            const canonicalItem = this.invitationToCanonicalItem(invitation);
            const transactItems = [
                {
                    Put: {
                        TableName: this.tableName,
                        Item: canonicalItem,
                        ConditionExpression: 'attribute_not_exists(PK)', // Ensure invitation doesn't already exist
                    },
                },
            ];
            // For user invitations, create user index item
            if (invitation.type === invitation_1.InvitationType.USER && invitation.userId) {
                const userIndexItem = await this.invitationToUserIndexItem(invitation, invitedBy);
                transactItems.push({
                    Put: {
                        TableName: this.tableName,
                        Item: userIndexItem,
                    },
                });
            }
            // Use TransactWrite to ensure all items are created atomically
            const command = new lib_dynamodb_1.TransactWriteCommand({
                TransactItems: transactItems,
            });
            await this.dynamoClient.send(command);
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('INFO', 'Invitation created in DynamoDB', {
                invitationId: invitation.invitationId,
                type: invitation.type,
                clubId: invitation.clubId,
                role: invitation.role,
                duration,
                operation: 'create_invitation',
            });
            return invitation;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('ERROR', 'Failed to create invitation', {
                clubId,
                invitedBy,
                type: input.type,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
                operation: 'create_invitation',
            });
            throw error;
        }
    }
    /**
     * Process invitation (accept/decline)
     */
    async processInvitation(invitationId, input, userId) {
        const startTime = Date.now();
        try {
            // Get existing invitation
            const existingInvitation = await this.getInvitationById(invitationId);
            if (!existingInvitation) {
                throw new invitation_errors_1.InvitationNotFoundError(invitationId);
            }
            // Create updated invitation entity
            const invitationEntity = (0, invitation_2.fromInvitationData)(existingInvitation);
            const updatedInvitationEntity = invitationEntity.process(input, userId);
            const updatedInvitation = updatedInvitationEntity.toInvitation();
            // Update canonical item
            const command = new lib_dynamodb_1.UpdateCommand({
                TableName: this.tableName,
                Key: {
                    PK: `INVITATION#${invitationId}`,
                    SK: 'METADATA',
                },
                UpdateExpression: 'SET #status = :status, processedAt = :processedAt, userId = :userId',
                ExpressionAttributeNames: {
                    '#status': 'status',
                },
                ExpressionAttributeValues: {
                    ':status': updatedInvitation.status,
                    ':processedAt': updatedInvitation.processedAt,
                    ':userId': updatedInvitation.userId,
                },
                ReturnValues: 'ALL_NEW',
            });
            const result = await this.dynamoClient.send(command);
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('INFO', 'Invitation processed in DynamoDB', {
                invitationId,
                action: input.action,
                newStatus: updatedInvitation.status,
                userId,
                duration,
                operation: 'process_invitation',
            });
            return this.dynamoItemToInvitation(result.Attributes);
        }
        catch (error) {
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('ERROR', 'Failed to process invitation', {
                invitationId,
                action: input.action,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
                operation: 'process_invitation',
            });
            throw error;
        }
    }
    /**
     * Cancel invitation (admin action)
     */
    async cancelInvitation(invitationId) {
        const startTime = Date.now();
        try {
            // Get existing invitation
            const existingInvitation = await this.getInvitationById(invitationId);
            if (!existingInvitation) {
                throw new invitation_errors_1.InvitationNotFoundError(invitationId);
            }
            // Create updated invitation entity
            const invitationEntity = (0, invitation_2.fromInvitationData)(existingInvitation);
            const updatedInvitationEntity = invitationEntity.cancel();
            const updatedInvitation = updatedInvitationEntity.toInvitation();
            // Update canonical item
            const command = new lib_dynamodb_1.UpdateCommand({
                TableName: this.tableName,
                Key: {
                    PK: `INVITATION#${invitationId}`,
                    SK: 'METADATA',
                },
                UpdateExpression: 'SET #status = :status, processedAt = :processedAt',
                ExpressionAttributeNames: {
                    '#status': 'status',
                },
                ExpressionAttributeValues: {
                    ':status': updatedInvitation.status,
                    ':processedAt': updatedInvitation.processedAt,
                },
                ReturnValues: 'ALL_NEW',
            });
            const result = await this.dynamoClient.send(command);
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('INFO', 'Invitation cancelled in DynamoDB', {
                invitationId,
                newStatus: updatedInvitation.status,
                duration,
                operation: 'cancel_invitation',
            });
            return this.dynamoItemToInvitation(result.Attributes);
        }
        catch (error) {
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('ERROR', 'Failed to cancel invitation', {
                invitationId,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
                operation: 'cancel_invitation',
            });
            throw error;
        }
    }
    /**
     * Check if user has pending invitation to club
     */
    async hasPendingInvitation(clubId, userId, email) {
        // This would require a more complex query or GSI
        // For Phase 2.2 MVP, we'll implement a simplified version
        return false;
    }
    /**
     * Get pending invitations for club (admin view)
     */
    async listClubInvitations(clubId, options) {
        // This would require a GSI or scan operation
        // For Phase 2.2 MVP, we'll implement a simplified version
        return [];
    }
    /**
     * Expire old invitations
     */
    async expireInvitations(beforeDate) {
        // This would require a scan operation to find expired invitations
        // For Phase 2.2 MVP, we'll implement a simplified version
        return 0;
    }
    /**
     * Get invitation statistics for club
     */
    async getInvitationStats(clubId) {
        // This would require aggregation queries
        // For Phase 2.2 MVP, we'll return default values
        return {
            pending: 0,
            accepted: 0,
            declined: 0,
            expired: 0,
            cancelled: 0,
        };
    }
    /**
     * Convert DynamoDB canonical item to Invitation
     */
    dynamoItemToInvitation(item) {
        return {
            invitationId: item.invitationId,
            type: item.type,
            clubId: item.clubId,
            email: item.email,
            userId: item.userId,
            role: item.role,
            status: item.status,
            invitedBy: item.invitedBy,
            invitedAt: item.invitedAt,
            expiresAt: item.expiresAt,
            processedAt: item.processedAt,
            message: item.message,
            token: item.token,
            deliveryMethod: item.deliveryMethod,
        };
    }
    /**
     * Convert Invitation to DynamoDB canonical item
     */
    invitationToCanonicalItem(invitation) {
        return {
            PK: `INVITATION#${invitation.invitationId}`,
            SK: 'METADATA',
            entityType: 'CLUB_INVITATION',
            invitationId: invitation.invitationId,
            type: invitation.type,
            clubId: invitation.clubId,
            email: invitation.email,
            userId: invitation.userId,
            role: invitation.role,
            status: invitation.status,
            invitedBy: invitation.invitedBy,
            invitedAt: invitation.invitedAt,
            expiresAt: invitation.expiresAt,
            processedAt: invitation.processedAt,
            message: invitation.message,
            token: invitation.token,
            deliveryMethod: invitation.deliveryMethod,
        };
    }
    /**
     * Convert Invitation to DynamoDB user index item (for in-app invitations)
     */
    async invitationToUserIndexItem(invitation, invitedBy) {
        const sk = `INVITATION#${invitation.invitationId}`;
        // For Phase 2.2 MVP, we'll use placeholder values for club and user names
        // In production, these would be enriched with actual data
        return {
            PK: `USER#${invitation.userId}`,
            SK: sk,
            GSI1PK: `USER#${invitation.userId}`,
            GSI1SK: sk,
            entityType: 'USER_INVITATION',
            invitationId: invitation.invitationId,
            clubId: invitation.clubId,
            clubName: 'Unknown Club',
            role: invitation.role,
            status: invitation.status,
            invitedBy: invitation.invitedBy,
            invitedByName: 'Unknown User',
            invitedAt: invitation.invitedAt,
            expiresAt: invitation.expiresAt,
            message: invitation.message,
        };
    }
}
exports.DynamoDBInvitationRepository = DynamoDBInvitationRepository;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHluYW1vZGItaW52aXRhdGlvbi1yZXBvc2l0b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZHluYW1vZGItaW52aXRhdGlvbi1yZXBvc2l0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBRUgsOERBQTBEO0FBQzFELHdEQU0rQjtBQUMvQixpRUFZMEM7QUFFMUMscUVBQW1FO0FBRW5FLGdFQUF1RjtBQUN2Riw4RUFBaUY7QUFFakY7O0dBRUc7QUFDSCxNQUFhLDRCQUE0QjtJQUl2QyxZQUFZLFNBQWtCLEVBQUUsWUFBNkI7UUFDM0QsTUFBTSxNQUFNLEdBQUcsWUFBWSxJQUFJLElBQUksZ0NBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN0RCxJQUFJLENBQUMsWUFBWSxHQUFHLHFDQUFzQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN4RCxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSxnQ0FBZ0MsQ0FBQztJQUNoRyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsaUJBQWlCLENBQUMsWUFBb0I7UUFDMUMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRTdCLElBQUk7WUFDRixNQUFNLE9BQU8sR0FBRyxJQUFJLHlCQUFVLENBQUM7Z0JBQzdCLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztnQkFDekIsR0FBRyxFQUFFO29CQUNILEVBQUUsRUFBRSxjQUFjLFlBQVksRUFBRTtvQkFDaEMsRUFBRSxFQUFFLFVBQVU7aUJBQ2Y7YUFDRixDQUFDLENBQUM7WUFFSCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3JELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUM7WUFF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QUFTLEVBQUUsVUFBVSxDQUFDLFNBQVM7WUFDL0IsV0FBVyxFQUFFLFVBQVUsQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBRSxVQUFVLENBQUMsT0FBTztZQUMzQixLQUFLLEVBQUUsVUFBVSxDQUFDLEtBQUs7WUFDdkIsY0FBYyxFQUFFLFVBQVUsQ0FBQyxjQUFjO1NBQzFDLENBQUM7SUFDSixDQUFDO0lBRUQ7O09BRUc7SUFDSyxLQUFLLENBQUMseUJBQXlCLENBQUMsVUFBMEIsRUFBRSxTQUFpQjtRQUNuRixNQUFNLEVBQUUsR0FBRyxjQUFjLFVBQVUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUVuRCwwRUFBMEU7UUFDMUUsMERBQTBEO1FBQzFELE9BQU87WUFDTCxFQUFFLEVBQUUsUUFBUSxVQUFVLENBQUMsTUFBTSxFQUFFO1lBQy9CLEVBQUUsRUFBRSxFQUFFO1lBQ04sTUFBTSxFQUFFLFFBQVEsVUFBVSxDQUFDLE1BQU0sRUFBRTtZQUNuQyxNQUFNLEVBQUUsRUFBRTtZQUNWLFVBQVUsRUFBRSxpQkFBaUI7WUFDN0IsWUFBWSxFQUFFLFVBQVUsQ0FBQyxZQUFZO1lBQ3JDLE1BQU0sRUFBRSxVQUFVLENBQUMsTUFBTTtZQUN6QixRQUFRLEVBQUUsY0FBYztZQUN4QixJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUk7WUFDckIsTUFBTSxFQUFFLFVBQVUsQ0FBQyxNQUFNO1lBQ3pCLFNBQVMsRUFBRSxVQUFVLENBQUMsU0FBUztZQUMvQixhQUFhLEVBQUUsY0FBYztZQUM3QixTQUFTLEVBQUUsVUFBVSxDQUFDLFNBQVM7WUFDL0IsU0FBUyxFQUFFLFVBQVUsQ0FBQyxTQUFTO1lBQy9CLE9BQU8sRUFBRSxVQUFVLENBQUMsT0FBTztTQUM1QixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBamhCRCxvRUFpaEJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBEeW5hbW9EQiBJbnZpdGF0aW9uIFJlcG9zaXRvcnkgLSBQaGFzZSAyLjJcbiAqIFxuICogRHluYW1vREIgaW1wbGVtZW50YXRpb24gb2YgdGhlIGludml0YXRpb24gcmVwb3NpdG9yeSBpbnRlcmZhY2UuXG4gKiBVc2VzIHNpbmdsZS10YWJsZSBkZXNpZ24gd2l0aCBkdWFsIGludml0YXRpb24gc3lzdGVtIHN1cHBvcnQuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDIuMiBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0yLjIuY2x1Yi1tZW1iZXJzaGlwLXJvbGVzLnYxLm1kXG4gKi9cblxuaW1wb3J0IHsgRHluYW1vREJDbGllbnQgfSBmcm9tICdAYXdzLXNkay9jbGllbnQtZHluYW1vZGInO1xuaW1wb3J0IHtcbiAgRHluYW1vREJEb2N1bWVudENsaWVudCxcbiAgR2V0Q29tbWFuZCxcbiAgUXVlcnlDb21tYW5kLFxuICBUcmFuc2FjdFdyaXRlQ29tbWFuZCxcbiAgVXBkYXRlQ29tbWFuZCxcbn0gZnJvbSAnQGF3cy1zZGsvbGliLWR5bmFtb2RiJztcbmltcG9ydCB7XG4gIENsdWJJbnZpdGF0aW9uLFxuICBJbnZpdGF0aW9uVHlwZSxcbiAgSW52aXRhdGlvblN0YXR1cyxcbiAgQ3JlYXRlSW52aXRhdGlvbklucHV0LFxuICBQcm9jZXNzSW52aXRhdGlvbklucHV0LFxuICBMaXN0SW52aXRhdGlvbnNPcHRpb25zLFxuICBMaXN0SW52aXRhdGlvbnNSZXN1bHQsXG4gIFVzZXJJbnZpdGF0aW9uU3VtbWFyeSxcbiAgSW52aXRhdGlvbkR5bmFtb0l0ZW0sXG4gIFVzZXJJbnZpdGF0aW9uRHluYW1vSXRlbSxcbiAgSU5WSVRBVElPTl9DT05TVFJBSU5UUyxcbn0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL3R5cGVzL2ludml0YXRpb24nO1xuaW1wb3J0IHsgTm90Rm91bmRFcnJvciB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC91dGlscy9lcnJvcnMnO1xuaW1wb3J0IHsgbG9nU3RydWN0dXJlZCB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC91dGlscy9sYW1iZGEtdXRpbHMnO1xuaW1wb3J0IHsgSUludml0YXRpb25SZXBvc2l0b3J5IH0gZnJvbSAnLi4vZG9tYWluL2ludml0YXRpb24vaW52aXRhdGlvbi1yZXBvc2l0b3J5JztcbmltcG9ydCB7IGNyZWF0ZUludml0YXRpb24sIGZyb21JbnZpdGF0aW9uRGF0YSB9IGZyb20gJy4uL2RvbWFpbi9pbnZpdGF0aW9uL2ludml0YXRpb24nO1xuaW1wb3J0IHsgSW52aXRhdGlvbk5vdEZvdW5kRXJyb3IgfSBmcm9tICcuLi9kb21haW4vaW52aXRhdGlvbi9pbnZpdGF0aW9uLWVycm9ycyc7XG5cbi8qKlxuICogRHluYW1vREIgaW52aXRhdGlvbiByZXBvc2l0b3J5IGltcGxlbWVudGF0aW9uXG4gKi9cbmV4cG9ydCBjbGFzcyBEeW5hbW9EQkludml0YXRpb25SZXBvc2l0b3J5IGltcGxlbWVudHMgSUludml0YXRpb25SZXBvc2l0b3J5IHtcbiAgcHJpdmF0ZSBkeW5hbW9DbGllbnQ6IER5bmFtb0RCRG9jdW1lbnRDbGllbnQ7XG4gIHByaXZhdGUgdGFibGVOYW1lOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IodGFibGVOYW1lPzogc3RyaW5nLCBkeW5hbW9DbGllbnQ/OiBEeW5hbW9EQkNsaWVudCkge1xuICAgIGNvbnN0IGNsaWVudCA9IGR5bmFtb0NsaWVudCB8fCBuZXcgRHluYW1vREJDbGllbnQoe30pO1xuICAgIHRoaXMuZHluYW1vQ2xpZW50ID0gRHluYW1vREJEb2N1bWVudENsaWVudC5mcm9tKGNsaWVudCk7XG4gICAgdGhpcy50YWJsZU5hbWUgPSB0YWJsZU5hbWUgfHwgcHJvY2Vzcy5lbnYuTUFJTl9UQUJMRV9OQU1FIHx8ICdzeWRuZXktY3ljbGVzLW1haW4tZGV2ZWxvcG1lbnQnO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBpbnZpdGF0aW9uIGJ5IElEXG4gICAqL1xuICBhc3luYyBnZXRJbnZpdGF0aW9uQnlJZChpbnZpdGF0aW9uSWQ6IHN0cmluZyk6IFByb21pc2U8Q2x1Ykludml0YXRpb24gfCBudWxsPiB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb21tYW5kID0gbmV3IEdldENvbW1hbmQoe1xuICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICBLZXk6IHtcbiAgICAgICAgICBQSzogYElOVklUQVRJT04jJHtpbnZpdGF0aW9uSWR9YCxcbiAgICAgICAgICBTSzogJ01FVEFEQVRBJyxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmR5bmFtb0NsaWVudC5zZW5kKGNvbW1hbmQpO1xuICAgICAgY29uc3QgZHVyYXRpb24gPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuXG4gICAgICBpZiAoIXJlc3VsdC5JdGVtKSB7XG4gICAgICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnSW52aXRhdGlvbiBub3QgZm91bmQnLCB7XG4gICAgICAgICAgaW52aXRhdGlvbklkLFxuICAgICAgICAgIGR1cmF0aW9uLFxuICAgICAgICAgIG9wZXJhdGlvbjogJ2dldF9pbnZpdGF0aW9uX2J5X2lkJyxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpbnZpdGF0aW9uID0gdGhpcy5keW5hbW9JdGVtVG9JbnZpdGF0aW9uKHJlc3VsdC5JdGVtIGFzIEludml0YXRpb25EeW5hbW9JdGVtKTtcblxuICAgICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdJbnZpdGF0aW9uIHJldHJpZXZlZCBmcm9tIER5bmFtb0RCJywge1xuICAgICAgICBpbnZpdGF0aW9uSWQsXG4gICAgICAgIHR5cGU6IGludml0YXRpb24udHlwZSxcbiAgICAgICAgc3RhdHVzOiBpbnZpdGF0aW9uLnN0YXR1cyxcbiAgICAgICAgY2x1YklkOiBpbnZpdGF0aW9uLmNsdWJJZCxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIG9wZXJhdGlvbjogJ2dldF9pbnZpdGF0aW9uX2J5X2lkJyxcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gaW52aXRhdGlvbjtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgZHVyYXRpb24gPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgICAgbG9nU3RydWN0dXJlZCgnRVJST1InLCAnRmFpbGVkIHRvIGdldCBpbnZpdGF0aW9uIGJ5IElEJywge1xuICAgICAgICBpbnZpdGF0aW9uSWQsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIG9wZXJhdGlvbjogJ2dldF9pbnZpdGF0aW9uX2J5X2lkJyxcbiAgICAgIH0pO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBpbnZpdGF0aW9uIGJ5IHRva2VuIChmb3IgZW1haWwgaW52aXRhdGlvbnMpXG4gICAqL1xuICBhc3luYyBnZXRJbnZpdGF0aW9uQnlUb2tlbih0b2tlbjogc3RyaW5nKTogUHJvbWlzZTxDbHViSW52aXRhdGlvbiB8IG51bGw+IHtcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIEZvciBQaGFzZSAyLjIgTVZQLCB3ZSdsbCBuZWVkIHRvIHNjYW4gb3IgdXNlIGEgR1NJIGZvciB0b2tlbiBsb29rdXBzXG4gICAgICAvLyBUaGlzIGlzIGEgc2ltcGxpZmllZCBpbXBsZW1lbnRhdGlvbiAtIGluIHByb2R1Y3Rpb24sIGNvbnNpZGVyIGFkZGluZyBhIEdTSVxuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBRdWVyeUNvbW1hbmQoe1xuICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICBGaWx0ZXJFeHByZXNzaW9uOiAnI3Rva2VuID0gOnRva2VuIEFORCAjZW50aXR5VHlwZSA9IDplbnRpdHlUeXBlJyxcbiAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzOiB7XG4gICAgICAgICAgJyN0b2tlbic6ICd0b2tlbicsXG4gICAgICAgICAgJyNlbnRpdHlUeXBlJzogJ2VudGl0eVR5cGUnLFxuICAgICAgICB9LFxuICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAgICAgJzp0b2tlbic6IHRva2VuLFxuICAgICAgICAgICc6ZW50aXR5VHlwZSc6ICdDTFVCX0lOVklUQVRJT04nLFxuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZHluYW1vQ2xpZW50LnNlbmQoY29tbWFuZCk7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG5cbiAgICAgIGlmICghcmVzdWx0Lkl0ZW1zIHx8IHJlc3VsdC5JdGVtcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdJbnZpdGF0aW9uIG5vdCBmb3VuZCBieSB0b2tlbicsIHtcbiAgICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgICBvcGVyYXRpb246ICdnZXRfaW52aXRhdGlvbl9ieV90b2tlbicsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgaW52aXRhdGlvbiA9IHRoaXMuZHluYW1vSXRlbVRvSW52aXRhdGlvbihyZXN1bHQuSXRlbXNbMF0gYXMgSW52aXRhdGlvbkR5bmFtb0l0ZW0pO1xuXG4gICAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0ludml0YXRpb24gcmV0cmlldmVkIGJ5IHRva2VuIGZyb20gRHluYW1vREInLCB7XG4gICAgICAgIGludml0YXRpb25JZDogaW52aXRhdGlvbi5pbnZpdGF0aW9uSWQsXG4gICAgICAgIHR5cGU6IGludml0YXRpb24udHlwZSxcbiAgICAgICAgc3RhdHVzOiBpbnZpdGF0aW9uLnN0YXR1cyxcbiAgICAgICAgY2x1YklkOiBpbnZpdGF0aW9uLmNsdWJJZCxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIG9wZXJhdGlvbjogJ2dldF9pbnZpdGF0aW9uX2J5X3Rva2VuJyxcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gaW52aXRhdGlvbjtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgZHVyYXRpb24gPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgICAgbG9nU3RydWN0dXJlZCgnRVJST1InLCAnRmFpbGVkIHRvIGdldCBpbnZpdGF0aW9uIGJ5IHRva2VuJywge1xuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgICBvcGVyYXRpb246ICdnZXRfaW52aXRhdGlvbl9ieV90b2tlbicsXG4gICAgICB9KTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHVzZXIncyBwZW5kaW5nIGludml0YXRpb25zXG4gICAqL1xuICBhc3luYyBsaXN0VXNlckludml0YXRpb25zKHVzZXJJZDogc3RyaW5nLCBvcHRpb25zOiBMaXN0SW52aXRhdGlvbnNPcHRpb25zKTogUHJvbWlzZTxMaXN0SW52aXRhdGlvbnNSZXN1bHQ+IHtcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IGxpbWl0ID0gb3B0aW9ucy5saW1pdCB8fCBJTlZJVEFUSU9OX0NPTlNUUkFJTlRTLkRFRkFVTFRfTElTVF9MSU1JVDtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBxdWVyeVBhcmFtczogYW55ID0ge1xuICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICBJbmRleE5hbWU6ICdHU0kxJyxcbiAgICAgICAgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbjogJ0dTSTFQSyA9IDpnc2kxcGsgQU5EIGJlZ2luc193aXRoKEdTSTFTSywgOmludml0YXRpb25QcmVmaXgpJyxcbiAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xuICAgICAgICAgICc6Z3NpMXBrJzogYFVTRVIjJHt1c2VySWR9YCxcbiAgICAgICAgICAnOmludml0YXRpb25QcmVmaXgnOiAnSU5WSVRBVElPTiMnLFxuICAgICAgICB9LFxuICAgICAgICBMaW1pdDogbGltaXQgKyAxLCAvLyBHZXQgb25lIGV4dHJhIHRvIGRldGVybWluZSBpZiB0aGVyZSBhcmUgbW9yZSByZXN1bHRzXG4gICAgICAgIFNjYW5JbmRleEZvcndhcmQ6IGZhbHNlLCAvLyBNb3N0IHJlY2VudCBmaXJzdFxuICAgICAgfTtcblxuICAgICAgLy8gQWRkIHN0YXR1cyBmaWx0ZXJcbiAgICAgIGlmIChvcHRpb25zLnN0YXR1cykge1xuICAgICAgICBxdWVyeVBhcmFtcy5GaWx0ZXJFeHByZXNzaW9uID0gJyNzdGF0dXMgPSA6c3RhdHVzJztcbiAgICAgICAgcXVlcnlQYXJhbXMuRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzID0ge1xuICAgICAgICAgICcjc3RhdHVzJzogJ3N0YXR1cycsXG4gICAgICAgIH07XG4gICAgICAgIHF1ZXJ5UGFyYW1zLkV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXNbJzpzdGF0dXMnXSA9IG9wdGlvbnMuc3RhdHVzO1xuICAgICAgfVxuXG4gICAgICAvLyBBZGQgY3Vyc29yIGZvciBwYWdpbmF0aW9uXG4gICAgICBpZiAob3B0aW9ucy5jdXJzb3IpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBkZWNvZGVkQ3Vyc29yID0gSlNPTi5wYXJzZShCdWZmZXIuZnJvbShvcHRpb25zLmN1cnNvciwgJ2Jhc2U2NCcpLnRvU3RyaW5nKCkpO1xuICAgICAgICAgIHF1ZXJ5UGFyYW1zLkV4Y2x1c2l2ZVN0YXJ0S2V5ID0ge1xuICAgICAgICAgICAgR1NJMVBLOiBgVVNFUiMke3VzZXJJZH1gLFxuICAgICAgICAgICAgR1NJMVNLOiBgSU5WSVRBVElPTiMke2RlY29kZWRDdXJzb3IuaW52aXRhdGlvbklkfWAsXG4gICAgICAgICAgICBQSzogYFVTRVIjJHt1c2VySWR9YCxcbiAgICAgICAgICAgIFNLOiBgSU5WSVRBVElPTiMke2RlY29kZWRDdXJzb3IuaW52aXRhdGlvbklkfWAsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY3Vyc29yIGZvcm1hdCcpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgUXVlcnlDb21tYW5kKHF1ZXJ5UGFyYW1zKTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZHluYW1vQ2xpZW50LnNlbmQoY29tbWFuZCk7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG5cbiAgICAgIGNvbnN0IGl0ZW1zID0gcmVzdWx0Lkl0ZW1zIHx8IFtdO1xuICAgICAgY29uc3QgaGFzTW9yZSA9IGl0ZW1zLmxlbmd0aCA+IGxpbWl0O1xuICAgICAgY29uc3QgaW52aXRhdGlvbkl0ZW1zID0gaXRlbXMuc2xpY2UoMCwgbGltaXQpO1xuXG4gICAgICBjb25zdCBpbnZpdGF0aW9uczogVXNlckludml0YXRpb25TdW1tYXJ5W10gPSBpbnZpdGF0aW9uSXRlbXMubWFwKGl0ZW0gPT4ge1xuICAgICAgICBjb25zdCBpbnZpdGF0aW9uSXRlbSA9IGl0ZW0gYXMgVXNlckludml0YXRpb25EeW5hbW9JdGVtO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGludml0YXRpb25JZDogaW52aXRhdGlvbkl0ZW0uaW52aXRhdGlvbklkLFxuICAgICAgICAgIGNsdWJJZDogaW52aXRhdGlvbkl0ZW0uY2x1YklkLFxuICAgICAgICAgIGNsdWJOYW1lOiBpbnZpdGF0aW9uSXRlbS5jbHViTmFtZSxcbiAgICAgICAgICByb2xlOiBpbnZpdGF0aW9uSXRlbS5yb2xlLFxuICAgICAgICAgIHN0YXR1czogaW52aXRhdGlvbkl0ZW0uc3RhdHVzLFxuICAgICAgICAgIGludml0ZWRCeTogaW52aXRhdGlvbkl0ZW0uaW52aXRlZEJ5LFxuICAgICAgICAgIGludml0ZWRCeU5hbWU6IGludml0YXRpb25JdGVtLmludml0ZWRCeU5hbWUsXG4gICAgICAgICAgaW52aXRlZEF0OiBpbnZpdGF0aW9uSXRlbS5pbnZpdGVkQXQsXG4gICAgICAgICAgZXhwaXJlc0F0OiBpbnZpdGF0aW9uSXRlbS5leHBpcmVzQXQsXG4gICAgICAgICAgbWVzc2FnZTogaW52aXRhdGlvbkl0ZW0ubWVzc2FnZSxcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gICAgICBsZXQgbmV4dEN1cnNvcjogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgICAgaWYgKGhhc01vcmUgJiYgaW52aXRhdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBsYXN0SW52aXRhdGlvbiA9IGludml0YXRpb25zW2ludml0YXRpb25zLmxlbmd0aCAtIDFdO1xuICAgICAgICBjb25zdCBjdXJzb3JEYXRhID0ge1xuICAgICAgICAgIGludml0YXRpb25JZDogbGFzdEludml0YXRpb24uaW52aXRhdGlvbklkLFxuICAgICAgICB9O1xuICAgICAgICBuZXh0Q3Vyc29yID0gQnVmZmVyLmZyb20oSlNPTi5zdHJpbmdpZnkoY3Vyc29yRGF0YSkpLnRvU3RyaW5nKCdiYXNlNjQnKTtcbiAgICAgIH1cblxuICAgICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdVc2VyIGludml0YXRpb25zIGxpc3RlZCBmcm9tIER5bmFtb0RCJywge1xuICAgICAgICB1c2VySWQsXG4gICAgICAgIHJlc3VsdENvdW50OiBpbnZpdGF0aW9ucy5sZW5ndGgsXG4gICAgICAgIGhhc01vcmUsXG4gICAgICAgIHN0YXR1czogb3B0aW9ucy5zdGF0dXMsXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgICBvcGVyYXRpb246ICdsaXN0X3VzZXJfaW52aXRhdGlvbnMnLFxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGludml0YXRpb25zLFxuICAgICAgICBuZXh0Q3Vyc29yLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgZHVyYXRpb24gPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgICAgbG9nU3RydWN0dXJlZCgnRVJST1InLCAnRmFpbGVkIHRvIGxpc3QgdXNlciBpbnZpdGF0aW9ucycsIHtcbiAgICAgICAgdXNlcklkLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgICBvcGVyYXRpb246ICdsaXN0X3VzZXJfaW52aXRhdGlvbnMnLFxuICAgICAgfSk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IGludml0YXRpb25cbiAgICovXG4gIGFzeW5jIGNyZWF0ZUludml0YXRpb24oaW5wdXQ6IENyZWF0ZUludml0YXRpb25JbnB1dCwgY2x1YklkOiBzdHJpbmcsIGludml0ZWRCeTogc3RyaW5nKTogUHJvbWlzZTxDbHViSW52aXRhdGlvbj4ge1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cbiAgICB0cnkge1xuICAgICAgLy8gQ3JlYXRlIGludml0YXRpb24gZW50aXR5XG4gICAgICBjb25zdCBpbnZpdGF0aW9uRW50aXR5ID0gY3JlYXRlSW52aXRhdGlvbihpbnB1dCwgY2x1YklkLCBpbnZpdGVkQnkpO1xuICAgICAgY29uc3QgaW52aXRhdGlvbiA9IGludml0YXRpb25FbnRpdHkudG9JbnZpdGF0aW9uKCk7XG5cbiAgICAgIC8vIENyZWF0ZSBEeW5hbW9EQiBpdGVtc1xuICAgICAgY29uc3QgY2Fub25pY2FsSXRlbSA9IHRoaXMuaW52aXRhdGlvblRvQ2Fub25pY2FsSXRlbShpbnZpdGF0aW9uKTtcbiAgICAgIGNvbnN0IHRyYW5zYWN0SXRlbXM6IGFueVtdID0gW1xuICAgICAgICB7XG4gICAgICAgICAgUHV0OiB7XG4gICAgICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICAgICAgSXRlbTogY2Fub25pY2FsSXRlbSxcbiAgICAgICAgICAgIENvbmRpdGlvbkV4cHJlc3Npb246ICdhdHRyaWJ1dGVfbm90X2V4aXN0cyhQSyknLCAvLyBFbnN1cmUgaW52aXRhdGlvbiBkb2Vzbid0IGFscmVhZHkgZXhpc3RcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgXTtcblxuICAgICAgLy8gRm9yIHVzZXIgaW52aXRhdGlvbnMsIGNyZWF0ZSB1c2VyIGluZGV4IGl0ZW1cbiAgICAgIGlmIChpbnZpdGF0aW9uLnR5cGUgPT09IEludml0YXRpb25UeXBlLlVTRVIgJiYgaW52aXRhdGlvbi51c2VySWQpIHtcbiAgICAgICAgY29uc3QgdXNlckluZGV4SXRlbSA9IGF3YWl0IHRoaXMuaW52aXRhdGlvblRvVXNlckluZGV4SXRlbShpbnZpdGF0aW9uLCBpbnZpdGVkQnkpO1xuICAgICAgICB0cmFuc2FjdEl0ZW1zLnB1c2goe1xuICAgICAgICAgIFB1dDoge1xuICAgICAgICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgICAgICAgIEl0ZW06IHVzZXJJbmRleEl0ZW0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFVzZSBUcmFuc2FjdFdyaXRlIHRvIGVuc3VyZSBhbGwgaXRlbXMgYXJlIGNyZWF0ZWQgYXRvbWljYWxseVxuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBUcmFuc2FjdFdyaXRlQ29tbWFuZCh7XG4gICAgICAgIFRyYW5zYWN0SXRlbXM6IHRyYW5zYWN0SXRlbXMsXG4gICAgICB9KTtcblxuICAgICAgYXdhaXQgdGhpcy5keW5hbW9DbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcblxuICAgICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdJbnZpdGF0aW9uIGNyZWF0ZWQgaW4gRHluYW1vREInLCB7XG4gICAgICAgIGludml0YXRpb25JZDogaW52aXRhdGlvbi5pbnZpdGF0aW9uSWQsXG4gICAgICAgIHR5cGU6IGludml0YXRpb24udHlwZSxcbiAgICAgICAgY2x1YklkOiBpbnZpdGF0aW9uLmNsdWJJZCxcbiAgICAgICAgcm9sZTogaW52aXRhdGlvbi5yb2xlLFxuICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgb3BlcmF0aW9uOiAnY3JlYXRlX2ludml0YXRpb24nLFxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBpbnZpdGF0aW9uO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdGYWlsZWQgdG8gY3JlYXRlIGludml0YXRpb24nLCB7XG4gICAgICAgIGNsdWJJZCxcbiAgICAgICAgaW52aXRlZEJ5LFxuICAgICAgICB0eXBlOiBpbnB1dC50eXBlLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgICBvcGVyYXRpb246ICdjcmVhdGVfaW52aXRhdGlvbicsXG4gICAgICB9KTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9jZXNzIGludml0YXRpb24gKGFjY2VwdC9kZWNsaW5lKVxuICAgKi9cbiAgYXN5bmMgcHJvY2Vzc0ludml0YXRpb24oaW52aXRhdGlvbklkOiBzdHJpbmcsIGlucHV0OiBQcm9jZXNzSW52aXRhdGlvbklucHV0LCB1c2VySWQ/OiBzdHJpbmcpOiBQcm9taXNlPENsdWJJbnZpdGF0aW9uPiB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgIHRyeSB7XG4gICAgICAvLyBHZXQgZXhpc3RpbmcgaW52aXRhdGlvblxuICAgICAgY29uc3QgZXhpc3RpbmdJbnZpdGF0aW9uID0gYXdhaXQgdGhpcy5nZXRJbnZpdGF0aW9uQnlJZChpbnZpdGF0aW9uSWQpO1xuICAgICAgaWYgKCFleGlzdGluZ0ludml0YXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEludml0YXRpb25Ob3RGb3VuZEVycm9yKGludml0YXRpb25JZCk7XG4gICAgICB9XG5cbiAgICAgIC8vIENyZWF0ZSB1cGRhdGVkIGludml0YXRpb24gZW50aXR5XG4gICAgICBjb25zdCBpbnZpdGF0aW9uRW50aXR5ID0gZnJvbUludml0YXRpb25EYXRhKGV4aXN0aW5nSW52aXRhdGlvbik7XG4gICAgICBjb25zdCB1cGRhdGVkSW52aXRhdGlvbkVudGl0eSA9IGludml0YXRpb25FbnRpdHkucHJvY2VzcyhpbnB1dCwgdXNlcklkKTtcbiAgICAgIGNvbnN0IHVwZGF0ZWRJbnZpdGF0aW9uID0gdXBkYXRlZEludml0YXRpb25FbnRpdHkudG9JbnZpdGF0aW9uKCk7XG5cbiAgICAgIC8vIFVwZGF0ZSBjYW5vbmljYWwgaXRlbVxuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBVcGRhdGVDb21tYW5kKHtcbiAgICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgICAgS2V5OiB7XG4gICAgICAgICAgUEs6IGBJTlZJVEFUSU9OIyR7aW52aXRhdGlvbklkfWAsXG4gICAgICAgICAgU0s6ICdNRVRBREFUQScsXG4gICAgICAgIH0sXG4gICAgICAgIFVwZGF0ZUV4cHJlc3Npb246ICdTRVQgI3N0YXR1cyA9IDpzdGF0dXMsIHByb2Nlc3NlZEF0ID0gOnByb2Nlc3NlZEF0LCB1c2VySWQgPSA6dXNlcklkJyxcbiAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzOiB7XG4gICAgICAgICAgJyNzdGF0dXMnOiAnc3RhdHVzJyxcbiAgICAgICAgfSxcbiAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xuICAgICAgICAgICc6c3RhdHVzJzogdXBkYXRlZEludml0YXRpb24uc3RhdHVzLFxuICAgICAgICAgICc6cHJvY2Vzc2VkQXQnOiB1cGRhdGVkSW52aXRhdGlvbi5wcm9jZXNzZWRBdCxcbiAgICAgICAgICAnOnVzZXJJZCc6IHVwZGF0ZWRJbnZpdGF0aW9uLnVzZXJJZCxcbiAgICAgICAgfSxcbiAgICAgICAgUmV0dXJuVmFsdWVzOiAnQUxMX05FVycsXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5keW5hbW9DbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcblxuICAgICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdJbnZpdGF0aW9uIHByb2Nlc3NlZCBpbiBEeW5hbW9EQicsIHtcbiAgICAgICAgaW52aXRhdGlvbklkLFxuICAgICAgICBhY3Rpb246IGlucHV0LmFjdGlvbixcbiAgICAgICAgbmV3U3RhdHVzOiB1cGRhdGVkSW52aXRhdGlvbi5zdGF0dXMsXG4gICAgICAgIHVzZXJJZCxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIG9wZXJhdGlvbjogJ3Byb2Nlc3NfaW52aXRhdGlvbicsXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHRoaXMuZHluYW1vSXRlbVRvSW52aXRhdGlvbihyZXN1bHQuQXR0cmlidXRlcyBhcyBJbnZpdGF0aW9uRHluYW1vSXRlbSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICAgIGxvZ1N0cnVjdHVyZWQoJ0VSUk9SJywgJ0ZhaWxlZCB0byBwcm9jZXNzIGludml0YXRpb24nLCB7XG4gICAgICAgIGludml0YXRpb25JZCxcbiAgICAgICAgYWN0aW9uOiBpbnB1dC5hY3Rpb24sXG4gICAgICAgIHVzZXJJZCxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgb3BlcmF0aW9uOiAncHJvY2Vzc19pbnZpdGF0aW9uJyxcbiAgICAgIH0pO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbmNlbCBpbnZpdGF0aW9uIChhZG1pbiBhY3Rpb24pXG4gICAqL1xuICBhc3luYyBjYW5jZWxJbnZpdGF0aW9uKGludml0YXRpb25JZDogc3RyaW5nKTogUHJvbWlzZTxDbHViSW52aXRhdGlvbj4ge1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cbiAgICB0cnkge1xuICAgICAgLy8gR2V0IGV4aXN0aW5nIGludml0YXRpb25cbiAgICAgIGNvbnN0IGV4aXN0aW5nSW52aXRhdGlvbiA9IGF3YWl0IHRoaXMuZ2V0SW52aXRhdGlvbkJ5SWQoaW52aXRhdGlvbklkKTtcbiAgICAgIGlmICghZXhpc3RpbmdJbnZpdGF0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBJbnZpdGF0aW9uTm90Rm91bmRFcnJvcihpbnZpdGF0aW9uSWQpO1xuICAgICAgfVxuXG4gICAgICAvLyBDcmVhdGUgdXBkYXRlZCBpbnZpdGF0aW9uIGVudGl0eVxuICAgICAgY29uc3QgaW52aXRhdGlvbkVudGl0eSA9IGZyb21JbnZpdGF0aW9uRGF0YShleGlzdGluZ0ludml0YXRpb24pO1xuICAgICAgY29uc3QgdXBkYXRlZEludml0YXRpb25FbnRpdHkgPSBpbnZpdGF0aW9uRW50aXR5LmNhbmNlbCgpO1xuICAgICAgY29uc3QgdXBkYXRlZEludml0YXRpb24gPSB1cGRhdGVkSW52aXRhdGlvbkVudGl0eS50b0ludml0YXRpb24oKTtcblxuICAgICAgLy8gVXBkYXRlIGNhbm9uaWNhbCBpdGVtXG4gICAgICBjb25zdCBjb21tYW5kID0gbmV3IFVwZGF0ZUNvbW1hbmQoe1xuICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICBLZXk6IHtcbiAgICAgICAgICBQSzogYElOVklUQVRJT04jJHtpbnZpdGF0aW9uSWR9YCxcbiAgICAgICAgICBTSzogJ01FVEFEQVRBJyxcbiAgICAgICAgfSxcbiAgICAgICAgVXBkYXRlRXhwcmVzc2lvbjogJ1NFVCAjc3RhdHVzID0gOnN0YXR1cywgcHJvY2Vzc2VkQXQgPSA6cHJvY2Vzc2VkQXQnLFxuICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlTmFtZXM6IHtcbiAgICAgICAgICAnI3N0YXR1cyc6ICdzdGF0dXMnLFxuICAgICAgICB9LFxuICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAgICAgJzpzdGF0dXMnOiB1cGRhdGVkSW52aXRhdGlvbi5zdGF0dXMsXG4gICAgICAgICAgJzpwcm9jZXNzZWRBdCc6IHVwZGF0ZWRJbnZpdGF0aW9uLnByb2Nlc3NlZEF0LFxuICAgICAgICB9LFxuICAgICAgICBSZXR1cm5WYWx1ZXM6ICdBTExfTkVXJyxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmR5bmFtb0NsaWVudC5zZW5kKGNvbW1hbmQpO1xuICAgICAgY29uc3QgZHVyYXRpb24gPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuXG4gICAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0ludml0YXRpb24gY2FuY2VsbGVkIGluIER5bmFtb0RCJywge1xuICAgICAgICBpbnZpdGF0aW9uSWQsXG4gICAgICAgIG5ld1N0YXR1czogdXBkYXRlZEludml0YXRpb24uc3RhdHVzLFxuICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgb3BlcmF0aW9uOiAnY2FuY2VsX2ludml0YXRpb24nLFxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB0aGlzLmR5bmFtb0l0ZW1Ub0ludml0YXRpb24ocmVzdWx0LkF0dHJpYnV0ZXMgYXMgSW52aXRhdGlvbkR5bmFtb0l0ZW0pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdGYWlsZWQgdG8gY2FuY2VsIGludml0YXRpb24nLCB7XG4gICAgICAgIGludml0YXRpb25JZCxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgb3BlcmF0aW9uOiAnY2FuY2VsX2ludml0YXRpb24nLFxuICAgICAgfSk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgdXNlciBoYXMgcGVuZGluZyBpbnZpdGF0aW9uIHRvIGNsdWJcbiAgICovXG4gIGFzeW5jIGhhc1BlbmRpbmdJbnZpdGF0aW9uKGNsdWJJZDogc3RyaW5nLCB1c2VySWQ/OiBzdHJpbmcsIGVtYWlsPzogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgLy8gVGhpcyB3b3VsZCByZXF1aXJlIGEgbW9yZSBjb21wbGV4IHF1ZXJ5IG9yIEdTSVxuICAgIC8vIEZvciBQaGFzZSAyLjIgTVZQLCB3ZSdsbCBpbXBsZW1lbnQgYSBzaW1wbGlmaWVkIHZlcnNpb25cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHBlbmRpbmcgaW52aXRhdGlvbnMgZm9yIGNsdWIgKGFkbWluIHZpZXcpXG4gICAqL1xuICBhc3luYyBsaXN0Q2x1Ykludml0YXRpb25zKGNsdWJJZDogc3RyaW5nLCBvcHRpb25zOiBMaXN0SW52aXRhdGlvbnNPcHRpb25zKTogUHJvbWlzZTxDbHViSW52aXRhdGlvbltdPiB7XG4gICAgLy8gVGhpcyB3b3VsZCByZXF1aXJlIGEgR1NJIG9yIHNjYW4gb3BlcmF0aW9uXG4gICAgLy8gRm9yIFBoYXNlIDIuMiBNVlAsIHdlJ2xsIGltcGxlbWVudCBhIHNpbXBsaWZpZWQgdmVyc2lvblxuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHBpcmUgb2xkIGludml0YXRpb25zXG4gICAqL1xuICBhc3luYyBleHBpcmVJbnZpdGF0aW9ucyhiZWZvcmVEYXRlOiBEYXRlKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICAvLyBUaGlzIHdvdWxkIHJlcXVpcmUgYSBzY2FuIG9wZXJhdGlvbiB0byBmaW5kIGV4cGlyZWQgaW52aXRhdGlvbnNcbiAgICAvLyBGb3IgUGhhc2UgMi4yIE1WUCwgd2UnbGwgaW1wbGVtZW50IGEgc2ltcGxpZmllZCB2ZXJzaW9uXG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGludml0YXRpb24gc3RhdGlzdGljcyBmb3IgY2x1YlxuICAgKi9cbiAgYXN5bmMgZ2V0SW52aXRhdGlvblN0YXRzKGNsdWJJZDogc3RyaW5nKTogUHJvbWlzZTx7XG4gICAgcGVuZGluZzogbnVtYmVyO1xuICAgIGFjY2VwdGVkOiBudW1iZXI7XG4gICAgZGVjbGluZWQ6IG51bWJlcjtcbiAgICBleHBpcmVkOiBudW1iZXI7XG4gICAgY2FuY2VsbGVkOiBudW1iZXI7XG4gIH0+IHtcbiAgICAvLyBUaGlzIHdvdWxkIHJlcXVpcmUgYWdncmVnYXRpb24gcXVlcmllc1xuICAgIC8vIEZvciBQaGFzZSAyLjIgTVZQLCB3ZSdsbCByZXR1cm4gZGVmYXVsdCB2YWx1ZXNcbiAgICByZXR1cm4ge1xuICAgICAgcGVuZGluZzogMCxcbiAgICAgIGFjY2VwdGVkOiAwLFxuICAgICAgZGVjbGluZWQ6IDAsXG4gICAgICBleHBpcmVkOiAwLFxuICAgICAgY2FuY2VsbGVkOiAwLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydCBEeW5hbW9EQiBjYW5vbmljYWwgaXRlbSB0byBJbnZpdGF0aW9uXG4gICAqL1xuICBwcml2YXRlIGR5bmFtb0l0ZW1Ub0ludml0YXRpb24oaXRlbTogSW52aXRhdGlvbkR5bmFtb0l0ZW0pOiBDbHViSW52aXRhdGlvbiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGludml0YXRpb25JZDogaXRlbS5pbnZpdGF0aW9uSWQsXG4gICAgICB0eXBlOiBpdGVtLnR5cGUsXG4gICAgICBjbHViSWQ6IGl0ZW0uY2x1YklkLFxuICAgICAgZW1haWw6IGl0ZW0uZW1haWwsXG4gICAgICB1c2VySWQ6IGl0ZW0udXNlcklkLFxuICAgICAgcm9sZTogaXRlbS5yb2xlLFxuICAgICAgc3RhdHVzOiBpdGVtLnN0YXR1cyxcbiAgICAgIGludml0ZWRCeTogaXRlbS5pbnZpdGVkQnksXG4gICAgICBpbnZpdGVkQXQ6IGl0ZW0uaW52aXRlZEF0LFxuICAgICAgZXhwaXJlc0F0OiBpdGVtLmV4cGlyZXNBdCxcbiAgICAgIHByb2Nlc3NlZEF0OiBpdGVtLnByb2Nlc3NlZEF0LFxuICAgICAgbWVzc2FnZTogaXRlbS5tZXNzYWdlLFxuICAgICAgdG9rZW46IGl0ZW0udG9rZW4sXG4gICAgICBkZWxpdmVyeU1ldGhvZDogaXRlbS5kZWxpdmVyeU1ldGhvZCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgSW52aXRhdGlvbiB0byBEeW5hbW9EQiBjYW5vbmljYWwgaXRlbVxuICAgKi9cbiAgcHJpdmF0ZSBpbnZpdGF0aW9uVG9DYW5vbmljYWxJdGVtKGludml0YXRpb246IENsdWJJbnZpdGF0aW9uKTogSW52aXRhdGlvbkR5bmFtb0l0ZW0ge1xuICAgIHJldHVybiB7XG4gICAgICBQSzogYElOVklUQVRJT04jJHtpbnZpdGF0aW9uLmludml0YXRpb25JZH1gLFxuICAgICAgU0s6ICdNRVRBREFUQScsXG4gICAgICBlbnRpdHlUeXBlOiAnQ0xVQl9JTlZJVEFUSU9OJyxcbiAgICAgIGludml0YXRpb25JZDogaW52aXRhdGlvbi5pbnZpdGF0aW9uSWQsXG4gICAgICB0eXBlOiBpbnZpdGF0aW9uLnR5cGUsXG4gICAgICBjbHViSWQ6IGludml0YXRpb24uY2x1YklkLFxuICAgICAgZW1haWw6IGludml0YXRpb24uZW1haWwsXG4gICAgICB1c2VySWQ6IGludml0YXRpb24udXNlcklkLFxuICAgICAgcm9sZTogaW52aXRhdGlvbi5yb2xlLFxuICAgICAgc3RhdHVzOiBpbnZpdGF0aW9uLnN0YXR1cyxcbiAgICAgIGludml0ZWRCeTogaW52aXRhdGlvbi5pbnZpdGVkQnksXG4gICAgICBpbnZpdGVkQXQ6IGludml0YXRpb24uaW52aXRlZEF0LFxuICAgICAgZXhwaXJlc0F0OiBpbnZpdGF0aW9uLmV4cGlyZXNBdCxcbiAgICAgIHByb2Nlc3NlZEF0OiBpbnZpdGF0aW9uLnByb2Nlc3NlZEF0LFxuICAgICAgbWVzc2FnZTogaW52aXRhdGlvbi5tZXNzYWdlLFxuICAgICAgdG9rZW46IGludml0YXRpb24udG9rZW4sXG4gICAgICBkZWxpdmVyeU1ldGhvZDogaW52aXRhdGlvbi5kZWxpdmVyeU1ldGhvZCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgSW52aXRhdGlvbiB0byBEeW5hbW9EQiB1c2VyIGluZGV4IGl0ZW0gKGZvciBpbi1hcHAgaW52aXRhdGlvbnMpXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGludml0YXRpb25Ub1VzZXJJbmRleEl0ZW0oaW52aXRhdGlvbjogQ2x1Ykludml0YXRpb24sIGludml0ZWRCeTogc3RyaW5nKTogUHJvbWlzZTxVc2VySW52aXRhdGlvbkR5bmFtb0l0ZW0+IHtcbiAgICBjb25zdCBzayA9IGBJTlZJVEFUSU9OIyR7aW52aXRhdGlvbi5pbnZpdGF0aW9uSWR9YDtcbiAgICBcbiAgICAvLyBGb3IgUGhhc2UgMi4yIE1WUCwgd2UnbGwgdXNlIHBsYWNlaG9sZGVyIHZhbHVlcyBmb3IgY2x1YiBhbmQgdXNlciBuYW1lc1xuICAgIC8vIEluIHByb2R1Y3Rpb24sIHRoZXNlIHdvdWxkIGJlIGVucmljaGVkIHdpdGggYWN0dWFsIGRhdGFcbiAgICByZXR1cm4ge1xuICAgICAgUEs6IGBVU0VSIyR7aW52aXRhdGlvbi51c2VySWR9YCxcbiAgICAgIFNLOiBzayxcbiAgICAgIEdTSTFQSzogYFVTRVIjJHtpbnZpdGF0aW9uLnVzZXJJZH1gLFxuICAgICAgR1NJMVNLOiBzayxcbiAgICAgIGVudGl0eVR5cGU6ICdVU0VSX0lOVklUQVRJT04nLFxuICAgICAgaW52aXRhdGlvbklkOiBpbnZpdGF0aW9uLmludml0YXRpb25JZCxcbiAgICAgIGNsdWJJZDogaW52aXRhdGlvbi5jbHViSWQsXG4gICAgICBjbHViTmFtZTogJ1Vua25vd24gQ2x1YicsIC8vIFdvdWxkIG5lZWQgY2x1YiBkYXRhIGVucmljaG1lbnRcbiAgICAgIHJvbGU6IGludml0YXRpb24ucm9sZSxcbiAgICAgIHN0YXR1czogaW52aXRhdGlvbi5zdGF0dXMsXG4gICAgICBpbnZpdGVkQnk6IGludml0YXRpb24uaW52aXRlZEJ5LFxuICAgICAgaW52aXRlZEJ5TmFtZTogJ1Vua25vd24gVXNlcicsIC8vIFdvdWxkIG5lZWQgdXNlciBkYXRhIGVucmljaG1lbnRcbiAgICAgIGludml0ZWRBdDogaW52aXRhdGlvbi5pbnZpdGVkQXQsXG4gICAgICBleHBpcmVzQXQ6IGludml0YXRpb24uZXhwaXJlc0F0LFxuICAgICAgbWVzc2FnZTogaW52aXRhdGlvbi5tZXNzYWdlLFxuICAgIH07XG4gIH1cbn0iXX0=