import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';

const SUMMARY_CACHE_DIR = path.join(process.cwd(), 'public', 'summary-cache');
const SUMMARY_INDEX_FILE = path.join(SUMMARY_CACHE_DIR, 'index.json');
const CACHE_EXPIRY_DAYS = 7; // Summaries expire after 7 days

interface SummaryCacheEntry {
  summary: string;
  timestamp: number;
  title: string;
  urlHash: string;
}

interface SummaryCacheIndex {
  [urlHash: string]: SummaryCacheEntry;
}

function generateUrlHash(url: string): string {
  return createHash('md5').update(url).digest('hex');
}

async function ensureCacheDirectory(): Promise<void> {
  try {
    await fs.access(SUMMARY_CACHE_DIR);
  } catch {
    await fs.mkdir(SUMMARY_CACHE_DIR, { recursive: true });
  }
}

async function loadCacheIndex(): Promise<SummaryCacheIndex> {
  try {
    const indexData = await fs.readFile(SUMMARY_INDEX_FILE, 'utf-8');
    return JSON.parse(indexData);
  } catch {
    return {};
  }
}

async function saveCacheIndex(index: SummaryCacheIndex): Promise<void> {
  await ensureCacheDirectory();
  
  // Atomic write: write to temp file then rename
  const tempFile = SUMMARY_INDEX_FILE + '.tmp';
  try {
    await fs.writeFile(tempFile, JSON.stringify(index, null, 2));
    await fs.rename(tempFile, SUMMARY_INDEX_FILE);
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempFile);
    } catch {}
    throw error;
  }
}

function isExpired(timestamp: number): boolean {
  const now = Date.now();
  const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  return (now - timestamp) > expiryTime;
}

export async function getCachedSummary(url: string): Promise<string | null> {
  try {
    const urlHash = generateUrlHash(url);
    const index = await loadCacheIndex();
    
    const cachedEntry = index[urlHash];
    if (!cachedEntry) {
      return null;
    }
    
    // Check if cache entry is expired
    if (isExpired(cachedEntry.timestamp)) {
      // Mark for cleanup but don't do it synchronously to avoid slowing down reads
      // The cleanup will happen during the next cache write or via scheduled cleanup
      return null;
    }
    
    return cachedEntry.summary;
  } catch (error) {
    console.error('Error reading cached summary:', error);
    return null;
  }
}

export async function cacheSummary(url: string, summary: string, title: string): Promise<void> {
  try {
    const urlHash = generateUrlHash(url);
    const index = await loadCacheIndex();
    
    // Clean up expired entries while we're here (lazy cleanup)
    const now = Date.now();
    let cleanedCount = 0;
    for (const [key, entry] of Object.entries(index)) {
      if (isExpired(entry.timestamp)) {
        delete index[key];
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned ${cleanedCount} expired summary cache entries during write`);
    }
    
    const cacheEntry: SummaryCacheEntry = {
      summary,
      timestamp: now,
      title,
      urlHash
    };
    
    index[urlHash] = cacheEntry;
    await saveCacheIndex(index);
    
    console.log(`Summary cached for URL: ${url.substring(0, 50)}...`);
  } catch (error) {
    console.error('Error caching summary:', error);
  }
}

export async function cleanOldSummaryCache(): Promise<void> {
  try {
    const index = await loadCacheIndex();
    let cleanedCount = 0;
    
    for (const [urlHash, entry] of Object.entries(index)) {
      if (isExpired(entry.timestamp)) {
        delete index[urlHash];
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      await saveCacheIndex(index);
      console.log(`Cleaned ${cleanedCount} expired summary cache entries`);
    }
    
    return;
  } catch (error) {
    console.error('Error cleaning summary cache:', error);
  }
}

export async function getSummaryCacheStats(): Promise<{
  totalEntries: number;
  totalSize: string;
  expiredEntries: number;
}> {
  try {
    const index = await loadCacheIndex();
    const entries = Object.values(index);
    
    let expiredCount = 0;
    entries.forEach(entry => {
      if (isExpired(entry.timestamp)) {
        expiredCount++;
      }
    });
    
    // Calculate approximate size
    const indexSize = JSON.stringify(index).length;
    const sizeInKB = (indexSize / 1024).toFixed(2);
    
    return {
      totalEntries: entries.length,
      totalSize: `${sizeInKB} KB`,
      expiredEntries: expiredCount
    };
  } catch (error) {
    console.error('Error getting summary cache stats:', error);
    return {
      totalEntries: 0,
      totalSize: '0 KB',
      expiredEntries: 0
    };
  }
}

export async function clearSummaryCache(): Promise<void> {
  try {
    await fs.rm(SUMMARY_CACHE_DIR, { recursive: true, force: true });
    console.log('Summary cache cleared');
  } catch (error) {
    console.error('Error clearing summary cache:', error);
  }
}
