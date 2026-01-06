# Migration Guide: Scraping → CMS JSON Manifests

This document describes how to migrate the comic viewer from the proxy/scraping system to consuming JSON manifests published by the Chimera CMS.

## Overview

**Current system:**
- `comics.js` contains a hardcoded list of comics with metadata
- `getPagesFromArchive()` fetches archive HTML via proxy, parses DOM to extract pages
- `getImageFromPage()` scrapes individual pages to find image URLs
- Data cached in localStorage

**New system:**
- CMS publishes `index.json` (master comics list) and `{slug}/manifest.json` (per-comic data)
- All page data including image URLs is already in the manifest
- No proxy, no scraping, no DOM parsing

## Data Source URLs

The CMS publishes manifests to:

```
https://api.chimeracomics.org/pub/v1/index.json          # All comics
https://api.chimeracomics.org/pub/v1/comics/{slug}/manifest.json  # Per comic
https://api.chimeracomics.org/media/{filename}           # Images
```

## Manifest Structures

### index.json (Comics List)

```json
{
  "version": "1.0",
  "generatedAt": "2025-01-02T12:00:00Z",
  "comics": [
    {
      "id": 4,
      "slug": "my-comic",
      "title": "My Webcomic",
      "tagline": "A story about adventure",
      "thumbnail": "/media/comic-thumb.jpg",
      "pageCount": 156,
      "latestPageDate": "2025-01-01",
      "route": "/my-comic/"
    }
  ]
}
```

### {slug}/manifest.json (Per-Comic)

```json
{
  "version": "1.0",
  "generatedAt": "2025-01-02T12:00:00Z",
  "comic": {
    "id": 4,
    "slug": "my-comic",
    "title": "My Webcomic",
    "tagline": "A story about adventure",
    "description": "Full description...",
    "thumbnail": "/media/comic-thumb.jpg"
  },
  "chapters": [
    {
      "id": 1,
      "title": "Chapter 1: The Beginning",
      "number": 1,
      "startPage": 1,
      "endPage": 24,
      "pageCount": 24
    }
  ],
  "pages": [
    {
      "number": 1,
      "chapter": 1,
      "image": "/media/abc123.jpg",
      "thumbnail": "/media/abc123-thumb.jpg",
      "width": 800,
      "height": 1200,
      "title": "Page 1",
      "altText": "Description of the image",
      "authorNote": "Author's commentary",
      "publishedDate": "2024-06-15"
    }
  ],
  "navigation": {
    "firstPage": 1,
    "lastPage": 156,
    "totalPages": 156
  }
}
```

## Data Structure Mapping

### Comics List

| CMS `index.json` | SPA `comics.js` |
|------------------|-----------------|
| `comics[].slug` | `id` |
| `comics[].title` | `name` |
| `comics[].title` | `sortname` (derive or add to CMS) |
| `comics[].thumbnail` | `square` |
| `comics[].tagline` | `description` (partial) |
| — | `credits` (add to CMS or manifest) |
| — | `genres` (add to CMS or manifest) |
| — | `links` (add to CMS or manifest) |

**Note:** The CMS may need additional fields for `credits`, `genres`, and `links` if you want full parity with the current hardcoded data.

### Per-Comic Data

| CMS `manifest.json` | SPA Expected Structure |
|---------------------|------------------------|
| `chapters[]` | `storylines[]` |
| `chapters[].title` | `storylines[].name` |
| `chapters[].number` | `storylines[].pageindex` (derive from pages) |
| `pages[]` | `storylines[].pages[]` (grouped by chapter) |
| `pages[].number` | `pages[].archivepageindex` |
| `pages[].image` | `pages[].img.original` |
| `pages[].title` | `pages[].name` |
| `comic.slug + page.number` | `pages[].id` |
| `comic.slug + page.number` | `pages[].href` |

### Transformation Function

The manifest needs to be transformed to match the SPA's expected structure:

