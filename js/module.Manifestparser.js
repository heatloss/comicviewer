/**
 * Manifestparser - Fetches and parses CMS JSON manifests
 *
 * Replaces: module.Archiveparser.js, module.Feedparser.js
 *
 * Phase 1: Basic fetch functions (no transformation yet)
 */

const isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

const config = {
  cmsBaseUrl: isLocal
    ? 'http://localhost:3333'
    : 'https://api.chimeracomics.org',
  manifestPath: '/api/pub/v1',
};

/**
 * Fetch the master comics index
 * @returns {Promise<{version: string, generatedAt: string, comics: Array}>}
 */
const getComicsIndex = async () => {
  const url = `${config.cmsBaseUrl}${config.manifestPath}/index.json`;
  console.log('[Manifestparser] Fetching index:', url);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch comics index: ${response.status}`);
  }

  const data = await response.json();
  console.log('[Manifestparser] Index loaded:', data.comics?.length, 'comics');
  return data;
};

/**
 * Fetch manifest for a specific comic
 * @param {string} slug - Comic slug (e.g., "my-comic")
 * @returns {Promise<{comic: Object, chapters: Array, pages: Array, navigation: Object}>}
 */
const getComicManifest = async (slug) => {
  const url = `${config.cmsBaseUrl}${config.manifestPath}/comics/${slug}/manifest.json`;
  console.log('[Manifestparser] Fetching manifest:', url);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch manifest for "${slug}": ${response.status}`
    );
  }

  const data = await response.json();
  console.log(
    '[Manifestparser] Manifest loaded:',
    slug,
    '-',
    data.pages?.length,
    'pages'
  );
  return data;
};

/**
 * Get full image URL from relative path
 * @param {string} path - Relative path (e.g., "/media/abc123.jpg")
 * @returns {string} Full URL
 */
const getImageUrl = (path) => {
  if (!path) return null;
  if (typeof path !== 'string') return null;
  if (path.startsWith('http')) return path;
  return `${config.cmsBaseUrl}${path}`;
};

/**
 * Transform image object from manifest to full URLs
 * @param {Object|string} image - Image object with original/mobile/desktop or legacy string path
 * @returns {Object} Image object with full URLs
 */
const transformImageUrls = (image) => {
  if (!image) return { original: null, mobile: null, desktop: null };

  // Handle legacy string format
  if (typeof image === 'string') {
    const url = getImageUrl(image);
    return { original: url, mobile: url, desktop: url };
  }

  // Handle new object format
  return {
    original: getImageUrl(image.original),
    mobile: getImageUrl(image.mobile),
    desktop: getImageUrl(image.desktop),
  };
};

/**
 * Transform credits array to display string
 * @param {Array|string} credits - Credits array [{role, name, url}, ...] or legacy string
 * @returns {string|null} Formatted credits string like "Name, Name2"
 */
const formatCredits = (credits) => {
  if (!credits) return null;
  if (typeof credits === 'string') return credits; // Legacy format
  if (Array.isArray(credits)) {
    return credits.map((c) => c.name).join(', ');
  }
  return null;
};

/**
 * Transform CMS manifest to SPA expected format
 * Maps nested chapters[].pages[] → storylines[].pages[]
 *
 * @param {Object} manifest - Raw CMS manifest
 * @returns {Object} Transformed comic data matching SPA structure
 */
const transformManifest = (manifest) => {
  const { comic, chapters } = manifest;

  // Map chapters to storylines (pages are already nested)
  const storylines = chapters
    .sort((a, b) => a.order - b.order)
    .map((chapter) => {
      const chapterPages = chapter.pages.map((page) => ({
        id: `${comic.slug}-page-${page.globalPageNumber}`,
        href: `${config.cmsBaseUrl}/comics/${comic.slug}/page/${page.globalPageNumber}`,
        name: page.title || `Page ${page.chapterPageNumber}`,
        archivepageindex: page.globalPageNumber - 1,
        img: {
          ...transformImageUrls(page.image),
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

  // Handle comic thumbnail (may be string or object)
  const thumbnailUrls = transformImageUrls(comic.thumbnail);

  return {
    id: comic.slug,
    title: comic.title,
    sortname: comic.sortname || comic.title,
    square: thumbnailUrls.mobile || thumbnailUrls.original,
    thumbnail: thumbnailUrls,
    description: comic.description || comic.tagline,
    credits: formatCredits(comic.credits),
    creditsData: comic.credits || [], // Raw data for future use
    genres: comic.genres || [],
    tags: comic.tags || [],
    links: comic.links || [],
    storylines,
  };
};

/**
 * Fetch and transform a comic manifest
 * Returns data in the format the SPA expects
 *
 * @param {string} slug - Comic slug
 * @returns {Promise<Object>} Transformed comic data
 */
const getTransformedComic = async (slug) => {
  console.log('transform');
  const manifest = await getComicManifest(slug);
  return transformManifest(manifest);
};

// Expose for console testing
if (typeof window !== 'undefined') {
  window.Manifestparser = {
    getComicsIndex,
    getComicManifest,
    getImageUrl,
    formatCredits,
    transformManifest,
    getTransformedComic,
    config,
  };
}

export {
  getComicsIndex,
  getComicManifest,
  getImageUrl,
  formatCredits,
  transformManifest,
  getTransformedComic,
  config,
};
