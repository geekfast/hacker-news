import { useState, useEffect } from 'react';

interface Story {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: number;
  descendants?: number;
  subreddit?: string;
  thumbnail?: string;
  source?: string;
}

interface UseStoryAssetsProps {
  story: Story;
}

interface UseStoryAssetsReturn {
  imageUrl: string | null;
  summary: string | null;
  isLoadingImage: boolean;
  isLoadingSummary: boolean;
}

function extractSubject(title: string): string {
  const patterns = [
    /Ask HN: (.+)/,
    /Show HN: (.+)/,
    /(.+) \(\d{4}\)/,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return title;
}

export function useStoryAssets({ story }: UseStoryAssetsProps): UseStoryAssetsReturn {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchImage() {
      // If a valid thumbnail URL is already provided (e.g., from Reddit scraping), use it directly.
      if (story.thumbnail && story.thumbnail.startsWith('http')) {
        if (isMounted) {
          setImageUrl(story.thumbnail);
          setIsLoadingImage(false);
        }
        return; // Skip fetching from Unsplash
      }

      // Fallback to fetching from our image search API for other sources (like Hacker News)
      try {
        const subject = extractSubject(story.title);
        const response = await fetch(`/api/search-image?query=${encodeURIComponent(subject)}`);
        
        if (!response.ok) {
          throw new Error(`Image API failed with status: ${response.status}`);
        }

        const data = await response.json();
        
        if (isMounted) {
          if (data.imageUrl) {
            setImageUrl(data.imageUrl);
          } else {
            setImageUrl('/placeholder.svg');
          }
          setIsLoadingImage(false);
        }
      } catch (error) {
        console.error('Error fetching image:', error);
        if (isMounted) {
          setImageUrl('/placeholder.svg');
          setIsLoadingImage(false);
        }
      }
    }
    
    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [story.title, story.thumbnail]);

  useEffect(() => {
    let isMounted = true;
    async function fetchSummary() {
      if (!story.url) {
        if(isMounted) setIsLoadingSummary(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/summarize?url=${encodeURIComponent(story.url)}&title=${encodeURIComponent(story.title)}`);
        
        if (!response.ok) {
          console.warn('Summary fetch failed:', response.status);
          if(isMounted) setIsLoadingSummary(false);
          return;
        }
        
        const data = await response.json();
        if (isMounted && data.summary) {
          setSummary(data.summary);
        }
      } catch (error) {
        console.error('Error fetching summary:', error);
      } finally {
        if (isMounted) {
          setIsLoadingSummary(false);
        }
      }
    }
    
    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, [story.url, story.title]);

  return {
    imageUrl,
    summary,
    isLoadingImage,
    isLoadingSummary,
  };
}
