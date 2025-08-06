#!/usr/bin/env node

/**
 * Cache Management Utility
 * 
 * Usage:
 *   node scripts/cache-manager.js status     # Show cache status
 *   node scripts/cache-manager.js clean      # Clean cache older than 7 days
 *   node scripts/cache-manager.js clear      # Clear all cache
 *   node scripts/cache-manager.js summary-status   # Show summary cache status
 *   node scripts/cache-manager.js summary-clean    # Clean old summary cache
 *   node scripts/cache-manager.js summary-clear    # Clear all summary cache
 */

const fs = require('fs').promises;
const path = require('path');

const CACHE_DIR = path.join(process.cwd(), 'public', 'cache');
const CACHE_INDEX_FILE = path.join(CACHE_DIR, 'index.json');
const SUMMARY_CACHE_DIR = path.join(process.cwd(), 'public', 'summary-cache');
const SUMMARY_INDEX_FILE = path.join(SUMMARY_CACHE_DIR, 'index.json');

async function loadCacheIndex() {
  try {
    const data = await fs.readFile(CACHE_INDEX_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function loadSummaryCacheIndex() {
  try {
    const data = await fs.readFile(SUMMARY_INDEX_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveCacheIndex(index) {
  await fs.writeFile(CACHE_INDEX_FILE, JSON.stringify(index, null, 2));
}

async function saveSummaryCacheIndex(index) {
  try {
    await fs.mkdir(SUMMARY_CACHE_DIR, { recursive: true });
  } catch {}
  await fs.writeFile(SUMMARY_INDEX_FILE, JSON.stringify(index, null, 2));
}

async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

async function formatBytes(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

async function showStatus() {
  console.log('📊 Cache Status\n');
  
  try {
    const index = await loadCacheIndex();
    const entries = Object.entries(index);
    
    if (entries.length === 0) {
      console.log('   No cached images found.');
      return;
    }
    
    let totalSize = 0;
    console.log('   Cached Images:');
    
    for (const [query, info] of entries) {
      const filePath = path.join(CACHE_DIR, info.filename);
      const size = await getFileSize(filePath);
      const date = new Date(info.timestamp).toLocaleDateString();
      
      totalSize += size;
      console.log(`   • ${query} (${await formatBytes(size)}) - ${date}`);
    }
    
    console.log(`\n   Total: ${entries.length} images, ${await formatBytes(totalSize)}`);
  } catch (error) {
    console.error('❌ Error reading cache:', error.message);
  }
}

async function cleanOldCache(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  console.log('🧹 Cleaning old cache entries...\n');
  
  try {
    const index = await loadCacheIndex();
    const now = Date.now();
    let removedCount = 0;
    let removedSize = 0;
    
    for (const [query, entry] of Object.entries(index)) {
      if (now - entry.timestamp > maxAgeMs) {
        const filePath = path.join(CACHE_DIR, entry.filename);
        const size = await getFileSize(filePath);
        
        try {
          await fs.unlink(filePath);
          removedSize += size;
          removedCount++;
          console.log(`   ✓ Removed: ${query} (${await formatBytes(size)})`);
        } catch {
          console.log(`   ⚠ Could not remove: ${query}`);
        }
        
        delete index[query];
      }
    }
    
    if (removedCount > 0) {
      await saveCacheIndex(index);
      console.log(`\n   ✅ Cleaned ${removedCount} entries, freed ${await formatBytes(removedSize)}`);
    } else {
      console.log('   ✅ No old entries to clean.');
    }
  } catch (error) {
    console.error('❌ Error cleaning cache:', error.message);
  }
}

async function clearAllCache() {
  console.log('🗑️  Clearing all cache...\n');
  
  try {
    const index = await loadCacheIndex();
    let removedCount = 0;
    let removedSize = 0;
    
    for (const [query, entry] of Object.entries(index)) {
      const filePath = path.join(CACHE_DIR, entry.filename);
      const size = await getFileSize(filePath);
      
      try {
        await fs.unlink(filePath);
        removedSize += size;
        removedCount++;
        console.log(`   ✓ Removed: ${query} (${await formatBytes(size)})`);
      } catch {
        console.log(`   ⚠ Could not remove: ${query}`);
      }
    }
    
    // Clear index
    await saveCacheIndex({});
    
    console.log(`\n   ✅ Cleared ${removedCount} entries, freed ${await formatBytes(removedSize)}`);
  } catch (error) {
    console.error('❌ Error clearing cache:', error.message);
  }
}

async function showSummaryStatus() {
  console.log('📄 Summary Cache Status:\n');
  
  try {
    const index = await loadSummaryCacheIndex();
    const entries = Object.entries(index);
    
    if (entries.length === 0) {
      console.log('   No cached summaries found.');
      return;
    }
    
    let totalSize = 0;
    let expiredCount = 0;
    const now = Date.now();
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    console.log('   Cached Summaries:');
    
    for (const [urlHash, info] of entries) {
      const age = now - info.timestamp;
      const isExpired = age > maxAgeMs;
      const date = new Date(info.timestamp).toLocaleDateString();
      const summaryPreview = info.summary.substring(0, 50) + '...';
      
      if (isExpired) expiredCount++;
      
      const entrySize = JSON.stringify(info).length;
      totalSize += entrySize;
      
      const status = isExpired ? '⚠️ EXPIRED' : '✅';
      console.log(`   ${status} ${info.title} (${date})`);
      console.log(`       ${summaryPreview}`);
    }
    
    console.log(`\n   Total: ${entries.length} summaries, ${await formatBytes(totalSize)}`);
    if (expiredCount > 0) {
      console.log(`   ⚠️  ${expiredCount} expired entries (run 'summary-clean' to remove)`);
    }
  } catch (error) {
    console.error('❌ Error reading summary cache:', error.message);
  }
}

async function cleanOldSummaryCache(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  console.log('🧹 Cleaning old summary cache entries...\n');
  
  try {
    const index = await loadSummaryCacheIndex();
    const entries = Object.entries(index);
    const now = Date.now();
    let removedCount = 0;
    
    console.log(`   Checking ${entries.length} cached summaries...`);
    
    const newIndex = {};
    for (const [urlHash, info] of entries) {
      const age = now - info.timestamp;
      if (age <= maxAgeMs) {
        newIndex[urlHash] = info;
      } else {
        removedCount++;
        console.log(`   🗑️  Removed: ${info.title}`);
      }
    }
    
    if (removedCount > 0) {
      await saveSummaryCacheIndex(newIndex);
      console.log(`\n   ✅ Cleaned ${removedCount} expired summary entries`);
    } else {
      console.log('   ✨ No expired entries found');
    }
  } catch (error) {
    console.error('❌ Error cleaning summary cache:', error.message);
  }
}

async function clearAllSummaryCache() {
  console.log('🗑️  Clearing all summary cache...\n');
  
  try {
    await fs.rm(SUMMARY_CACHE_DIR, { recursive: true, force: true });
    console.log('   ✅ All summary cache cleared');
  } catch (error) {
    console.error('❌ Error clearing summary cache:', error.message);
  }
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'status':
      await showStatus();
      break;
    case 'clean':
      await cleanOldCache();
      break;
    case 'clear':
      await clearAllCache();
      break;
    case 'summary-status':
      await showSummaryStatus();
      break;
    case 'summary-clean':
      await cleanOldSummaryCache();
      break;
    case 'summary-clear':
      await clearAllSummaryCache();
      break;
    case 'all-status':
      await showStatus();
      console.log('');
      await showSummaryStatus();
      break;
    default:
      console.log('🖼️  Cache Manager');
      console.log('\nUsage:');
      console.log('  node scripts/cache-manager.js status         # Show image cache status');
      console.log('  node scripts/cache-manager.js clean          # Clean old image cache');
      console.log('  node scripts/cache-manager.js clear          # Clear all image cache');
      console.log('  node scripts/cache-manager.js summary-status # Show summary cache status');
      console.log('  node scripts/cache-manager.js summary-clean  # Clean old summary cache');
      console.log('  node scripts/cache-manager.js summary-clear  # Clear all summary cache');
      console.log('  node scripts/cache-manager.js all-status     # Show both cache statuses');
  }
}

main().catch(console.error);
