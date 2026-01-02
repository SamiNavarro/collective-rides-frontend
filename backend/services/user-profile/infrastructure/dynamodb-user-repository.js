"use strict";
/**
 * DynamoDB User Repository - Phase 1.2
 *
 * DynamoDB implementation of the user repository interface using the
 * existing single table from Phase 1.1.
 *
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBUserRepository = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const user_1 = require("../../../shared/types/user");
const errors_1 = require("../../../shared/utils/errors");
/**
 * DynamoDB implementation of user repository
 */
class DynamoDBUserRepository {
    constructor(tableName, dynamoClient) {
        this.tableName = tableName;
        const client = dynamoClient || new client_dynamodb_1.DynamoDBClient({});
        this.docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
    }
    /**
     * Get user by ID
     *
     * @param userId - User ID
     * @returns User data or null if not found
     */
    async getUserById(userId) {
        try {
            const command = new lib_dynamodb_1.GetCommand({
                TableName: this.tableName,
                Key: {
                    PK: `USER#${userId}`,
                    SK: 'PROFILE',
                },
                ConsistentRead: true, // Strong consistency as per spec
            });
            const result = await this.docClient.send(command);
            if (!result.Item) {
                return null;
            }
            return this.mapDynamoItemToUser(result.Item);
        }
        catch (error) {
            console.error('Error getting user by ID:', error, { userId });
            throw new errors_1.InternalError('Failed to retrieve user');
        }
    }
    /**
     * Create a new user
     *
     * @param input - User creation input
     * @returns Created user data
     */
    async createUser(input) {
        const now = new Date().toISOString();
        const user = {
            id: input.id,
            email: input.email,
            displayName: input.displayName || this.extractDisplayNameFromEmail(input.email),
            avatarUrl: input.avatarUrl,
            systemRole: user_1.SystemRole.USER,
            createdAt: now,
            updatedAt: now,
        };
        try {
            const command = new lib_dynamodb_1.PutCommand({
                TableName: this.tableName,
                Item: {
                    PK: `USER#${user.id}`,
                    SK: 'PROFILE',
                    email: user.email,
                    displayName: user.displayName,
                    avatarUrl: user.avatarUrl,
                    systemRole: user.systemRole,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    // GSI attributes for future queries
                    GSI1PK: `USER#${user.id}`,
                    GSI1SK: 'PROFILE',
                },
                ConditionExpression: 'attribute_not_exists(PK)', // Prevent overwriting existing user
            });
            await this.docClient.send(command);
            return user;
        }
        catch (error) {
            if (error.name === 'ConditionalCheckFailedException') {
                // User already exists, get and return existing user
                const existingUser = await this.getUserById(input.id);
                if (existingUser) {
                    return existingUser;
                }
            }
            console.error('Error creating user:', error, { input });
            throw new errors_1.InternalError('Failed to create user');
        }
    }
    /**
     * Update an existing user
     *
     * @param userId - User ID
     * @param input - Update input
     * @returns Updated user data
     */
    async updateUser(userId, input) {
        try {
            // Build update expression dynamically
            const updateExpressions = [];
            const expressionAttributeNames = {};
            const expressionAttributeValues = {};
            if (input.displayName !== undefined) {
                updateExpressions.push('#displayName = :displayName');
                expressionAttributeNames['#displayName'] = 'displayName';
                expressionAttributeValues[':displayName'] = input.displayName;
            }
            if (input.avatarUrl !== undefined) {
                updateExpressions.push('#avatarUrl = :avatarUrl');
                expressionAttributeNames['#avatarUrl'] = 'avatarUrl';
                expressionAttributeValues[':avatarUrl'] = input.avatarUrl;
            }
            if (input.systemRole !== undefined) {
                updateExpressions.push('#systemRole = :systemRole');
                expressionAttributeNames['#systemRole'] = 'systemRole';
                expressionAttributeValues[':systemRole'] = input.systemRole;
            }
            // Always update the updatedAt timestamp
            updateExpressions.push('#updatedAt = :updatedAt');
            expressionAttributeNames['#updatedAt'] = 'updatedAt';
            expressionAttributeValues[':updatedAt'] = new Date().toISOString();
            const command = new lib_dynamodb_1.UpdateCommand({
                TableName: this.tableName,
                Key: {
                    PK: `USER#${userId}`,
                    SK: 'PROFILE',
                },
                UpdateExpression: `SET ${updateExpressions.join(', ')}`,
                ExpressionAttributeNames: expressionAttributeNames,
                ExpressionAttributeValues: expressionAttributeValues,
                ConditionExpression: 'attribute_exists(PK)',
                ReturnValues: 'ALL_NEW',
            });
            const result = await this.docClient.send(command);
            if (!result.Attributes) {
                throw new errors_1.InternalError('Update operation did not return updated item');
            }
            return this.mapDynamoItemToUser(result.Attributes);
        }
        catch (error) {
            if (error.name === 'ConditionalCheckFailedException') {
                throw new errors_1.NotFoundError('User not found');
            }
            console.error('Error updating user:', error, { userId, input });
            throw new errors_1.InternalError('Failed to update user');
        }
    }
    /**
     * Check if user exists
     *
     * @param userId - User ID
     * @returns True if user exists
     */
    async userExists(userId) {
        try {
            const command = new lib_dynamodb_1.GetCommand({
                TableName: this.tableName,
                Key: {
                    PK: `USER#${userId}`,
                    SK: 'PROFILE',
                },
                ProjectionExpression: 'PK', // Only fetch the key to minimize data transfer
            });
            const result = await this.docClient.send(command);
            return !!result.Item;
        }
        catch (error) {
            console.error('Error checking user existence:', error, { userId });
            return false; // Assume user doesn't exist on error
        }
    }
    /**
     * Map DynamoDB item to User object
     *
     * @param item - DynamoDB item
     * @returns User object
     */
    mapDynamoItemToUser(item) {
        return {
            id: item.PK.replace('USER#', ''),
            email: item.email,
            displayName: item.displayName,
            avatarUrl: item.avatarUrl,
            systemRole: item.systemRole,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        };
    }
    /**
     * Extract display name from email address
     *
     * @param email - Email address
     * @returns Display name
     */
    extractDisplayNameFromEmail(email) {
        const localPart = email.split('@')[0];
        // Convert to title case and replace common separators
        return localPart
            .replace(/[._-]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
}
exports.DynamoDBUserRepository = DynamoDBUserRepository;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHluYW1vZGItdXNlci1yZXBvc2l0b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZHluYW1vZGItdXNlci1yZXBvc2l0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7O0dBU0c7OztBQUVILDhEQUEwRDtBQUMxRCx3REFBc0c7QUFDdEcscURBQWdHO0FBQ2hHLHlEQUE0RTtBQUc1RTs7R0FFRztBQUNILE1BQWEsc0JBQXNCO0lBR2pDLFlBQ21CLFNBQWlCLEVBQ2xDLFlBQTZCO1FBRFosY0FBUyxHQUFULFNBQVMsQ0FBUTtRQUdsQyxNQUFNLE1BQU0sR0FBRyxZQUFZLElBQUksSUFBSSxnQ0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3RELElBQUksQ0FBQyxTQUFTLEdBQUcscUNBQXNCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBYztRQUM5QixJQUFJO1lBQ0YsTUFBTSxPQUFPLEdBQUcsSUFBSSx5QkFBVSxDQUFDO2dCQUM3QixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7Z0JBQ3pCLEdBQUcsRUFBRTtvQkFDSCxFQUFFLEVBQUUsUUFBUSxNQUFNLEVBQUU7b0JBQ3BCLEVBQUUsRUFBRSxTQUFTO2lCQUNkO2dCQUNELGNBQWMsRUFBRSxJQUFJLEVBQUUsaUNBQWlDO2FBQ3hELENBQUMsQ0FBQztZQUVILE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFbEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUU7Z0JBQ2hCLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFFRCxPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDOUM7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNkLE9BQU8sQ0FBQyxLQUFLLENBQUMsMkJBQTJCLEVBQUUsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUM5RCxNQUFNLElBQUksc0JBQWEsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1NBQ3BEO0lBQ0gsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFzQjtRQUNyQyxNQUFNLEdBQUcsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRXJDLE1BQU0sSUFBSSxHQUFTO1lBQ2pCLEVBQUUsRUFBRSxLQUFLLENBQUMsRUFBRTtZQUNaLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSztZQUNsQixXQUFXLEVBQUUsS0FBSyxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsMkJBQTJCLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztZQUMvRSxTQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVM7WUFDMUIsVUFBVSxFQUFFLGlCQUFVLENBQUMsSUFBSTtZQUMzQixTQUFTLEVBQUUsR0FBRztZQUNkLFNBQVMsRUFBRSxHQUFHO1NBQ2YsQ0FBQztRQUVGLElBQUk7WUFDRixNQUFNLE9BQU8sR0FBRyxJQUFJLHlCQUFVLENBQUM7Z0JBQzdCLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztnQkFDekIsSUFBSSxFQUFFO29CQUNKLEVBQUUsRUFBRSxRQUFRLElBQUksQ0FBQyxFQUFFLEVBQUU7b0JBQ3JCLEVBQUUsRUFBRSxTQUFTO29CQUNiLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztvQkFDakIsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO29CQUM3QixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7b0JBQ3pCLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtvQkFDM0IsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO29CQUN6QixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7b0JBQ3pCLG9DQUFvQztvQkFDcEMsTUFBTSxFQUFFLFFBQVEsSUFBSSxDQUFDLEVBQUUsRUFBRTtvQkFDekIsTUFBTSxFQUFFLFNBQVM7aUJBQ2xCO2dCQUNELG1CQUFtQixFQUFFLDBCQUEwQixFQUFFLG9DQUFvQzthQUN0RixDQUFDLENBQUM7WUFFSCxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRW5DLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFBQyxPQUFPLEtBQVUsRUFBRTtZQUNuQixJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssaUNBQWlDLEVBQUU7Z0JBQ3BELG9EQUFvRDtnQkFDcEQsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDdEQsSUFBSSxZQUFZLEVBQUU7b0JBQ2hCLE9BQU8sWUFBWSxDQUFDO2lCQUNyQjthQUNGO1lBRUQsT0FBTyxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ3hELE1BQU0sSUFBSSxzQkFBYSxDQUFDLHVCQUF1QixDQUFDLENBQUM7U0FDbEQ7SUFDSCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFjLEVBQUUsS0FBc0I7UUFDckQsSUFBSTtZQUNGLHNDQUFzQztZQUN0QyxNQUFNLGlCQUFpQixHQUFhLEVBQUUsQ0FBQztZQUN2QyxNQUFNLHdCQUF3QixHQUEyQixFQUFFLENBQUM7WUFDNUQsTUFBTSx5QkFBeUIsR0FBd0IsRUFBRSxDQUFDO1lBRTFELElBQUksS0FBSyxDQUFDLFdBQVcsS0FBSyxTQUFTLEVBQUU7Z0JBQ25DLGlCQUFpQixDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO2dCQUN0RCx3QkFBd0IsQ0FBQyxjQUFjLENBQUMsR0FBRyxhQUFhLENBQUM7Z0JBQ3pELHlCQUF5QixDQUFDLGNBQWMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7YUFDL0Q7WUFFRCxJQUFJLEtBQUssQ0FBQyxTQUFTLEtBQUssU0FBUyxFQUFFO2dCQUNqQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsQ0FBQztnQkFDbEQsd0JBQXdCLENBQUMsWUFBWSxDQUFDLEdBQUcsV0FBVyxDQUFDO2dCQUNyRCx5QkFBeUIsQ0FBQyxZQUFZLENBQUMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDO2FBQzNEO1lBRUQsSUFBSSxLQUFLLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRTtnQkFDbEMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUM7Z0JBQ3BELHdCQUF3QixDQUFDLGFBQWEsQ0FBQyxHQUFHLFlBQVksQ0FBQztnQkFDdkQseUJBQXlCLENBQUMsYUFBYSxDQUFDLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQzthQUM3RDtZQUVELHdDQUF3QztZQUN4QyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsQ0FBQztZQUNsRCx3QkFBd0IsQ0FBQyxZQUFZLENBQUMsR0FBRyxXQUFXLENBQUM7WUFDckQseUJBQXlCLENBQUMsWUFBWSxDQUFDLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUVuRSxNQUFNLE9BQU8sR0FBRyxJQUFJLDRCQUFhLENBQUM7Z0JBQ2hDLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztnQkFDekIsR0FBRyxFQUFFO29CQUNILEVBQUUsRUFBRSxRQUFRLE1BQU0sRUFBRTtvQkFDcEIsRUFBRSxFQUFFLFNBQVM7aUJBQ2Q7Z0JBQ0QsZ0JBQWdCLEVBQUUsT0FBTyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3ZELHdCQUF3QixFQUFFLHdCQUF3QjtnQkFDbEQseUJBQXlCLEVBQUUseUJBQXlCO2dCQUNwRCxtQkFBbUIsRUFBRSxzQkFBc0I7Z0JBQzNDLFlBQVksRUFBRSxTQUFTO2FBQ3hCLENBQUMsQ0FBQztZQUVILE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFbEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUU7Z0JBQ3RCLE1BQU0sSUFBSSxzQkFBYSxDQUFDLDhDQUE4QyxDQUFDLENBQUM7YUFDekU7WUFFRCxPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDcEQ7UUFBQyxPQUFPLEtBQVUsRUFBRTtZQUNuQixJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssaUNBQWlDLEVBQUU7Z0JBQ3BELE1BQU0sSUFBSSxzQkFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7YUFDM0M7WUFFRCxPQUFPLENBQUMsS0FBSyxDQUFDLHNCQUFzQixFQUFFLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ2hFLE1BQU0sSUFBSSxzQkFBYSxDQUFDLHVCQUF1QixDQUFDLENBQUM7U0FDbEQ7SUFDSCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQWM7UUFDN0IsSUFBSTtZQUNGLE1BQU0sT0FBTyxHQUFHLElBQUkseUJBQVUsQ0FBQztnQkFDN0IsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO2dCQUN6QixHQUFHLEVBQUU7b0JBQ0gsRUFBRSxFQUFFLFFBQVEsTUFBTSxFQUFFO29CQUNwQixFQUFFLEVBQUUsU0FBUztpQkFDZDtnQkFDRCxvQkFBb0IsRUFBRSxJQUFJLEVBQUUsK0NBQStDO2FBQzVFLENBQUMsQ0FBQztZQUVILE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFbEQsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztTQUN0QjtRQUFDLE9BQU8sS0FBSyxFQUFFO1lBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQ0FBZ0MsRUFBRSxLQUFLLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQ25FLE9BQU8sS0FBSyxDQUFDLENBQUMscUNBQXFDO1NBQ3BEO0lBQ0gsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ssbUJBQW1CLENBQUMsSUFBeUI7UUFDbkQsT0FBTztZQUNMLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO1lBQ2hDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztZQUNqQixXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7WUFDN0IsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO1lBQ3pCLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBd0I7WUFDekMsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO1lBQ3pCLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztTQUMxQixDQUFDO0lBQ0osQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ssMkJBQTJCLENBQUMsS0FBYTtRQUMvQyxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXRDLHNEQUFzRDtRQUN0RCxPQUFPLFNBQVM7YUFDYixPQUFPLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQzthQUN0QixLQUFLLENBQUMsR0FBRyxDQUFDO2FBQ1YsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO2FBQ3ZFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNmLENBQUM7Q0FDRjtBQS9ORCx3REErTkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIER5bmFtb0RCIFVzZXIgUmVwb3NpdG9yeSAtIFBoYXNlIDEuMlxuICogXG4gKiBEeW5hbW9EQiBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgdXNlciByZXBvc2l0b3J5IGludGVyZmFjZSB1c2luZyB0aGVcbiAqIGV4aXN0aW5nIHNpbmdsZSB0YWJsZSBmcm9tIFBoYXNlIDEuMS5cbiAqIFxuICogQ29tcGxpYW5jZTpcbiAqIC0gUGhhc2UgMS4yIFNwZWM6IC5raXJvL3NwZWNzL3BoYXNlLTEuMi51c2VyLXByb2ZpbGUudjEubWRcbiAqIC0gQVdTIEFyY2hpdGVjdHVyZTogLmtpcm8vc3BlY3MvYXJjaGl0ZWN0dXJlLmF3cy52MS5tZFxuICovXG5cbmltcG9ydCB7IER5bmFtb0RCQ2xpZW50IH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJztcbmltcG9ydCB7IER5bmFtb0RCRG9jdW1lbnRDbGllbnQsIEdldENvbW1hbmQsIFB1dENvbW1hbmQsIFVwZGF0ZUNvbW1hbmQgfSBmcm9tICdAYXdzLXNkay9saWItZHluYW1vZGInO1xuaW1wb3J0IHsgVXNlciwgQ3JlYXRlVXNlcklucHV0LCBVcGRhdGVVc2VySW5wdXQsIFN5c3RlbVJvbGUgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdHlwZXMvdXNlcic7XG5pbXBvcnQgeyBJbnRlcm5hbEVycm9yLCBOb3RGb3VuZEVycm9yIH0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2Vycm9ycyc7XG5pbXBvcnQgeyBJVXNlclJlcG9zaXRvcnkgfSBmcm9tICcuLi9kb21haW4vdXNlci1yZXBvc2l0b3J5JztcblxuLyoqXG4gKiBEeW5hbW9EQiBpbXBsZW1lbnRhdGlvbiBvZiB1c2VyIHJlcG9zaXRvcnlcbiAqL1xuZXhwb3J0IGNsYXNzIER5bmFtb0RCVXNlclJlcG9zaXRvcnkgaW1wbGVtZW50cyBJVXNlclJlcG9zaXRvcnkge1xuICBwcml2YXRlIHJlYWRvbmx5IGRvY0NsaWVudDogRHluYW1vREJEb2N1bWVudENsaWVudDtcbiAgXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdGFibGVOYW1lOiBzdHJpbmcsXG4gICAgZHluYW1vQ2xpZW50PzogRHluYW1vREJDbGllbnRcbiAgKSB7XG4gICAgY29uc3QgY2xpZW50ID0gZHluYW1vQ2xpZW50IHx8IG5ldyBEeW5hbW9EQkNsaWVudCh7fSk7XG4gICAgdGhpcy5kb2NDbGllbnQgPSBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LmZyb20oY2xpZW50KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB1c2VyIGJ5IElEXG4gICAqIFxuICAgKiBAcGFyYW0gdXNlcklkIC0gVXNlciBJRFxuICAgKiBAcmV0dXJucyBVc2VyIGRhdGEgb3IgbnVsbCBpZiBub3QgZm91bmRcbiAgICovXG4gIGFzeW5jIGdldFVzZXJCeUlkKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxVc2VyIHwgbnVsbD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjb21tYW5kID0gbmV3IEdldENvbW1hbmQoe1xuICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICBLZXk6IHtcbiAgICAgICAgICBQSzogYFVTRVIjJHt1c2VySWR9YCxcbiAgICAgICAgICBTSzogJ1BST0ZJTEUnLFxuICAgICAgICB9LFxuICAgICAgICBDb25zaXN0ZW50UmVhZDogdHJ1ZSwgLy8gU3Ryb25nIGNvbnNpc3RlbmN5IGFzIHBlciBzcGVjXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5kb2NDbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgIFxuICAgICAgaWYgKCFyZXN1bHQuSXRlbSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgcmV0dXJuIHRoaXMubWFwRHluYW1vSXRlbVRvVXNlcihyZXN1bHQuSXRlbSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGdldHRpbmcgdXNlciBieSBJRDonLCBlcnJvciwgeyB1c2VySWQgfSk7XG4gICAgICB0aHJvdyBuZXcgSW50ZXJuYWxFcnJvcignRmFpbGVkIHRvIHJldHJpZXZlIHVzZXInKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgdXNlclxuICAgKiBcbiAgICogQHBhcmFtIGlucHV0IC0gVXNlciBjcmVhdGlvbiBpbnB1dFxuICAgKiBAcmV0dXJucyBDcmVhdGVkIHVzZXIgZGF0YVxuICAgKi9cbiAgYXN5bmMgY3JlYXRlVXNlcihpbnB1dDogQ3JlYXRlVXNlcklucHV0KTogUHJvbWlzZTxVc2VyPiB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgIFxuICAgIGNvbnN0IHVzZXI6IFVzZXIgPSB7XG4gICAgICBpZDogaW5wdXQuaWQsXG4gICAgICBlbWFpbDogaW5wdXQuZW1haWwsXG4gICAgICBkaXNwbGF5TmFtZTogaW5wdXQuZGlzcGxheU5hbWUgfHwgdGhpcy5leHRyYWN0RGlzcGxheU5hbWVGcm9tRW1haWwoaW5wdXQuZW1haWwpLFxuICAgICAgYXZhdGFyVXJsOiBpbnB1dC5hdmF0YXJVcmwsXG4gICAgICBzeXN0ZW1Sb2xlOiBTeXN0ZW1Sb2xlLlVTRVIsIC8vIERlZmF1bHQgdG8gVXNlciBhcyBwZXIgZG9tYWluIHJ1bGVzXG4gICAgICBjcmVhdGVkQXQ6IG5vdyxcbiAgICAgIHVwZGF0ZWRBdDogbm93LFxuICAgIH07XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgUHV0Q29tbWFuZCh7XG4gICAgICAgIFRhYmxlTmFtZTogdGhpcy50YWJsZU5hbWUsXG4gICAgICAgIEl0ZW06IHtcbiAgICAgICAgICBQSzogYFVTRVIjJHt1c2VyLmlkfWAsXG4gICAgICAgICAgU0s6ICdQUk9GSUxFJyxcbiAgICAgICAgICBlbWFpbDogdXNlci5lbWFpbCxcbiAgICAgICAgICBkaXNwbGF5TmFtZTogdXNlci5kaXNwbGF5TmFtZSxcbiAgICAgICAgICBhdmF0YXJVcmw6IHVzZXIuYXZhdGFyVXJsLFxuICAgICAgICAgIHN5c3RlbVJvbGU6IHVzZXIuc3lzdGVtUm9sZSxcbiAgICAgICAgICBjcmVhdGVkQXQ6IHVzZXIuY3JlYXRlZEF0LFxuICAgICAgICAgIHVwZGF0ZWRBdDogdXNlci51cGRhdGVkQXQsXG4gICAgICAgICAgLy8gR1NJIGF0dHJpYnV0ZXMgZm9yIGZ1dHVyZSBxdWVyaWVzXG4gICAgICAgICAgR1NJMVBLOiBgVVNFUiMke3VzZXIuaWR9YCxcbiAgICAgICAgICBHU0kxU0s6ICdQUk9GSUxFJyxcbiAgICAgICAgfSxcbiAgICAgICAgQ29uZGl0aW9uRXhwcmVzc2lvbjogJ2F0dHJpYnV0ZV9ub3RfZXhpc3RzKFBLKScsIC8vIFByZXZlbnQgb3ZlcndyaXRpbmcgZXhpc3RpbmcgdXNlclxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGF3YWl0IHRoaXMuZG9jQ2xpZW50LnNlbmQoY29tbWFuZCk7XG4gICAgICBcbiAgICAgIHJldHVybiB1c2VyO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmIChlcnJvci5uYW1lID09PSAnQ29uZGl0aW9uYWxDaGVja0ZhaWxlZEV4Y2VwdGlvbicpIHtcbiAgICAgICAgLy8gVXNlciBhbHJlYWR5IGV4aXN0cywgZ2V0IGFuZCByZXR1cm4gZXhpc3RpbmcgdXNlclxuICAgICAgICBjb25zdCBleGlzdGluZ1VzZXIgPSBhd2FpdCB0aGlzLmdldFVzZXJCeUlkKGlucHV0LmlkKTtcbiAgICAgICAgaWYgKGV4aXN0aW5nVXNlcikge1xuICAgICAgICAgIHJldHVybiBleGlzdGluZ1VzZXI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgY3JlYXRpbmcgdXNlcjonLCBlcnJvciwgeyBpbnB1dCB9KTtcbiAgICAgIHRocm93IG5ldyBJbnRlcm5hbEVycm9yKCdGYWlsZWQgdG8gY3JlYXRlIHVzZXInKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBVcGRhdGUgYW4gZXhpc3RpbmcgdXNlclxuICAgKiBcbiAgICogQHBhcmFtIHVzZXJJZCAtIFVzZXIgSURcbiAgICogQHBhcmFtIGlucHV0IC0gVXBkYXRlIGlucHV0XG4gICAqIEByZXR1cm5zIFVwZGF0ZWQgdXNlciBkYXRhXG4gICAqL1xuICBhc3luYyB1cGRhdGVVc2VyKHVzZXJJZDogc3RyaW5nLCBpbnB1dDogVXBkYXRlVXNlcklucHV0KTogUHJvbWlzZTxVc2VyPiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIEJ1aWxkIHVwZGF0ZSBleHByZXNzaW9uIGR5bmFtaWNhbGx5XG4gICAgICBjb25zdCB1cGRhdGVFeHByZXNzaW9uczogc3RyaW5nW10gPSBbXTtcbiAgICAgIGNvbnN0IGV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgICAgY29uc3QgZXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuICAgICAgXG4gICAgICBpZiAoaW5wdXQuZGlzcGxheU5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB1cGRhdGVFeHByZXNzaW9ucy5wdXNoKCcjZGlzcGxheU5hbWUgPSA6ZGlzcGxheU5hbWUnKTtcbiAgICAgICAgZXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzWycjZGlzcGxheU5hbWUnXSA9ICdkaXNwbGF5TmFtZSc7XG4gICAgICAgIGV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXNbJzpkaXNwbGF5TmFtZSddID0gaW5wdXQuZGlzcGxheU5hbWU7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGlmIChpbnB1dC5hdmF0YXJVcmwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB1cGRhdGVFeHByZXNzaW9ucy5wdXNoKCcjYXZhdGFyVXJsID0gOmF2YXRhclVybCcpO1xuICAgICAgICBleHByZXNzaW9uQXR0cmlidXRlTmFtZXNbJyNhdmF0YXJVcmwnXSA9ICdhdmF0YXJVcmwnO1xuICAgICAgICBleHByZXNzaW9uQXR0cmlidXRlVmFsdWVzWyc6YXZhdGFyVXJsJ10gPSBpbnB1dC5hdmF0YXJVcmw7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGlmIChpbnB1dC5zeXN0ZW1Sb2xlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdXBkYXRlRXhwcmVzc2lvbnMucHVzaCgnI3N5c3RlbVJvbGUgPSA6c3lzdGVtUm9sZScpO1xuICAgICAgICBleHByZXNzaW9uQXR0cmlidXRlTmFtZXNbJyNzeXN0ZW1Sb2xlJ10gPSAnc3lzdGVtUm9sZSc7XG4gICAgICAgIGV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXNbJzpzeXN0ZW1Sb2xlJ10gPSBpbnB1dC5zeXN0ZW1Sb2xlO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBBbHdheXMgdXBkYXRlIHRoZSB1cGRhdGVkQXQgdGltZXN0YW1wXG4gICAgICB1cGRhdGVFeHByZXNzaW9ucy5wdXNoKCcjdXBkYXRlZEF0ID0gOnVwZGF0ZWRBdCcpO1xuICAgICAgZXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzWycjdXBkYXRlZEF0J10gPSAndXBkYXRlZEF0JztcbiAgICAgIGV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXNbJzp1cGRhdGVkQXQnXSA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgIFxuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBVcGRhdGVDb21tYW5kKHtcbiAgICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgICAgS2V5OiB7XG4gICAgICAgICAgUEs6IGBVU0VSIyR7dXNlcklkfWAsXG4gICAgICAgICAgU0s6ICdQUk9GSUxFJyxcbiAgICAgICAgfSxcbiAgICAgICAgVXBkYXRlRXhwcmVzc2lvbjogYFNFVCAke3VwZGF0ZUV4cHJlc3Npb25zLmpvaW4oJywgJyl9YCxcbiAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzOiBleHByZXNzaW9uQXR0cmlidXRlTmFtZXMsXG4gICAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IGV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXMsXG4gICAgICAgIENvbmRpdGlvbkV4cHJlc3Npb246ICdhdHRyaWJ1dGVfZXhpc3RzKFBLKScsIC8vIEVuc3VyZSB1c2VyIGV4aXN0c1xuICAgICAgICBSZXR1cm5WYWx1ZXM6ICdBTExfTkVXJyxcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmRvY0NsaWVudC5zZW5kKGNvbW1hbmQpO1xuICAgICAgXG4gICAgICBpZiAoIXJlc3VsdC5BdHRyaWJ1dGVzKSB7XG4gICAgICAgIHRocm93IG5ldyBJbnRlcm5hbEVycm9yKCdVcGRhdGUgb3BlcmF0aW9uIGRpZCBub3QgcmV0dXJuIHVwZGF0ZWQgaXRlbScpO1xuICAgICAgfVxuICAgICAgXG4gICAgICByZXR1cm4gdGhpcy5tYXBEeW5hbW9JdGVtVG9Vc2VyKHJlc3VsdC5BdHRyaWJ1dGVzKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAoZXJyb3IubmFtZSA9PT0gJ0NvbmRpdGlvbmFsQ2hlY2tGYWlsZWRFeGNlcHRpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBOb3RGb3VuZEVycm9yKCdVc2VyIG5vdCBmb3VuZCcpO1xuICAgICAgfVxuICAgICAgXG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciB1cGRhdGluZyB1c2VyOicsIGVycm9yLCB7IHVzZXJJZCwgaW5wdXQgfSk7XG4gICAgICB0aHJvdyBuZXcgSW50ZXJuYWxFcnJvcignRmFpbGVkIHRvIHVwZGF0ZSB1c2VyJyk7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogQ2hlY2sgaWYgdXNlciBleGlzdHNcbiAgICogXG4gICAqIEBwYXJhbSB1c2VySWQgLSBVc2VyIElEXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdXNlciBleGlzdHNcbiAgICovXG4gIGFzeW5jIHVzZXJFeGlzdHModXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBHZXRDb21tYW5kKHtcbiAgICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgICAgS2V5OiB7XG4gICAgICAgICAgUEs6IGBVU0VSIyR7dXNlcklkfWAsXG4gICAgICAgICAgU0s6ICdQUk9GSUxFJyxcbiAgICAgICAgfSxcbiAgICAgICAgUHJvamVjdGlvbkV4cHJlc3Npb246ICdQSycsIC8vIE9ubHkgZmV0Y2ggdGhlIGtleSB0byBtaW5pbWl6ZSBkYXRhIHRyYW5zZmVyXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5kb2NDbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgIFxuICAgICAgcmV0dXJuICEhcmVzdWx0Lkl0ZW07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGNoZWNraW5nIHVzZXIgZXhpc3RlbmNlOicsIGVycm9yLCB7IHVzZXJJZCB9KTtcbiAgICAgIHJldHVybiBmYWxzZTsgLy8gQXNzdW1lIHVzZXIgZG9lc24ndCBleGlzdCBvbiBlcnJvclxuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIE1hcCBEeW5hbW9EQiBpdGVtIHRvIFVzZXIgb2JqZWN0XG4gICAqIFxuICAgKiBAcGFyYW0gaXRlbSAtIER5bmFtb0RCIGl0ZW1cbiAgICogQHJldHVybnMgVXNlciBvYmplY3RcbiAgICovXG4gIHByaXZhdGUgbWFwRHluYW1vSXRlbVRvVXNlcihpdGVtOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogVXNlciB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiBpdGVtLlBLLnJlcGxhY2UoJ1VTRVIjJywgJycpLFxuICAgICAgZW1haWw6IGl0ZW0uZW1haWwsXG4gICAgICBkaXNwbGF5TmFtZTogaXRlbS5kaXNwbGF5TmFtZSxcbiAgICAgIGF2YXRhclVybDogaXRlbS5hdmF0YXJVcmwsXG4gICAgICBzeXN0ZW1Sb2xlOiBpdGVtLnN5c3RlbVJvbGUgYXMgU3lzdGVtUm9sZSxcbiAgICAgIGNyZWF0ZWRBdDogaXRlbS5jcmVhdGVkQXQsXG4gICAgICB1cGRhdGVkQXQ6IGl0ZW0udXBkYXRlZEF0LFxuICAgIH07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBFeHRyYWN0IGRpc3BsYXkgbmFtZSBmcm9tIGVtYWlsIGFkZHJlc3NcbiAgICogXG4gICAqIEBwYXJhbSBlbWFpbCAtIEVtYWlsIGFkZHJlc3NcbiAgICogQHJldHVybnMgRGlzcGxheSBuYW1lXG4gICAqL1xuICBwcml2YXRlIGV4dHJhY3REaXNwbGF5TmFtZUZyb21FbWFpbChlbWFpbDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBsb2NhbFBhcnQgPSBlbWFpbC5zcGxpdCgnQCcpWzBdO1xuICAgIFxuICAgIC8vIENvbnZlcnQgdG8gdGl0bGUgY2FzZSBhbmQgcmVwbGFjZSBjb21tb24gc2VwYXJhdG9yc1xuICAgIHJldHVybiBsb2NhbFBhcnRcbiAgICAgIC5yZXBsYWNlKC9bLl8tXS9nLCAnICcpXG4gICAgICAuc3BsaXQoJyAnKVxuICAgICAgLm1hcCh3b3JkID0+IHdvcmQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB3b3JkLnNsaWNlKDEpLnRvTG93ZXJDYXNlKCkpXG4gICAgICAuam9pbignICcpO1xuICB9XG59Il19