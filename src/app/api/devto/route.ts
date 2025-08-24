import { NextRequest, NextResponse } from 'next/server';

interface DevToArticle {
  id: number;
  title: string;
  description: string;
  url: string;
  published_at: string;
  positive_reactions_count: number;
  comments_count: number;
  user: {
    name: string;
    username: string;
  };
  tag_list: string[];
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

async function fetchDevToArticles(tag: string = '', top: number = 7): Promise<TrendingPost[]> {
  try {
    let url = 'https://dev.to/api/articles';
    
    const params = new URLSearchParams({
      per_page: '20',
      top: top.toString(),
    });
    
    if (tag) {
      params.append('tag', tag);
    }
    
    url += '?' + params.toString();
    
    console.log(`🔍 Fetching Dev.to articles for ${tag || 'all tags'}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Hacker-News-App/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Dev.to API error: ${response.status}`);
    }

    const articles: DevToArticle[] = await response.json();

    console.log(`✅ Successfully fetched ${articles.length} Dev.to articles`);

    return articles.map((article) => ({
      id: article.id.toString(),
      title: article.title,
      url: article.url,
      permalink: article.url,
      score: article.positive_reactions_count,
      author: article.user.username,
      created_utc: Math.floor(new Date(article.published_at).getTime() / 1000),
      num_comments: article.comments_count,
      subreddit: `devto-${article.tag_list[0]?.toLowerCase() || 'general'}`,
    }));
    
  } catch (error) {
    console.error(`❌ Failed to fetch Dev.to articles:`, error);
    return [];
  }
}

async function fetchMultipleTags(): Promise<TrendingPost[]> {
  const tags = ['javascript', 'typescript', 'python', 'react', 'node', 'webdev'];
  const promises = tags.map(tag => fetchDevToArticles(tag));
  
  // Add general trending
  promises.push(fetchDevToArticles());
  
  const results = await Promise.allSettled(promises);
  const allPosts: TrendingPost[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allPosts.push(...result.value);
    } else {
      const tag = index < tags.length ? tags[index] : 'general';
      console.log(`⚠️ Failed to fetch Dev.to articles for ${tag}`);
    }
  });
  
  // Remove duplicates and sort by reactions
  const uniquePosts = Array.from(
    new Map(allPosts.map(post => [post.id, post])).values()
  ).sort((a, b) => b.score - a.score);
  
  return uniquePosts;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');
    const tag = searchParams.get('tag') || '';
    const top = parseInt(searchParams.get('top') || '7');

    console.log(`🔍 Dev.to API request - limit: ${limit}, tag: ${tag}, top: ${top}`);

    let posts: TrendingPost[];
    
    if (tag) {
      posts = await fetchDevToArticles(tag, top);
    } else {
      posts = await fetchMultipleTags();
    }

    const limitedPosts = posts.slice(0, limit);

    return NextResponse.json({
      posts: limitedPosts,
      source: 'devto',
      region: process.env.VERCEL_REGION || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      successfulTags: tag ? 1 : 7,
      totalPosts: limitedPosts.length,
    });

  } catch (error) {
    console.error('❌ Dev.to API route error:', error);
    
    return NextResponse.json({
      posts: [],
      source: 'devto',
      region: process.env.VERCEL_REGION || 'unknown', 
      environment: process.env.NODE_ENV || 'development',
      error: 'Failed to fetch Dev.to articles',
      successfulTags: 0,
      totalPosts: 0,
    });
  }
}
