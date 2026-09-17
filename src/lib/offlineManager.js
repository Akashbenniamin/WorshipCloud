// Offline Caching & Background Prefetch Manager for Worship Cloud
export const CACHE_NAME = 'worship-cloud-v1';

let isPrefetching = false;
let prefetchCancelled = false;

// List of critical static assets to cache for offline application shell
export const SHELL_ASSETS = [
  './',
  './index.html',
  './favicon.svg',
  './manifest.json',
  './data/bible-meta.json',
  './data/songs/songs-index.json',
  './data/dailyVersePool.json'
];

/**
 * Generate the full list of data URLs required for complete offline operation
 */
export function getAllOfflineDataUrls() {
  const urls = [...SHELL_ASSETS];

  // All 64 Song Chunks (chunk-00.json to chunk-63.json)
  for (let i = 0; i < 64; i++) {
    const chunkId = String(i).padStart(2, '0');
    urls.push('./data/songs/chunks/chunk-' + chunkId + '.json');
  }

  return urls;
}

/**
 * Complete offline URLs including both Bible versions (taovbsi and kjv)
 * Takes bibleMeta array to map all 66 book codes
 */
export function getAllOfflineUrlsWithBible(booksMeta = []) {
  const urls = getAllOfflineDataUrls();

  if (Array.isArray(booksMeta) && booksMeta.length > 0) {
    booksMeta.forEach((book) => {
      if (book.code) {
        urls.push('./data/bible/taovbsi/' + book.code + '.json');
        urls.push('./data/bible/kjv/' + book.code + '.json');
      }
    });
  }

  return urls;
}

/**
 * Check Cache API support
 */
export function isCacheSupported() {
  return typeof window !== 'undefined' && 'caches' in window;
}

/**
 * Check current cache status: returns { cachedCount, totalCount, isComplete }
 */
export async function getCacheStatus(totalUrls) {
  if (!isCacheSupported()) return { cachedCount: 0, totalCount: totalUrls.length, isComplete: false };
  try {
    const cache = await caches.open(CACHE_NAME);
    let cachedCount = 0;
    
    // Check in batches for performance
    const batchSize = 30;
    for (let i = 0; i < totalUrls.length; i += batchSize) {
      const batch = totalUrls.slice(i, i + batchSize);
      const checks = await Promise.all(
        batch.map(async (url) => {
          const match = await cache.match(url);
          return !!match;
        })
      );
      cachedCount += checks.filter(Boolean).length;
    }

    return {
      cachedCount,
      totalCount: totalUrls.length,
      isComplete: cachedCount >= totalUrls.length && totalUrls.length > 0
    };
  } catch (err) {
    console.warn('Error reading cache status:', err);
    return { cachedCount: 0, totalCount: totalUrls.length, isComplete: false };
  }
}

/**
 * Download and cache all URLs with real-time progress callback
 */
export async function downloadAllForOffline(urls, onProgress) {
  if (!isCacheSupported()) {
    throw new Error('Cache Storage is not supported on this browser.');
  }

  isPrefetching = true;
  prefetchCancelled = false;

  const cache = await caches.open(CACHE_NAME);
  const total = urls.length;
  let completed = 0;

  // Concurrency limit of 3 to avoid network congestion
  const CONCURRENCY = 3;
  let index = 0;

  const worker = async () => {
    while (index < urls.length && !prefetchCancelled) {
      const myIndex = index++;
      const url = urls[myIndex];

      try {
        const existing = await cache.match(url);
        if (!existing) {
          const response = await fetch(url, { cache: 'no-cache' });
          if (response.ok) {
            await cache.put(url, response.clone());
          }
        }
      } catch (err) {
        console.warn('Failed to cache ' + url + ':', err);
      }

      completed++;
      if (onProgress) {
        onProgress({
          current: completed,
          total,
          percent: Math.round((completed / total) * 100),
          isDone: completed >= total,
          currentItem: url.split('/').pop()
        });
      }
    }
  };

  const pool = Array.from({ length: Math.min(CONCURRENCY, urls.length) }, () => worker());
  await Promise.all(pool);
  isPrefetching = false;

  // Mark in localStorage when complete
  if (completed >= total && !prefetchCancelled) {
    try {
      localStorage.setItem('worship_cloud_offline_ready', 'true');
    } catch {}
  }

  return { completed, total, cancelled: prefetchCancelled };
}

/**
 * Cancel any ongoing download
 */
export function cancelOfflineDownload() {
  prefetchCancelled = true;
  isPrefetching = false;
}

/**
 * Background prefetcher that runs silently when the browser is idle
 * Respects Save-Data and slow connections
 */
export function startIdleBackgroundPrefetch(booksMeta = []) {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  // Check if user has Save-Data enabled or is on slow network
  if (navigator.connection) {
    if (navigator.connection.saveData) {
      return;
    }
    const type = navigator.connection.effectiveType;
    if (type === 'slow-2g' || type === '2g') {
      return;
    }
  }

  const alreadyReady = localStorage.getItem('worship_cloud_offline_ready') === 'true';
  if (alreadyReady) return;

  const scheduleIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 4000));

  scheduleIdle(async () => {
    try {
      const urls = getAllOfflineUrlsWithBible(booksMeta);
      const cache = await caches.open(CACHE_NAME);

      for (const url of urls) {
        if (isPrefetching) break;
        try {
          const match = await cache.match(url);
          if (!match) {
            await new Promise((r) => setTimeout(r, 250));
            const res = await fetch(url);
            if (res.ok) {
              await cache.put(url, res);
            }
          }
        } catch {}
      }
    } catch (e) {
      console.warn('Background idle prefetch error:', e);
    }
  }, { timeout: 10000 });
}
