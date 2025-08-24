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
  subreddit?: string; // Optional for non-Reddit sources
  source?: string; // Add source field for better identification
}

function parseRSSFallback(rssText: string): TrendingPost[] {
  try {
    // Simple regex-based fallback parsing
    const itemPattern = /<item>([\s\S]*?)<\/item>/g;
    const itemMatches: string[] = [];
    let match;
    
    while ((match = itemPattern.exec(rssText)) !== null) {
      itemMatches.push(match[1]);
    }
    
    const posts: TrendingPost[] = [];
    
    itemMatches.forEach((itemText, index) => {
      try {
        const title = itemText.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || 
                     itemText.match(/<title>(.*?)<\/title>/)?.[1] || '';
        const link = itemText.match(/<link>(.*?)<\/link>/)?.[1] || '';
        const author = itemText.match(/<dc:creator><!\[CDATA\[(.*?)\]\]><\/dc:creator>/)?.[1] || 
                      itemText.match(/<dc:creator>(.*?)<\/dc:creator>/)?.[1] || 'unknown';
        const pubDate = itemText.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
        
        if (title && link) {
          posts.push({
            id: `lobster-${index}-${Date.now()}`,
            title: title.trim(),
            url: link.trim(),
            permalink: link.trim(),
            score: 1,
            author: author.trim(),
            created_utc: pubDate ? Math.floor(new Date(pubDate).getTime() / 1000) : Math.floor(Date.now() / 1000),
            num_comments: 0,
            source: 'lobsters',
          });
        }
      } catch (error) {
        console.error('Error in fallback parsing:', error);
      }
    });
    
    return posts;
  } catch (error) {
    console.error('Fallback parsing failed:', error);
    return [];
  }
}

