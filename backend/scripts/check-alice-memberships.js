#!/usr/bin/env node

/**
 * Check all of Alice's membership records
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'sydney-cycles-main-development';
const ALICE_USER_ID = 'b12ba510-80b1-708f-ff85-d56755c2596f';

async function checkMemberships() {
  console.log('\n🔍 Checking Alice\'s memberships...\n');

  try {
    // Query using GSI1 to get all memberships for Alice
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${ALICE_USER_ID}`,
        ':sk': 'MEMBERSHIP#'
      }
    }));

    console.log(`Found ${result.Items.length} membership records:\n`);
    
    result.Items.forEach((item, index) => {
      console.log(`Record ${index + 1}:`);
      console.log(JSON.stringify(item, null, 2));
      console.log('');
    });

    return result.Items;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return [];
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║          Check Alice Memberships - Phase 3.4              ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  await checkMemberships();
}

main();
