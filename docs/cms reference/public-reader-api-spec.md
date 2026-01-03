# Public Reader API Specification

Endpoints for the public-facing comic reader SPA, separate from the authenticated CMS admin endpoints.

## Design Principles

1. **No authentication required** for reading published content
2. **Slug-based URLs** for human-readable, shareable links
3. **Minimal payloads** — only fields needed for rendering
4. **Cache-friendly** — responses should be cacheable at CDN edge

---

## Endpoints

### Get All Public Comics

```
GET /api/public/comics
```

Returns all live comics for the grid/browse view.

**Query Parameters:**
- `genre` — Filter by genre slug (e.g., `?genre=action`)
- `tag` — Filter by tag slug (e.g., `?tag=lgbtq`)
- `sort` — Sort order: `title`, `updated`, `created` (default: `updated`)
- `limit` — Results per page (default: 20, max: 100)
- `page` — Page number for pagination

**Response:**

```json
{
  "docs": [
    {
      "id": 1,
      "slug": "my-awesome-comic",
      "title": "My Awesome Comic",
      "description": "A brief summary of the comic series",
      "coverImage": {
        "url": "/api/media/file/cover.jpg",
        "thumbnail": "/api/media/file/cover-400w.jpg"
      },
      "author": {
        "name": "Jane Doe"  // From credits, not user account
      },
      "genres": ["Action", "Adventure"],
      "tags": ["LGBTQ+", "Webcomic"],
      "status": "live",
      "publishSchedule": "weekly",
      "stats": {
        "totalPages": 45,
        "totalChapters": 3,
        "lastPagePublished": "2024-01-15T10:30:00Z"
      }
    }
  ],
  "totalDocs": 12,
  "page": 1,
  "totalPages": 1,
  "hasNextPage": false,
  "hasPrevPage": false
}
```

**Notes:**
- Only returns comics with `status: "live"`
- `author.name` derived from first credit with role "writer" or "creator", not the CMS user
- Genres/tags returned as string arrays (labels), not IDs

---

### Get Single Comic with Chapters

```
GET /api/public/comics/:slug
```

Returns a complete comic with all chapters and pages for the reader.

**Response:**

```json
{
  "id": 1,
  "slug": "my-awesome-comic",
  "title": "My Awesome Comic",
  "description": "A brief summary of the comic series",
  "coverImage": {
    "url": "/api/media/file/cover.jpg",
    "thumbnail": "/api/media/file/cover-400w.jpg",
    "thumbnailLarge": "/api/media/file/cover-800w.jpg"
  },
  "credits": [
    { "role": "writer", "name": "Jane Doe", "url": "https://janedoe.com" },
    { "role": "artist", "name": "John Smith", "url": "https://johnsmith.art" }
  ],
  "genres": ["Action", "Adventure"],
  "tags": ["LGBTQ+", "Webcomic"],
  "status": "live",
  "publishSchedule": "weekly",
  "stats": {
    "totalPages": 45,
    "totalChapters": 3,
    "lastPagePublished": "2024-01-15T10:30:00Z"
  },
  "chapters": [
    {
      "id": 2,
      "slug": "the-beginning",
      "title": "The Beginning",
      "order": 1,
      "description": "Our hero's journey starts here...",
      "coverImage": {
        "thumbnail": "/api/media/file/ch1-cover-400w.jpg"
      },
      "stats": {
        "pageCount": 15,
        "firstPageNumber": 1,
        "lastPageNumber": 15
      },
      "pages": [
        {
          "id": 10,
          "chapterPageNumber": 1,
          "globalPageNumber": 1,
          "title": null,
          "image": {
            "url": "/api/media/file/page-001.jpg",
            "thumbnail": "/api/media/file/page-001-400w.jpg",
            "thumbnailLarge": "/api/media/file/page-001-800w.jpg"
          },
          "altText": "Chapter 1 cover showing the hero standing on a cliff"
        },
        {
          "id": 11,
          "chapterPageNumber": 2,
          "globalPageNumber": 2,
          "title": "The Hero Awakens",
          "image": {
            "url": "/api/media/file/page-002.jpg",
            "thumbnail": "/api/media/file/page-002-400w.jpg",
            "thumbnailLarge": "/api/media/file/page-002-800w.jpg"
          },
          "altText": "Our hero wakes up in a mysterious forest"
        }
      ]
    },
    {
      "id": 3,
      "slug": "the-journey-begins",
      "title": "The Journey Begins",
      "order": 2,
      "pages": []
    }
  ]
}
```

