#!/usr/bin/env node

/**
 * Debug script to test the club API response for 'cpcc'
 * This will help us understand what data structure is being returned
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.collectiverides.com.au';

async function debugClubAPI() {
  console.log('🔍 Testing Club API for clubId: cpcc');
  console.log('📍 API URL:', API_URL);
  console.log('');

  try {
    const url = `${API_URL}/v1/clubs/cpcc`;
    console.log('🌐 Fetching:', url);
    
    const response = await fetch(url);
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('');

    const data = await response.json();
    console.log('📦 Raw response data:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    // Analyze the structure
    console.log('🔍 Data structure analysis:');
    console.log('  - Type:', typeof data);
    console.log('  - Is array?', Array.isArray(data));
    console.log('  - Keys:', Object.keys(data));
    console.log('');

    if (data.id) {
      console.log('✅ Found club.id:', data.id);
    } else {
      console.log('❌ No club.id found');
    }

    if (data.name) {
      console.log('✅ Found club.name:', data.name);
    } else {
      console.log('❌ No club.name found');
    }

    if (data.description) {
      console.log('✅ Found club.description:', data.description);
    } else {
      console.log('⚠️  No club.description found');
    }

    console.log('');
    console.log('🎯 Expected structure for ClubDetail:');
    console.log('  - id: string');
    console.log('  - name: string');
    console.log('  - description?: string');
    console.log('  - city?: string');
    console.log('  - memberCount?: number');
    console.log('  - status: "active" | "suspended" | "archived"');
    console.log('  - createdAt: string');
    console.log('  - updatedAt: string');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugClubAPI();
