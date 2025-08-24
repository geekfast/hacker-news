// Reddit API Test Script
// Run with: node scripts/test-reddit-api.js

const { default: fetch } = require('node-fetch');

async function testRedditAPI() {
  console.log('🧪 Testing Reddit API endpoints...\n');
  
  const endpoints = [
    'http://localhost:3000/api/reddit?limit=3',
    'http://localhost:3000/api/aggregate'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔄 Testing: ${endpoint}`);
      const startTime = Date.now();
      
      const response = await fetch(endpoint, {
        headers: {
          'User-Agent': 'Reddit-API-Test/1.0'
        },
        timeout: 60000
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success (${duration}ms)`);
        
        if (data.posts && Array.isArray(data.posts)) {
          console.log(`   📊 Found ${data.posts.length} posts`);
          console.log(`   🏷️  Source: ${data.source || 'unknown'}`);
          
          if (data.posts.length > 0) {
            const firstPost = data.posts[0];
            console.log(`   🔝 Top post: "${firstPost.title?.substring(0, 50)}..."`);
            console.log(`   📈 Score: ${firstPost.score}`);
            console.log(`   🏠 Subreddit: ${firstPost.subreddit || 'N/A'}`);
          }
        }
      } else {
        console.log(`❌ Failed: HTTP ${response.status}`);
        const text = await response.text();
        console.log(`   Error: ${text.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
    
    console.log('');
  }
}

// Run the test
testRedditAPI().catch(console.error);
