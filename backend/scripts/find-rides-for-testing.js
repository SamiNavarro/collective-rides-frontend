#!/usr/bin/env node

/**
 * Find Rides for Testing
 * 
 * Finds rides that a user is NOT participating in
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'sydney-cycles-main-development';

const USER_EMAIL = process.argv[2] || 'testuser2@test.com';

async function findUserByEmail(email) {
  const params = {
    TableName: TABLE_NAME,
    FilterExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': email
    }
  };

  const result = await docClient.send(new ScanCommand(params));
  return result.Items && result.Items.length > 0 ? result.Items[0] : null;
}

async function getAllRides() {
  const params = {
    TableName: TABLE_NAME,
    FilterExpression: 'entityType = :type',
    ExpressionAttributeValues: {
      ':type': 'RIDE'
    }
  };

  const result = await docClient.send(new ScanCommand(params));
  return result.Items || [];
}

async function getUserParticipations(userId) {
  const params = {
    TableName: TABLE_NAME,
    FilterExpression: 'userId = :userId AND entityType = :type',
    ExpressionAttributeValues: {
      ':userId': userId,
      ':type': 'RIDE_PARTICIPATION'
    }
  };

  const result = await docClient.send(new ScanCommand(params));
  return result.Items || [];
}

async function findRidesForTesting() {
  console.log('\n=== Finding Rides for Testing ===\n');
  
  console.log(`Looking for user: ${USER_EMAIL}`);
  const user = await findUserByEmail(USER_EMAIL);
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  const userId = user.userId || user.PK?.replace('USER#', '');
  console.log(`✅ Found user: ${userId}\n`);
  
  console.log('Fetching all rides...');
  const allRides = await getAllRides();
  console.log(`Found ${allRides.length} total rides\n`);
  
  console.log('Fetching user participations...');
  const participations = await getUserParticipations(userId);
  const participatingRideIds = new Set(participations.map(p => p.rideId));
  console.log(`User is participating in ${participations.length} rides\n`);
  
  console.log('========================================');
  console.log('Rides Available for Testing');
  console.log('========================================\n');
  
  const availableRides = allRides.filter(ride => !participatingRideIds.has(ride.rideId));
  
  if (availableRides.length === 0) {
    console.log('❌ No rides available for testing - user is participating in all rides!');
    console.log('\nSuggestion: Create new rides or use a different test user.');
    return;
  }
  
  availableRides.forEach((ride, index) => {
    console.log(`${index + 1}. ${ride.title}`);
    console.log(`   Ride ID: ${ride.rideId}`);
    console.log(`   Club: ${ride.clubId}`);
    console.log(`   Status: ${ride.status}`);
    console.log(`   Participants: ${ride.currentParticipants} / ${ride.maxParticipants}`);
    console.log(`   URL: http://localhost:3000/clubs/${ride.clubId}/rides/${ride.rideId}`);
    console.log('');
  });
  
  console.log('========================================');
  console.log(`Total available: ${availableRides.length} rides`);
  console.log('========================================\n');
}

findRidesForTesting().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error(error);
  process.exit(1);
});
