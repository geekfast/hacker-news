'use client';

import Header from './components/Header';
import { useState, useEffect } from 'react';

// Rate limiter untuk gambar
let lastImageRequest = 0;
const IMAGE_RATE_LIMIT = 150; // ms

const imageRateLimiter = () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastImageRequest;
  if (timeSinceLastRequest < IMAGE_RATE_LIMIT) {
    return new Promise(resolve => {
      setTimeout(resolve, IMAGE_RATE_LIMIT - timeSinceLastRequest);
    });
  }
  lastImageRequest = now;
  return Promise.resolve();
};

// Cache untuk data yang sudah diambil
const cache = new Map();

async function cachedFetch(url: string, cacheDuration = 60000) {
  const now = Date.now();
  const cached = cache.get(url);
  
  if (cached && (now - cached.timestamp) < cacheDuration) {
    return cached.data;
  }
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    cache.set(url, { data, timestamp: now });
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    return cached?.data || null;
  }
}

interface Story {
  title: string;
  url: string;
  score: number;
  id: number;
  by: string;
  time: number;
  descendants?: number;
  type: string;
  image?: string;
  isLoading?: boolean;
}

interface StoryItemProps {
  story: Story;
}

function StoryItem({ story }: StoryItemProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      if (!story.title) return;
      
      setIsLoadingImage(true);
      try {
        await imageRateLimiter();
        const imageData = await cachedFetch(`/api/search-image?query=${encodeURIComponent(story.title)}`);
        if (imageData?.url) {
          setImageUrl(imageData.url);
        }
      } catch (error) {
        console.error('Error loading image:', error);
      } finally {
        setIsLoadingImage(false);
      }
    };

    fetchImage();
  }, [story.title]);

  const formatTime = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    const hours = Math.floor(diff / 3600);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex gap-4">
        {/* Image section */}
        <div className="w-32 h-24 flex-shrink-0">
          {isLoadingImage ? (
            <div className="w-full h-full bg-gray-200 rounded animate-pulse flex items-center justify-center">
              <span className="text-xs text-gray-500">Loading...</span>
            </div>
          ) : imageUrl ? (
            <img 
              src={imageUrl} 
              alt={story.title}
              className="w-full h-full object-cover rounded"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
              <span className="text-xs text-gray-400">No image</span>
            </div>
          )}
        </div>

        {/* Content section */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2 line-clamp-2">
            <a 
              href={story.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {story.title}
            </a>
          </h3>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
            <span className="flex items-center gap-1">
              <span className="font-medium">{story.score}</span> points
            </span>
            <span>by {story.by}</span>
            <span>{formatTime(story.time)}</span>
            {story.descendants && (
              <span>{story.descendants} comments</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StoryItemGridProps {
  stories: Story[];
}

function StoryItemGrid({ stories }: StoryItemGridProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {stories.map((story) => (
        <StoryItem key={story.id} story={story} />
      ))}
    </div>
  );
}

export default function Home() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      setIsLoading(true);
      try {
        // Fetch Hacker News stories
        const hnData = await cachedFetch('https://hacker-news.firebaseio.com/v0/topstories.json');
        if (hnData) {
          const storyDetails = await Promise.all(
            hnData.slice(0, 10).map(async (id: number) => {
              const story = await cachedFetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
              return story;
            })
          );
          
          // Fetch Reddit stories
          const redditData = await cachedFetch('/api/reddit?limit=12');
          const redditStories = redditData?.stories || [];

          // Combine and sort by score
          const allStories = [
            ...storyDetails.filter(story => story && story.title && story.url),
            ...redditStories
          ].sort((a, b) => (b.score || 0) - (a.score || 0));

          setStories(allStories.slice(0, 20));
        }
      } catch (error) {
        console.error('Error fetching stories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStories();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        {isLoading ? (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading stories...</p>
            </div>
          </div>
        ) : (
          <StoryItemGrid stories={stories} />
        )}
      </main>
    </div>
  );
}
