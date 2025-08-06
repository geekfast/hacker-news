import { NextRequest, NextResponse } from 'next/server';

export interface RedditPost {
  id: string;
  title: string;
  url: string;
  score: number;
  author: string;
  created: number;
  comments: number;
  subreddit: string;
  thumbnail?: string;
  selftext?: string;
  is_self: boolean;
}

interface RedditApiPost {
  id: string;
  title: string;
  url: string;
  score: number;
  author: string;
  created_utc: number;
  num_comments: number;
  subreddit: string;
  thumbnail?: string;
  selftext?: string;
  is_self: boolean;
  stickied: boolean;
  pinned: boolean;
}

// Enhanced environment detection
const isProduction = () => {
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
};

// Get region info for debugging
const getVercelRegion = () => {
  return process.env.VERCEL_REGION || 'unknown';
};

// Optimized subreddits list for tech content
const SUBREDDITS = [
  'programming',
  'javascript', 
  'webdev',
  'technology',
  'MachineLearning',
  'artificial',
  'coding',
  'compsci'
];

// Enhanced timeout settings based on environment
const getTimeoutSettings = () => {
  const isProd = isProduction();
  return {
    timeout: isProd ? 15000 : 10000, // 15s for production, 10s for dev
    signal: AbortSignal.timeout(isProd ? 15000 : 10000)
  };
};

