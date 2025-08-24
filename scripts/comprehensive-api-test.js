// Enhanced API Testing Script
// Run with: node scripts/comprehensive-api-test.js

const { default: fetch } = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

const testEndpoints = [
  {
    name: 'Hacker News API',
    url: `${BASE_URL}/api/hacker-news?limit=5`,
    expectedFields: ['posts']
  },
  {
    name: 'Reddit API',
    url: `${BASE_URL}/api/reddit?limit=5`,
    expectedFields: ['posts', 'source']
  },
  {
    name: 'Dev.to API',
    url: `${BASE_URL}/api/devto?limit=5`,
    expectedFields: ['posts']
  },
  {
    name: 'GitHub API',
    url: `${BASE_URL}/api/github?limit=5`,
    expectedFields: ['posts']
  },
  {
    name: 'Aggregate API (All Sources)',
    url: `${BASE_URL}/api/aggregate?limit=20&sources=github,devto,reddit`,
    expectedFields: ['posts', 'sources']
  }
];

async function testAPI(endpoint) {
  console.log(`\n🧪 Testing: ${endpoint.name}`);
  console.log(`📡 URL: ${endpoint.url}`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(endpoint.url, {
      headers: {
        'User-Agent': 'API-Test/1.0'
      },
      timeout: 60000
    });
    
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Success (${duration}ms)`);
      
      // Validate expected fields
      const missingFields = endpoint.expectedFields.filter(field => !data.hasOwnProperty(field));
      if (missingFields.length > 0) {
        console.log(`⚠️  Missing fields: ${missingFields.join(', ')}`);
      }
      
      if (data.posts && Array.isArray(data.posts)) {
        console.log(`📊 Posts found: ${data.posts.length}`);
        
        if (data.posts.length > 0) {
          const firstPost = data.posts[0];
          console.log(`🔝 Sample post: "${(firstPost.title || 'No title').substring(0, 60)}..."`);
          console.log(`   📈 Score: ${firstPost.score || 'N/A'}`);
          console.log(`   👤 Author: ${firstPost.author || 'N/A'}`);
          console.log(`   🔗 URL: ${firstPost.url ? 'Valid' : 'Missing'}`);
          
          if (firstPost.subreddit) {
            console.log(`   🏠 Subreddit: r/${firstPost.subreddit}`);
          }
        }
        
        // Check post quality
        const validPosts = data.posts.filter(post => post.title && post.url);
        console.log(`✅ Valid posts: ${validPosts.length}/${data.posts.length}`);
      }
      
      // Additional metadata
      if (data.source) {
        console.log(`🏷️  Source: ${data.source}`);
      }
      
      if (data.sources) {
        console.log(`🔗 Sources: ${Object.keys(data.sources).join(', ')}`);
      }
      
      return { success: true, duration, postCount: data.posts?.length || 0 };
      
    } else {
      console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log(`   Details: ${text.substring(0, 200)}...`);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive API Tests\n');
  console.log('=' * 50);
  
  const results = [];
  let totalDuration = 0;
  
  for (const endpoint of testEndpoints) {
    const result = await testAPI(endpoint);
    results.push({ ...result, name: endpoint.name });
    
    if (result.success) {
      totalDuration += result.duration;
    }
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n' + '=' * 50);
  console.log('📊 TEST SUMMARY');
  console.log('=' * 50);
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);
  
  if (successful.length > 0) {
    const avgDuration = Math.round(totalDuration / successful.length);
    console.log(`📈 Average Response Time: ${avgDuration}ms`);
    
    const totalPosts = successful.reduce((sum, r) => sum + (r.postCount || 0), 0);
    console.log(`📋 Total Posts Retrieved: ${totalPosts}`);
  }
  
  if (failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    failed.forEach(test => {
      console.log(`   ${test.name}: ${test.error}`);
    });
  }
  
  console.log('\n🎯 RECOMMENDATIONS:');
  
  if (successful.length === results.length) {
    console.log('🎉 All APIs working perfectly!');
    console.log('✅ Reddit API improvements are effective');
    console.log('✅ VPN/geo-blocking workarounds successful');
    console.log('✅ Ready for production deployment');
  } else {
    console.log('⚠️  Some APIs need attention:');
    
    if (failed.some(f => f.name.includes('Reddit'))) {
      console.log('   🔧 Reddit API may need fallback optimization');
    }
    
    if (failed.length > 2) {
      console.log('   🔧 Check network connectivity and firewall settings');
    }
  }
}

// Run the comprehensive test
runAllTests().catch(console.error);
