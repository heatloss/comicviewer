import comics from './comics.js';
import {
  getPagesFromArchive,
  getImageFromPage,
  bufferImageList,
} from './module.Archiveparser.js';

const progbarConfig = {};

const normalizedComics = () => {
  comics.comics.map((comic) => {
    comic.sortname = comic.sortname || comic.name;
    return comic;
  });
  return comics;
};

const comicData =
  JSON.parse(localStorage.getItem('comicdata')) || normalizedComics();

const storeComicData = () => {
  localStorage.setItem('comicdata', JSON.stringify(comicData));
};

const generateProgressbar = (idString = 'progbar') => {
  progbarConfig.progressBar = document.createElement('progress');
  progbarConfig.progressBar.id = idString;
  progbarConfig.progressBar.classList.add('progbar');
  // app.querySelector(selector).replaceChildren(progbarConfig.progressBar);
  progbarConfig.progressRange = -1;
  progbarConfig.progressAmt = -1;
  progbarConfig.progressTimer = setInterval(updateProgress, 250);
  return progbarConfig.progressBar;
};

const updateProgress = () => {
  const progressAmt = progbarConfig.progressAmt;
  if (progbarConfig.progressRange === -1) {
    progbarConfig.progressRange = progressAmt;
    progbarConfig.progressBar.max = progressAmt;
  }
  progbarConfig.progressBar.value =
    progressAmt === -1 ? '-1' : progbarConfig.progressRange - progressAmt;
  if (progressAmt < 1) {
    clearInterval(progbarConfig.progressTimer);
  }
};

const sourceAllStorylineCovers = async (title) => {
  progbarConfig.progressAmt = getComic(title).storylines.length;
  const storylinesWithCoverImages = await Promise.all(
    getComic(title).storylines.map(async (storyline) => {
      const imgSrc =
        storyline.pages[0].img?.original ||
        (await getImageFromPage(storyline.pages[0].href)); // Don't fetch if image is already present
      storyline.pages[0].img.original = imgSrc;
      progbarConfig.progressAmt -= 1;
      return storyline;
    })
  );
  storeComicData();
  return storylinesWithCoverImages;
};

const sourceSomeImagesInStoryline = async (storyPages, pagenum, buffer = 6) => {
  const storySlice = storyPages.slice(
    Math.max(pagenum - buffer, 0),
    Math.min(pagenum + buffer, storyPages.length - 1)
  );
  progbarConfig.progressAmt = storySlice.length;
  const imageSources = await Promise.all(
    storySlice.map(async (pageObj) => {
      const imgSrc =
        pageObj.img?.original || (await getImageFromPage(pageObj.href)); // Don't fetch if image is already present
      pageObj.img.original = imgSrc;
      progbarConfig.progressAmt -= 1;
      return imgSrc;
    })
  );
  storeComicData();
  return imageSources;
};

const getComic = (title) => {
  const selectedComic = comicData.comics.filter(
    (comic) => comic.name === title
  )[0];
  return selectedComic;
};

const wasRecentlyChecked = (title) => {
  const checkComic = getComic(title);
  if (checkComic?.lastchecked) {
    if (new Date() - new Date(checkComic.lastchecked) < 3600000) {
      return true; // If last checked less than an hour ago
    }
  }
  return false;
};

const updatePubDate = (title, pubdate) => {
  const comic = getComic(title);
  comic.lastupdated = pubdate;
  comic.lastchecked = new Date();
  storeComicData();
};

const getPopulatedComic = async (title) => {
  const selectedComic = getComic(title);
  if (!selectedComic?.storylines?.length > 0 || !wasRecentlyChecked(title)) {
    const archiveAndChapters = await getPagesFromArchive(
      selectedComic.archiveurl
    );
    Object.assign(selectedComic, archiveAndChapters);
  }
  return selectedComic;
};

const getCoversForComic = async (title) => {
  const storylinesWithCovers = await sourceAllStorylineCovers(title);
  return storylinesWithCovers;
};

const bufferCoverImages = async (storylines) => {
  const coversArray = storylines.map((storyline) => {
    return storyline.pages[0];
  });
  const imageBuffer = await sourceSomeImagesInStoryline(coversArray);
  bufferImageList(imageBuffer);
  return imageBuffer;
};

const bufferStorylineImages = async (storypages, pagenum) => {
  const imageBuffer = await sourceSomeImagesInStoryline(storypages, pagenum);
  bufferImageList(imageBuffer);
  return imageBuffer;
};

const getAllComics = () => {
  return comicData;
};

export {
  getComic,
  getPopulatedComic,
  getCoversForComic,
  bufferStorylineImages,
  bufferCoverImages,
  getAllComics,
  generateProgressbar,
  wasRecentlyChecked,
  updatePubDate,
};
