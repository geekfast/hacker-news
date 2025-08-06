import { NextResponse } from 'next/server';
import { getCachedImage, cacheImage } from '@/utils/imageCache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    // First, check if we have a cached image
    const cachedImageUrl = await getCachedImage(query);
    if (cachedImageUrl) {
      console.log(`Serving cached image for query: ${query}`);
      return NextResponse.json({ 
        imageUrl: cachedImageUrl,
        cached: true 
      });
    }

    // If not cached, fetch from Unsplash
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      return NextResponse.json({ error: 'Unsplash API key is not configured' }, { status: 500 });
    }

    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Unsplash API responded with status: ${response.status}`);
    }

    const data = await response.json();
    const originalImageUrl = data.results[0]?.urls?.small;

    if (!originalImageUrl) {
      return NextResponse.json({ error: 'No image found for the query' }, { status: 404 });
    }

    // Cache the image locally
    const localImageUrl = await cacheImage(query, originalImageUrl);
    console.log(`Cached new image for query: ${query}`);

    return NextResponse.json({ 
      imageUrl: localImageUrl,
      cached: false 
    });

  } catch (error) {
    console.error('Error in image search:', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}
