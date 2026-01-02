"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBParticipationRepository = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const participation_1 = require("../domain/participation/participation");
const participation_2 = require("../../../shared/types/participation");
class DynamoDBParticipationRepository {
    constructor(dynamoClient, tableName) {
        this.docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
        this.tableName = tableName;
    }
    async create(participation) {
        const participationData = participation.toJSON();
        const now = new Date().toISOString();
        const items = [
            // Main participation item
            {
                Put: {
                    TableName: this.tableName,
                    Item: {
                        PK: `RIDE#${participationData.rideId}`,
                        SK: `PARTICIPANT#${participationData.userId}`,
                        entityType: 'RIDE_PARTICIPATION',
                        ...participationData
                    }
                }
            },
            // User ride index item
            {
                Put: {
                    TableName: this.tableName,
                    Item: {
                        PK: `USER#${participationData.userId}`,
                        SK: `RIDE#${participationData.rideId}`,
                        GSI1PK: `USER#${participationData.userId}`,
                        GSI1SK: `RIDE#${participationData.rideId}`,
                        entityType: 'USER_RIDE',
                        participationId: participationData.participationId,
                        rideId: participationData.rideId,
                        clubId: participationData.clubId,
                        role: participationData.role,
                        status: participationData.status,
                        joinedAt: participationData.joinedAt
                    }
                }
            }
        ];
        await this.docClient.send(new lib_dynamodb_1.TransactWriteCommand({ TransactItems: items }));
    }
    async findById(participationId) {
        // We need to scan for participation by ID since it's not in the key
        // In a real implementation, you might want to add a GSI for this
        const result = await this.docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: this.tableName,
            FilterExpression: 'participationId = :participationId',
            ExpressionAttributeValues: {
                ':participationId': participationId
            }
        }));
        if (!result.Items || result.Items.length === 0) {
            return null;
        }
        return new participation_1.ParticipationEntity(result.Items[0]);
    }
    async findByRideAndUser(rideId, userId) {
        const result = await this.docClient.send(new lib_dynamodb_1.GetCommand({
            TableName: this.tableName,
            Key: {
                PK: `RIDE#${rideId}`,
                SK: `PARTICIPANT#${userId}`
            }
        }));
        if (!result.Item) {
            return null;
        }
        return new participation_1.ParticipationEntity(result.Item);
    }
    async findByRideId(rideId) {
        const result = await this.docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': `RIDE#${rideId}`,
                ':sk': 'PARTICIPANT#'
            }
        }));
        if (!result.Items) {
            return [];
        }
        return result.Items.map(item => new participation_1.ParticipationEntity(item));
    }
    async findByUserId(userId, query) {
        const queryParams = {
            TableName: this.tableName,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
                ':sk': 'RIDE#'
            },
            Limit: query.limit || 20,
            ScanIndexForward: false // Most recent first
        };
        if (query.cursor) {
            queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(query.cursor, 'base64').toString());
        }
        // Add filtering
        const filterExpressions = [];
        if (query.role) {
            filterExpressions.push('#role = :role');
            queryParams.ExpressionAttributeNames = { '#role': 'role' };
            queryParams.ExpressionAttributeValues[':role'] = query.role;
        }
        if (query.status) {
            filterExpressions.push('#status = :status');
            queryParams.ExpressionAttributeNames = {
                ...queryParams.ExpressionAttributeNames,
                '#status': 'status'
            };
            queryParams.ExpressionAttributeValues[':status'] = query.status;
        }
        if (filterExpressions.length > 0) {
            queryParams.FilterExpression = filterExpressions.join(' AND ');
        }
        const result = await this.docClient.send(new lib_dynamodb_1.QueryCommand(queryParams));
        // Transform to UserRideInfo (in real implementation, you'd join with ride data)
        const rides = [];
        if (result.Items) {
            for (const item of result.Items) {
                // Get full ride details
                const rideResult = await this.docClient.send(new lib_dynamodb_1.QueryCommand({
                    TableName: this.tableName,
                    IndexName: 'GSI1',
                    KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
                    ExpressionAttributeValues: {
                        ':pk': `RIDE#${item.rideId}`,
                        ':sk': 'METADATA'
                    }
                }));
                if (rideResult.Items && rideResult.Items.length > 0) {
                    const rideData = rideResult.Items[0];
                    // Get club name (simplified - in real implementation you'd cache this)
                    const clubResult = await this.docClient.send(new lib_dynamodb_1.GetCommand({
                        TableName: this.tableName,
                        Key: {
                            PK: `CLUB#${item.clubId}`,
                            SK: 'METADATA'
                        }
                    }));
                    const clubName = clubResult.Item?.name || 'Unknown Club';
                    rides.push({
                        participationId: item.participationId,
                        rideId: item.rideId,
                        clubId: item.clubId,
                        clubName,
                        title: rideData.title,
                        rideType: rideData.rideType,
                        difficulty: rideData.difficulty,
                        startDateTime: rideData.startDateTime,
                        role: item.role,
                        status: item.status,
                        joinedAt: item.joinedAt
                    });
                }
            }
        }
        let nextCursor;
        if (result.LastEvaluatedKey) {
            nextCursor = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
        }
        return { rides, nextCursor };
    }
    async update(participation) {
        const participationData = participation.toJSON();
        const items = [
            // Update main participation item
            {
                Put: {
                    TableName: this.tableName,
                    Item: {
                        PK: `RIDE#${participationData.rideId}`,
                        SK: `PARTICIPANT#${participationData.userId}`,
                        entityType: 'RIDE_PARTICIPATION',
                        ...participationData
                    }
                }
            },
            // Update user ride index item
            {
                Put: {
                    TableName: this.tableName,
                    Item: {
                        PK: `USER#${participationData.userId}`,
                        SK: `RIDE#${participationData.rideId}`,
                        GSI1PK: `USER#${participationData.userId}`,
                        GSI1SK: `RIDE#${participationData.rideId}`,
                        entityType: 'USER_RIDE',
                        participationId: participationData.participationId,
                        rideId: participationData.rideId,
                        clubId: participationData.clubId,
                        role: participationData.role,
                        status: participationData.status,
                        joinedAt: participationData.joinedAt
                    }
                }
            }
        ];
        await this.docClient.send(new lib_dynamodb_1.TransactWriteCommand({ TransactItems: items }));
    }
    async delete(participationId) {
        // First find the participation to get keys
        const participation = await this.findById(participationId);
        if (!participation) {
            return; // Already deleted
        }
        const participationData = participation.toJSON();
        const items = [
            // Delete main participation item
            {
                Delete: {
                    TableName: this.tableName,
                    Key: {
                        PK: `RIDE#${participationData.rideId}`,
                        SK: `PARTICIPANT#${participationData.userId}`
                    }
                }
            },
            // Delete user ride index item
            {
                Delete: {
                    TableName: this.tableName,
                    Key: {
                        PK: `USER#${participationData.userId}`,
                        SK: `RIDE#${participationData.rideId}`
                    }
                }
            }
        ];
        await this.docClient.send(new lib_dynamodb_1.TransactWriteCommand({ TransactItems: items }));
    }
    async getWaitlistPosition(rideId) {
        const result = await this.docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            FilterExpression: '#status = :status',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':pk': `RIDE#${rideId}`,
                ':sk': 'PARTICIPANT#',
                ':status': participation_2.ParticipationStatus.WAITLISTED
            }
        }));
        return result.Items?.length || 0;
    }
}
exports.DynamoDBParticipationRepository = DynamoDBParticipationRepository;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHluYW1vZGItcGFydGljaXBhdGlvbi1yZXBvc2l0b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZHluYW1vZGItcGFydGljaXBhdGlvbi1yZXBvc2l0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHdEQVErQjtBQUMvQix5RUFBNEU7QUFPNUUsdUVBQThGO0FBRTlGLE1BQWEsK0JBQStCO0lBSTFDLFlBQVksWUFBNEIsRUFBRSxTQUFpQjtRQUN6RCxJQUFJLENBQUMsU0FBUyxHQUFHLHFDQUFzQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMzRCxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztJQUM3QixDQUFDO0lBRUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxhQUFrQztRQUM3QyxNQUFNLGlCQUFpQixHQUFHLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNqRCxNQUFNLEdBQUcsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRXJDLE1BQU0sS0FBSyxHQUFHO1lBQ1osMEJBQTBCO1lBQzFCO2dCQUNFLEdBQUcsRUFBRTtvQkFDSCxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7b0JBQ3pCLElBQUksRUFBRTt3QkFDSixFQUFFLEVBQUUsUUFBUSxpQkFBaUIsQ0FBQyxNQUFNLEVBQUU7d0JBQ3RDLEVBQUUsRUFBRSxlQUFlLGlCQUFpQixDQUFDLE1BQU0sRUFBRTt3QkFDN0MsVUFBVSxFQUFFLG9CQUFvQjt3QkFDaEMsR0FBRyxpQkFBaUI7cUJBQ3JCO2lCQUNGO2FBQ0Y7WUFDRCx1QkFBdUI7WUFDdkI7Z0JBQ0UsR0FBRyxFQUFFO29CQUNILFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztvQkFDekIsSUFBSSxFQUFFO3dCQUNKLEVBQUUsRUFBRSxRQUFRLGlCQUFpQixDQUFDLE1BQU0sRUFBRTt3QkFDdEMsRUFBRSxFQUFFLFFBQVEsaUJBQWlCLENBQUMsTUFBTSxFQUFF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QUFDLEtBQUssRUFBRSxNQUFNLElBQUksQ0FBQyxDQUFDO0lBQ25DLENBQUM7Q0FDRjtBQTlSRCwwRUE4UkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEeW5hbW9EQkNsaWVudCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYic7XG5pbXBvcnQgeyBcbiAgRHluYW1vREJEb2N1bWVudENsaWVudCwgXG4gIFB1dENvbW1hbmQsIFxuICBHZXRDb21tYW5kLCBcbiAgUXVlcnlDb21tYW5kLCBcbiAgVXBkYXRlQ29tbWFuZCxcbiAgRGVsZXRlQ29tbWFuZCxcbiAgVHJhbnNhY3RXcml0ZUNvbW1hbmRcbn0gZnJvbSAnQGF3cy1zZGsvbGliLWR5bmFtb2RiJztcbmltcG9ydCB7IFBhcnRpY2lwYXRpb25FbnRpdHkgfSBmcm9tICcuLi9kb21haW4vcGFydGljaXBhdGlvbi9wYXJ0aWNpcGF0aW9uJztcbmltcG9ydCB7IFxuICBQYXJ0aWNpcGF0aW9uUmVwb3NpdG9yeSwgXG4gIFBhZ2luYXRlZFBhcnRpY2lwYXRpb25zLFxuICBVc2VyUmlkZUluZm8sXG4gIFBhZ2luYXRlZFVzZXJSaWRlcyBcbn0gZnJvbSAnLi4vZG9tYWluL3BhcnRpY2lwYXRpb24vcGFydGljaXBhdGlvbi1yZXBvc2l0b3J5JztcbmltcG9ydCB7IExpc3RVc2VyUmlkZXNRdWVyeSwgUGFydGljaXBhdGlvblN0YXR1cyB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC90eXBlcy9wYXJ0aWNpcGF0aW9uJztcblxuZXhwb3J0IGNsYXNzIER5bmFtb0RCUGFydGljaXBhdGlvblJlcG9zaXRvcnkgaW1wbGVtZW50cyBQYXJ0aWNpcGF0aW9uUmVwb3NpdG9yeSB7XG4gIHByaXZhdGUgZG9jQ2xpZW50OiBEeW5hbW9EQkRvY3VtZW50Q2xpZW50O1xuICBwcml2YXRlIHRhYmxlTmFtZTogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKGR5bmFtb0NsaWVudDogRHluYW1vREJDbGllbnQsIHRhYmxlTmFtZTogc3RyaW5nKSB7XG4gICAgdGhpcy5kb2NDbGllbnQgPSBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LmZyb20oZHluYW1vQ2xpZW50KTtcbiAgICB0aGlzLnRhYmxlTmFtZSA9IHRhYmxlTmFtZTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZShwYXJ0aWNpcGF0aW9uOiBQYXJ0aWNpcGF0aW9uRW50aXR5KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgcGFydGljaXBhdGlvbkRhdGEgPSBwYXJ0aWNpcGF0aW9uLnRvSlNPTigpO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcblxuICAgIGNvbnN0IGl0ZW1zID0gW1xuICAgICAgLy8gTWFpbiBwYXJ0aWNpcGF0aW9uIGl0ZW1cbiAgICAgIHtcbiAgICAgICAgUHV0OiB7XG4gICAgICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgICAgICBJdGVtOiB7XG4gICAgICAgICAgICBQSzogYFJJREUjJHtwYXJ0aWNpcGF0aW9uRGF0YS5yaWRlSWR9YCxcbiAgICAgICAgICAgIFNLOiBgUEFSVElDSVBBTlQjJHtwYXJ0aWNpcGF0aW9uRGF0YS51c2VySWR9YCxcbiAgICAgICAgICAgIGVudGl0eVR5cGU6ICdSSURFX1BBUlRJQ0lQQVRJT04nLFxuICAgICAgICAgICAgLi4ucGFydGljaXBhdGlvbkRhdGFcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAvLyBVc2VyIHJpZGUgaW5kZXggaXRlbVxuICAgICAge1xuICAgICAgICBQdXQ6IHtcbiAgICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICAgIEl0ZW06IHtcbiAgICAgICAgICAgIFBLOiBgVVNFUiMke3BhcnRpY2lwYXRpb25EYXRhLnVzZXJJZH1gLFxuICAgICAgICAgICAgU0s6IGBSSURFIyR7cGFydGljaXBhdGlvbkRhdGEucmlkZUlkfWAsXG4gICAgICAgICAgICBHU0kxUEs6IGBVU0VSIyR7cGFydGljaXBhdGlvbkRhdGEudXNlcklkfWAsXG4gICAgICAgICAgICBHU0kxU0s6IGBSSURFIyR7cGFydGljaXBhdGlvbkRhdGEucmlkZUlkfWAsXG4gICAgICAgICAgICBlbnRpdHlUeXBlOiAnVVNFUl9SSURFJyxcbiAgICAgICAgICAgIHBhcnRpY2lwYXRpb25JZDogcGFydGljaXBhdGlvbkRhdGEucGFydGljaXBhdGlvbklkLFxuICAgICAgICAgICAgcmlkZUlkOiBwYXJ0aWNpcGF0aW9uRGF0YS5yaWRlSWQsXG4gICAgICAgICAgICBjbHViSWQ6IHBhcnRpY2lwYXRpb25EYXRhLmNsdWJJZCxcbiAgICAgICAgICAgIHJvbGU6IHBhcnRpY2lwYXRpb25EYXRhLnJvbGUsXG4gICAgICAgICAgICBzdGF0dXM6IHBhcnRpY2lwYXRpb25EYXRhLnN0YXR1cyxcbiAgICAgICAgICAgIGpvaW5lZEF0OiBwYXJ0aWNpcGF0aW9uRGF0YS5qb2luZWRBdFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIF07XG5cbiAgICBhd2FpdCB0aGlzLmRvY0NsaWVudC5zZW5kKG5ldyBUcmFuc2FjdFdyaXRlQ29tbWFuZCh7IFRyYW5zYWN0SXRlbXM6IGl0ZW1zIH0pKTtcbiAgfVxuXG4gIGFzeW5jIGZpbmRCeUlkKHBhcnRpY2lwYXRpb25JZDogc3RyaW5nKTogUHJvbWlzZTxQYXJ0aWNpcGF0aW9uRW50aXR5IHwgbnVsbD4ge1xuICAgIC8vIFdlIG5lZWQgdG8gc2NhbiBmb3IgcGFydGljaXBhdGlvbiBieSBJRCBzaW5jZSBpdCdzIG5vdCBpbiB0aGUga2V5XG4gICAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB5b3UgbWlnaHQgd2FudCB0byBhZGQgYSBHU0kgZm9yIHRoaXNcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmRvY0NsaWVudC5zZW5kKG5ldyBRdWVyeUNvbW1hbmQoe1xuICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgIEZpbHRlckV4cHJlc3Npb246ICdwYXJ0aWNpcGF0aW9uSWQgPSA6cGFydGljaXBhdGlvbklkJyxcbiAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IHtcbiAgICAgICAgJzpwYXJ0aWNpcGF0aW9uSWQnOiBwYXJ0aWNpcGF0aW9uSWRcbiAgICAgIH1cbiAgICB9KSk7XG5cbiAgICBpZiAoIXJlc3VsdC5JdGVtcyB8fCByZXN1bHQuSXRlbXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFBhcnRpY2lwYXRpb25FbnRpdHkocmVzdWx0Lkl0ZW1zWzBdIGFzIGFueSk7XG4gIH1cblxuICBhc3luYyBmaW5kQnlSaWRlQW5kVXNlcihyaWRlSWQ6IHN0cmluZywgdXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPFBhcnRpY2lwYXRpb25FbnRpdHkgfCBudWxsPiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5kb2NDbGllbnQuc2VuZChuZXcgR2V0Q29tbWFuZCh7XG4gICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgS2V5OiB7XG4gICAgICAgIFBLOiBgUklERSMke3JpZGVJZH1gLFxuICAgICAgICBTSzogYFBBUlRJQ0lQQU5UIyR7dXNlcklkfWBcbiAgICAgIH1cbiAgICB9KSk7XG5cbiAgICBpZiAoIXJlc3VsdC5JdGVtKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFBhcnRpY2lwYXRpb25FbnRpdHkocmVzdWx0Lkl0ZW0gYXMgYW55KTtcbiAgfVxuXG4gIGFzeW5jIGZpbmRCeVJpZGVJZChyaWRlSWQ6IHN0cmluZyk6IFByb21pc2U8UGFydGljaXBhdGlvbkVudGl0eVtdPiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5kb2NDbGllbnQuc2VuZChuZXcgUXVlcnlDb21tYW5kKHtcbiAgICAgIFRhYmxlTmFtZTogdGhpcy50YWJsZU5hbWUsXG4gICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiAnUEsgPSA6cGsgQU5EIGJlZ2luc193aXRoKFNLLCA6c2spJyxcbiAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IHtcbiAgICAgICAgJzpwayc6IGBSSURFIyR7cmlkZUlkfWAsXG4gICAgICAgICc6c2snOiAnUEFSVElDSVBBTlQjJ1xuICAgICAgfVxuICAgIH0pKTtcblxuICAgIGlmICghcmVzdWx0Lkl0ZW1zKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdC5JdGVtcy5tYXAoaXRlbSA9PiBuZXcgUGFydGljaXBhdGlvbkVudGl0eShpdGVtIGFzIGFueSkpO1xuICB9XG5cbiAgYXN5bmMgZmluZEJ5VXNlcklkKHVzZXJJZDogc3RyaW5nLCBxdWVyeTogTGlzdFVzZXJSaWRlc1F1ZXJ5KTogUHJvbWlzZTxQYWdpbmF0ZWRVc2VyUmlkZXM+IHtcbiAgICBjb25zdCBxdWVyeVBhcmFtczogYW55ID0ge1xuICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgIEluZGV4TmFtZTogJ0dTSTEnLFxuICAgICAgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbjogJ0dTSTFQSyA9IDpwayBBTkQgYmVnaW5zX3dpdGgoR1NJMVNLLCA6c2spJyxcbiAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IHtcbiAgICAgICAgJzpwayc6IGBVU0VSIyR7dXNlcklkfWAsXG4gICAgICAgICc6c2snOiAnUklERSMnXG4gICAgICB9LFxuICAgICAgTGltaXQ6IHF1ZXJ5LmxpbWl0IHx8IDIwLFxuICAgICAgU2NhbkluZGV4Rm9yd2FyZDogZmFsc2UgLy8gTW9zdCByZWNlbnQgZmlyc3RcbiAgICB9O1xuXG4gICAgaWYgKHF1ZXJ5LmN1cnNvcikge1xuICAgICAgcXVlcnlQYXJhbXMuRXhjbHVzaXZlU3RhcnRLZXkgPSBKU09OLnBhcnNlKEJ1ZmZlci5mcm9tKHF1ZXJ5LmN1cnNvciwgJ2Jhc2U2NCcpLnRvU3RyaW5nKCkpO1xuICAgIH1cblxuICAgIC8vIEFkZCBmaWx0ZXJpbmdcbiAgICBjb25zdCBmaWx0ZXJFeHByZXNzaW9uczogc3RyaW5nW10gPSBbXTtcbiAgICBpZiAocXVlcnkucm9sZSkge1xuICAgICAgZmlsdGVyRXhwcmVzc2lvbnMucHVzaCgnI3JvbGUgPSA6cm9sZScpO1xuICAgICAgcXVlcnlQYXJhbXMuRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzID0geyAnI3JvbGUnOiAncm9sZScgfTtcbiAgICAgIHF1ZXJ5UGFyYW1zLkV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXNbJzpyb2xlJ10gPSBxdWVyeS5yb2xlO1xuICAgIH1cbiAgICBpZiAocXVlcnkuc3RhdHVzKSB7XG4gICAgICBmaWx0ZXJFeHByZXNzaW9ucy5wdXNoKCcjc3RhdHVzID0gOnN0YXR1cycpO1xuICAgICAgcXVlcnlQYXJhbXMuRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzID0geyBcbiAgICAgICAgLi4ucXVlcnlQYXJhbXMuRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzLFxuICAgICAgICAnI3N0YXR1cyc6ICdzdGF0dXMnIFxuICAgICAgfTtcbiAgICAgIHF1ZXJ5UGFyYW1zLkV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXNbJzpzdGF0dXMnXSA9IHF1ZXJ5LnN0YXR1cztcbiAgICB9XG5cbiAgICBpZiAoZmlsdGVyRXhwcmVzc2lvbnMubGVuZ3RoID4gMCkge1xuICAgICAgcXVlcnlQYXJhbXMuRmlsdGVyRXhwcmVzc2lvbiA9IGZpbHRlckV4cHJlc3Npb25zLmpvaW4oJyBBTkQgJyk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5kb2NDbGllbnQuc2VuZChuZXcgUXVlcnlDb21tYW5kKHF1ZXJ5UGFyYW1zKSk7XG5cbiAgICAvLyBUcmFuc2Zvcm0gdG8gVXNlclJpZGVJbmZvIChpbiByZWFsIGltcGxlbWVudGF0aW9uLCB5b3UnZCBqb2luIHdpdGggcmlkZSBkYXRhKVxuICAgIGNvbnN0IHJpZGVzOiBVc2VyUmlkZUluZm9bXSA9IFtdO1xuICAgIGlmIChyZXN1bHQuSXRlbXMpIHtcbiAgICAgIGZvciAoY29uc3QgaXRlbSBvZiByZXN1bHQuSXRlbXMpIHtcbiAgICAgICAgLy8gR2V0IGZ1bGwgcmlkZSBkZXRhaWxzXG4gICAgICAgIGNvbnN0IHJpZGVSZXN1bHQgPSBhd2FpdCB0aGlzLmRvY0NsaWVudC5zZW5kKG5ldyBRdWVyeUNvbW1hbmQoe1xuICAgICAgICAgIFRhYmxlTmFtZTogdGhpcy50YWJsZU5hbWUsXG4gICAgICAgICAgSW5kZXhOYW1lOiAnR1NJMScsXG4gICAgICAgICAgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbjogJ0dTSTFQSyA9IDpwayBBTkQgR1NJMVNLID0gOnNrJyxcbiAgICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAgICAgICAnOnBrJzogYFJJREUjJHtpdGVtLnJpZGVJZH1gLFxuICAgICAgICAgICAgJzpzayc6ICdNRVRBREFUQSdcbiAgICAgICAgICB9XG4gICAgICAgIH0pKTtcblxuICAgICAgICBpZiAocmlkZVJlc3VsdC5JdGVtcyAmJiByaWRlUmVzdWx0Lkl0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBjb25zdCByaWRlRGF0YSA9IHJpZGVSZXN1bHQuSXRlbXNbMF07XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gR2V0IGNsdWIgbmFtZSAoc2ltcGxpZmllZCAtIGluIHJlYWwgaW1wbGVtZW50YXRpb24geW91J2QgY2FjaGUgdGhpcylcbiAgICAgICAgICBjb25zdCBjbHViUmVzdWx0ID0gYXdhaXQgdGhpcy5kb2NDbGllbnQuc2VuZChuZXcgR2V0Q29tbWFuZCh7XG4gICAgICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICAgICAgS2V5OiB7XG4gICAgICAgICAgICAgIFBLOiBgQ0xVQiMke2l0ZW0uY2x1YklkfWAsXG4gICAgICAgICAgICAgIFNLOiAnTUVUQURBVEEnXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgY29uc3QgY2x1Yk5hbWUgPSBjbHViUmVzdWx0Lkl0ZW0/Lm5hbWUgfHwgJ1Vua25vd24gQ2x1Yic7XG5cbiAgICAgICAgICByaWRlcy5wdXNoKHtcbiAgICAgICAgICAgIHBhcnRpY2lwYXRpb25JZDogaXRlbS5wYXJ0aWNpcGF0aW9uSWQsXG4gICAgICAgICAgICByaWRlSWQ6IGl0ZW0ucmlkZUlkLFxuICAgICAgICAgICAgY2x1YklkOiBpdGVtLmNsdWJJZCxcbiAgICAgICAgICAgIGNsdWJOYW1lLFxuICAgICAgICAgICAgdGl0bGU6IHJpZGVEYXRhLnRpdGxlLFxuICAgICAgICAgICAgcmlkZVR5cGU6IHJpZGVEYXRhLnJpZGVUeXBlLFxuICAgICAgICAgICAgZGlmZmljdWx0eTogcmlkZURhdGEuZGlmZmljdWx0eSxcbiAgICAgICAgICAgIHN0YXJ0RGF0ZVRpbWU6IHJpZGVEYXRhLnN0YXJ0RGF0ZVRpbWUsXG4gICAgICAgICAgICByb2xlOiBpdGVtLnJvbGUsXG4gICAgICAgICAgICBzdGF0dXM6IGl0ZW0uc3RhdHVzLFxuICAgICAgICAgICAgam9pbmVkQXQ6IGl0ZW0uam9pbmVkQXRcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBuZXh0Q3Vyc29yOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgaWYgKHJlc3VsdC5MYXN0RXZhbHVhdGVkS2V5KSB7XG4gICAgICBuZXh0Q3Vyc29yID0gQnVmZmVyLmZyb20oSlNPTi5zdHJpbmdpZnkocmVzdWx0Lkxhc3RFdmFsdWF0ZWRLZXkpKS50b1N0cmluZygnYmFzZTY0Jyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgcmlkZXMsIG5leHRDdXJzb3IgfTtcbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZShwYXJ0aWNpcGF0aW9uOiBQYXJ0aWNpcGF0aW9uRW50aXR5KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgcGFydGljaXBhdGlvbkRhdGEgPSBwYXJ0aWNpcGF0aW9uLnRvSlNPTigpO1xuXG4gICAgY29uc3QgaXRlbXMgPSBbXG4gICAgICAvLyBVcGRhdGUgbWFpbiBwYXJ0aWNpcGF0aW9uIGl0ZW1cbiAgICAgIHtcbiAgICAgICAgUHV0OiB7XG4gICAgICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgICAgICBJdGVtOiB7XG4gICAgICAgICAgICBQSzogYFJJREUjJHtwYXJ0aWNpcGF0aW9uRGF0YS5yaWRlSWR9YCxcbiAgICAgICAgICAgIFNLOiBgUEFSVElDSVBBTlQjJHtwYXJ0aWNpcGF0aW9uRGF0YS51c2VySWR9YCxcbiAgICAgICAgICAgIGVudGl0eVR5cGU6ICdSSURFX1BBUlRJQ0lQQVRJT04nLFxuICAgICAgICAgICAgLi4ucGFydGljaXBhdGlvbkRhdGFcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAvLyBVcGRhdGUgdXNlciByaWRlIGluZGV4IGl0ZW1cbiAgICAgIHtcbiAgICAgICAgUHV0OiB7XG4gICAgICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgICAgICBJdGVtOiB7XG4gICAgICAgICAgICBQSzogYFVTRVIjJHtwYXJ0aWNpcGF0aW9uRGF0YS51c2VySWR9YCxcbiAgICAgICAgICAgIFNLOiBgUklERSMke3BhcnRpY2lwYXRpb25EYXRhLnJpZGVJZH1gLFxuICAgICAgICAgICAgR1NJMVBLOiBgVVNFUiMke3BhcnRpY2lwYXRpb25EYXRhLnVzZXJJZH1gLFxuICAgICAgICAgICAgR1NJMVNLOiBgUklERSMke3BhcnRpY2lwYXRpb25EYXRhLnJpZGVJZH1gLFxuICAgICAgICAgICAgZW50aXR5VHlwZTogJ1VTRVJfUklERScsXG4gICAgICAgICAgICBwYXJ0aWNpcGF0aW9uSWQ6IHBhcnRpY2lwYXRpb25EYXRhLnBhcnRpY2lwYXRpb25JZCxcbiAgICAgICAgICAgIHJpZGVJZDogcGFydGljaXBhdGlvbkRhdGEucmlkZUlkLFxuICAgICAgICAgICAgY2x1YklkOiBwYXJ0aWNpcGF0aW9uRGF0YS5jbHViSWQsXG4gICAgICAgICAgICByb2xlOiBwYXJ0aWNpcGF0aW9uRGF0YS5yb2xlLFxuICAgICAgICAgICAgc3RhdHVzOiBwYXJ0aWNpcGF0aW9uRGF0YS5zdGF0dXMsXG4gICAgICAgICAgICBqb2luZWRBdDogcGFydGljaXBhdGlvbkRhdGEuam9pbmVkQXRcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBdO1xuXG4gICAgYXdhaXQgdGhpcy5kb2NDbGllbnQuc2VuZChuZXcgVHJhbnNhY3RXcml0ZUNvbW1hbmQoeyBUcmFuc2FjdEl0ZW1zOiBpdGVtcyB9KSk7XG4gIH1cblxuICBhc3luYyBkZWxldGUocGFydGljaXBhdGlvbklkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyBGaXJzdCBmaW5kIHRoZSBwYXJ0aWNpcGF0aW9uIHRvIGdldCBrZXlzXG4gICAgY29uc3QgcGFydGljaXBhdGlvbiA9IGF3YWl0IHRoaXMuZmluZEJ5SWQocGFydGljaXBhdGlvbklkKTtcbiAgICBpZiAoIXBhcnRpY2lwYXRpb24pIHtcbiAgICAgIHJldHVybjsgLy8gQWxyZWFkeSBkZWxldGVkXG4gICAgfVxuXG4gICAgY29uc3QgcGFydGljaXBhdGlvbkRhdGEgPSBwYXJ0aWNpcGF0aW9uLnRvSlNPTigpO1xuXG4gICAgY29uc3QgaXRlbXMgPSBbXG4gICAgICAvLyBEZWxldGUgbWFpbiBwYXJ0aWNpcGF0aW9uIGl0ZW1cbiAgICAgIHtcbiAgICAgICAgRGVsZXRlOiB7XG4gICAgICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgICAgICBLZXk6IHtcbiAgICAgICAgICAgIFBLOiBgUklERSMke3BhcnRpY2lwYXRpb25EYXRhLnJpZGVJZH1gLFxuICAgICAgICAgICAgU0s6IGBQQVJUSUNJUEFOVCMke3BhcnRpY2lwYXRpb25EYXRhLnVzZXJJZH1gXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgLy8gRGVsZXRlIHVzZXIgcmlkZSBpbmRleCBpdGVtXG4gICAgICB7XG4gICAgICAgIERlbGV0ZToge1xuICAgICAgICAgIFRhYmxlTmFtZTogdGhpcy50YWJsZU5hbWUsXG4gICAgICAgICAgS2V5OiB7XG4gICAgICAgICAgICBQSzogYFVTRVIjJHtwYXJ0aWNpcGF0aW9uRGF0YS51c2VySWR9YCxcbiAgICAgICAgICAgIFNLOiBgUklERSMke3BhcnRpY2lwYXRpb25EYXRhLnJpZGVJZH1gXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgXTtcblxuICAgIGF3YWl0IHRoaXMuZG9jQ2xpZW50LnNlbmQobmV3IFRyYW5zYWN0V3JpdGVDb21tYW5kKHsgVHJhbnNhY3RJdGVtczogaXRlbXMgfSkpO1xuICB9XG5cbiAgYXN5bmMgZ2V0V2FpdGxpc3RQb3NpdGlvbihyaWRlSWQ6IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5kb2NDbGllbnQuc2VuZChuZXcgUXVlcnlDb21tYW5kKHtcbiAgICAgIFRhYmxlTmFtZTogdGhpcy50YWJsZU5hbWUsXG4gICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiAnUEsgPSA6cGsgQU5EIGJlZ2luc193aXRoKFNLLCA6c2spJyxcbiAgICAgIEZpbHRlckV4cHJlc3Npb246ICcjc3RhdHVzID0gOnN0YXR1cycsXG4gICAgICBFeHByZXNzaW9uQXR0cmlidXRlTmFtZXM6IHtcbiAgICAgICAgJyNzdGF0dXMnOiAnc3RhdHVzJ1xuICAgICAgfSxcbiAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IHtcbiAgICAgICAgJzpwayc6IGBSSURFIyR7cmlkZUlkfWAsXG4gICAgICAgICc6c2snOiAnUEFSVElDSVBBTlQjJyxcbiAgICAgICAgJzpzdGF0dXMnOiBQYXJ0aWNpcGF0aW9uU3RhdHVzLldBSVRMSVNURURcbiAgICAgIH1cbiAgICB9KSk7XG5cbiAgICByZXR1cm4gcmVzdWx0Lkl0ZW1zPy5sZW5ndGggfHwgMDtcbiAgfVxufSJdfQ==