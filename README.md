This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

- 📰 **Hacker News Integration**: Fetch and display top stories from Hacker News API
- � **Reddit Content Aggregation**: Multi-subreddit tech content with intelligent fallback system
- 🤖 **Cascade AI Summarization**: Triple-redundancy AI powered by Gemini → OpenAI → Template fallback
- 🖼️ **Smart Image Caching**: Automatic image generation and local caching for each news story
- 📋 **Dual View Modes**: Switch between List view (detailed) and Grid view (visual) with preference persistence
- 🎨 **Dark Theme**: Beautiful dark theme optimized for reading
- ⚡ **Performance**: Optimized with caching and skeleton loading states
- 🎨 **AI-Enhanced Images**: Gemini-powered contextual image generation with Unsplash fallback

## AI Summarization System

The app features a sophisticated cascade AI summarization system that ensures reliable content summarization:

### Triple-Redundancy Strategy
1. **🥇 Primary: Google Gemini** - Fast, cost-effective AI summarization using gemini-1.5-flash
2. **🥈 Secondary: OpenAI GPT-3.5-turbo** - Reliable fallback for when Gemini is unavailable
3. **🥉 Tertiary: Template-based** - Always-available dummy summarization as final fallback

### Environment Variables Required
```bash
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

## Reddit Integration

The app aggregates content from multiple tech-focused subreddits with intelligent fallback:

### Subreddits Monitored
- programming, javascript, webdev, technology
- MachineLearning, artificial, coding, compsci

### Environment Variables
```bash
REDDIT_FALLBACK_ENABLED=true  # Enable high-quality mock data when Reddit is inaccessible
```

### Smart Fallback System
- Monitors SSL certificate health and connection timeouts
- Automatically switches to curated mock data when 75%+ of subreddits fail
- Provides seamless user experience even when Reddit is blocked or unavailable

## API Endpoints

### `/api/reddit`
- Aggregates content from 8 tech-focused subreddits
- Intelligent fallback to high-quality mock data
- SSL-aware connection handling with timeout management

### `/api/summarize` 
- **Cascade AI Strategy**: Gemini → OpenAI → Template fallback
- Smart content extraction with intelligent retry logic
- Comprehensive error handling and caching

### `/api/generate-image`
- Generate contextual image descriptions using Gemini AI
- Enhanced search queries for more relevant visual content
- Seamless fallback to traditional image search

### `/api/search-image`
- Search and cache images based on news story titles
- Automatic local storage to reduce external API calls

### `/api/clean-cache`
- Clean old cached images and summaries
- Configurable retention periods

## Cache Management

```bash
# View cache status
npm run cache:status

# Clean old cache (>7 days)
npm run cache:clean

# Clear all cache
npm run cache:clear
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Image Caching System

This project includes an intelligent image caching system that reduces API calls to Unsplash and improves performance:

### Features
- **Local Caching**: Images are downloaded and stored locally in `public/cache/`
- **Persistent Storage**: Cache survives server restarts
- **Smart Cache Management**: Built-in utilities for cache maintenance

### API Endpoints
- `GET /api/search-image?query=<search_term>` - Search and cache images
- `POST /api/clean-cache` - Clean old cache entries

### Cache Management Commands
```bash
npm run cache:status  # Show cache status and size
npm run cache:clean   # Clean cache older than 7 days  
npm run cache:clear   # Clear all cached images
```

### Benefits
- ✅ **Reduced API Calls**: Images only fetched once from Unsplash
- ✅ **Faster Loading**: Serve images directly from local storage
- ✅ **Cost Effective**: Reduce Unsplash API quota usage
- ✅ **Offline Support**: Images available even when API is down

For detailed information, see [CACHE_SYSTEM.md](CACHE_SYSTEM.md)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