```javascript
function transformManifest(manifest, baseUrl) {
  const { comic, chapters, pages } = manifest;

  // Group pages by chapter
  const storylines = chapters.map(chapter => {
    const chapterPages = pages
      .filter(p => p.chapter === chapter.number)
      .map(page => ({
        id: `${comic.slug}-page-${page.number}`,
        href: `${baseUrl}/comics/${comic.slug}/page/${page.number}`,
        name: page.title || `Page ${page.number}`,
        archivepageindex: page.number - 1,
        img: {
          original: `${baseUrl}${page.image}`,
          thumbnail: page.thumbnail ? `${baseUrl}${page.thumbnail}` : null,
          width: page.width,
          height: page.height,
        },
        altText: page.altText,
        authorNote: page.authorNote,
        publishedDate: page.publishedDate,
      }));

    return {
      name: chapter.title,
      pageindex: chapterPages[0]?.archivepageindex || 0,
      pages: chapterPages,
    };
  });

  // Handle pages without chapters (put in default storyline)
  const unchapteredPages = pages.filter(p => !p.chapter);
  if (unchapteredPages.length > 0) {
    storylines.unshift({
      name: 'Pages',
      pageindex: 0,
      pages: unchapteredPages.map(page => ({
        id: `${comic.slug}-page-${page.number}`,
        href: `${baseUrl}/comics/${comic.slug}/page/${page.number}`,
        name: page.title || `Page ${page.number}`,
        archivepageindex: page.number - 1,
        img: {
          original: `${baseUrl}${page.image}`,
        },
      })),
    });
  }

  return {
    id: comic.slug,
    name: comic.title,
    sortname: comic.title, // Could add sortname to CMS
    square: comic.thumbnail ? `${baseUrl}${comic.thumbnail}` : null,
    description: comic.description || comic.tagline,
    storylines,
    allpages: pages.map(p => ({
      id: `${comic.slug}-page-${p.number}`,
      href: `${baseUrl}/comics/${comic.slug}/page/${p.number}`,
      name: p.title || `Page ${p.number}`,
      img: { original: `${baseUrl}${p.image}` },
      archivepageindex: p.number - 1,
    })),
  };
}
```

## Files to Modify

### 1. Create `module.Manifestparser.js` (replaces Archiveparser)

```javascript
const config = {
  cmsBaseUrl: 'https://api.chimeracomics.org',
  manifestPath: '/pub/v1',
};

/**
 * Fetch the master comics index
 */
const getComicsIndex = async () => {
  const response = await fetch(`${config.cmsBaseUrl}${config.manifestPath}/index.json`);
  if (!response.ok) throw new Error('Failed to fetch comics index');
  return response.json();
};

/**
 * Fetch manifest for a specific comic
 */
const getComicManifest = async (slug) => {
  const response = await fetch(
    `${config.cmsBaseUrl}${config.manifestPath}/comics/${slug}/manifest.json`
  );
  if (!response.ok) throw new Error(`Failed to fetch manifest for ${slug}`);
  return response.json();
};

/**
 * Transform CMS manifest to SPA expected format
 */
const transformManifest = (manifest) => {
  // ... transformation logic from above
};

/**
 * Replacement for getPagesFromArchive()
 * Returns data in the format the SPA expects
 */
const getPagesFromManifest = async (slug) => {
  const manifest = await getComicManifest(slug);
  return transformManifest(manifest);
};

/**
 * Prefetch images (replaces bufferImageList)
 */
const prefetchImages = (imageUrls) => {
  imageUrls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
};

export {
  getComicsIndex,
  getComicManifest,
  getPagesFromManifest,
  prefetchImages,
};
```

### 2. Update `module.Comicdata.js`

**Remove:**
- `getPagesFromArchive` import
- `getImageFromPage` import and all usages
- Proxy-related logic

**Change:**
- `getPopulatedComic()` to use `getPagesFromManifest(comic.slug)` instead of `getPagesFromArchive(comic.archiveurl)`
- Image buffering to use URLs directly from manifest (no scraping needed)

**Simplify:**
- `sourceSomeImagesInStoryline()` - images are already in the data, just prefetch them
- `sourceAllStorylineCovers()` - covers are already known, just prefetch

