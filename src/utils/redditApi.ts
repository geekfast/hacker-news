export interface Story {
  id: number;
  title: string;
  url: string;
  score: number;
  by: string;
  time: number;
  descendants: number;
  subreddit?: string;
}

export interface RedditPost {
  id: string;
  title: string;
  url: string;
  score: number;
  author: string;
  created: number;
  comments: number;
  subreddit: string;
  thumbnail?: string;
  selftext?: string;
  is_self: boolean;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchRedditStories = async (limit: number = 12): Promise<Story[]> => {
  const maxAttempts = 3;
  const baseDelayMs = 600;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔍 Fetching aggregated Reddit stories (attempt ${attempt}/${maxAttempts})`);
      
      const response = await fetch(`/api/reddit?limit=${limit}`, { cache: 'no-store' });
      
      if (!response.ok) {
        console.error(`❌ Reddit API error: ${response.status} ${response.statusText}`);
        throw new Error(`Reddit API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.posts || !Array.isArray(data.posts)) {
        console.error('❌ Invalid Reddit API response format:', data);
        throw new Error('Invalid Reddit API response format');
      }
      
      if (data.posts.length === 0) {
        throw new Error('Empty Reddit response');
      }
      
      console.log(`✅ Received ${data.posts.length} aggregated Reddit posts`);
      
      return data.posts.map(convertRedditToStory);
    } catch (error) {
      console.error(`Error fetching aggregated Reddit stories (attempt ${attempt}):`, error);
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await sleep(delay);
        continue;
      }
      return [];
    }
  }

  return [];
};

// Helper function to convert Reddit post to Story format
const convertRedditToStory = (redditPost: RedditPost): Story => {
  // Create a stable hash from the title and URL for a consistent numeric ID
  const stringToHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash | 0; // Convert to 32-bit signed integer
    }
    return Math.abs(hash); // Ensure positive number
  };

  const hashId = stringToHash(redditPost.title + redditPost.url);
  
  return {
    id: hashId + (redditPost.created % 1000), // Ensure uniqueness with timestamp
    title: redditPost.title,
    url: redditPost.url,
    score: redditPost.score,
    by: redditPost.author,
    time: redditPost.created,
    descendants: redditPost.comments,
    subreddit: redditPost.subreddit
  };
};
