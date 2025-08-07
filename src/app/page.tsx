'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

type Category = 'hacker-news' | 'reddit';

// Helper function to ensure unique IDs
function ensureUniqueIds(stories: Story[]): Story[] {
  const seenIds = new Set<number>();
  return stories.map((story, index) => {
    let uniqueId = story.id;
    
    // If ID already exists, create a new one
    while (seenIds.has(uniqueId)) {
      uniqueId = story.id + index + Date.now() % 10000;
    }
    
    seenIds.add(uniqueId);
    return { ...story, id: uniqueId };
  });
}

interface Story {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: number;
  descendants?: number;
  subreddit?: string; // For Reddit: subreddit name
  thumbnail?: string; // For Reddit thumbnails
}

function SkeletonLoader() {
  return (
    <div className="animate-pulse flex items-start space-x-4 p-4 mb-4 border rounded-lg">
      <div className="w-24 h-24 bg-gray-300 rounded-md"></div>
      <div className="flex-1 space-y-4 py-1">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded"></div>
          <div className="h-4 bg-gray-300 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
}

function StoryItemGrid({ story }: { story: Story }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

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

  useEffect(() => {
    async function fetchImage() {
      const subject = extractSubject(story.title);
      const response = await fetch(`/api/search-image?query=${encodeURIComponent(subject)}`);
      const data = await response.json();
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
      }
      setIsLoadingImage(false);
    }
    fetchImage();
  }, [story.title]);

  useEffect(() => {
    async function fetchSummary() {
      if (!story.url) {
        setIsLoadingSummary(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/summarize?url=${encodeURIComponent(story.url)}&title=${encodeURIComponent(story.title)}`);
        const data = await response.json();
        if (data.summary) {
          setSummary(data.summary);
        }
      } catch (error) {
        console.error('Error fetching summary:', error);
      }
      setIsLoadingSummary(false);
    }
    fetchSummary();
  }, [story.url, story.title]);

  if (isLoadingImage) {
    return (
      <div className="bg-card-background border border-card-border rounded-lg p-4 animate-pulse">
        <div className="w-full h-48 bg-gray-300 rounded-md mb-4"></div>
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <a 
      href={story.url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="block bg-card-background border border-card-border rounded-lg p-4 flex flex-col h-full hover:border-link-color transition-colors"
    >
      {imageUrl && (
        <Image 
          src={imageUrl} 
          alt={story.title} 
          width={400} 
          height={192} 
          className="w-full h-48 object-cover rounded-md mb-4" 
        />
      )}
      <div className="flex-1 flex flex-col">
        <h3 className="text-link-color text-lg font-semibold mb-2 line-clamp-2">
          {story.title}
        </h3>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-text-secondary">
            by {story.by}
            {story.subreddit && (
              <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs block mt-1">
                r/{story.subreddit}
              </span>
            )}
          </p>
          <div className="flex flex-col items-end gap-1">
            {story.descendants && story.descendants > 0 && (
              <span className="text-xs text-text-secondary">
                {story.descendants} comments
              </span>
            )}
            <div className="bg-link-color text-white px-2 py-1 rounded-full text-xs font-medium">
              {story.score} pts
            </div>
          </div>
        </div>
        
        {/* Summary section - inline style */}
        <div className="mt-auto">
          {isLoadingSummary ? (
            <div className="animate-pulse">
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
            </div>
          ) : summary ? (
            <p className="text-sm text-text-secondary line-clamp-3">{summary}</p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">No summary available</p>
          )}
        </div>
      </div>
    </a>
  );
}

function StoryItem({ story }: { story: Story }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

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

  useEffect(() => {
    async function fetchImage() {
      const subject = extractSubject(story.title);
      const response = await fetch(`/api/search-image?query=${encodeURIComponent(subject)}`);
      const data = await response.json();
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
      }
      setIsLoadingImage(false);
    }
    fetchImage();
  }, [story.title]);

  useEffect(() => {
    async function fetchSummary() {
      if (!story.url) {
        setIsLoadingSummary(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/summarize?url=${encodeURIComponent(story.url)}&title=${encodeURIComponent(story.title)}`);
        const data = await response.json();
        if (data.summary) {
          setSummary(data.summary);
        }
      } catch (error) {
        console.error('Error fetching summary:', error);
      }
      setIsLoadingSummary(false);
    }
    fetchSummary();
  }, [story.url, story.title]);

  if (isLoadingImage) {
    return <SkeletonLoader />;
  }

  return (
    <li>
      <a 
        href={story.url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="bg-card-background border border-card-border rounded-lg flex items-start space-x-4 p-4 mb-4 block hover:border-link-color transition-colors"
      >
        {imageUrl && (
          <Image 
            src={imageUrl} 
            alt={story.title} 
            width={96} 
            height={96} 
            className="w-24 h-24 object-cover rounded-md" 
          />
        )}
        <div className="flex-1">
          <h3 className="text-link-color text-lg font-semibold">
            {story.title}
          </h3>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-text-secondary">
              by {story.by}
              {story.subreddit && (
                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                  r/{story.subreddit}
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              {story.descendants && story.descendants > 0 && (
                <span className="text-xs text-text-secondary">
                  {story.descendants} comments
                </span>
              )}
              <div className="bg-link-color text-white px-2 py-1 rounded-full text-xs font-medium">
                {story.score} pts
              </div>
            </div>
          </div>
          
          {/* Summary section - inline style */}
          <div className="mt-2">
            {isLoadingSummary ? (
              <div className="animate-pulse">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              </div>
            ) : summary ? (
              <p className="text-sm text-text-secondary">{summary}</p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">No summary available</p>
            )}
          </div>
        </div>
      </a>
    </li>
  );
}

async function getTopStories(): Promise<number[]> {
  const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
  return response.json();
}

async function getStory(id: number): Promise<Story> {
  const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
  return response.json();
}

export default function PageSuspenseWrapper() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}

function HomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [storyIds, setStoryIds] = useState<number[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [isViewModeLoaded, setIsViewModeLoaded] = useState(false);
  const [category, setCategory] = useState<Category>(
    (searchParams.get('category') as Category) || 'hacker-news'
  );
  const storiesPerPage = 10;

  // Load view mode preference from URL or localStorage
  useEffect(() => {
    const urlViewMode = searchParams.get('view') as 'list' | 'grid';
    const savedViewMode = localStorage.getItem('viewMode') as 'list' | 'grid';
    if (urlViewMode) {
      setViewMode(urlViewMode);
    } else if (savedViewMode) {
      setViewMode(savedViewMode);
    }
    setIsViewModeLoaded(true);
  }, [searchParams]);

  // Save view mode preference and update URL
  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('viewMode', mode);
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', mode);
    params.set('category', category);
    router.push(`/?${params.toString()}`);
  };

  // Fetch data based on category
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setStories([]);
      setPage(1);
      
      if (category === 'hacker-news') {
        // Fetch Hacker News data
        const ids = await getTopStories();
        setStoryIds(ids);
      } else if (category === 'reddit') {
        // Fetch initial Reddit data
        try {
          const { fetchRedditStories } = await import('@/utils/redditApi');
          const redditStories = await fetchRedditStories(12);
          
          // Ensure absolutely unique IDs for Reddit stories
          const uniqueStories = ensureUniqueIds(redditStories);
          
          setStories(uniqueStories);
          setStoryIds([]); // Reddit doesn't use storyIds
        } catch (error) {
          console.error('Failed to fetch Reddit stories:', error);
          setStories([]); // Set empty array on error
        }
      }
      
      setIsLoading(false);
    }
    
    fetchData();
  }, [category]);

  useEffect(() => {
    async function fetchStories() {
      if (category === 'hacker-news') {
        // Fetch stories for Hacker News category
        if (storyIds.length === 0) return;
        
        const end = page * storiesPerPage;
        const start = end - storiesPerPage;
        const idsToFetch = storyIds.slice(start, end);
        const newStories = await Promise.all(idsToFetch.map(id => getStory(id)));
        
        // Ensure no duplicate stories by ID
        setStories(prevStories => {
          const existingIds = new Set(prevStories.map(story => story.id));
          const uniqueNewStories = newStories.filter(story => !existingIds.has(story.id));
          const combinedStories = [...prevStories, ...uniqueNewStories];
          
          // Apply additional uniqueness check
          return ensureUniqueIds(combinedStories);
        });
      } else if (category === 'reddit' && page > 1) {
        // Fetch more Reddit stories when page increases
        try {
          const { fetchRedditStories } = await import('@/utils/redditApi');
          const additionalStories = await fetchRedditStories(12); // Fetch 12 more stories
          
          // Ensure absolutely unique IDs for new Reddit stories
          const uniqueNewStories = ensureUniqueIds(additionalStories);
          
          setStories(prevStories => {
            const existingIds = new Set(prevStories.map(story => story.id));
            const filteredNewStories = uniqueNewStories.filter(story => !existingIds.has(story.id));
            const combinedStories = [...prevStories, ...filteredNewStories];
            
            // Apply additional uniqueness check
            return ensureUniqueIds(combinedStories);
          });
        } catch (error) {
          console.error('Failed to fetch more Reddit stories:', error);
          // Don't show error to user, just log it and continue with existing stories
        }
      }
    }
    
    fetchStories();
  }, [storyIds, page, category]);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {category === 'hacker-news' ? 'Hacker News' : 'Reddit'}
          </h1>
          
          {/* View Toggle - only render after view mode is loaded */}
          {isViewModeLoaded && (
            <div className="flex gap-2">
              <button
                onClick={() => handleViewModeChange('list')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'outline outline-2 outline-link-color text-link-color bg-transparent'
                    : 'bg-card-background text-foreground hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List
              </button>
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'outline outline-2 outline-link-color text-link-color bg-transparent'
                    : 'bg-card-background text-foreground hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Grid
              </button>
            </div>
          )}
        </div>

        {/* Category Navigation */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Category Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('category', 'hacker-news');
                  params.set('view', viewMode);
                  router.push(`/?${params.toString()}`);
                  setCategory('hacker-news');
                }}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  category === 'hacker-news'
                    ? 'bg-link-color text-white outline outline-2 outline-link-color'
                    : 'bg-card-background text-foreground hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                🔥 Hacker News
              </button>
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('category', 'reddit');
                  params.set('view', viewMode);
                  router.push(`/?${params.toString()}`);
                  setCategory('reddit');
                }}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  category === 'reddit'
                    ? 'bg-link-color text-white outline outline-2 outline-link-color'
                    : 'bg-card-background text-foreground hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                🚀 Reddit
              </button>
            </div>


          </div>
        </div>

        {isLoading ? (
          viewMode === 'list' ? (
            <ul>
              {Array.from({ length: storiesPerPage }).map((_, index) => (
                <SkeletonLoader key={index} />
              ))}
            </ul>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: storiesPerPage }).map((_, index) => (
                <div key={index} className="bg-card-background border border-card-border rounded-lg p-4 animate-pulse">
                  <div className="w-full h-48 bg-gray-300 rounded-md mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          )
        ) : viewMode === 'list' ? (
          <ul>
            {stories.map((story, index) => (
              <StoryItem key={`${story.id}-${index}`} story={story} />
            ))}
          </ul>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story, index) => (
              <StoryItemGrid key={`${story.id}-${index}`} story={story} />
            ))}
          </div>
        )}
        
        {/* Load More Button - for both categories */}
        {stories.length > 0 && (
          <div className="flex justify-center">
            <button
              onClick={() => setPage(prevPage => prevPage + 1)}
              className="bg-link-color hover:bg-blue-600 active:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg mt-6 transition-all duration-200 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-link-color focus:ring-offset-2"
            >
              Load More Stories
            </button>
          </div>
        )}
        
        {/* Reddit Info */}
        {category === 'reddit' && stories.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Showing top {stories.length} posts across all subreddits, sorted by score
          </div>
        )}
      </div>
    </div>
  );
}
