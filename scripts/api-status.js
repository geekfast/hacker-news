// Simple API Status Checker
// Run with: node scripts/api-status.js

const { default: fetch } = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function quickTest() {
  console.log('🚀 Quick API Status Check\n');
  
  const tests = [
    { name: 'Reddit API', url: `${BASE_URL}/api/reddit?limit=3` },
    { name: 'Aggregate API', url: `${BASE_URL}/api/aggregate?limit=10&sources=github,reddit` }
  ];
  
  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      const response = await fetch(test.url, { timeout: 30000 });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${test.name}: ${data.posts ? data.posts.length : 0} posts`);
        
        if (data.source) {
          console.log(`   Source: ${data.source}`);
        }
      } else {
        console.log(`❌ ${test.name}: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
}

quickTest();
