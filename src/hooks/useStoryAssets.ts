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
        console.log('Fetching image for:', subject);
        const response = await fetch(`/api/search-image?query=${encodeURIComponent(subject)}`);
        
        // Always expect JSON response now (API returns placeholder for errors)
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          console.warn('Response is not JSON:', contentType);
          setImageUrl('/placeholder.svg');
          setIsLoadingImage(false);
          return;
        }
        
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError, 'Raw response:', responseText);
          setImageUrl('/placeholder.svg');
          setIsLoadingImage(false);
          return;
        }
        
        console.log('Image API response:', data);
        if (data.imageUrl) {
          console.log('Setting imageUrl to:', data.imageUrl);
          setImageUrl(data.imageUrl);
        } else {
          console.log('No imageUrl in response, using placeholder');
          setImageUrl('/placeholder.svg');
        }
      } catch (error) {
        console.error('Error fetching image:', error);
        setImageUrl('/placeholder.svg');
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
