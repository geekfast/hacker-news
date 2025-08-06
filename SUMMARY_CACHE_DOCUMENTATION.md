# Summary Caching System

This document describes the summary caching implementation for the Hacker News application.

## Overview

The summary caching system reduces API calls and improves performance by storing generated summaries locally. It works similarly to the image caching system but is optimized for text content.

## Architecture

### Core Components

1. **Summary Cache Utility** (`src/utils/summaryCache.ts`)
   - Handles caching, retrieval, and management of summaries
   - Uses MD5 hashing of URLs as cache keys
   - Implements automatic expiration (7 days)

2. **Enhanced Summarize API** (`src/app/api/summarize/route.ts`)
   - Checks cache before generating summaries
   - Caches new summaries automatically
   - Falls back to content extraction if cache miss

3. **Cache Management API** (`src/app/api/clean-summary-cache/route.ts`)
   - Provides REST endpoints for cache management
   - Supports stats, cleaning, and clearing operations

## Cache Structure

### Storage Location
```
public/
└── summary-cache/
    └── index.json
```

### Cache Entry Format
```typescript
interface SummaryCacheEntry {
  summary: string;        // The generated summary text
  timestamp: number;      // When the summary was cached
  title: string;         // Original article title
  urlHash: string;       // MD5 hash of the URL
}
```

### Cache Index Format
```typescript
interface SummaryCacheIndex {
  [urlHash: string]: SummaryCacheEntry;
}
```

## API Endpoints

### Summary Generation with Caching
```
GET /api/summarize?url={url}&title={title}
```

**Response:**
```json
{
  "summary": "Generated summary text...",
  "source": "cache" | "content" | "title"
}
```

### Cache Management
```
GET /api/clean-summary-cache?action={action}
```

**Actions:**
- `stats` - Get cache statistics
- `clean` - Remove expired entries
- `clear` - Clear all cache

## CLI Management

### Available Commands

```bash
# Summary cache specific
npm run cache:summary-status    # Show summary cache status
npm run cache:summary-clean     # Clean expired summaries
npm run cache:summary-clear     # Clear all summaries

# Combined operations
npm run cache:all-status        # Show both image and summary cache status
```

### Direct Script Usage

```bash
node scripts/cache-manager.js summary-status
node scripts/cache-manager.js summary-clean
node scripts/cache-manager.js summary-clear
node scripts/cache-manager.js all-status
```

## Cache Behavior

### Cache Hit Flow
1. Request comes to `/api/summarize`
2. Generate URL hash using MD5
3. Check if hash exists in cache index
4. Verify entry is not expired (< 7 days)
5. Return cached summary immediately

### Cache Miss Flow
1. Extract content from URL
2. Generate summary using extractive algorithm
3. Store summary in cache with timestamp
4. Return generated summary

### Expiration Policy
- **Default TTL**: 7 days
- **Cleanup**: Manual via CLI or API
- **Auto-cleanup**: Not implemented (to avoid performance impact)

## Performance Benefits

### Before Caching
- Every request triggers content extraction
- Summary generation on every page load
- Higher latency for repeated articles

### After Caching
- Instant response for cached summaries
- Reduced server load
- Better user experience with faster loading

## Monitoring

### Cache Statistics
```bash
npm run cache:summary-status
```

**Output Example:**
```
📄 Summary Cache Status:

   Cached Summaries:
   ✅ OpenAI Announces GPT-5 (12/25/2024)
       OpenAI has announced the release of GPT-5, featuring...
   ✅ Apple Vision Pro Review (12/24/2024)
       The Apple Vision Pro represents a significant leap...

   Total: 15 summaries, 24.5 KB
```

### Cache Maintenance
```bash
npm run cache:summary-clean    # Remove expired entries
npm run cache:summary-clear    # Clear everything (use with caution)
```

## Integration with Existing System

### File Structure
```
src/
├── utils/
│   ├── imageCache.ts         # Existing image cache
│   └── summaryCache.ts       # New summary cache
├── app/api/
│   ├── search-image/route.ts # Uses image cache
│   ├── summarize/route.ts    # Uses summary cache
│   └── clean-summary-cache/  # Summary cache management
└── scripts/
    └── cache-manager.js      # Enhanced with summary support
```

### Shared Patterns
- Both systems use MD5 hashing for keys
- Similar expiration mechanisms (7 days)
- Consistent CLI management interface
- JSON-based index files

## Deployment Considerations

### Vercel Deployment
- Cache will be reset on each deployment
- Consider using external storage (Redis, etc.) for production
- Current implementation suitable for development/testing

### Local Development
- Cache persists between restarts
- Manual cleanup available via CLI
- No automatic background cleanup (by design)

## Future Enhancements

### Potential Improvements
1. **External Storage**: Redis or database for persistence
2. **Background Cleanup**: Automatic expired entry removal
3. **Cache Warming**: Pre-generate summaries for popular articles
4. **Compression**: Gzip cache entries to save space
5. **Analytics**: Track cache hit/miss ratios

### API Rate Limiting
The caching system effectively implements rate limiting by reducing redundant API calls for the same content.

## Error Handling

### Cache Failures
- Graceful degradation to content extraction
- Error logging without breaking functionality
- Fallback to title-based summaries

### Corrupted Cache
- Individual entry validation
- Automatic removal of invalid entries
- Full cache reset capability via CLI

## Security Considerations

### URL Validation
- Cache keys based on URL hashes (not content)
- No sensitive information stored in cache
- Public cache directory (no authentication needed)

### Cache Poisoning
- Low risk due to deterministic content extraction
- Cache entries include original title for verification
- Manual cache clearing available if needed