**Notes:**
- Only returns comics with `status: "live"`
- Only includes pages with `status: "published"`
- Chapters sorted by `order`
- Pages sorted by `chapterPageNumber`
- Returns 404 if comic not found or not live

---

### Get Page Images Only (for Preloading)

```
GET /api/public/comics/:slug/images
```

Lightweight endpoint returning just image URLs for buffering/preloading.

**Query Parameters:**
- `chapter` — Filter by chapter order number (1-indexed)
- `from` — Start at global page number
- `limit` — Number of pages (default: 10)

**Response:**

```json
{
  "comic": "my-awesome-comic",
  "pages": [
    {
      "globalPageNumber": 15,
      "chapterPageNumber": 1,
      "chapterId": 3,
      "thumbnail": "/api/media/file/page-015-400w.jpg",
      "thumbnailLarge": "/api/media/file/page-015-800w.jpg",
      "full": "/api/media/file/page-015.jpg"
    },
    {
      "globalPageNumber": 16,
      "chapterPageNumber": 2,
      "chapterId": 3,
      "thumbnail": "/api/media/file/page-016-400w.jpg",
      "thumbnailLarge": "/api/media/file/page-016-800w.jpg",
      "full": "/api/media/file/page-016.jpg"
    }
  ]
}
```

**Use case:** The reader can call this to preload the next N pages without fetching full page metadata.

---

### Get Comic Metadata Only

```
GET /api/public/comics/:slug/meta
```

Returns just comic metadata without chapters/pages. Useful for share cards, SEO, initial page load.

**Response:**

```json
{
  "slug": "my-awesome-comic",
  "title": "My Awesome Comic",
  "description": "A brief summary of the comic series",
  "coverImage": {
    "url": "/api/media/file/cover.jpg",
    "thumbnail": "/api/media/file/cover-400w.jpg"
  },
  "credits": [
    { "role": "writer", "name": "Jane Doe" }
  ],
  "genres": ["Action", "Adventure"],
  "stats": {
    "totalPages": 45,
    "totalChapters": 3
  },
  "seo": {
    "title": "My Awesome Comic - A Fantasy Adventure",
    "description": "Follow the journey of...",
    "image": "/api/media/file/social-card.jpg"
  }
}
```

---

## Caching Strategy

These endpoints should be cached aggressively since content only changes when creators publish:

| Endpoint | Cache Duration | Invalidation |
|----------|---------------|--------------|
| `/api/public/comics` | 5 minutes | On any comic status change |
| `/api/public/comics/:slug` | 1 hour | On comic/page publish |
| `/api/public/comics/:slug/images` | 1 hour | On page publish |
| `/api/public/comics/:slug/meta` | 1 hour | On comic update |

Cloudflare Workers can use Cache API or KV for this.

---

## Implementation Notes

These endpoints would be implemented as custom Payload endpoints (similar to `/api/comic-with-chapters`), with:

1. No `req.user` check (public access)
2. Explicit `where` filters for `status: "live"` and `status: "published"`
3. Response shaping to strip internal fields (user IDs, internal metadata)
4. Slug-based lookups instead of integer IDs

The endpoints could live alongside the existing CMS API at `/api/public/*` or on a separate worker/subdomain for isolation.
