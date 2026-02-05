#!/usr/bin/env node

/**
 * Fix Participant Counts
 * 
 * Recalculates currentParticipants for all rides based on actual CONFIRMED participations
 * This fixes data inconsistencies from old withdrawn participations
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'sydney-cycles-main-development';

async function getAllRides() {
  const rides = [];
  let lastEvaluatedKey;

  do {
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: 'begins_with(PK, :pk) AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': 'RIDE#',
        ':sk': 'METADATA#'
      },
      ExclusiveStartKey: lastEvaluatedKey
    };

    const result = await docClient.send(new ScanCommand(params));
    rides.push(...result.Items);
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return rides;
}

async function getParticipationsForRide(rideId) {
  const participations = [];
  let lastEvaluatedKey;

  do {
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `RIDE#${rideId}`,
        ':sk': 'PARTICIPATION#'
      },
      ExclusiveStartKey: lastEvaluatedKey
    };

    const result = await docClient.send(new ScanCommand(params));
    participations.push(...result.Items);
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return participations;
}

async function updateRideCount(rideId, newCount) {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      PK: `RIDE#${rideId}`,
      SK: 'METADATA#'
    },
    UpdateExpression: 'SET currentParticipants = :count',
    ExpressionAttributeValues: {
      ':count': newCount
    }
  };

  await docClient.send(new UpdateCommand(params));
}

async function fixParticipantCounts() {
  console.log('\n=== Fixing Participant Counts ===\n');
  
  // Get all rides
  console.log('1. Fetching all rides...');
  const rides = await getAllRides();
  console.log(`   Found ${rides.length} rides\n`);

  let fixed = 0;
  let skipped = 0;

  for (const ride of rides) {
    const rideId = ride.PK.replace('RIDE#', '');
    const currentCount = ride.currentParticipants || 0;
    
    // Get all participations for this ride
    const participations = await getParticipationsForRide(rideId);
    
    // Count only CONFIRMED participations
    const confirmedCount = participations.filter(p => p.status === 'confirmed').length;
    
    if (currentCount !== confirmedCount) {
      console.log(`Fixing: ${ride.title || rideId}`);
      console.log(`  Current count: ${currentCount}`);
      console.log(`  Actual confirmed: ${confirmedCount}`);
      console.log(`  Total participations: ${participations.length}`);
      
      // Show breakdown
      const statusCounts = {};
      participations.forEach(p => {
        statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
      });
      console.log(`  Status breakdown:`, statusCounts);
      
      await updateRideCount(rideId, confirmedCount);
      console.log(`  ✅ Updated to ${confirmedCount}\n`);
      fixed++;
    } else {
      skipped++;
    }
  }

  console.log('========================================');
  console.log('Summary');
  console.log('========================================');
  console.log(`Total rides: ${rides.length}`);
  console.log(`Fixed: ${fixed}`);
  console.log(`Already correct: ${skipped}`);
  console.log('');
}

fixParticipantCounts().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error(error);
  process.exit(1);
});
