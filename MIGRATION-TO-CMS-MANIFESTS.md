# Migration Guide: Scraping to CMS JSON Manifests

This document describes the migration from the proxy/scraping system to consuming JSON manifests published by the Chimera CMS.

**Status: Mostly Complete** — Core migration is done. This document updated January 2026.

## Overview

### Old System (Removed)
- `comics.js` contained a hardcoded list of comics with metadata
- `getPagesFromArchive()` fetched archive HTML via proxy, parsed DOM to extract pages
- `getImageFromPage()` scraped individual pages to find image URLs
- Data cached in localStorage

### New System (Implemented)
- CMS publishes `index.json` (master comics list) and `{slug}/manifest.json` (per-comic data)
- All page data including image URLs is already in the manifest
- No proxy, no scraping, no DOM parsing
- `module.Manifestparser.js` handles fetching and transformation

## Data Source URLs

The CMS publishes manifests to:

```
https://api.chimeracomics.org/api/pub/v1/index.json              # All comics
https://api.chimeracomics.org/api/pub/v1/comics/{slug}/manifest.json  # Per comic
https://api.chimeracomics.org/api/media/{filename}               # Images (original)
https://api.chimeracomics.org/api/pub/media/mobile/{filename}    # Images (mobile optimized)
https://api.chimeracomics.org/api/pub/media/desktop/{filename}   # Images (desktop optimized)
```

For local development, the base URL is `http://localhost:3333`.

## Current Manifest Structures

### index.json (Comics List)

```json
{
  "version": "1.1",
  "generatedAt": "2026-01-22T23:23:49.715Z",
  "comics": [
    {
      "id": 1,
      "slug": "automans-daughter",
      "title": "The Automan's Daughter",
      "tagline": "An adventure story...",
      "thumbnail": "/api/media/thumbnail/cover-thumbnail.jpg",
      "pageCount": 27,
      "latestPageDate": "2025-09-28T10:16:00.000Z",
      "route": "/automans-daughter/",
      "credits": [
        { "role": "artist", "name": "Mike Stamm", "url": "https://..." }
      ],
      "genres": ["Steampunk", "Action-Adventure"],
      "tags": ["Mecha", "Violence"],
      "links": [
        { "type": "patreon", "label": "Patreon", "url": "https://..." }
      ]
    }
  ]
}
```

### {slug}/manifest.json (Per-Comic)

```json
{
  "version": "1.1",
  "generatedAt": "2026-01-22T23:23:49.715Z",
  "meta": {
    "id": 1,
    "slug": "automans-daughter",
    "title": "The Automan's Daughter",
    "tagline": "Short description...",
    "description": "Full description...",
    "thumbnail": "/api/media/thumbnail/cover-thumbnail.jpg",
    "credits": [
      { "role": "artist", "name": "Mike Stamm", "url": "https://..." }
    ],
    "links": [
      { "type": "patreon", "label": "Patreon", "url": "https://..." }
    ],
    "genres": ["Steampunk", "Action-Adventure"],
    "tags": ["Mecha", "Violence"]
  },
  "chapters": [
    {
      "id": 1,
      "slug": "chapter-1",
      "title": "Chapter 1",
      "order": 1,
      "pages": [
        {
          "slug": "chapter-1-cover",
          "globalPageNumber": 1,
          "chapterPageNumber": 1,
          "image": {
            "original": "/api/media/file/issue-1-cover.jpg",
            "mobile": "/api/pub/media/mobile/issue-1-cover.webp",
            "desktop": "/api/pub/media/desktop/issue-1-cover.webp"
          },
          "thumbnail": "/api/media/thumbnail/issue-1-cover-thumbnail.jpg",
          "width": 1600,
          "height": 2464,
          "title": "Chapter 1, cover",
          "altText": "Description of the image",
          "authorNote": null,
          "contentWarning": null,
          "publishedDate": "2025-08-28T21:15:12.332Z"
        }
      ]
    }
  ],
  "navigation": {
    "firstPage": 1,
    "lastPage": 27,
    "totalPages": 27
  }
}
```

**Key changes from earlier versions:**
- `comic` renamed to `meta`
- `pages` array is now nested inside each `chapters[]` entry (not flat)
- Images are objects with `original`, `mobile`, `desktop` variants
- Links use `type`, `label`, `url` (not `linktext`, `linkurl`)
- Added `contentWarning` field on pages

## Data Structure Mapping