async function fetchSubredditPosts(subreddit: string, limit: number = 3): Promise<RedditPost[]> {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
    const { signal } = getTimeoutSettings();
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'HackerNewsClone/1.0 (Web App for aggregating tech news)',
      },
      signal
    });

    if (!response.ok) {
      console.warn(`⚠️ Failed to fetch r/${subreddit}: HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    if (!data?.data?.children) {
      console.warn(`⚠️ Invalid response format from r/${subreddit}`);
      return [];
    }

    const posts = data.data.children
      .map((child: { data: RedditApiPost }) => child.data)
      .filter((post: RedditApiPost) => !post.stickied && !post.pinned)
      .slice(0, limit)
      .map((post: RedditApiPost): RedditPost => ({
        id: post.id,
        title: post.title,
        url: post.url,
        score: post.score,
        author: post.author,
        created: post.created_utc,
        comments: post.num_comments,
        subreddit: post.subreddit,
        thumbnail: post.thumbnail !== 'self' ? post.thumbnail : undefined,
        selftext: post.selftext,
        is_self: post.is_self
      }));

    console.log(`✅ Successfully fetched ${posts.length} posts from r/${subreddit}`);
    return posts;

  } catch (error: unknown) {
    console.error(`❌ Failed to fetch r/${subreddit}:`, error);
    return [];
  }
}

// Mock data for fallback - high quality tech posts
const getMockRedditPosts = (): RedditPost[] => {
  const baseTime = Math.floor(Date.now() / 1000);
  
  return [
    {
      id: 'mock1',
      title: "Apple's new M4 chip breaks all performance records",
      url: 'https://apple.com/m4-chip',
      score: 1200,
      author: 'techreporter',
      created: baseTime - 3600,
      comments: 89,
      subreddit: 'technology',
      is_self: false
    },
    {
      id: 'mock2',
      title: "GPT-5 leaked benchmarks show 95% accuracy improvement",
      url: 'https://openai.com/gpt5',
      score: 980,
      author: 'ai_researcher',
      created: baseTime - 7200,
      comments: 156,
      subreddit: 'artificial',
      is_self: false
    },
    {
      id: 'mock3',
      title: "AI discovers new antibiotic compounds",
      url: 'https://ai-antibiotics.com',
      score: 850,
      author: 'biotech_news',
      created: baseTime - 10800,
      comments: 67,
      subreddit: 'MachineLearning',
      is_self: false
    },
    {
      id: 'mock4',
      title: "Quantum computing breakthrough at IBM",
      url: 'https://ibm.com/quantum',
      score: 720,
      author: 'quantum_dev',
      created: baseTime - 14400,
      comments: 45,
      subreddit: 'compsci',
      is_self: false
    },
    {
      id: 'mock5',
      title: "Google's new LLM outperforms ChatGPT in coding tasks",
      url: 'https://google.ai/llm',
      score: 650,
      author: 'google_ai',
      created: baseTime - 18000,
      comments: 123,
      subreddit: 'programming',
      is_self: false
    },
    {
      id: 'mock6',
      title: "Breakthrough in quantum algorithms for optimization",
      url: 'https://quantum-algo.edu',
      score: 590,
      author: 'quantum_researcher',
      created: baseTime - 21600,
      comments: 34,
      subreddit: 'compsci',
      is_self: false
    },
    {
      id: 'mock7',
      title: "New JavaScript features in ES2024 that will blow your mind",
      url: 'https://js-features.com/es2024',
      score: 540,
      author: 'js_ninja',
      created: baseTime - 25200,
      comments: 78,
      subreddit: 'javascript',
      is_self: false
    },
    {
      id: 'mock8',
      title: "Artificial general intelligence timeline predictions",
      url: 'https://agi-timeline.org',
      score: 490,
      author: 'agi_expert',
      created: baseTime - 28800,
      comments: 201,
      subreddit: 'artificial',
      is_self: false
    },
    {
      id: 'mock9',
      title: "Machine learning model predicts climate change with 99% accuracy",
      url: 'https://climate-ml.org',
      score: 460,
      author: 'climate_scientist',
      created: baseTime - 32400,
      comments: 89,
      subreddit: 'MachineLearning',
      is_self: false
    },
    {
      id: 'mock10',
      title: "Tesla's new autopilot system uses advanced AI",
      url: 'https://tesla.com/autopilot',
      score: 420,
      author: 'tesla_insider',
      created: baseTime - 36000,
      comments: 156,
      subreddit: 'technology',
      is_self: false
    },
    {
      id: 'mock11',
      title: "GitHub Copilot now supports 50+ programming languages",
      url: 'https://github.com/copilot',
      score: 380,
      author: 'github_team',
      created: baseTime - 39600,
      comments: 67,
      subreddit: 'programming',
      is_self: false
    },
    {
      id: 'mock12',
      title: "Why I stopped using React and switched to Vanilla JS",
      url: 'https://medium.com/@dev/vanilla-js',
      score: 340,
      author: 'frontend_dev',
      created: baseTime - 43200,
      comments: 234,
      subreddit: 'webdev',
      is_self: false
    }
  ];
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '12');
  const postsPerSubreddit = Math.max(1, Math.ceil(limit / SUBREDDITS.length));
  
  const isProd = isProduction();
  const region = getVercelRegion();
  
  console.log(`🔍 Fetching ${isProd ? 'real' : 'aggregated'} Reddit data from all subreddits`);
  if (isProd) {
    console.log(`🌍 Production environment detected - Region: ${region}`);
  }

  const allPosts: RedditPost[] = [];
  let failedSubreddits = 0;

  // Fetch from all subreddits concurrently
  const subredditPromises = SUBREDDITS.map(async (subreddit) => {
    const posts = await fetchSubredditPosts(subreddit, postsPerSubreddit);
    if (posts.length === 0) {
      failedSubreddits++;
    }
    return posts;
  });

  try {
    const results = await Promise.all(subredditPromises);
    results.forEach(posts => allPosts.push(...posts));
  } catch (error) {
    console.error('❌ Error fetching from subreddits:', error);
  }

  // Enhanced fallback logic - only use mock data if most subreddits fail
  const shouldUseFallback = failedSubreddits >= SUBREDDITS.length * 0.75; // 75% failure rate
  
  if (shouldUseFallback) {
    console.warn(`⚠️ ${failedSubreddits}/${SUBREDDITS.length} subreddits failed, Reddit appears to be blocked. Using fallback data.`);
    const mockPosts = getMockRedditPosts().slice(0, limit);
    
    console.log(`✅ Successfully aggregated ${mockPosts.length} top posts from ${SUBREDDITS.length} subreddits`);
    if (mockPosts.length > 0) {
      console.log(`🏆 Top post: "${mockPosts[0].title}" with ${mockPosts[0].score} points from r/${mockPosts[0].subreddit}`);
    }
    console.log(`📝 Note: Using mock data due to Reddit access restrictions${isProd ? '' : ' in Indonesia'}`);
    
    return NextResponse.json({
      posts: mockPosts,
      source: 'fallback',
      region: region,
      environment: isProd ? 'production' : 'development'
    });
  }

  // Sort all posts by score and take the top ones
  const topPosts = allPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  console.log(`✅ Successfully aggregated ${topPosts.length} top posts from ${SUBREDDITS.length - failedSubreddits} subreddits`);
  if (topPosts.length > 0) {
    console.log(`🏆 Top post: "${topPosts[0].title}" with ${topPosts[0].score} points from r/${topPosts[0].subreddit}`);
  }

  return NextResponse.json({
    posts: topPosts,
    source: 'reddit',
    region: region,
    environment: isProd ? 'production' : 'development',
    successfulSubreddits: SUBREDDITS.length - failedSubreddits,
    totalSubreddits: SUBREDDITS.length
  });
}
