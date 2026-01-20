#!/usr/bin/env node

/**
 * Find a club the user is NOT a member of
 */

const userId = '512be5a0-f031-701c-787e-15a05bbb0ad1';

async function main() {
  const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
  const { DynamoDBDocumentClient, QueryCommand } = await import('@aws-sdk/lib-dynamodb');
  
  const client = new DynamoDBClient({ region: 'us-east-2' });
  const docClient = DynamoDBDocumentClient.from(client);
  
  // Get all clubs
  const clubsResult = await docClient.send(new QueryCommand({
    TableName: 'sydney-cycles-main-development',
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: {
      ':pk': 'CLUBS',
    },
  }));
  
  const allClubs = clubsResult.Items || [];
  console.log(`\n📋 Total clubs: ${allClubs.length}`);
  
  // Get user's memberships
  const membershipsResult = await docClient.send(new QueryCommand({
    TableName: 'sydney-cycles-main-development',
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
    },
  }));
  
  const memberships = (membershipsResult.Items || []).filter(item => 
    item.SK && item.SK.startsWith('MEMBERSHIP#')
  );
  
  const memberClubIds = memberships.map(m => m.clubId);
  console.log(`\n👤 User memberships: ${memberships.length}`);
  console.log(`   Member of: ${memberClubIds.join(', ')}`);
  
  // Find clubs user is NOT a member of
  const availableClubs = allClubs.filter(club => 
    !memberClubIds.includes(club.id) && club.status === 'active'
  );
  
  console.log(`\n✅ Available clubs to join: ${availableClubs.length}`);
  
  if (availableClubs.length > 0) {
    console.log('\n🎯 You can join these clubs:');
    availableClubs.forEach(club => {
      console.log(`   - ${club.name} (${club.id})`);
    });
    console.log(`\n💡 Try joining: ${availableClubs[0].name}`);
  } else {
    console.log('\n⚠️  You are already a member of all clubs!');
    console.log('   You need to leave a club first before testing join.');
  }
}

main().catch(console.error);
