import {
  getComicsIndex,
  getTransformedComic,
  getImageUrl,
  formatCredits,
} from './module.Manifestparser.js';

const comicsIndex = await getComicsIndex();

/**
 * Transform index comics to include full image URLs
 */
const normalizedComics = () => {
  return comicsIndex.comics.map((comic) => ({
    ...comic,
    sortname: comic.sortname || comic.title,
    square: getImageUrl(comic.thumbnail), // Resolve relative path to full URL
    credits: formatCredits(comic.credits), // Format credits array to string
  }));
};

const comicData = normalizedComics();

/**
 * Find a comic by identifier (slug preferred, title as fallback)
 * @param {string} identifier - Comic slug or title
 */
const getComic = (identifier) => {
  const selectedComic = comicData.find(
    (comic) => comic.slug === identifier || comic.title === identifier
  );
  return selectedComic;
};

/**
 * Fetch full comic manifest by identifier (slug preferred, title as fallback)
 * @param {string} identifier - Comic slug or title
 */
const getPopulatedComic = async (identifier) => {
  const comicEntry = comicsIndex.comics.find(
    (c) => c.slug === identifier || c.title === identifier
  );
  if (!comicEntry) {
    throw new Error(`Comic not found: ${identifier}`);
  }

  // Fetch transformed manifest (includes storylines with all image URLs)
  return getTransformedComic(comicEntry.slug);
};

/**
 * Prefetch images by preloading them into browser cache
 * @param {string[]} urls - Array of image URLs to prefetch
 */
const prefetchImages = (urls) => {
  urls.forEach((url) => {
    if (url) {
      const img = new Image();
      img.src = url;
    }
  });
};

/**
 * Prefetch cover images for all storylines (uses mobile size)
 * @param {Array} storylines - Storylines array with pages
 */
const bufferCoverImages = (storylines) => {
  const coverUrls = storylines
    .map((storyline) => {
      const img = storyline.pages[0]?.img;
      return img?.mobile || img?.original;
    })
    .filter(Boolean);
  prefetchImages(coverUrls);
  return coverUrls;
};

/**
 * Prefetch images around current reading position (uses desktop size)
 * @param {Array} storypages - Pages in current storyline
 * @param {number} pagenum - Current page index
 * @param {number} buffer - Number of pages to prefetch in each direction
 */
const bufferStorylineImages = (storypages, pagenum, buffer = 6) => {
  const startIdx = Math.max(pagenum - buffer, 0);
  const endIdx = Math.min(pagenum + buffer + 1, storypages.length);
  const imageUrls = storypages
    .slice(startIdx, endIdx)
    .map((page) => {
      const img = page.img;
      return img?.desktop || img?.original;
    })
    .filter(Boolean);
  prefetchImages(imageUrls);
  return imageUrls;
};

const getAllComics = () => {
  return { comics: comicData };
};

export {
  getComic,
  getPopulatedComic,
  bufferStorylineImages,
  bufferCoverImages,
  getAllComics,
};
