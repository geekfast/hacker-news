import { NextRequest, NextResponse } from 'next/server';

interface TrendingPost {
  id: string;
  title: string;
  url: string;
  permalink: string;
  score: number;
  author: string;
  created_utc: number;
  num_comments: number;
  subreddit: string;
}

interface SourceResult {
  posts: TrendingPost[];
  source: string;
  error?: string;
  totalPosts: number;
}

async function fetchFromSource(source: string, limit: number = 6): Promise<SourceResult> {
  try {
    console.log(`🔍 Fetching from ${source} API (limit: ${limit})`);
    
    // Import and call the API functions directly
    let result: SourceResult;
    
    if (source === 'github') {
      const { GET } = await import('../github/route');
      const mockRequest = new NextRequest(`http://localhost/api/github?limit=${limit}`);
      const response = await GET(mockRequest);
      const data = await response.json();
      result = {
        posts: data.posts || [],
        source,
        totalPosts: data.totalPosts || 0,
      };
    } else if (source === 'devto') {
      const { GET } = await import('../devto/route');
      const mockRequest = new NextRequest(`http://localhost/api/devto?limit=${limit}`);
      const response = await GET(mockRequest);
      const data = await response.json();
      result = {
        posts: data.posts || [],
        source,
        totalPosts: data.totalPosts || 0,
      };
    } else if (source === 'lobsters') {
      const { GET } = await import('../lobsters/route');
      const mockRequest = new NextRequest(`http://localhost/api/lobsters?limit=${limit}`);
      const response = await GET(mockRequest);
      const data = await response.json();
      result = {
        posts: data.posts || [],
        source,
        totalPosts: data.totalPosts || 0,
      };
    } else if (source === 'reddit') {
      const { GET } = await import('../reddit/route');
      const mockRequest = new NextRequest(`http://localhost/api/reddit?limit=${limit}`);
      const response = await GET(mockRequest);
      const data = await response.json();
      result = {
        posts: data.posts || [],
        source,
        totalPosts: data.totalPosts || 0,
      };
    } else {
      throw new Error(`Unknown source: ${source}`);
    }
    
    console.log(`✅ ${source} returned ${result.posts.length} posts`);
    return result;
    
  } catch (error) {
    console.error(`❌ Failed to fetch from ${source}:`, error);
    return {
      posts: [],
      source,
      error: error instanceof Error ? error.message : 'Unknown error',
      totalPosts: 0,
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const sources = searchParams.get('sources')?.split(',') || ['github', 'devto', 'lobsters', 'reddit'];
    const includeReddit = searchParams.get('include_reddit') !== 'false';

    console.log(`🚀 Aggregation API request - limit: ${limit}, sources: ${sources.join(', ')}`);

    // Calculate posts per source
    const postsPerSource = Math.ceil(limit / sources.length);

    // Fetch from all sources in parallel
    const sourcePromises = sources.map(source => {
      // Skip Reddit if not included
      if (source === 'reddit' && !includeReddit) {
        console.log('⏭️ Skipping Reddit (disabled)');
        return Promise.resolve({
          posts: [],
          source: 'reddit',
          error: 'Disabled by configuration',
          totalPosts: 0,
        });
      }
      
      return fetchFromSource(source, postsPerSource);
    });

    const results = await Promise.allSettled(sourcePromises);
    
    const allPosts: TrendingPost[] = [];
    const sourceStats: Record<string, any> = {};
    
    results.forEach((result, index) => {
      const source = sources[index];
      
      if (result.status === 'fulfilled') {
        const { posts, error, totalPosts } = result.value;
        allPosts.push(...posts);
        sourceStats[source] = {
          success: !error,
          count: posts.length,
          error: error || null,
          totalPosts,
        };
      } else {
        sourceStats[source] = {
          success: false,
          count: 0,
          error: result.reason?.message || 'Promise rejected',
          totalPosts: 0,
        };
      }
    });

    // Remove duplicates by URL and sort by score
    const uniquePosts = Array.from(
      new Map(allPosts.map(post => [post.url, post])).values()
    ).sort((a, b) => {
      // Multi-factor sorting: score, recency, comments
      const scoreA = b.score - a.score;
      if (Math.abs(scoreA) < 5) {
        // If scores are close, prefer more recent
        return b.created_utc - a.created_utc;
      }
      return scoreA;
    });

    const limitedPosts = uniquePosts.slice(0, limit);

    // Calculate success rate
    const successfulSources = Object.values(sourceStats).filter(stat => stat.success).length;
    const totalSources = sources.length;

    console.log(`📊 Aggregation complete: ${limitedPosts.length} posts from ${successfulSources}/${totalSources} sources`);

    return NextResponse.json({
      posts: limitedPosts,
      sourceStats,
      meta: {
        totalPosts: limitedPosts.length,
        totalSources,
        successfulSources,
        region: process.env.VERCEL_REGION || 'unknown',
        environment: process.env.NODE_ENV || 'development',
        requestedLimit: limit,
        sources: sources,
      },
    });

  } catch (error) {
    console.error('❌ Aggregation API route error:', error);
    
    return NextResponse.json({
      posts: [],
      sourceStats: {},
      meta: {
        totalPosts: 0,
        totalSources: 0,
        successfulSources: 0,
        region: process.env.VERCEL_REGION || 'unknown',
        environment: process.env.NODE_ENV || 'development',
        error: 'Failed to aggregate sources',
      },
    });
  }
}
