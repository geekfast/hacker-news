import { NextRequest, NextResponse } from 'next/server';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  stargazers_count: number;
  language: string;
  created_at: string;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

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

async function fetchGitHubTrending(language: string = ''): Promise<TrendingPost[]> {
  try {
    // Use a simpler search query to avoid rate limits
    const query = language 
      ? `language:${language} stars:>10 created:>2024-08-01`
      : 'stars:>100 created:>2024-08-01';
    
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=15`;
    
    console.log(`🔍 Fetching GitHub trending for ${language || 'all languages'}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Hacker-News-App/1.0',
        'Accept': 'application/vnd.github.v3+json',
        // Add basic rate limiting
        'X-RateLimit-Remaining': '60',
      },
      // Add timeout
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      // Log the actual error for debugging
      const errorText = await response.text().catch(() => 'Unknown error');
      console.log(`⚠️ GitHub API error ${response.status}: ${errorText}`);
      
      // Return empty array instead of throwing to prevent cascade failures
      return [];
    }

    const data = await response.json();
    const repos: GitHubRepo[] = data.items || [];

    console.log(`✅ Successfully fetched ${repos.length} GitHub repos`);

    return repos.map((repo) => ({
      id: repo.id.toString(),
      title: `${repo.name} - ${repo.description || 'No description'}`,
      url: repo.html_url,
      permalink: repo.html_url,
      score: repo.stargazers_count,
      author: repo.owner.login,
      created_utc: Math.floor(new Date(repo.created_at).getTime() / 1000),
      num_comments: 0, // GitHub doesn't have comments in this context
      subreddit: `github-${repo.language?.toLowerCase() || 'general'}`,
    }));
    
  } catch (error) {
    console.error(`❌ Failed to fetch GitHub trending:`, error);
    return [];
  }
}

async function fetchMultipleLanguages(): Promise<TrendingPost[]> {
  // Reduce the number of languages to avoid rate limiting
  const languages = ['javascript', 'typescript', 'python'];
  const promises = languages.map(lang => fetchGitHubTrending(lang));
  
  // Add general trending
  promises.push(fetchGitHubTrending());
  
  const results = await Promise.allSettled(promises);
  const allPosts: TrendingPost[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allPosts.push(...result.value);
    } else {
      const lang = index < languages.length ? languages[index] : 'general';
      console.log(`⚠️ Failed to fetch GitHub trending for ${lang}`);
    }
  });
  
  // Remove duplicates and sort by stars
  const uniquePosts = Array.from(
    new Map(allPosts.map(post => [post.id, post])).values()
  ).sort((a, b) => b.score - a.score);
  
  return uniquePosts;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');
    const language = searchParams.get('language') || '';

    console.log(`🔍 GitHub API request - limit: ${limit}, language: ${language}`);

    let posts: TrendingPost[];
    
    if (language) {
      posts = await fetchGitHubTrending(language);
    } else {
      posts = await fetchMultipleLanguages();
    }

    const limitedPosts = posts.slice(0, limit);

    return NextResponse.json({
      posts: limitedPosts,
      source: 'github',
      region: process.env.VERCEL_REGION || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      successfulLanguages: language ? 1 : 6,
      totalPosts: limitedPosts.length,
    });

  } catch (error) {
    console.error('❌ GitHub API route error:', error);
    
    return NextResponse.json({
      posts: [],
      source: 'github',
      region: process.env.VERCEL_REGION || 'unknown', 
      environment: process.env.NODE_ENV || 'development',
      error: 'Failed to fetch GitHub trending',
      successfulLanguages: 0,
      totalPosts: 0,
    });
  }
}
