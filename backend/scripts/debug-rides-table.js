#!/usr/bin/env node

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'sydney-cycles-main-development';

async function debugTable() {
  console.log('\n=== Debugging Rides Table ===\n');
  
  // Scan for all items
  const params = {
    TableName: TABLE_NAME
  };

  const result = await docClient.send(new ScanCommand(params));
  
  console.log(`Found ${result.Items.length} total items\n`);
  
  console.log('=== RIDE# Metadata Records ===\n');
  
  const rideMetadata = result.Items.filter(item => 
    item.PK.startsWith('RIDE#') && item.SK === 'METADATA#'
  );
  
  console.log(`Found ${rideMetadata.length} ride metadata records\n`);
  
  rideMetadata.forEach(item => {
    console.log('Ride:', {
      rideId: item.PK.replace('RIDE#', ''),
      title: item.title,
      currentParticipants: item.currentParticipants,
      maxParticipants: item.maxParticipants
    });
  });
  
  console.log('\n=== RIDE# Participation Records ===\n');
  
  const participations = result.Items.filter(item => 
    item.PK.startsWith('RIDE#') && item.SK.startsWith('PARTICIPATION#')
  );
  
  console.log(`Found ${participations.length} participation records\n`);
  
  // Group by ride
  const byRide = {};
  participations.forEach(p => {
    const rideId = p.PK.replace('RIDE#', '');
    if (!byRide[rideId]) byRide[rideId] = [];
    byRide[rideId].push(p);
  });
  
  Object.entries(byRide).forEach(([rideId, parts]) => {
    console.log(`\nRide: ${rideId}`);
    console.log(`  Total participations: ${parts.length}`);
    const statusCounts = {};
    parts.forEach(p => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    });
    console.log(`  Status breakdown:`, statusCounts);
    
    // Show details
    parts.forEach(p => {
      console.log(`    - ${p.userId}: ${p.status} (joined: ${p.joinedAt})`);
    });
  });
}

debugTable().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
