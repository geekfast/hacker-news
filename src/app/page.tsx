'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStoryAssets } from '@/hooks/useStoryAssets';
import FallbackImage from '@/components/FallbackImage';

type Category = 'hacker-news' | 'reddit' | 'tech-news';

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

function ensureUniqueIds(stories: Story[]): Story[] {
  const seenIds = new Set<number>();
  return stories.map((story, index) => {
    let uniqueId = story.id;
    if (seenIds.has(uniqueId)) {
      const createHash = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash | 0;
        }
        return Math.abs(hash);
      };
      uniqueId = createHash(story.title + (story.url || '') + index.toString());
    }
    seenIds.add(uniqueId);
    return { ...story, id: uniqueId };
  });
}

function timeAgo(unixTime: number): string {
  const seconds = Math.floor(Date.now() / 1000 - unixTime);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function SourceBadge({ story }: { story: Story }) {
  if (story.subreddit) {
    return (
      <span className="text-[11px] text-text-secondary">
        r/{story.subreddit}
      </span>
    );
  }
  if (story.source) {
    const label = story.source === 'github' ? 'GitHub' :
                  story.source === 'devto' ? 'Dev.to' : story.source;
    return (
      <span className="text-[11px] text-text-secondary">
        {label}
      </span>
    );
  }
  return null;
}

function GridSkeleton() {
  return (
    <div className="bg-card-background border border-card-border rounded-xl overflow-hidden animate-pulse">
      <div className="h-44 bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-2/3" />
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="bg-card-background border border-card-border rounded-lg p-3 flex gap-3 animate-pulse">
      <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2 py-0.5">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-2/3" />
      </div>
    </div>
  );
}

function StoryItemGrid({ story }: { story: Story }) {
  const { imageUrl, summary, isLoadingSummary } = useStoryAssets({ story });

  return (
    <a
      href={story.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-card-background border border-card-border rounded-xl overflow-hidden hover:border-link/40 transition-all duration-200"
    >
      <div className="h-44 overflow-hidden">
        <FallbackImage
          src={imageUrl || ''}
          alt={story.title}
          width={400}
          height={176}
          className="w-full h-44 object-cover group-hover:scale-[1.02] transition-transform duration-300"
          fallbackType="grid"
        />
      </div>
      <div className="p-4">
        <h3 className="text-[15px] font-semibold leading-snug line-clamp-2 text-foreground mb-2">
          {story.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-2">
          <SourceBadge story={story} />
          {story.subreddit || story.source ? (
            <span className="text-text-secondary/40">·</span>
          ) : null}
          <span>{story.by}</span>
          <span className="text-text-secondary/40">·</span>
          <span>{timeAgo(story.time)}</span>
          <span className="text-text-secondary/40">·</span>
          <span className="text-accent-green font-medium">{story.score}</span>
        </div>
        {isLoadingSummary ? (
          <div className="space-y-1.5">
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
        ) : summary ? (
          <p className="text-[13px] text-text-secondary line-clamp-2">{summary}</p>
        ) : null}
      </div>
    </a>
  );
}

function StoryItem({ story }: { story: Story }) {
  const { imageUrl, summary, isLoadingSummary } = useStoryAssets({ story });

  return (
    <li>
      <a
        href={story.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block bg-card-background border border-card-border rounded-lg p-3 flex gap-3 hover:border-l-2 hover:border-l-link transition-all duration-200"
      >
        <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg">
          <FallbackImage
            src={imageUrl || ''}
            alt={story.title}
            width={64}
            height={64}
            className="w-16 h-16 object-cover"
            fallbackType="list"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold line-clamp-1 text-foreground mb-1">
            {story.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
            <SourceBadge story={story} />
            {story.subreddit || story.source ? (
              <span className="text-text-secondary/40">·</span>
            ) : null}
            <span>{story.by}</span>
            <span className="text-text-secondary/40">·</span>
            <span>{timeAgo(story.time)}</span>
            <span className="text-text-secondary/40">·</span>
            <span className="text-accent-green font-medium">{story.score}</span>
          </div>
          {isLoadingSummary ? (
            <div className="h-3 bg-muted rounded w-2/3 mt-1" />
          ) : summary ? (
            <p className="text-xs text-text-secondary line-clamp-1">{summary}</p>
          ) : null}
        </div>
      </a>
    </li>
  );
}

async function getTopStories(): Promise<number[]> {
  try {
    const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching top stories:', error);
    return [];
  }
}

async function getStory(id: number): Promise<Story | null> {
  try {
    const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
    if (!response.ok) throw new Error(`Failed to fetch story ${id}: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error(`Error fetching story ${id}:`, error);
    return null;
  }
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
  const [displayedStories, setDisplayedStories] = useState<Story[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [isViewModeLoaded, setIsViewModeLoaded] = useState(false);
  const [category, setCategory] = useState<Category>(
    (searchParams.get('category') as Category) || 'hacker-news'
  );
  const [availableSources, setAvailableSources] = useState<string[]>(['hacker-news', 'reddit', 'tech-news']);

  const ITEMS_PER_PAGE = 12;

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

  useEffect(() => {
    if (stories.length > 0) {
      setDisplayedStories(stories.slice(0, ITEMS_PER_PAGE));
      setPage(1);
    }
  }, [stories]);

  const loadMoreStories = () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    const currentLength = displayedStories.length;
    const nextPageItems = stories.slice(currentLength, currentLength + ITEMS_PER_PAGE);
    setTimeout(() => {
      setDisplayedStories(prev => [...prev, ...nextPageItems]);
      setIsLoadingMore(false);
    }, 500);
  };

  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('viewMode', mode);
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', mode);
    params.set('category', category);
    router.replace(`/?${params.toString()}`);
  };

  const handleCategoryChange = (cat: Category) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('category', cat);
    params.set('view', viewMode);
    router.push(`/?${params.toString()}`);
    setCategory(cat);
  };

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setStories([]);
      setPage(1);

      if (category === 'hacker-news') {
        const ids = await getTopStories();
        setStoryIds(ids);
      } else if (category === 'reddit') {
        try {
          const response = await fetch('/api/reddit?limit=50');
          const data = await response.json();
          if (data.available === false || data.posts.length === 0) {
            setAvailableSources(prev => prev.filter(s => s !== 'reddit'));
            setCategory('tech-news');
            return;
          }
          setAvailableSources(prev => [...new Set([...prev, 'reddit'])]);
          const { fetchRedditStories } = await import('@/utils/redditApi');
          const redditStories = await fetchRedditStories(50);
          setStories(ensureUniqueIds(redditStories));
          setStoryIds([]);
        } catch (error) {
          console.error('Failed to fetch Reddit stories:', error);
          setAvailableSources(prev => prev.filter(s => s !== 'reddit'));
          setStories([]);
          setCategory('tech-news');
        }
      } else if (category === 'tech-news') {
        try {
          const response = await fetch('/api/aggregate?sources=github,devto&include_reddit=false&limit=50');
          const data = await response.json();
          const newAvailableSources = ['hacker-news', 'tech-news'];
          if (data.sources && Object.keys(data.sources).length > 0) {
            const workingSources = Object.keys(data.sources).filter((source: string) =>
              data.sources[source].available !== false && data.sources[source].success
            );
            if (workingSources.length > 0) {
              setAvailableSources(prev => [...new Set([...prev, ...newAvailableSources])]);
            }
          }
          if (data.posts && data.posts.length > 0) {
            const techStories = data.posts.map((post: {
              id: string | number;
              title: string;
              url?: string;
              permalink?: string;
              score?: number;
              author?: string;
              time?: number;
              created_utc?: number;
              num_comments?: number;
              descendants?: number;
              subreddit?: string;
              source?: string;
            }) => ({
              id: typeof post.id === 'string' ? parseInt(post.id) || Math.floor(Math.random() * 1000000) : post.id,
              title: post.title,
              url: post.url || post.permalink,
              score: post.score || 1,
              by: post.author || 'unknown',
              time: post.created_utc || Math.floor(Date.now() / 1000),
              descendants: post.num_comments || 0,
              subreddit: post.subreddit,
              source: post.source,
            }));
            setStories(ensureUniqueIds(techStories));
          } else {
            setStories([]);
          }
          setStoryIds([]);
        } catch (error) {
          console.error('Failed to fetch tech news:', error);
          setStories([]);
        }
      }

      setIsLoading(false);
    }

    fetchData();
  }, [category]);

  useEffect(() => {
    async function fetchHackerNewsStories() {
      if (category === 'hacker-news' && storyIds.length > 0) {
        setIsLoading(true);
        try {
          const idsToFetch = storyIds.slice(0, 50);
          const storyPromises = idsToFetch.map(id => getStory(id));
          const fetchedStories = await Promise.all(storyPromises);
          setStories(fetchedStories.filter((story): story is Story => story !== null));
        } catch (error) {
          console.error('Error fetching Hacker News stories:', error);
          setStories([]);
        } finally {
          setIsLoading(false);
        }
      }
    }
    fetchHackerNewsStories();
  }, [storyIds, category]);

  const categories: { key: Category; label: string }[] = [
    { key: 'tech-news', label: 'Tech News' },
    { key: 'hacker-news', label: 'Hacker News' },
    ...(availableSources.includes('reddit') ? [{ key: 'reddit' as Category, label: 'Reddit' }] : []),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4">
        {/* Category Tabs + View Toggle */}
        <div className="flex items-center justify-between py-4 border-b border-card-border">
          <nav className="flex gap-6">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                className={`text-sm font-medium pb-1 transition-colors ${
                  category === cat.key
                    ? 'text-foreground border-b-2 border-link'
                    : 'text-text-secondary hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </nav>

          {isViewModeLoaded && (
            <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-1.5 rounded-md transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-card-background shadow-sm text-foreground'
                    : 'text-text-secondary hover:text-foreground'
                }`}
                title="List View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-1.5 rounded-md transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-card-background shadow-sm text-foreground'
                    : 'text-text-secondary hover:text-foreground'
                }`}
                title="Grid View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="py-6">
          {isLoading ? (
            viewMode === 'list' ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ListSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <GridSkeleton key={i} />
                ))}
              </div>
            )
          ) : viewMode === 'list' ? (
            <div className="space-y-3">
              {displayedStories.map((story, index) => (
                <StoryItem key={`${story.id}-${index}`} story={story} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedStories.map((story, index) => (
                <StoryItemGrid key={`${story.id}-${index}`} story={story} />
              ))}
            </div>
          )}
        </div>

        {/* Load More */}
        {!isLoading && displayedStories.length > 0 && displayedStories.length < stories.length && (
          <div className="flex justify-center pb-12">
            <button
              onClick={loadMoreStories}
              disabled={isLoadingMore}
              className="border border-card-border rounded-lg px-6 py-2.5 text-sm font-medium text-text-secondary hover:text-foreground hover:border-foreground/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading
                </span>
              ) : (
                `Load more (${stories.length - displayedStories.length} remaining)`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
