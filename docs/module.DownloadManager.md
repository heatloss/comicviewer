# DownloadManager Module

Handles offline storage of comics for offline reading, similar to Netflix/Plex download patterns.

## Dependencies

- Cache API (for storing images)
- IndexedDB (for metadata tracking)
- Service Worker (for serving cached content)

## API

```javascript
const DownloadManager = {
  // Download a full comic or chapter for offline reading
  async download(comicId, chapterId = null) {},

  // Cancel an in-progress download
  cancelDownload(comicId) {},

  // Remove a comic/chapter from offline storage
  async remove(comicId, chapterId = null) {},

  // Check if a comic/chapter is downloaded
  async isDownloaded(comicId, chapterId = null) {},

  // Get download progress for an in-progress download
  getProgress(comicId) {},

  // List all downloaded comics with metadata
  async listDownloaded() {},

  // Get storage usage info
  async getStorageInfo() {},

  // Event hooks
  onProgress: null,   // (comicId, current, total) => {}
  onComplete: null,   // (comicId) => {}
  onError: null,      // (comicId, error) => {}
};
```

## Implementation Sketch

```javascript
const CACHE_NAME = 'comic-pages-v1';
const DB_NAME = 'comicviewer-offline';
const DB_VERSION = 1;

const DownloadManager = {
  _db: null,
  _activeDownloads: new Map(), // comicId -> AbortController
  _progress: new Map(),        // comicId -> { current, total }

  // Event callbacks
  onProgress: null,
  onComplete: null,
  onError: null,

  // Initialize IndexedDB
  async _initDB() {
    if (this._db) return this._db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this._db = request.result;
        resolve(this._db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store metadata about downloaded comics
        if (!db.objectStoreNames.contains('downloads')) {
          const store = db.createObjectStore('downloads', { keyPath: 'id' });
          store.createIndex('comicId', 'comicId', { unique: false });
        }
      };
    });
  },

  // Check available storage quota
  async getStorageInfo() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage,
        available: estimate.quota,
        percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(1)
      };
    }
    return null;
  },

  // Download a comic for offline reading
  async download(comicId, chapterId = null) {
    const db = await this._initDB();
    const cache = await caches.open(CACHE_NAME);

    // Fetch page list from API
    const pages = await this._fetchPageList(comicId, chapterId);
    const total = pages.length;

    // Set up abort controller for cancellation
    const controller = new AbortController();
    this._activeDownloads.set(comicId, controller);
    this._progress.set(comicId, { current: 0, total });

    try {
      for (let i = 0; i < pages.length; i++) {
        // Check for cancellation
        if (controller.signal.aborted) {
          throw new DOMException('Download cancelled', 'AbortError');
        }

        const pageUrl = pages[i].url;

        // Fetch and cache the image
        const response = await fetch(pageUrl, { signal: controller.signal });
        if (response.ok) {
          await cache.put(pageUrl, response.clone());
        }

        // Update progress
        this._progress.set(comicId, { current: i + 1, total });
        if (this.onProgress) {
          this.onProgress(comicId, i + 1, total);
        }
      }

      // Store metadata in IndexedDB
      await this._storeMetadata(db, {
        id: chapterId ? `${comicId}:${chapterId}` : comicId,
        comicId,
        chapterId,
        pageCount: total,
        downloadedAt: Date.now(),
        pages: pages.map(p => p.url)
      });

      if (this.onComplete) {
        this.onComplete(comicId);
      }

    } catch (error) {
      if (error.name !== 'AbortError' && this.onError) {
        this.onError(comicId, error);
      }
      throw error;
    } finally {
      this._activeDownloads.delete(comicId);
      this._progress.delete(comicId);
    }
  },

  // Cancel an in-progress download
  cancelDownload(comicId) {
    const controller = this._activeDownloads.get(comicId);
    if (controller) {
      controller.abort();
    }
  },

  // Get current progress
  getProgress(comicId) {
    return this._progress.get(comicId) || null;
  },

  // Check if comic is downloaded
  async isDownloaded(comicId, chapterId = null) {
    const db = await this._initDB();
    const id = chapterId ? `${comicId}:${chapterId}` : comicId;

    return new Promise((resolve) => {
      const tx = db.transaction('downloads', 'readonly');
      const store = tx.objectStore('downloads');
      const request = store.get(id);
      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => resolve(false);
    });
  },

  // List all downloaded comics
  async listDownloaded() {
    const db = await this._initDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('downloads', 'readonly');
      const store = tx.objectStore('downloads');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // Remove from offline storage
  async remove(comicId, chapterId = null) {
    const db = await this._initDB();
    const cache = await caches.open(CACHE_NAME);
    const id = chapterId ? `${comicId}:${chapterId}` : comicId;

    // Get metadata to find cached URLs
    const metadata = await this._getMetadata(db, id);
    if (metadata) {
      // Remove all cached pages
      for (const url of metadata.pages) {
        await cache.delete(url);
      }

      // Remove metadata
      await this._deleteMetadata(db, id);
    }
  },

  // Private: fetch page list from API
  async _fetchPageList(comicId, chapterId) {
    // TODO: Implement based on your CMS API structure
    // Should return array of { url, pageNumber }
    const endpoint = chapterId
      ? `/api/comics/${comicId}/chapters/${chapterId}/pages`
      : `/api/comics/${comicId}/pages`;

    const response = await fetch(endpoint);
    return response.json();
  },

  // Private: store metadata
  async _storeMetadata(db, data) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('downloads', 'readwrite');
      const store = tx.objectStore('downloads');
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // Private: get metadata
  async _getMetadata(db, id) {
    return new Promise((resolve) => {
      const tx = db.transaction('downloads', 'readonly');
      const store = tx.objectStore('downloads');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  },

  // Private: delete metadata
  async _deleteMetadata(db, id) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('downloads', 'readwrite');
      const store = tx.objectStore('downloads');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

export default DownloadManager;
```

