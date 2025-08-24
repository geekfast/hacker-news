import { NextResponse } from 'next/server';
import { getCachedImage, cacheImage } from '@/utils/imageCache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ 
      error: 'Query parameter is required' 
    }, { 
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Helper function to return placeholder
  const returnPlaceholder = (reason: string) => {
    return NextResponse.json({
      imageUrl: '/placeholder.svg',
      cached: false,
      source: 'placeholder',
      reason: reason,
      query: query
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300'
      }
    });
  };

  try {
    // In production (Vercel), skip local cache and fetch directly from Unsplash
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    
    if (!isProduction) {
      // Development: Use local cache
      const cachedImageUrl = await getCachedImage(query);
      if (cachedImageUrl) {
        console.log(`Serving cached image for query: ${query}`);
        return NextResponse.json({ 
          imageUrl: cachedImageUrl,
          cached: true,
          source: 'local-cache'
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }
    }

    // Fetch from Unsplash
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      console.warn('Unsplash API key not configured, returning placeholder');
      return returnPlaceholder('API key not configured');
    }

    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      if (response.status === 410) {
        console.warn(`Unsplash API returned 410 for query: ${query}, returning placeholder`);
        return returnPlaceholder('Resource no longer available');
      }
      if (response.status === 403 || response.status === 429) {
        console.warn(`Unsplash API rate limited (${response.status}) for query: ${query}, returning placeholder`);
        return returnPlaceholder('API rate limited');
      }
      throw new Error(`Unsplash API responded with status: ${response.status}`);
    }

    const data = await response.json();
    const originalImageUrl = data.results[0]?.urls?.small;

    if (!originalImageUrl) {
      console.warn(`No image found for query: ${query}, returning placeholder`);
      return returnPlaceholder('No image found for search term');
    }

    if (isProduction) {
      // Production: Return direct Unsplash URL
      console.log(`Serving direct Unsplash image for query: ${query}`);
      return NextResponse.json({ 
        imageUrl: originalImageUrl,
        cached: false,
        source: 'unsplash-direct'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=1800'
        }
      });
    } else {
      // Development: Cache the image locally
      const localImageUrl = await cacheImage(query, originalImageUrl);
      console.log(`Cached new image for query: ${query}`);
      
      return NextResponse.json({ 
        imageUrl: localImageUrl,
        cached: false,
        source: 'unsplash-cached'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

  } catch (error) {
    console.error('Error in image search:', error);
    
    // For any error, return placeholder instead of error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`API error for query "${query}": ${errorMessage}, returning placeholder`);
    
    return returnPlaceholder(`API error: ${errorMessage}`);
  }
}
