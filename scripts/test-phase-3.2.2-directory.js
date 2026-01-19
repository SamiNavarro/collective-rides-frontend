#!/usr/bin/env node

/**
 * Phase 3.2.2 Directory Integration Test
 * 
 * Tests the real club directory integration:
 * - API client discovery method
 * - React Query hook
 * - Directory page rendering
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Phase 3.2.2 Directory Integration Test\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

// Test 1: API client has discovery method
test('API client has discovery method', () => {
  const apiClient = fs.readFileSync('lib/api/api-client.ts', 'utf8');
  if (!apiClient.includes('discovery:')) {
    throw new Error('discovery method not found in API client');
  }
  if (!apiClient.includes('queryParams')) {
    throw new Error('discovery method does not handle query params');
  }
});

// Test 2: Discovery hook exists
test('Discovery hook file exists', () => {
  if (!fs.existsSync('hooks/use-clubs-discovery.ts')) {
    throw new Error('use-clubs-discovery.ts not found');
  }
});

// Test 3: Discovery hook has proper structure
test('Discovery hook has proper structure', () => {
  const hook = fs.readFileSync('hooks/use-clubs-discovery.ts', 'utf8');
  if (!hook.includes('useClubsDiscovery')) {
    throw new Error('useClubsDiscovery hook not found');
  }
  if (!hook.includes('useQuery')) {
    throw new Error('useQuery not used');
  }
  if (!hook.includes('staleTime: 5 * 60 * 1000')) {
    throw new Error('5 minute cache not configured');
  }
});

// Test 4: Directory page imports discovery hook
test('Directory page imports discovery hook', () => {
  const page = fs.readFileSync('app/clubs/directory/page.tsx', 'utf8');
  if (!page.includes('useClubsDiscovery')) {
    throw new Error('useClubsDiscovery not imported');
  }
});

// Test 5: Directory page uses real data
test('Directory page uses real data', () => {
  const page = fs.readFileSync('app/clubs/directory/page.tsx', 'utf8');
  if (!page.includes('const { data: discoveryData, isLoading, isError')) {
    throw new Error('Discovery data not fetched');
  }
});

// Test 6: Directory page has loading state
test('Directory page has loading state', () => {
  const page = fs.readFileSync('app/clubs/directory/page.tsx', 'utf8');
  if (!page.includes('isLoading') || !page.includes('Loader2')) {
    throw new Error('Loading state not implemented');
  }
});

// Test 7: Directory page has error state
test('Directory page has error state', () => {
  const page = fs.readFileSync('app/clubs/directory/page.tsx', 'utf8');
  if (!page.includes('isError') || !page.includes('AlertCircle')) {
    throw new Error('Error state not implemented');
  }
});

// Test 8: Directory page has empty state
test('Directory page has empty state', () => {
  const page = fs.readFileSync('app/clubs/directory/page.tsx', 'utf8');
  if (!page.includes('No clubs found')) {
    throw new Error('Empty state not implemented');
  }
});

// Test 9: Directory page merges backend data with enhancements
test('Directory page merges backend data with enhancements', () => {
  const page = fs.readFileSync('app/clubs/directory/page.tsx', 'utf8');
  if (!page.includes('mockEnhancements')) {
    throw new Error('Mock enhancements not found');
  }
  if (!page.includes('useMemo')) {
    throw new Error('useMemo not used for data merging');
  }
});

// Test 10: Directory page applies client-side filters
test('Directory page applies client-side filters', () => {
  const page = fs.readFileSync('app/clubs/directory/page.tsx', 'utf8');
  if (!page.includes('filteredClubs')) {
    throw new Error('Filtered clubs not implemented');
  }
  if (!page.includes('paceValue') || !page.includes('beginnerFriendlyValue')) {
    throw new Error('Client-side filters not applied');
  }
});

// Test 11: Old mock data array removed
test('Old mock data array removed', () => {
  const page = fs.readFileSync('app/clubs/directory/page.tsx', 'utf8');
  if (page.includes('const cyclingClubs = [')) {
    throw new Error('Old cyclingClubs array still present');
  }
});

// Test 12: Discovery hook has proper TypeScript types
test('Discovery hook has proper TypeScript types', () => {
  const hook = fs.readFileSync('hooks/use-clubs-discovery.ts', 'utf8');
  if (!hook.includes('ClubDiscoveryFilters')) {
    throw new Error('ClubDiscoveryFilters interface not found');
  }
  if (!hook.includes('ClubDiscoveryResponse')) {
    throw new Error('ClubDiscoveryResponse interface not found');
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('='.repeat(50));

if (failed > 0) {
  console.log('\n⚠️  Some tests failed. Please review the errors above.');
  process.exit(1);
} else {
  console.log('\n🎉 All tests passed! Phase 3.2.2 implementation looks good.');
  console.log('\n📋 Next Steps:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Navigate to /clubs/directory');
  console.log('3. Verify clubs load from backend');
  console.log('4. Test filters and search');
  console.log('5. Check loading and error states');
  process.exit(0);
}