async function fetchLobstersRSS(): Promise<TrendingPost[]> {
  try {
    console.log('🔍 Fetching Lobste.rs RSS feed');
    
    const response = await fetch('https://lobste.rs/rss', {
      headers: {
        'User-Agent': 'Hacker-News-App/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`Lobste.rs RSS error: ${response.status}`);
    }

    const rssText = await response.text();
    
    // Parse XML using simple regex parsing (avoiding xml2js dependency)
    try {
      // Simple regex-based XML parsing for RSS items
      const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
      const titleRegex = /<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/i;
      const linkRegex = /<link[^>]*>(.*?)<\/link>/i;
      const authorRegex = /<dc:creator[^>]*><!\[CDATA\[(.*?)\]\]><\/dc:creator>/i;
      const pubDateRegex = /<pubDate[^>]*>(.*?)<\/pubDate>/i;
      
      const itemMatches = Array.from(rssText.matchAll(itemRegex));
      
      console.log(`📰 Found ${itemMatches.length} RSS items`);

      const posts: TrendingPost[] = [];
      
      itemMatches.forEach((itemMatch, index) => {
        try {
          const itemContent = itemMatch[1];
          const titleMatch = itemContent.match(titleRegex);
          const linkMatch = itemContent.match(linkRegex);
          const authorMatch = itemContent.match(authorRegex);
          const pubDateMatch = itemContent.match(pubDateRegex);
          
          const title = titleMatch?.[1] || '';
          const link = linkMatch?.[1] || '';
          const author = authorMatch?.[1] || 'unknown';
          const pubDate = pubDateMatch?.[1] || '';
          
          // Extract score and comments from description if available
          const descMatch = itemContent.match(/<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>/i);
          const description = descMatch?.[1] || '';
          
          // Extract score from description if available
          const scoreMatch = description.match(/(\d+)\s*points?/i);
          const score = scoreMatch ? parseInt(scoreMatch[1]) : 1;
          
          // Extract comments count
          const commentsMatch = description.match(/(\d+)\s*comments?/i);
          const comments = commentsMatch ? parseInt(commentsMatch[1]) : 0;
          
          // Generate ID from link
          const urlParts = link.split('/');
          const id = urlParts[urlParts.length - 1] || Date.now().toString() + index;
          
          posts.push({
            id,
            title: title.trim(),
            url: link,
            permalink: link,
            score,
            author: author.trim(),
            created_utc: pubDate ? Math.floor(new Date(pubDate).getTime() / 1000) : Math.floor(Date.now() / 1000),
            num_comments: comments,
            source: 'lobsters', // Use source instead of subreddit
          });
        } catch (itemError) {
          console.error('Error parsing RSS item:', itemError);
        }
      });

      console.log(`✅ Successfully parsed ${posts.length} Lobste.rs posts`);
      return posts;
    } catch (parseError) {
      console.error('❌ Failed to parse XML:', parseError);
      // Fallback: try simple text parsing
      return parseRSSFallback(rssText);
    }
    
  } catch (error) {
    console.error('❌ Failed to fetch Lobste.rs RSS:', error);
    return [];
  }
}

async function fetchLobstersHottest(): Promise<TrendingPost[]> {
  try {
    console.log('🔍 Fetching Lobste.rs hottest feed');
    
    // Try the main RSS feed instead since hottest.rss might not exist
    const response = await fetch('https://lobste.rs/rss', {
      headers: {
        'User-Agent': 'Hacker-News-App/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`Lobste.rs RSS error: ${response.status}`);
    }

    const rssText = await response.text();
    
    // Parse XML using simple regex parsing (avoiding xml2js dependency)
    try {
      // Simple regex-based XML parsing for RSS items
      const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
      const titleRegex = /<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/i;
      const linkRegex = /<link[^>]*>(.*?)<\/link>/i;
      const authorRegex = /<dc:creator[^>]*><!\[CDATA\[(.*?)\]\]><\/dc:creator>/i;
      const pubDateRegex = /<pubDate[^>]*>(.*?)<\/pubDate>/i;
      
      const itemMatches = Array.from(rssText.matchAll(itemRegex));
      
      const posts: TrendingPost[] = [];
      
      // Take only the first few items and treat them as "hottest"
      itemMatches.slice(0, 10).forEach((itemMatch, index) => {
        try {
          const itemContent = itemMatch[1];
          const titleMatch = itemContent.match(titleRegex);
          const linkMatch = itemContent.match(linkRegex);
          const authorMatch = itemContent.match(authorRegex);
          const pubDateMatch = itemContent.match(pubDateRegex);
          
          const title = titleMatch?.[1] || '';
          const link = linkMatch?.[1] || '';
          const author = authorMatch?.[1] || 'unknown';
          const pubDate = pubDateMatch?.[1] || '';
          
          // Extract score and comments from description if available
          const descMatch = itemContent.match(/<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>/i);
          const description = descMatch?.[1] || '';
          
          // Extract score from description if available
          const scoreMatch = description.match(/(\d+)\s*points?/i);
          const baseScore = scoreMatch ? parseInt(scoreMatch[1]) : 1;
          
          // Extract comments count
          const commentsMatch = description.match(/(\d+)\s*comments?/i);
          const comments = commentsMatch ? parseInt(commentsMatch[1]) : 0;
          
          // Generate ID from link
          const urlParts = link.split('/');
          const id = urlParts[urlParts.length - 1] || Date.now().toString() + index;
          
          posts.push({
            id: `hot-${id}`,
            title: title.trim(),
            url: link,
            permalink: link,
            score: Math.max(baseScore * 1.3, 5), // Mark as "hottest" with slight boost
            author: author.trim(),
            created_utc: pubDate ? Math.floor(new Date(pubDate).getTime() / 1000) : Math.floor(Date.now() / 1000),
            num_comments: comments,
            source: 'lobsters-trending', // Use source instead of subreddit for trending items
          });
        } catch (itemError) {
          console.error('Error parsing hottest RSS item:', itemError);
        }
      });

      console.log(`✅ Successfully parsed ${posts.length} Lobste.rs hottest posts`);
      return posts;
    } catch (parseError) {
      console.error('❌ Failed to parse hottest XML:', parseError);
      // Fallback: try simple text parsing
      const fallbackPosts = parseRSSFallback(rssText);
      return fallbackPosts.slice(0, 10).map(post => ({
        ...post,
        id: `hot-${post.id}`,
        score: Math.max(post.score * 1.3, 5),
        source: 'lobsters-trending',
      }));
    }
    
  } catch (error) {
    console.error('❌ Failed to fetch Lobste.rs hottest RSS:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');
    const feed = searchParams.get('feed') || 'both'; // 'newest', 'hottest', 'both'

    console.log(`🔍 Lobste.rs API request - limit: ${limit}, feed: ${feed}`);

    const allPosts: TrendingPost[] = [];
    
    if (feed === 'newest' || feed === 'both') {
      const newestPosts = await fetchLobstersRSS();
      allPosts.push(...newestPosts);
    }
    
    if (feed === 'hottest' || feed === 'both') {
      const hottestPosts = await fetchLobstersHottest();
      allPosts.push(...hottestPosts);
    }

    // Remove duplicates and sort by score
    const uniquePosts = Array.from(
      new Map(allPosts.map(post => [post.url, post])).values()
    ).sort((a, b) => b.score - a.score);

    const limitedPosts = uniquePosts.slice(0, limit);

    return NextResponse.json({
      posts: limitedPosts,
      source: 'lobsters',
      region: process.env.VERCEL_REGION || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      feeds: feed === 'both' ? 2 : 1,
      totalPosts: limitedPosts.length,
    });

  } catch (error) {
    console.error('❌ Lobste.rs API route error:', error);
    
    return NextResponse.json({
      posts: [],
      source: 'lobsters',
      region: process.env.VERCEL_REGION || 'unknown', 
      environment: process.env.NODE_ENV || 'development',
      error: 'Failed to fetch Lobste.rs RSS',
      feeds: 0,
      totalPosts: 0,
    });
  }
}