### Comics List (index.json → SPA)

| CMS Field | SPA Field | Status |
|-----------|-----------|--------|
| `comics[].slug` | `id` | Done |
| `comics[].title` | `title` | Done |
| `comics[].title` | `sortname` | Done (uses title, CMS can add sortname) |
| `comics[].thumbnail` | `square` | Done |
| `comics[].tagline` | `description` | Done |
| `comics[].credits` | `credits` | Done (formatted to string) |
| `comics[].genres` | `genres` | Done |
| `comics[].tags` | `tags` | Done |
| `comics[].links` | `links` | Done |
| `comics[].latestPageDate` | `latestPageDate` | Done |

### Per-Comic Manifest (manifest.json → SPA)

| CMS Field | SPA Field | Status |
|-----------|-----------|--------|
| `meta.*` | Comic metadata | Done |
| `chapters[]` | `storylines[]` | Done |
| `chapters[].title` | `storylines[].name` | Done |
| `chapters[].pages[]` | `storylines[].pages[]` | Done |
| `pages[].image` | `pages[].img` (with full URLs) | Done |
| `pages[].contentWarning` | `pages[].contentWarning` | Passed through, UI pending |

## Implementation Status

### Completed

- [x] **module.Manifestparser.js** — Fetches and transforms CMS manifests
  - `getComicsIndex()` — Fetches master comics list
  - `getComicManifest(slug)` — Fetches per-comic manifest
  - `transformManifest()` — Converts CMS structure to SPA structure
  - `transformImageUrls()` — Handles image object format (original/mobile/desktop)
  - `formatCredits()` — Converts credits array to display string
  - `getImageUrl()` — Converts relative paths to full URLs

- [x] **module.Comicdata.js** — Updated to use manifest parser
  - `getPopulatedComic()` uses `getTransformedComic()` from manifest parser
  - Image buffering uses URLs directly from manifest
  - Removed scraping-related logic

- [x] **module.Grid.js** — Updated to use CMS data
  - Loads comics from `normalizedComics()`
  - Handles new thumbnail format

- [x] **module.Storylines.js** — Updated for new link format
  - Uses `link.type`, `link.label`, `link.url` (was `linktext`, `linkurl`)

- [x] **Removed legacy files**
  - `module.Archiveparser.js` — Removed (replaced by Manifestparser)
  - `module.Feedparser.js` — Removed
  - Proxy configuration — Removed

### Remaining Work

- [ ] **Content Warning UI** — `contentWarning` field is in manifest but UI not implemented
  - See `docs/STATE-MANAGEMENT-PLAN.md` for implementation approach
  - Requires state management updates to track dismissed warnings

- [ ] **Author Notes UI** — `authorNote` field passed through but not displayed

- [ ] **Alt Text** — `altText` field available but not used for accessibility

## File Reference

### Current Module Responsibilities

| Module | Responsibility |
|--------|----------------|
| `module.Manifestparser.js` | Fetch CMS data, transform to SPA format |
| `module.Comicdata.js` | Comic data access, image buffering |
| `module.Comicreader.js` | Reader UI, page navigation |
| `module.Storylines.js` | Rack view, chapter covers |
| `module.Grid.js` | Home view, comics grid |
| `module.Userdata.js` | localStorage persistence (reading positions, subscriptions) |

### Transformation Flow

```
CMS manifest.json
       ↓
getComicManifest(slug)
       ↓
transformManifest()
  - meta → comic metadata
  - chapters[].pages[] → storylines[].pages[]
  - image URLs → full URLs with mobile/desktop variants
       ↓
SPA internal format
       ↓
Comicreader / Storylines / Grid
```

## Testing Checklist

- [x] Comics list loads from `index.json`
- [x] Individual comic data loads from `manifest.json`
- [x] Chapters/storylines display correctly
- [x] Page navigation works
- [x] Images load from CMS media URLs
- [x] Desktop/mobile image variants work
- [x] Image prefetching/buffering works
- [x] Reading progress saves/restores
- [x] External links work (Patreon, Bluesky, etc.)
- [ ] Content warnings display and can be dismissed
- [ ] Author notes display
- [ ] Alt text used for accessibility

## Related Documentation

- `docs/STATE-MANAGEMENT-PLAN.md` — Plan for centralized state (needed for content warnings)
- `docs/refactoring-recommendations.md` — General architecture improvements
- `docs/cms reference/` — CMS API specifications
