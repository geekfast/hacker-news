import { NextRequest, NextResponse } from 'next/server';

// All subreddits we want to aggregate
const ALL_SUBREDDITS = [
  'programming',
  'javascript', 
  'webdev',
  'technology',
  'MachineLearning',
  'artificial',
  'coding',
  'compsci'
];

interface RedditPost {
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

interface RedditApiResponse {
  data: {
    children: Array<{
      data: {
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
      };
    }>;
  };
}

const fetchSubredditPosts = async (subreddit: string, limit: number = 5): Promise<RedditPost[]> => {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'HackerNewsClone/1.0 (Web App for aggregating tech news)',
      },
      // Vercel-optimized caching
      cache: 'default',
      next: { 
        revalidate: 300, // 5 minutes cache
        tags: [`reddit-${subreddit}`] // Tag for selective revalidation
      }
    });

    if (!response.ok) {
      console.warn(`⚠️ Reddit API error for r/${subreddit}: ${response.status}`);
      return [];
    }

    const data: RedditApiResponse = await response.json();
    
    if (!data.data?.children) {
      console.warn(`⚠️ Invalid response format from r/${subreddit}`);
      return [];
    }

    const posts = data.data.children
      .filter(child => {
        // Filter out deleted/removed posts and invalid data
        const post = child.data;
        return post && 
               post.title && 
               post.title !== '[deleted]' && 
               post.title !== '[removed]' &&
               post.author !== '[deleted]' &&
               post.score !== undefined &&
               post.score >= 0;
      })
      .map(child => ({
        id: child.data.id,
        title: child.data.title,
        url: child.data.url,
        score: child.data.score,
        author: child.data.author,
        created: child.data.created_utc,
        comments: child.data.num_comments,
        subreddit: child.data.subreddit,
        thumbnail: child.data.thumbnail && child.data.thumbnail !== 'self' ? child.data.thumbnail : undefined,
        selftext: child.data.selftext,
        is_self: child.data.is_self
      }));

    return posts;

  } catch (error) {
    console.error(`❌ Failed to fetch r/${subreddit}:`, error);
    return []; // Return empty array to not break aggregation
  }
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '12');

  try {
    console.log('🔍 Fetching real Reddit data from all subreddits');
    const startTime = Date.now();

    // Fetch posts from all subreddits in parallel for better performance
    const subredditPromises = ALL_SUBREDDITS.map(subreddit => 
      fetchSubredditPosts(subreddit, 5)
    );

    // Use Promise.allSettled to handle failures gracefully
    const subredditResults = await Promise.allSettled(subredditPromises);
    
    // Extract successful results
    const allPosts: RedditPost[] = subredditResults
      .filter((result): result is PromiseFulfilledResult<RedditPost[]> => 
        result.status === 'fulfilled'
      )
      .flatMap(result => result.value);

    // Filter and sort posts
    const validPosts = allPosts.filter(post => 
      post.title && 
      post.score !== undefined && 
      post.author !== '[deleted]' &&
      post.title.length > 10 // Filter out very short titles
    );

    const topPosts = validPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const successfulSubreddits = subredditResults.filter(
      result => result.status === 'fulfilled' && result.value.length > 0
    ).length;
    
    const fetchTime = Date.now() - startTime;
    
    console.log(`✅ Reddit fetch completed in ${fetchTime}ms`);
    console.log(`📊 ${successfulSubreddits}/${ALL_SUBREDDITS.length} subreddits successful`);
    console.log(`📈 ${validPosts.length} total posts, returning top ${topPosts.length}`);
    
    if (topPosts.length > 0) {
      console.log(`🏆 Top: "${topPosts[0]?.title.slice(0, 50)}..." (${topPosts[0]?.score} pts from r/${topPosts[0]?.subreddit})`);
    }

    // Return comprehensive response
    return NextResponse.json({ 
      posts: topPosts,
      meta: {
        totalPosts: validPosts.length,
        successfulSubreddits,
        totalSubreddits: ALL_SUBREDDITS.length,
        fetchTimeMs: fetchTime,
        source: 'reddit-api',
        timestamp: new Date().toISOString(),
        cacheAge: 300 // 5 minutes
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Source': 'reddit-api'
      }
    });

  } catch (error) {
    console.error('❌ Reddit aggregation error:', error);
    
    // Enhanced error response for debugging
    return NextResponse.json(
      { 
        error: 'Failed to fetch Reddit data', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        meta: {
          source: 'reddit-api-error',
          subreddits: ALL_SUBREDDITS
        }
      },
      { 
        status: 500,
        headers: {
          'X-Error': 'reddit-fetch-failed'
        }
      }
    );
  }
}

// Optional: Add route segment config for Vercel optimization
export const runtime = 'nodejs'; // Use Node.js runtime
export const dynamic = 'force-dynamic'; // Always run dynamically
export const revalidate = 300; // Revalidate every 5 minutes
