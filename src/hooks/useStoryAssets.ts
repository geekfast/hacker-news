import { useState, useEffect } from 'react';

interface UseStoryAssetsProps {
  title: string;
  url?: string;
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

export function useStoryAssets({ title, url }: UseStoryAssetsProps): UseStoryAssetsReturn {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  useEffect(() => {
    async function fetchImage() {
      try {
        const subject = extractSubject(title);
        const response = await fetch(`/api/search-image?query=${encodeURIComponent(subject)}`);
        
        if (!response.ok) {
          console.warn('Image search failed:', response.status);
          setIsLoadingImage(false);
          return;
        }
        
        const data = await response.json();
        if (data.imageUrl) {
          setImageUrl(data.imageUrl);
        }
      } catch (error) {
        console.error('Error fetching image:', error);
      } finally {
        setIsLoadingImage(false);
      }
    }
    
    fetchImage();
  }, [title]);

  useEffect(() => {
    async function fetchSummary() {
      if (!url) {
        setIsLoadingSummary(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/summarize?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`);
        
        if (!response.ok) {
          console.warn('Summary fetch failed:', response.status);
          setIsLoadingSummary(false);
          return;
        }
        
        const data = await response.json();
        if (data.summary) {
          setSummary(data.summary);
        }
      } catch (error) {
        console.error('Error fetching summary:', error);
      } finally {
        setIsLoadingSummary(false);
      }
    }
    
    fetchSummary();
  }, [url, title]);

  return {
    imageUrl,
    summary,
    isLoadingImage,
    isLoadingSummary,
  };
}
