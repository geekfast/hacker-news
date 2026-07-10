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
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

    if (!isProduction) {
      const cachedImageUrl = await getCachedImage(query);
      if (cachedImageUrl) {
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

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      return returnPlaceholder('API key not configured');
    }

    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      if (response.status === 410) {
        return returnPlaceholder('Resource no longer available');
      }
      if (response.status === 403 || response.status === 429) {
        return returnPlaceholder('API rate limited');
      }
      return returnPlaceholder(`API error: HTTP ${response.status}`);
    }

    const data = await response.json();
    const originalImageUrl = data.results[0]?.urls?.small;

    if (!originalImageUrl) {
      return returnPlaceholder('No image found for search term');
    }

    let cachedUrl = originalImageUrl;
    if (!isProduction) {
      try {
        cachedUrl = await cacheImage(query, originalImageUrl);
      } catch {
        cachedUrl = originalImageUrl;
      }
    }

    return NextResponse.json({ 
      imageUrl: cachedUrl,
      cached: false,
      source: isProduction ? 'unsplash' : 'unsplash-cached'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300'
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return returnPlaceholder(`API error: ${errorMessage}`);
  }
}