## Service Worker Integration

The service worker should intercept image requests and check the cache:

```javascript
// In service-worker.js

const CACHE_NAME = 'comic-pages-v1';

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only intercept comic image requests
  if (isComicImageRequest(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) {
            return cached;
          }
          return fetch(event.request);
        })
      )
    );
  }
});

function isComicImageRequest(url) {
  // Adjust based on your URL patterns
  return url.pathname.startsWith('/comics/') &&
         /\.(jpg|jpeg|png|webp|gif)$/i.test(url.pathname);
}
```

## Usage Example

```javascript
import DownloadManager from './module.DownloadManager.js';

// Set up progress handler
DownloadManager.onProgress = (comicId, current, total) => {
  const percent = Math.round((current / total) * 100);
  updateProgressUI(comicId, percent);
};

DownloadManager.onComplete = (comicId) => {
  showDownloadedBadge(comicId);
};

// Download button handler
downloadButton.addEventListener('click', async () => {
  const comicId = downloadButton.dataset.comicId;

  // Check storage first
  const storage = await DownloadManager.getStorageInfo();
  if (storage && parseFloat(storage.percentUsed) > 90) {
    showWarning('Storage is almost full. Manage downloads in settings.');
    return;
  }

  try {
    await DownloadManager.download(comicId);
  } catch (error) {
    if (error.name !== 'AbortError') {
      showError('Download failed. Please try again.');
    }
  }
});

// Cancel button
cancelButton.addEventListener('click', () => {
  DownloadManager.cancelDownload(comicId);
});
```

## Storage Management UI

Consider providing a settings/management screen that shows:

1. List of downloaded comics with:
   - Title and cover thumbnail
   - Page count
   - Approximate size (can estimate from page count)
   - Download date
   - Delete button

2. Overall storage usage:
   - Progress bar showing used/available
   - "Clear all downloads" option

3. Automatic cleanup options (future enhancement):
   - Delete comics not read in X days
   - Keep only N most recent downloads
