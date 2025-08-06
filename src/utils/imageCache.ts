import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), 'public', 'cache');
const CACHE_INDEX_FILE = path.join(CACHE_DIR, 'index.json');

interface CacheIndex {
  [query: string]: {
    filename: string;
    timestamp: number;
    originalUrl: string;
  };
}

// Utility function to generate safe filename from query
function generateFilename(query: string): string {
  const hash = createHash('md5').update(query).digest('hex');
  return `${hash}.jpg`;
}

// Ensure cache directory exists
async function ensureCacheDir(): Promise<void> {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

// Load cache index
async function loadCacheIndex(): Promise<CacheIndex> {
  try {
    const data = await fs.readFile(CACHE_INDEX_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Save cache index
async function saveCacheIndex(index: CacheIndex): Promise<void> {
  await ensureCacheDir();
  await fs.writeFile(CACHE_INDEX_FILE, JSON.stringify(index, null, 2));
}

// Check if image exists in cache
export async function getCachedImage(query: string): Promise<string | null> {
  try {
    const index = await loadCacheIndex();
    const cacheEntry = index[query.toLowerCase()];
    
    if (!cacheEntry) {
      return null;
    }
    
    const filePath = path.join(CACHE_DIR, cacheEntry.filename);
    
    // Check if file actually exists
    try {
      await fs.access(filePath);
      return `/cache/${cacheEntry.filename}`;
    } catch {
      // File doesn't exist, remove from index
      delete index[query.toLowerCase()];
      await saveCacheIndex(index);
      return null;
    }
  } catch (error) {
    console.error('Error checking cache:', error);
    return null;
  }
}

// Download and cache image
export async function cacheImage(query: string, imageUrl: string): Promise<string> {
  try {
    await ensureCacheDir();
    
    const filename = generateFilename(query);
    const filePath = path.join(CACHE_DIR, filename);
    
    // Download image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Save image to disk
    await fs.writeFile(filePath, buffer);
    
    // Update cache index
    const index = await loadCacheIndex();
    index[query.toLowerCase()] = {
      filename,
      timestamp: Date.now(),
      originalUrl: imageUrl,
    };
    await saveCacheIndex(index);
    
    return `/cache/${filename}`;
  } catch (error) {
    console.error('Error caching image:', error);
    throw error;
  }
}

// Clean old cache entries (optional - call this periodically)
export async function cleanOldCache(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  try {
    const index = await loadCacheIndex();
    const now = Date.now();
    let modified = false;
    
    for (const [query, entry] of Object.entries(index)) {
      if (now - entry.timestamp > maxAgeMs) {
        // Delete file
        const filePath = path.join(CACHE_DIR, entry.filename);
        try {
          await fs.unlink(filePath);
        } catch {
          // File might already be deleted
        }
        
        // Remove from index
        delete index[query];
        modified = true;
      }
    }
    
    if (modified) {
      await saveCacheIndex(index);
    }
  } catch (error) {
    console.error('Error cleaning cache:', error);
  }
}
