import { NextRequest, NextResponse } from 'next/server';

// All subreddits we want to aggregate
const ALL_SUBREDDITS = [
  'programming',
  'javascript', 
  'webdev',
  'technology',
  'MachineLearning',
  'artificial',
  'coding',
  'compsci'
];

interface RedditPost {
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

const generateMockRedditPosts = (subreddit: string, count: number): RedditPost[] => {
  const posts: RedditPost[] = [];
  
  const subredditContent = {
    programming: [
      { title: "Why I stopped using React and switched to Vanilla JS", score: 850, url: "https://medium.com/@dev/vanilla-js" },
      { title: "Building a compiler from scratch in Rust", score: 720, url: "https://github.com/rustlang/compiler" },
      { title: "The art of writing clean, maintainable code", score: 680, url: "https://cleancode.dev" },
      { title: "Memory management in modern programming languages", score: 590, url: "https://programming.blog/memory" },
      { title: "Functional programming concepts every developer should know", score: 540, url: "https://functional.dev" }
    ],
    javascript: [
      { title: "New JavaScript features in ES2024 that will blow your mind", score: 920, url: "https://js-features.com/es2024" },
      { title: "Vue 4 vs React 19: Performance benchmarks", score: 780, url: "https://framework-bench.com" },
      { title: "Building reactive UIs without frameworks", score: 650, url: "https://reactive-ui.dev" },
      { title: "TypeScript 5.5 introduces new type system features", score: 590, url: "https://typescript.org/5.5" },
      { title: "Modern JavaScript bundling with Vite and Rollup", score: 480, url: "https://bundling.guide" }
    ],
    webdev: [
      { title: "CSS Grid vs Flexbox: When to use what in 2024", score: 820, url: "https://css-layout.guide" },
      { title: "Building responsive web apps with Container Queries", score: 750, url: "https://container-queries.dev" },
      { title: "Web accessibility guidelines every developer must follow", score: 690, url: "https://a11y-guide.com" },
      { title: "Progressive Web Apps: The complete developer guide", score: 580, url: "https://pwa-guide.dev" },
      { title: "Optimizing Core Web Vitals for better SEO", score: 520, url: "https://web-vitals.guide" }
    ],
    technology: [
      { title: "Apple's new M4 chip breaks all performance records", score: 1200, url: "https://apple.com/m4-chip" },
      { title: "Quantum computing breakthrough at IBM", score: 980, url: "https://ibm.com/quantum" },
      { title: "Tesla's new autopilot system uses advanced AI", score: 870, url: "https://tesla.com/autopilot" },
      { title: "SpaceX successfully launches reusable rocket", score: 760, url: "https://spacex.com/launch" },
      { title: "5G network expansion reaches rural areas", score: 650, url: "https://5g-expansion.com" }
    ],
    MachineLearning: [
      { title: "GPT-5 leaked benchmarks show 95% accuracy improvement", score: 1150, url: "https://openai.com/gpt5" },
      { title: "Google's new LLM outperforms ChatGPT in coding tasks", score: 980, url: "https://google.ai/llm" },
      { title: "Machine learning model predicts climate change with 99% accuracy", score: 890, url: "https://climate-ml.org" },
      { title: "Neural networks that can reason like humans", score: 780, url: "https://neural-reasoning.com" },
      { title: "Computer vision breakthrough in medical diagnosis", score: 720, url: "https://medical-ai.dev" }
    ],
    artificial: [
      { title: "AI discovers new antibiotic compounds", score: 1050, url: "https://ai-antibiotics.com" },
      { title: "Artificial general intelligence timeline predictions", score: 920, url: "https://agi-timeline.org" },
      { title: "AI-powered code generation reaches production quality", score: 810, url: "https://ai-coding.dev" },
      { title: "Ethical AI framework adopted by major tech companies", score: 700, url: "https://ethical-ai.org" },
      { title: "AI revolutionizes drug discovery process", score: 640, url: "https://ai-pharma.com" }
    ],
    coding: [
      { title: "GitHub Copilot now supports 50+ programming languages", score: 860, url: "https://github.com/copilot" },
      { title: "Visual Studio Code gets AI-powered debugging", score: 750, url: "https://vscode.dev/ai-debug" },
      { title: "Leetcode alternatives for coding interview prep", score: 680, url: "https://coding-prep.dev" },
      { title: "Code review best practices from senior engineers", score: 590, url: "https://code-review.guide" },
      { title: "Building microservices with Docker and Kubernetes", score: 530, url: "https://microservices.dev" }
    ],
    compsci: [
      { title: "Breakthrough in quantum algorithms for optimization", score: 950, url: "https://quantum-algo.edu" },
      { title: "New data structure achieves O(1) for all operations", score: 840, url: "https://cs-research.edu" },
      { title: "Computer science curriculum overhaul at Stanford", score: 720, url: "https://stanford.edu/cs-curriculum" },
      { title: "Distributed systems consensus algorithm improvements", score: 650, url: "https://distributed-sys.edu" },
      { title: "Graph theory applications in social network analysis", score: 580, url: "https://graph-theory.edu" }
    ]
  };

  const content = subredditContent[subreddit as keyof typeof subredditContent] || subredditContent.programming;
  
  for (let i = 0; i < count && i < content.length; i++) {
    const post = content[i];
    posts.push({
      id: `reddit_${subreddit}_${i + 1}`,
      title: post.title,
      url: post.url,
      score: post.score,
      author: `user_${Math.floor(Math.random() * 1000)}`,
      created: Date.now() - Math.floor(Math.random() * 86400000),
      comments: Math.floor(Math.random() * 100) + 10,
      subreddit: subreddit,
      thumbnail: Math.random() > 0.5 ? `https://picsum.photos/150/150?random=${i}` : undefined,
      selftext: Math.random() > 0.7 ? "This is a self post with some content..." : "",
      is_self: Math.random() > 0.6
    });
  }

  return posts;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '12');

  try {
    console.log('🔍 Fetching aggregated Reddit data from all subreddits');

    // Aggregate posts from all subreddits
    const allPosts: RedditPost[] = [];
    
    for (const subreddit of ALL_SUBREDDITS) {
      const subredditPosts = generateMockRedditPosts(subreddit, 5); // Get 5 posts from each
      allPosts.push(...subredditPosts);
    }

    // Sort by score (highest first) and take the top posts
    const topPosts = allPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    console.log(`✅ Successfully aggregated ${topPosts.length} top posts from ${ALL_SUBREDDITS.length} subreddits`);
    console.log(`🏆 Top post: "${topPosts[0]?.title}" with ${topPosts[0]?.score} points from r/${topPosts[0]?.subreddit}`);
    console.log('📝 Note: Using mock data due to Reddit access restrictions in Indonesia');

    return NextResponse.json({ posts: topPosts });

  } catch (error) {
    console.error('Reddit aggregation error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch aggregated Reddit data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
