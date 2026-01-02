"use strict";
/**
 * DynamoDB Club Repository - Phase 2.1
 *
 * DynamoDB implementation of the club repository interface.
 * Uses single-table design with index item pattern for efficient queries.
 *
 * Compliance:
 * - Phase 2.1 Spec: .kiro/specs/phase-2.1.club-service.v1.md
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBClubRepository = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const club_1 = require("../../../shared/types/club");
const club_2 = require("../domain/club");
const lambda_utils_1 = require("../../../shared/utils/lambda-utils");
const errors_1 = require("../../../shared/utils/errors");
/**
 * DynamoDB club repository implementation
 */
class DynamoDBClubRepository {
    constructor(tableName, dynamoClient) {
        this.tableName = tableName;
        const client = dynamoClient || new client_dynamodb_1.DynamoDBClient({});
        this.docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
    }
    /**
     * Get club by ID
     */
    async getClubById(id) {
        const startTime = Date.now();
        try {
            const command = new lib_dynamodb_1.GetCommand({
                TableName: this.tableName,
                Key: {
                    PK: `CLUB#${id}`,
                    SK: 'METADATA',
                },
            });
            const result = await this.docClient.send(command);
            const duration = Date.now() - startTime;
            if (!result.Item) {
                (0, lambda_utils_1.logStructured)('INFO', 'Club not found', {
                    clubId: id,
                    duration,
                });
                return null;
            }
            const club = this.mapDynamoItemToClub(result.Item);
            (0, lambda_utils_1.logStructured)('INFO', 'Club retrieved successfully', {
                clubId: id,
                duration,
            });
            return club;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('ERROR', 'Failed to get club by ID', {
                clubId: id,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
            });
            throw error;
        }
    }
    /**
     * List clubs with pagination and filtering
     */
    async listClubs(options) {
        const startTime = Date.now();
        const limit = options.limit || club_1.CLUB_CONSTRAINTS.DEFAULT_LIST_LIMIT;
        try {
            const queryParams = {
                TableName: this.tableName,
                IndexName: 'GSI1',
                KeyConditionExpression: 'GSI1PK = :pk',
                ExpressionAttributeValues: {
                    ':pk': 'INDEX#CLUB',
                },
                Limit: limit + 1,
                ScanIndexForward: true, // Sort by GSI1SK (name-based)
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
                const cursor = this.decodeCursor(options.cursor);
                queryParams.ExclusiveStartKey = {
                    GSI1PK: 'INDEX#CLUB',
                    GSI1SK: `NAME#${cursor.nameLower}#ID#${cursor.clubId}`,
                    PK: 'INDEX#CLUB',
                    SK: `NAME#${cursor.nameLower}#ID#${cursor.clubId}`,
                };
            }
            const command = new lib_dynamodb_1.QueryCommand(queryParams);
            const result = await this.docClient.send(command);
            const duration = Date.now() - startTime;
            const items = result.Items || [];
            const hasMore = items.length > limit;
            const clubs = items.slice(0, limit).map(item => this.indexItemToClub(item));
            let nextCursor;
            if (hasMore) {
                const lastClub = clubs[clubs.length - 1];
                nextCursor = this.encodeCursor({
                    nameLower: (0, club_2.normalizeClubName)(lastClub.name),
                    clubId: lastClub.id,
                });
            }
            (0, lambda_utils_1.logStructured)('INFO', 'Clubs listed successfully', {
                count: clubs.length,
                hasMore,
                duration,
                status: options.status,
            });
            return {
                clubs,
                nextCursor,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('ERROR', 'Failed to list clubs', {
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
                options,
            });
            throw error;
        }
    }
    /**
     * Create a new club
     */
    async createClub(input) {
        const startTime = Date.now();
        try {
            // Create club entity
            const clubEntity = (0, club_2.createClub)(input);
            const club = clubEntity.data;
            // Prepare canonical club item
            const clubItem = {
                PK: `CLUB#${club.id}`,
                SK: 'METADATA',
                entityType: 'CLUB',
                id: club.id,
                name: club.name,
                nameLower: (0, club_2.normalizeClubName)(club.name),
                description: club.description,
                city: club.city,
                logoUrl: club.logoUrl,
                status: club.status,
                createdAt: club.createdAt,
                updatedAt: club.updatedAt,
            };
            // Prepare index item
            const indexItem = {
                PK: 'INDEX#CLUB',
                SK: `NAME#${clubItem.nameLower}#ID#${club.id}`,
                GSI1PK: 'INDEX#CLUB',
                GSI1SK: `NAME#${clubItem.nameLower}#ID#${club.id}`,
                entityType: 'CLUB_INDEX',
                clubId: club.id,
                name: club.name,
                nameLower: clubItem.nameLower,
                status: club.status,
                city: club.city,
                createdAt: club.createdAt,
                updatedAt: club.updatedAt,
            };
            // Use TransactWrite to ensure both items are created atomically
            const transactParams = {
                TransactItems: [
                    {
                        Put: {
                            TableName: this.tableName,
                            Item: clubItem,
                            ConditionExpression: 'attribute_not_exists(PK)', // Ensure club doesn't already exist
                        },
                    },
                    {
                        Put: {
                            TableName: this.tableName,
                            Item: indexItem,
                        },
                    },
                ],
            };
            const command = new lib_dynamodb_1.TransactWriteCommand(transactParams);
            await this.docClient.send(command);
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('INFO', 'Club created successfully', {
                clubId: club.id,
                clubName: club.name,
                duration,
            });
            return club;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('ERROR', 'Failed to create club', {
                clubName: input.name,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
            });
            throw error;
        }
    }
    /**
     * Update an existing club
     */
    async updateClub(id, input) {
        const startTime = Date.now();
        try {
            // Get existing club first
            const existingClub = await this.getClubById(id);
            if (!existingClub) {
                throw new errors_1.NotFoundError('Club not found');
            }
            // Create updated club
            const updatedClub = {
                ...existingClub,
                ...input,
                updatedAt: new Date().toISOString(),
            };
            const transactItems = [];
            // Always update the canonical club item
            const clubItem = {
                PK: `CLUB#${id}`,
                SK: 'METADATA',
                entityType: 'CLUB',
                id: updatedClub.id,
                name: updatedClub.name,
                nameLower: (0, club_2.normalizeClubName)(updatedClub.name),
                description: updatedClub.description,
                city: updatedClub.city,
                logoUrl: updatedClub.logoUrl,
                status: updatedClub.status,
                createdAt: updatedClub.createdAt,
                updatedAt: updatedClub.updatedAt,
            };
            transactItems.push({
                Put: {
                    TableName: this.tableName,
                    Item: clubItem,
                },
            });
            // If name changed, update index item
            const nameChanged = (0, club_2.normalizeClubName)(updatedClub.name) !== (0, club_2.normalizeClubName)(existingClub.name);
            if (nameChanged) {
                // Delete old index item
                transactItems.push({
                    Delete: {
                        TableName: this.tableName,
                        Key: {
                            PK: 'INDEX#CLUB',
                            SK: `NAME#${(0, club_2.normalizeClubName)(existingClub.name)}#ID#${id}`,
                        },
                    },
                });
                // Create new index item
                const newIndexItem = {
                    PK: 'INDEX#CLUB',
                    SK: `NAME#${clubItem.nameLower}#ID#${id}`,
                    GSI1PK: 'INDEX#CLUB',
                    GSI1SK: `NAME#${clubItem.nameLower}#ID#${id}`,
                    entityType: 'CLUB_INDEX',
                    clubId: id,
                    name: updatedClub.name,
                    nameLower: clubItem.nameLower,
                    status: updatedClub.status,
                    city: updatedClub.city,
                    createdAt: updatedClub.createdAt,
                    updatedAt: updatedClub.updatedAt,
                };
                transactItems.push({
                    Put: {
                        TableName: this.tableName,
                        Item: newIndexItem,
                    },
                });
            }
            else {
                // Update existing index item
                const indexItem = {
                    PK: 'INDEX#CLUB',
                    SK: `NAME#${clubItem.nameLower}#ID#${id}`,
                    GSI1PK: 'INDEX#CLUB',
                    GSI1SK: `NAME#${clubItem.nameLower}#ID#${id}`,
                    entityType: 'CLUB_INDEX',
                    clubId: id,
                    name: updatedClub.name,
                    nameLower: clubItem.nameLower,
                    status: updatedClub.status,
                    city: updatedClub.city,
                    createdAt: updatedClub.createdAt,
                    updatedAt: updatedClub.updatedAt,
                };
                transactItems.push({
                    Put: {
                        TableName: this.tableName,
                        Item: indexItem,
                    },
                });
            }
            const transactParams = {
                TransactItems: transactItems,
            };
            const command = new lib_dynamodb_1.TransactWriteCommand(transactParams);
            await this.docClient.send(command);
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('INFO', 'Club updated successfully', {
                clubId: id,
                clubName: updatedClub.name,
                nameChanged,
                duration,
            });
            return updatedClub;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('ERROR', 'Failed to update club', {
                clubId: id,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
            });
            throw error;
        }
    }
    /**
     * Check if club exists
     */
    async clubExists(id) {
        const club = await this.getClubById(id);
        return club !== null;
    }
    /**
     * Check if club name is unique
     */
    async isClubNameUnique(name, excludeId) {
        const startTime = Date.now();
        try {
            const nameLower = (0, club_2.normalizeClubName)(name);
            const command = new lib_dynamodb_1.QueryCommand({
                TableName: this.tableName,
                IndexName: 'GSI1',
                KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :namePrefix)',
                ExpressionAttributeValues: {
                    ':pk': 'INDEX#CLUB',
                    ':namePrefix': `NAME#${nameLower}#`,
                },
                Limit: 10, // Should be very few matches for exact name
            });
            const result = await this.docClient.send(command);
            const duration = Date.now() - startTime;
            const items = result.Items || [];
            // Check if any existing club has the exact same name (excluding the specified club)
            const conflictingClub = items.find((item) => {
                const indexItem = item;
                return indexItem.nameLower === nameLower &&
                    (!excludeId || indexItem.clubId !== excludeId);
            });
            const isUnique = !conflictingClub;
            (0, lambda_utils_1.logStructured)('INFO', 'Club name uniqueness check completed', {
                name,
                isUnique,
                excludeId,
                duration,
            });
            return isUnique;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            (0, lambda_utils_1.logStructured)('ERROR', 'Failed to check club name uniqueness', {
                name,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
            });
            throw error;
        }
    }
    /**
     * Get clubs by status
     */
    async getClubsByStatus(status, limit) {
        const result = await this.listClubs({
            status: status,
            limit: limit || club_1.CLUB_CONSTRAINTS.DEFAULT_LIST_LIMIT,
        });
        return result.clubs;
    }
    /**
     * Search clubs by name
     */
    async searchClubsByName(nameQuery, limit) {
        // For now, this is a simple implementation
        // In the future, this could use more sophisticated search
        const result = await this.listClubs({
            limit: limit || club_1.CLUB_CONSTRAINTS.DEFAULT_LIST_LIMIT,
        });
        const query = nameQuery.toLowerCase();
        return result.clubs.filter(club => club.name.toLowerCase().includes(query));
    }
    /**
     * Map DynamoDB item to Club
     */
    mapDynamoItemToClub(item) {
        return {
            id: item.id,
            name: item.name,
            description: item.description,
            status: item.status,
            city: item.city,
            logoUrl: item.logoUrl,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        };
    }
    /**
     * Map index item to Club (minimal data)
     */
    indexItemToClub(item) {
        return {
            id: item.clubId,
            name: item.name,
            status: item.status,
            city: item.city,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            // Note: description and logoUrl are not in index items
            // They would need to be fetched separately if needed
        };
    }
    /**
     * Encode cursor for pagination
     */
    encodeCursor(cursor) {
        const cursorData = JSON.stringify(cursor);
        return Buffer.from(cursorData).toString('base64');
    }
    /**
     * Decode cursor for pagination
     */
    decodeCursor(cursor) {
        try {
            const cursorData = Buffer.from(cursor, 'base64').toString('utf-8');
            return JSON.parse(cursorData);
        }
        catch (error) {
            throw new Error('Invalid pagination cursor');
        }
    }
}
exports.DynamoDBClubRepository = DynamoDBClubRepository;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHluYW1vZGItY2x1Yi1yZXBvc2l0b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZHluYW1vZGItY2x1Yi1yZXBvc2l0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7O0dBU0c7OztBQUVILDhEQUEwRDtBQUMxRCx3REFNK0I7QUFDL0IscURBVW9DO0FBUXBDLHlDQUE2RTtBQUM3RSxxRUFBbUU7QUFDbkUseURBQTZEO0FBRTdEOztHQUVHO0FBQ0gsTUFBYSxzQkFBc0I7SUFHakMsWUFDbUIsU0FBaUIsRUFDbEMsWUFBNkI7UUFEWixjQUFTLEdBQVQsU0FBUyxDQUFRO1FBR2xDLE1BQU0sTUFBTSxHQUFHLFlBQVksSUFBSSxJQUFJLGdDQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxxQ0FBc0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLFdBQVcsQ0FBQyxFQUFVO1FBQzFCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUU3QixJQUFJO1lBQ0YsTUFBTSxPQUFPLEdBQUcsSUFBSSx5QkFBVSxDQUFDO2dCQUM3QixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7Z0JBQ3pCLEdBQUcsRUFBRTtvQkFDSCxFQUFFLEVBQUUsUUFBUSxFQUFFLEVBQUU7b0JBQ2hCLEVBQUUsRUFBRSxVQUFVO2lCQUNmO2FBQ0YsQ0FBQyxDQUFDO1lBRUgsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNsRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDO1lBRXhDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFO2dCQUNoQixJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFF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aGFzZSAyLjFcbiAqIFxuICogRHluYW1vREIgaW1wbGVtZW50YXRpb24gb2YgdGhlIGNsdWIgcmVwb3NpdG9yeSBpbnRlcmZhY2UuXG4gKiBVc2VzIHNpbmdsZS10YWJsZSBkZXNpZ24gd2l0aCBpbmRleCBpdGVtIHBhdHRlcm4gZm9yIGVmZmljaWVudCBxdWVyaWVzLlxuICogXG4gKiBDb21wbGlhbmNlOlxuICogLSBQaGFzZSAyLjEgU3BlYzogLmtpcm8vc3BlY3MvcGhhc2UtMi4xLmNsdWItc2VydmljZS52MS5tZFxuICogLSBBV1MgQXJjaGl0ZWN0dXJlOiAua2lyby9zcGVjcy9hcmNoaXRlY3R1cmUuYXdzLnYxLm1kXG4gKi9cblxuaW1wb3J0IHsgRHluYW1vREJDbGllbnQgfSBmcm9tICdAYXdzLXNkay9jbGllbnQtZHluYW1vZGInO1xuaW1wb3J0IHtcbiAgRHluYW1vREJEb2N1bWVudENsaWVudCxcbiAgR2V0Q29tbWFuZCxcbiAgUXVlcnlDb21tYW5kLFxuICBUcmFuc2FjdFdyaXRlQ29tbWFuZCxcbiAgVHJhbnNhY3RXcml0ZUNvbW1hbmRJbnB1dFxufSBmcm9tICdAYXdzLXNkay9saWItZHluYW1vZGInO1xuaW1wb3J0IHtcbiAgQ2x1YixcbiAgQ2x1YlN0YXR1cyxcbiAgQ3JlYXRlQ2x1YklucHV0LFxuICBVcGRhdGVDbHViSW5wdXQsXG4gIExpc3RDbHVic09wdGlvbnMsXG4gIExpc3RDbHVic1Jlc3VsdCxcbiAgQ2x1YkR5bmFtb0l0ZW0sXG4gIENsdWJJbmRleEl0ZW0sXG4gIENMVUJfQ09OU1RSQUlOVFNcbn0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL3R5cGVzL2NsdWInO1xuXG4vLyBEZWZpbmUgY3Vyc29yIHR5cGUgbG9jYWxseSBzaW5jZSBpdCdzIG5vdCBleHBvcnRlZCBmcm9tIHNoYXJlZCB0eXBlc1xuaW50ZXJmYWNlIENsdWJDdXJzb3Ige1xuICBuYW1lTG93ZXI6IHN0cmluZztcbiAgY2x1YklkOiBzdHJpbmc7XG59XG5pbXBvcnQgeyBJQ2x1YlJlcG9zaXRvcnkgfSBmcm9tICcuLi9kb21haW4vY2x1Yi1yZXBvc2l0b3J5JztcbmltcG9ydCB7IGNyZWF0ZUNsdWIsIGZyb21DbHViRGF0YSwgbm9ybWFsaXplQ2x1Yk5hbWUgfSBmcm9tICcuLi9kb21haW4vY2x1Yic7XG5pbXBvcnQgeyBsb2dTdHJ1Y3R1cmVkIH0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBOb3RGb3VuZEVycm9yIH0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2Vycm9ycyc7XG5cbi8qKlxuICogRHluYW1vREIgY2x1YiByZXBvc2l0b3J5IGltcGxlbWVudGF0aW9uXG4gKi9cbmV4cG9ydCBjbGFzcyBEeW5hbW9EQkNsdWJSZXBvc2l0b3J5IGltcGxlbWVudHMgSUNsdWJSZXBvc2l0b3J5IHtcbiAgcHJpdmF0ZSByZWFkb25seSBkb2NDbGllbnQ6IER5bmFtb0RCRG9jdW1lbnRDbGllbnQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSB0YWJsZU5hbWU6IHN0cmluZyxcbiAgICBkeW5hbW9DbGllbnQ/OiBEeW5hbW9EQkNsaWVudFxuICApIHtcbiAgICBjb25zdCBjbGllbnQgPSBkeW5hbW9DbGllbnQgfHwgbmV3IER5bmFtb0RCQ2xpZW50KHt9KTtcbiAgICB0aGlzLmRvY0NsaWVudCA9IER5bmFtb0RCRG9jdW1lbnRDbGllbnQuZnJvbShjbGllbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBjbHViIGJ5IElEXG4gICAqL1xuICBhc3luYyBnZXRDbHViQnlJZChpZDogc3RyaW5nKTogUHJvbWlzZTxDbHViIHwgbnVsbD4ge1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBHZXRDb21tYW5kKHtcbiAgICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgICAgS2V5OiB7XG4gICAgICAgICAgUEs6IGBDTFVCIyR7aWR9YCxcbiAgICAgICAgICBTSzogJ01FVEFEQVRBJyxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmRvY0NsaWVudC5zZW5kKGNvbW1hbmQpO1xuICAgICAgY29uc3QgZHVyYXRpb24gPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuXG4gICAgICBpZiAoIXJlc3VsdC5JdGVtKSB7XG4gICAgICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnQ2x1YiBub3QgZm91bmQnLCB7XG4gICAgICAgICAgY2x1YklkOiBpZCxcbiAgICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjbHViID0gdGhpcy5tYXBEeW5hbW9JdGVtVG9DbHViKHJlc3VsdC5JdGVtIGFzIENsdWJEeW5hbW9JdGVtKTtcblxuICAgICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdDbHViIHJldHJpZXZlZCBzdWNjZXNzZnVsbHknLCB7XG4gICAgICAgIGNsdWJJZDogaWQsXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBjbHViO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdGYWlsZWQgdG8gZ2V0IGNsdWIgYnkgSUQnLCB7XG4gICAgICAgIGNsdWJJZDogaWQsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICB9KTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGNsdWJzIHdpdGggcGFnaW5hdGlvbiBhbmQgZmlsdGVyaW5nXG4gICAqL1xuICBhc3luYyBsaXN0Q2x1YnMob3B0aW9uczogTGlzdENsdWJzT3B0aW9ucyk6IFByb21pc2U8TGlzdENsdWJzUmVzdWx0PiB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCBsaW1pdCA9IG9wdGlvbnMubGltaXQgfHwgQ0xVQl9DT05TVFJBSU5UUy5ERUZBVUxUX0xJU1RfTElNSVQ7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcXVlcnlQYXJhbXM6IGFueSA9IHtcbiAgICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgICAgSW5kZXhOYW1lOiAnR1NJMScsXG4gICAgICAgIEtleUNvbmRpdGlvbkV4cHJlc3Npb246ICdHU0kxUEsgPSA6cGsnLFxuICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAgICAgJzpwayc6ICdJTkRFWCNDTFVCJyxcbiAgICAgICAgfSxcbiAgICAgICAgTGltaXQ6IGxpbWl0ICsgMSwgLy8gR2V0IG9uZSBleHRyYSB0byBkZXRlcm1pbmUgaWYgdGhlcmUgYXJlIG1vcmUgcmVzdWx0c1xuICAgICAgICBTY2FuSW5kZXhGb3J3YXJkOiB0cnVlLCAvLyBTb3J0IGJ5IEdTSTFTSyAobmFtZS1iYXNlZClcbiAgICAgIH07XG5cbiAgICAgIC8vIEFkZCBzdGF0dXMgZmlsdGVyXG4gICAgICBpZiAob3B0aW9ucy5zdGF0dXMpIHtcbiAgICAgICAgcXVlcnlQYXJhbXMuRmlsdGVyRXhwcmVzc2lvbiA9ICcjc3RhdHVzID0gOnN0YXR1cyc7XG4gICAgICAgIHF1ZXJ5UGFyYW1zLkV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lcyA9IHtcbiAgICAgICAgICAnI3N0YXR1cyc6ICdzdGF0dXMnLFxuICAgICAgICB9O1xuICAgICAgICBxdWVyeVBhcmFtcy5FeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzWyc6c3RhdHVzJ10gPSBvcHRpb25zLnN0YXR1cztcbiAgICAgIH1cblxuICAgICAgLy8gQWRkIGN1cnNvciBmb3IgcGFnaW5hdGlvblxuICAgICAgaWYgKG9wdGlvbnMuY3Vyc29yKSB7XG4gICAgICAgIGNvbnN0IGN1cnNvciA9IHRoaXMuZGVjb2RlQ3Vyc29yKG9wdGlvbnMuY3Vyc29yKTtcbiAgICAgICAgcXVlcnlQYXJhbXMuRXhjbHVzaXZlU3RhcnRLZXkgPSB7XG4gICAgICAgICAgR1NJMVBLOiAnSU5ERVgjQ0xVQicsXG4gICAgICAgICAgR1NJMVNLOiBgTkFNRSMke2N1cnNvci5uYW1lTG93ZXJ9I0lEIyR7Y3Vyc29yLmNsdWJJZH1gLFxuICAgICAgICAgIFBLOiAnSU5ERVgjQ0xVQicsXG4gICAgICAgICAgU0s6IGBOQU1FIyR7Y3Vyc29yLm5hbWVMb3dlcn0jSUQjJHtjdXJzb3IuY2x1YklkfWAsXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgUXVlcnlDb21tYW5kKHF1ZXJ5UGFyYW1zKTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZG9jQ2xpZW50LnNlbmQoY29tbWFuZCk7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG5cbiAgICAgIGNvbnN0IGl0ZW1zID0gcmVzdWx0Lkl0ZW1zIHx8IFtdO1xuICAgICAgY29uc3QgaGFzTW9yZSA9IGl0ZW1zLmxlbmd0aCA+IGxpbWl0O1xuICAgICAgY29uc3QgY2x1YnMgPSBpdGVtcy5zbGljZSgwLCBsaW1pdCkubWFwKGl0ZW0gPT4gdGhpcy5pbmRleEl0ZW1Ub0NsdWIoaXRlbSBhcyBDbHViSW5kZXhJdGVtKSk7XG5cbiAgICAgIGxldCBuZXh0Q3Vyc29yOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgICBpZiAoaGFzTW9yZSkge1xuICAgICAgICBjb25zdCBsYXN0Q2x1YiA9IGNsdWJzW2NsdWJzLmxlbmd0aCAtIDFdO1xuICAgICAgICBuZXh0Q3Vyc29yID0gdGhpcy5lbmNvZGVDdXJzb3Ioe1xuICAgICAgICAgIG5hbWVMb3dlcjogbm9ybWFsaXplQ2x1Yk5hbWUobGFzdENsdWIubmFtZSksXG4gICAgICAgICAgY2x1YklkOiBsYXN0Q2x1Yi5pZCxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnQ2x1YnMgbGlzdGVkIHN1Y2Nlc3NmdWxseScsIHtcbiAgICAgICAgY291bnQ6IGNsdWJzLmxlbmd0aCxcbiAgICAgICAgaGFzTW9yZSxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICAgIHN0YXR1czogb3B0aW9ucy5zdGF0dXMsXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2x1YnMsXG4gICAgICAgIG5leHRDdXJzb3IsXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdGYWlsZWQgdG8gbGlzdCBjbHVicycsIHtcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgb3B0aW9ucyxcbiAgICAgIH0pO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBjbHViXG4gICAqL1xuICBhc3luYyBjcmVhdGVDbHViKGlucHV0OiBDcmVhdGVDbHViSW5wdXQpOiBQcm9taXNlPENsdWI+IHtcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIENyZWF0ZSBjbHViIGVudGl0eVxuICAgICAgY29uc3QgY2x1YkVudGl0eSA9IGNyZWF0ZUNsdWIoaW5wdXQpO1xuICAgICAgY29uc3QgY2x1YiA9IGNsdWJFbnRpdHkuZGF0YTtcblxuICAgICAgLy8gUHJlcGFyZSBjYW5vbmljYWwgY2x1YiBpdGVtXG4gICAgICBjb25zdCBjbHViSXRlbTogQ2x1YkR5bmFtb0l0ZW0gPSB7XG4gICAgICAgIFBLOiBgQ0xVQiMke2NsdWIuaWR9YCxcbiAgICAgICAgU0s6ICdNRVRBREFUQScsXG4gICAgICAgIGVudGl0eVR5cGU6ICdDTFVCJyxcbiAgICAgICAgaWQ6IGNsdWIuaWQsXG4gICAgICAgIG5hbWU6IGNsdWIubmFtZSxcbiAgICAgICAgbmFtZUxvd2VyOiBub3JtYWxpemVDbHViTmFtZShjbHViLm5hbWUpLFxuICAgICAgICBkZXNjcmlwdGlvbjogY2x1Yi5kZXNjcmlwdGlvbixcbiAgICAgICAgY2l0eTogY2x1Yi5jaXR5LFxuICAgICAgICBsb2dvVXJsOiBjbHViLmxvZ29VcmwsXG4gICAgICAgIHN0YXR1czogY2x1Yi5zdGF0dXMsXG4gICAgICAgIGNyZWF0ZWRBdDogY2x1Yi5jcmVhdGVkQXQsXG4gICAgICAgIHVwZGF0ZWRBdDogY2x1Yi51cGRhdGVkQXQsXG4gICAgICB9O1xuXG4gICAgICAvLyBQcmVwYXJlIGluZGV4IGl0ZW1cbiAgICAgIGNvbnN0IGluZGV4SXRlbTogQ2x1YkluZGV4SXRlbSA9IHtcbiAgICAgICAgUEs6ICdJTkRFWCNDTFVCJyxcbiAgICAgICAgU0s6IGBOQU1FIyR7Y2x1Ykl0ZW0ubmFtZUxvd2VyfSNJRCMke2NsdWIuaWR9YCxcbiAgICAgICAgR1NJMVBLOiAnSU5ERVgjQ0xVQicsXG4gICAgICAgIEdTSTFTSzogYE5BTUUjJHtjbHViSXRlbS5uYW1lTG93ZXJ9I0lEIyR7Y2x1Yi5pZH1gLFxuICAgICAgICBlbnRpdHlUeXBlOiAnQ0xVQl9JTkRFWCcsXG4gICAgICAgIGNsdWJJZDogY2x1Yi5pZCxcbiAgICAgICAgbmFtZTogY2x1Yi5uYW1lLFxuICAgICAgICBuYW1lTG93ZXI6IGNsdWJJdGVtLm5hbWVMb3dlcixcbiAgICAgICAgc3RhdHVzOiBjbHViLnN0YXR1cyxcbiAgICAgICAgY2l0eTogY2x1Yi5jaXR5LFxuICAgICAgICBjcmVhdGVkQXQ6IGNsdWIuY3JlYXRlZEF0LFxuICAgICAgICB1cGRhdGVkQXQ6IGNsdWIudXBkYXRlZEF0LFxuICAgICAgfTtcblxuICAgICAgLy8gVXNlIFRyYW5zYWN0V3JpdGUgdG8gZW5zdXJlIGJvdGggaXRlbXMgYXJlIGNyZWF0ZWQgYXRvbWljYWxseVxuICAgICAgY29uc3QgdHJhbnNhY3RQYXJhbXM6IFRyYW5zYWN0V3JpdGVDb21tYW5kSW5wdXQgPSB7XG4gICAgICAgIFRyYW5zYWN0SXRlbXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBQdXQ6IHtcbiAgICAgICAgICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgICAgICAgICAgSXRlbTogY2x1Ykl0ZW0sXG4gICAgICAgICAgICAgIENvbmRpdGlvbkV4cHJlc3Npb246ICdhdHRyaWJ1dGVfbm90X2V4aXN0cyhQSyknLCAvLyBFbnN1cmUgY2x1YiBkb2Vzbid0IGFscmVhZHkgZXhpc3RcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBQdXQ6IHtcbiAgICAgICAgICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgICAgICAgICAgSXRlbTogaW5kZXhJdGVtLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfTtcblxuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBUcmFuc2FjdFdyaXRlQ29tbWFuZCh0cmFuc2FjdFBhcmFtcyk7XG4gICAgICBhd2FpdCB0aGlzLmRvY0NsaWVudC5zZW5kKGNvbW1hbmQpO1xuXG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG5cbiAgICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnQ2x1YiBjcmVhdGVkIHN1Y2Nlc3NmdWxseScsIHtcbiAgICAgICAgY2x1YklkOiBjbHViLmlkLFxuICAgICAgICBjbHViTmFtZTogY2x1Yi5uYW1lLFxuICAgICAgICBkdXJhdGlvbixcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gY2x1YjtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgZHVyYXRpb24gPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgICAgbG9nU3RydWN0dXJlZCgnRVJST1InLCAnRmFpbGVkIHRvIGNyZWF0ZSBjbHViJywge1xuICAgICAgICBjbHViTmFtZTogaW5wdXQubmFtZSxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgICAgICBkdXJhdGlvbixcbiAgICAgIH0pO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBhbiBleGlzdGluZyBjbHViXG4gICAqL1xuICBhc3luYyB1cGRhdGVDbHViKGlkOiBzdHJpbmcsIGlucHV0OiBVcGRhdGVDbHViSW5wdXQpOiBQcm9taXNlPENsdWI+IHtcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIEdldCBleGlzdGluZyBjbHViIGZpcnN0XG4gICAgICBjb25zdCBleGlzdGluZ0NsdWIgPSBhd2FpdCB0aGlzLmdldENsdWJCeUlkKGlkKTtcbiAgICAgIGlmICghZXhpc3RpbmdDbHViKSB7XG4gICAgICAgIHRocm93IG5ldyBOb3RGb3VuZEVycm9yKCdDbHViIG5vdCBmb3VuZCcpO1xuICAgICAgfVxuXG4gICAgICAvLyBDcmVhdGUgdXBkYXRlZCBjbHViXG4gICAgICBjb25zdCB1cGRhdGVkQ2x1YjogQ2x1YiA9IHtcbiAgICAgICAgLi4uZXhpc3RpbmdDbHViLFxuICAgICAgICAuLi5pbnB1dCxcbiAgICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICB9O1xuXG4gICAgICBjb25zdCB0cmFuc2FjdEl0ZW1zOiBhbnlbXSA9IFtdO1xuXG4gICAgICAvLyBBbHdheXMgdXBkYXRlIHRoZSBjYW5vbmljYWwgY2x1YiBpdGVtXG4gICAgICBjb25zdCBjbHViSXRlbTogQ2x1YkR5bmFtb0l0ZW0gPSB7XG4gICAgICAgIFBLOiBgQ0xVQiMke2lkfWAsXG4gICAgICAgIFNLOiAnTUVUQURBVEEnLFxuICAgICAgICBlbnRpdHlUeXBlOiAnQ0xVQicsXG4gICAgICAgIGlkOiB1cGRhdGVkQ2x1Yi5pZCxcbiAgICAgICAgbmFtZTogdXBkYXRlZENsdWIubmFtZSxcbiAgICAgICAgbmFtZUxvd2VyOiBub3JtYWxpemVDbHViTmFtZSh1cGRhdGVkQ2x1Yi5uYW1lKSxcbiAgICAgICAgZGVzY3JpcHRpb246IHVwZGF0ZWRDbHViLmRlc2NyaXB0aW9uLFxuICAgICAgICBjaXR5OiB1cGRhdGVkQ2x1Yi5jaXR5LFxuICAgICAgICBsb2dvVXJsOiB1cGRhdGVkQ2x1Yi5sb2dvVXJsLFxuICAgICAgICBzdGF0dXM6IHVwZGF0ZWRDbHViLnN0YXR1cyxcbiAgICAgICAgY3JlYXRlZEF0OiB1cGRhdGVkQ2x1Yi5jcmVhdGVkQXQsXG4gICAgICAgIHVwZGF0ZWRBdDogdXBkYXRlZENsdWIudXBkYXRlZEF0LFxuICAgICAgfTtcblxuICAgICAgdHJhbnNhY3RJdGVtcy5wdXNoKHtcbiAgICAgICAgUHV0OiB7XG4gICAgICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgICAgICBJdGVtOiBjbHViSXRlbSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBJZiBuYW1lIGNoYW5nZWQsIHVwZGF0ZSBpbmRleCBpdGVtXG4gICAgICBjb25zdCBuYW1lQ2hhbmdlZCA9IG5vcm1hbGl6ZUNsdWJOYW1lKHVwZGF0ZWRDbHViLm5hbWUpICE9PSBub3JtYWxpemVDbHViTmFtZShleGlzdGluZ0NsdWIubmFtZSk7XG5cbiAgICAgIGlmIChuYW1lQ2hhbmdlZCkge1xuICAgICAgICAvLyBEZWxldGUgb2xkIGluZGV4IGl0ZW1cbiAgICAgICAgdHJhbnNhY3RJdGVtcy5wdXNoKHtcbiAgICAgICAgICBEZWxldGU6IHtcbiAgICAgICAgICAgIFRhYmxlTmFtZTogdGhpcy50YWJsZU5hbWUsXG4gICAgICAgICAgICBLZXk6IHtcbiAgICAgICAgICAgICAgUEs6ICdJTkRFWCNDTFVCJyxcbiAgICAgICAgICAgICAgU0s6IGBOQU1FIyR7bm9ybWFsaXplQ2x1Yk5hbWUoZXhpc3RpbmdDbHViLm5hbWUpfSNJRCMke2lkfWAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIENyZWF0ZSBuZXcgaW5kZXggaXRlbVxuICAgICAgICBjb25zdCBuZXdJbmRleEl0ZW06IENsdWJJbmRleEl0ZW0gPSB7XG4gICAgICAgICAgUEs6ICdJTkRFWCNDTFVCJyxcbiAgICAgICAgICBTSzogYE5BTUUjJHtjbHViSXRlbS5uYW1lTG93ZXJ9I0lEIyR7aWR9YCxcbiAgICAgICAgICBHU0kxUEs6ICdJTkRFWCNDTFVCJyxcbiAgICAgICAgICBHU0kxU0s6IGBOQU1FIyR7Y2x1Ykl0ZW0ubmFtZUxvd2VyfSNJRCMke2lkfWAsXG4gICAgICAgICAgZW50aXR5VHlwZTogJ0NMVUJfSU5ERVgnLFxuICAgICAgICAgIGNsdWJJZDogaWQsXG4gICAgICAgICAgbmFtZTogdXBkYXRlZENsdWIubmFtZSxcbiAgICAgICAgICBuYW1lTG93ZXI6IGNsdWJJdGVtLm5hbWVMb3dlcixcbiAgICAgICAgICBzdGF0dXM6IHVwZGF0ZWRDbHViLnN0YXR1cyxcbiAgICAgICAgICBjaXR5OiB1cGRhdGVkQ2x1Yi5jaXR5LFxuICAgICAgICAgIGNyZWF0ZWRBdDogdXBkYXRlZENsdWIuY3JlYXRlZEF0LFxuICAgICAgICAgIHVwZGF0ZWRBdDogdXBkYXRlZENsdWIudXBkYXRlZEF0LFxuICAgICAgICB9O1xuXG4gICAgICAgIHRyYW5zYWN0SXRlbXMucHVzaCh7XG4gICAgICAgICAgUHV0OiB7XG4gICAgICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICAgICAgSXRlbTogbmV3SW5kZXhJdGVtLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVXBkYXRlIGV4aXN0aW5nIGluZGV4IGl0ZW1cbiAgICAgICAgY29uc3QgaW5kZXhJdGVtOiBDbHViSW5kZXhJdGVtID0ge1xuICAgICAgICAgIFBLOiAnSU5ERVgjQ0xVQicsXG4gICAgICAgICAgU0s6IGBOQU1FIyR7Y2x1Ykl0ZW0ubmFtZUxvd2VyfSNJRCMke2lkfWAsXG4gICAgICAgICAgR1NJMVBLOiAnSU5ERVgjQ0xVQicsXG4gICAgICAgICAgR1NJMVNLOiBgTkFNRSMke2NsdWJJdGVtLm5hbWVMb3dlcn0jSUQjJHtpZH1gLFxuICAgICAgICAgIGVudGl0eVR5cGU6ICdDTFVCX0lOREVYJyxcbiAgICAgICAgICBjbHViSWQ6IGlkLFxuICAgICAgICAgIG5hbWU6IHVwZGF0ZWRDbHViLm5hbWUsXG4gICAgICAgICAgbmFtZUxvd2VyOiBjbHViSXRlbS5uYW1lTG93ZXIsXG4gICAgICAgICAgc3RhdHVzOiB1cGRhdGVkQ2x1Yi5zdGF0dXMsXG4gICAgICAgICAgY2l0eTogdXBkYXRlZENsdWIuY2l0eSxcbiAgICAgICAgICBjcmVhdGVkQXQ6IHVwZGF0ZWRDbHViLmNyZWF0ZWRBdCxcbiAgICAgICAgICB1cGRhdGVkQXQ6IHVwZGF0ZWRDbHViLnVwZGF0ZWRBdCxcbiAgICAgICAgfTtcblxuICAgICAgICB0cmFuc2FjdEl0ZW1zLnB1c2goe1xuICAgICAgICAgIFB1dDoge1xuICAgICAgICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgICAgICAgIEl0ZW06IGluZGV4SXRlbSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdHJhbnNhY3RQYXJhbXM6IFRyYW5zYWN0V3JpdGVDb21tYW5kSW5wdXQgPSB7XG4gICAgICAgIFRyYW5zYWN0SXRlbXM6IHRyYW5zYWN0SXRlbXMsXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBjb21tYW5kID0gbmV3IFRyYW5zYWN0V3JpdGVDb21tYW5kKHRyYW5zYWN0UGFyYW1zKTtcbiAgICAgIGF3YWl0IHRoaXMuZG9jQ2xpZW50LnNlbmQoY29tbWFuZCk7XG5cbiAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcblxuICAgICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdDbHViIHVwZGF0ZWQgc3VjY2Vzc2Z1bGx5Jywge1xuICAgICAgICBjbHViSWQ6IGlkLFxuICAgICAgICBjbHViTmFtZTogdXBkYXRlZENsdWIubmFtZSxcbiAgICAgICAgbmFtZUNoYW5nZWQsXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB1cGRhdGVkQ2x1YjtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgZHVyYXRpb24gPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgICAgbG9nU3RydWN0dXJlZCgnRVJST1InLCAnRmFpbGVkIHRvIHVwZGF0ZSBjbHViJywge1xuICAgICAgICBjbHViSWQ6IGlkLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgfSk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgY2x1YiBleGlzdHNcbiAgICovXG4gIGFzeW5jIGNsdWJFeGlzdHMoaWQ6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGNsdWIgPSBhd2FpdCB0aGlzLmdldENsdWJCeUlkKGlkKTtcbiAgICByZXR1cm4gY2x1YiAhPT0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBjbHViIG5hbWUgaXMgdW5pcXVlXG4gICAqL1xuICBhc3luYyBpc0NsdWJOYW1lVW5pcXVlKG5hbWU6IHN0cmluZywgZXhjbHVkZUlkPzogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBuYW1lTG93ZXIgPSBub3JtYWxpemVDbHViTmFtZShuYW1lKTtcblxuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBRdWVyeUNvbW1hbmQoe1xuICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICBJbmRleE5hbWU6ICdHU0kxJyxcbiAgICAgICAgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbjogJ0dTSTFQSyA9IDpwayBBTkQgYmVnaW5zX3dpdGgoR1NJMVNLLCA6bmFtZVByZWZpeCknLFxuICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAgICAgJzpwayc6ICdJTkRFWCNDTFVCJyxcbiAgICAgICAgICAnOm5hbWVQcmVmaXgnOiBgTkFNRSMke25hbWVMb3dlcn0jYCxcbiAgICAgICAgfSxcbiAgICAgICAgTGltaXQ6IDEwLCAvLyBTaG91bGQgYmUgdmVyeSBmZXcgbWF0Y2hlcyBmb3IgZXhhY3QgbmFtZVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZG9jQ2xpZW50LnNlbmQoY29tbWFuZCk7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG5cbiAgICAgIGNvbnN0IGl0ZW1zID0gcmVzdWx0Lkl0ZW1zIHx8IFtdO1xuXG4gICAgICAvLyBDaGVjayBpZiBhbnkgZXhpc3RpbmcgY2x1YiBoYXMgdGhlIGV4YWN0IHNhbWUgbmFtZSAoZXhjbHVkaW5nIHRoZSBzcGVjaWZpZWQgY2x1YilcbiAgICAgIGNvbnN0IGNvbmZsaWN0aW5nQ2x1YiA9IGl0ZW1zLmZpbmQoKGl0ZW06IGFueSkgPT4ge1xuICAgICAgICBjb25zdCBpbmRleEl0ZW0gPSBpdGVtIGFzIENsdWJJbmRleEl0ZW07XG4gICAgICAgIHJldHVybiBpbmRleEl0ZW0ubmFtZUxvd2VyID09PSBuYW1lTG93ZXIgJiZcbiAgICAgICAgICAoIWV4Y2x1ZGVJZCB8fCBpbmRleEl0ZW0uY2x1YklkICE9PSBleGNsdWRlSWQpO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGlzVW5pcXVlID0gIWNvbmZsaWN0aW5nQ2x1YjtcblxuICAgICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdDbHViIG5hbWUgdW5pcXVlbmVzcyBjaGVjayBjb21wbGV0ZWQnLCB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIGlzVW5pcXVlLFxuICAgICAgICBleGNsdWRlSWQsXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBpc1VuaXF1ZTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgZHVyYXRpb24gPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgICAgbG9nU3RydWN0dXJlZCgnRVJST1InLCAnRmFpbGVkIHRvIGNoZWNrIGNsdWIgbmFtZSB1bmlxdWVuZXNzJywge1xuICAgICAgICBuYW1lLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgfSk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IGNsdWJzIGJ5IHN0YXR1c1xuICAgKi9cbiAgYXN5bmMgZ2V0Q2x1YnNCeVN0YXR1cyhzdGF0dXM6IHN0cmluZywgbGltaXQ/OiBudW1iZXIpOiBQcm9taXNlPENsdWJbXT4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMubGlzdENsdWJzKHtcbiAgICAgIHN0YXR1czogc3RhdHVzIGFzIENsdWJTdGF0dXMsXG4gICAgICBsaW1pdDogbGltaXQgfHwgQ0xVQl9DT05TVFJBSU5UUy5ERUZBVUxUX0xJU1RfTElNSVQsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0LmNsdWJzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlYXJjaCBjbHVicyBieSBuYW1lXG4gICAqL1xuICBhc3luYyBzZWFyY2hDbHVic0J5TmFtZShuYW1lUXVlcnk6IHN0cmluZywgbGltaXQ/OiBudW1iZXIpOiBQcm9taXNlPENsdWJbXT4ge1xuICAgIC8vIEZvciBub3csIHRoaXMgaXMgYSBzaW1wbGUgaW1wbGVtZW50YXRpb25cbiAgICAvLyBJbiB0aGUgZnV0dXJlLCB0aGlzIGNvdWxkIHVzZSBtb3JlIHNvcGhpc3RpY2F0ZWQgc2VhcmNoXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5saXN0Q2x1YnMoe1xuICAgICAgbGltaXQ6IGxpbWl0IHx8IENMVUJfQ09OU1RSQUlOVFMuREVGQVVMVF9MSVNUX0xJTUlULFxuICAgIH0pO1xuXG4gICAgY29uc3QgcXVlcnkgPSBuYW1lUXVlcnkudG9Mb3dlckNhc2UoKTtcbiAgICByZXR1cm4gcmVzdWx0LmNsdWJzLmZpbHRlcihjbHViID0+XG4gICAgICBjbHViLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxdWVyeSlcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIE1hcCBEeW5hbW9EQiBpdGVtIHRvIENsdWJcbiAgICovXG4gIHByaXZhdGUgbWFwRHluYW1vSXRlbVRvQ2x1YihpdGVtOiBDbHViRHluYW1vSXRlbSk6IENsdWIge1xuICAgIHJldHVybiB7XG4gICAgICBpZDogaXRlbS5pZCxcbiAgICAgIG5hbWU6IGl0ZW0ubmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiBpdGVtLmRlc2NyaXB0aW9uLFxuICAgICAgc3RhdHVzOiBpdGVtLnN0YXR1cyxcbiAgICAgIGNpdHk6IGl0ZW0uY2l0eSxcbiAgICAgIGxvZ29Vcmw6IGl0ZW0ubG9nb1VybCxcbiAgICAgIGNyZWF0ZWRBdDogaXRlbS5jcmVhdGVkQXQsXG4gICAgICB1cGRhdGVkQXQ6IGl0ZW0udXBkYXRlZEF0LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogTWFwIGluZGV4IGl0ZW0gdG8gQ2x1YiAobWluaW1hbCBkYXRhKVxuICAgKi9cbiAgcHJpdmF0ZSBpbmRleEl0ZW1Ub0NsdWIoaXRlbTogQ2x1YkluZGV4SXRlbSk6IENsdWIge1xuICAgIHJldHVybiB7XG4gICAgICBpZDogaXRlbS5jbHViSWQsXG4gICAgICBuYW1lOiBpdGVtLm5hbWUsXG4gICAgICBzdGF0dXM6IGl0ZW0uc3RhdHVzLFxuICAgICAgY2l0eTogaXRlbS5jaXR5LFxuICAgICAgY3JlYXRlZEF0OiBpdGVtLmNyZWF0ZWRBdCxcbiAgICAgIHVwZGF0ZWRBdDogaXRlbS51cGRhdGVkQXQsXG4gICAgICAvLyBOb3RlOiBkZXNjcmlwdGlvbiBhbmQgbG9nb1VybCBhcmUgbm90IGluIGluZGV4IGl0ZW1zXG4gICAgICAvLyBUaGV5IHdvdWxkIG5lZWQgdG8gYmUgZmV0Y2hlZCBzZXBhcmF0ZWx5IGlmIG5lZWRlZFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogRW5jb2RlIGN1cnNvciBmb3IgcGFnaW5hdGlvblxuICAgKi9cbiAgcHJpdmF0ZSBlbmNvZGVDdXJzb3IoY3Vyc29yOiBDbHViQ3Vyc29yKTogc3RyaW5nIHtcbiAgICBjb25zdCBjdXJzb3JEYXRhID0gSlNPTi5zdHJpbmdpZnkoY3Vyc29yKTtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20oY3Vyc29yRGF0YSkudG9TdHJpbmcoJ2Jhc2U2NCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlY29kZSBjdXJzb3IgZm9yIHBhZ2luYXRpb25cbiAgICovXG4gIHByaXZhdGUgZGVjb2RlQ3Vyc29yKGN1cnNvcjogc3RyaW5nKTogQ2x1YkN1cnNvciB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGN1cnNvckRhdGEgPSBCdWZmZXIuZnJvbShjdXJzb3IsICdiYXNlNjQnKS50b1N0cmluZygndXRmLTgnKTtcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKGN1cnNvckRhdGEpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcGFnaW5hdGlvbiBjdXJzb3InKTtcbiAgICB9XG4gIH1cbn0iXX0=