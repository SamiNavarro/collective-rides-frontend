#!/usr/bin/env node

/**
 * Fix Alice's USER_MEMBERSHIP record to match CLUB_MEMBERSHIP
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'sydney-cycles-main-development';
const ALICE_USER_ID = 'b12ba510-80b1-708f-ff85-d56755c2596f';
const CLUB_ID = 'attaquercc';

async function fixUserMembership() {
  console.log('\n🔧 Fixing Alice\'s USER_MEMBERSHIP record...\n');

  try {
    const now = new Date().toISOString();
    
    // Update the USER_MEMBERSHIP record
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${ALICE_USER_ID}`,
        SK: `MEMBERSHIP#${CLUB_ID}`
      },
      UpdateExpression: 'SET #role = :role, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#role': 'role',
        '#updatedAt': 'updatedAt'
      },
      ExpressionAttributeValues: {
        ':role': 'owner',
        ':updatedAt': now
      }
    }));

    console.log('✅ USER_MEMBERSHIP record updated to owner!\n');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║       Fix Alice USER_MEMBERSHIP - Phase 3.4               ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const fixed = await fixUserMembership();

  if (fixed) {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                      SUCCESS! 🎉                           ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('Alice\'s USER_MEMBERSHIP record has been updated to owner.');
    console.log('Both CLUB_MEMBERSHIP and USER_MEMBERSHIP now show role=owner.\n');
    console.log('Refresh your browser and check My Clubs - Alice should now');
    console.log('see "Attaquer.cc" with role="owner" (no duplicate).\n');
  } else {
    console.log('❌ Failed to fix USER_MEMBERSHIP\n');
    process.exit(1);
  }
}

main();
