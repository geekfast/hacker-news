import { NextResponse } from 'next/server';
// TEMPORARY: Disable cache import for testing
// import { getCachedImage, cacheImage } from '@/utils/imageCache';

export async function GET(request: Request) {
  console.log('🔍 Search Image API called:', new Date().toISOString());
  console.log('🔧 TESTING: Modified API v3 - CACHE COMPLETELY DISABLED!');
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  console.log('📝 Query parameter:', query);

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
    // TEMPORARY: Skip caching for testing
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    
    // Disable caching temporarily to test if that's the issue
    console.log('🔧 TESTING: Skipping cache to test direct Unsplash images');
    
    // if (!isProduction) {
    //   // Development: Use local cache
    //   const cachedImageUrl = await getCachedImage(query);
    //   if (cachedImageUrl) {
    //     console.log(`Serving cached image for query: ${query}`);
    //     return NextResponse.json({ 
    //       imageUrl: cachedImageUrl,
    //       cached: true,
    //       source: 'local-cache'
    //     }, {
    //       headers: {
    //         'Content-Type': 'application/json',
    //         'Cache-Control': 'public, max-age=3600'
    //       }
    //     });
    //   }
    // }

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
      console.warn(`Unsplash API responded with status: ${response.status} for query: ${query}, returning placeholder`);
      return returnPlaceholder(`API error: HTTP ${response.status}`);
    }

    const responseText = await response.text();
    console.log('🔧 Raw response length:', responseText.length);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('🚨 JSON Parse Error:', parseError, 'Raw response:', responseText.substring(0, 200));
      return returnPlaceholder('Invalid JSON response from API');
    }
    const originalImageUrl = data.results[0]?.urls?.small;

    if (!originalImageUrl) {
      console.warn(`No image found for query: ${query}, returning placeholder`);
      return returnPlaceholder('No image found for search term');
    }

    // TESTING: Always return direct Unsplash URL, no caching
    console.log(`🔧 TESTING: Serving DIRECT UNSPLASH URL for query: ${query} - URL: ${originalImageUrl}`);
    return NextResponse.json({ 
      imageUrl: originalImageUrl,
      cached: false,
      source: 'unsplash-direct-test-v3'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Error in image search:', error);
    
    // For any error, return placeholder instead of error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`API error for query "${query}": ${errorMessage}, returning placeholder`);
    
    return returnPlaceholder(`API error: ${errorMessage}`);
  }
}