```javascript
// Before
const imgSrc = pageObj.img?.original || (await getImageFromPage(pageObj.href));

// After
const imgSrc = pageObj.img?.original; // Already populated from manifest
```

### 3. Update or Replace `comics.js`

**Option A: Dynamic loading (recommended)**

Remove the hardcoded list entirely. Load from `index.json` on startup:

```javascript
let comicsData = null;

const loadComics = async () => {
  if (comicsData) return comicsData;

  const index = await getComicsIndex();
  comicsData = {
    comics: index.comics.map(c => ({
      id: c.slug,
      name: c.title,
      sortname: c.title,
      square: c.thumbnail,
      // Additional fields if CMS provides them:
      // credits, genres, links
    }))
  };
  return comicsData;
};

export default { loadComics };
```

**Option B: Hybrid (fallback)**

Keep the hardcoded list as fallback, merge with CMS data:

```javascript
import hardcodedComics from './comics-fallback.js';
import { getComicsIndex } from './module.Manifestparser.js';

const loadComics = async () => {
  try {
    const cmsIndex = await getComicsIndex();
    // Merge CMS comics with any hardcoded ones not in CMS
    return mergeComicsLists(cmsIndex.comics, hardcodedComics.comics);
  } catch (e) {
    console.warn('Failed to load CMS index, using fallback');
    return hardcodedComics;
  }
};
```

### 4. Update `index.js` (if needed)

If the app initialization assumes synchronous access to `comics.js`, update to handle async loading:

```javascript
// Before
import comics from './comics.js';
initApp(comics);

// After
import { loadComics } from './comics.js';
loadComics().then(comics => initApp(comics));
```

## What to Delete

Once migration is complete, remove:

- `module.Archiveparser.js` (replaced by Manifestparser)
- Proxy URL configuration
- `getImageFromPage()` function
- DOM parsing logic
- Any ComicPress/archive selector logic

## Caching Strategy

The current app caches in localStorage. With manifests:

1. **Manifest caching** - Cache the JSON with a timestamp, refresh periodically
2. **Image caching** - Let the browser/service worker handle this
3. **Freshness check** - Compare `manifest.version` or `generatedAt` to detect updates

```javascript
const CACHE_KEY = 'comic-manifest-';
const CACHE_TTL = 3600000; // 1 hour

const getCachedManifest = (slug) => {
  const cached = localStorage.getItem(CACHE_KEY + slug);
  if (!cached) return null;

  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_TTL) return null;

  return data;
};

const cacheManifest = (slug, data) => {
  localStorage.setItem(CACHE_KEY + slug, JSON.stringify({
    data,
    timestamp: Date.now(),
  }));
};
```

## Service Worker Considerations

If adding a service worker for offline support:

1. Cache the reader shell (HTML, JS, CSS)
2. Cache manifests with stale-while-revalidate
3. Cache images with cache-first (they're immutable)
4. Prefetch upcoming pages based on reading position

See the Chimera CMS documentation (`docs/future publishing/to hybrid SPA-SSG/`) for service worker examples.

## Testing Checklist

- [ ] Comics list loads from `index.json`
- [ ] Individual comic data loads from `manifest.json`
- [ ] Chapters/storylines display correctly
- [ ] Page navigation works
- [ ] Images load from CMS media URLs
- [ ] Image prefetching/buffering works
- [ ] Reading progress saves/restores
- [ ] Offline reading works (if service worker added)
- [ ] Fallback works if CMS is unreachable

## CMS Fields to Add (Optional)

For full feature parity, consider adding these fields to the CMS:

| Field | Collection | Purpose |
|-------|------------|---------|
| `sortname` | Comics | For alphabetical sorting ("The End" → "End, The") |
| `credits` | Comics | Author/artist attribution |
| `genres` | Comics | Genre tags (relationship to Genres collection) |
| `links` | Comics | External links (store, Patreon, social) |

These may already exist in the CMS - check the Comics collection fields.
