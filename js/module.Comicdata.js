import comics from './comics.js';
import {
  getPagesFromArchive,
  getImageFromPage,
} from './module.Archiveparser.js';

const progbarConfig = {};

const normalizedComics = () => {
  comics.comics.map((comic) => {
    comic.sortname = comic.sortname || comic.name;
  });
  return comics;
};

const comicData =
  JSON.parse(localStorage.getItem('comicdata')) || normalizedComics();

const storeComicData = () => {
  localStorage.setItem('comicdata', JSON.stringify(comicData));
};

const getApproximateProgress = (num) => {
  return approximateProgressRange;
};

const generateProgressbar = (selector) => {
  progbarConfig.progressBar = document.createElement('progress');
  progbarConfig.progressBar.id = 'progbar';
  app.querySelector(selector).replaceChildren(progbarConfig.progressBar);
  progbarConfig.progressRange = -1;
  progbarConfig.progressTimer = setInterval(updateProgress, 50);
};

const updateProgress = () => {
  const progressAmt = progbarConfig.progressAmt;
  if (progbarConfig.progressRange === -1) {
    progbarConfig.progressRange = progressAmt;
    progbarConfig.progressBar.max = progressAmt;
  }
  progbarConfig.progressBar.value = progbarConfig.progressRange - progressAmt;
  if (progressAmt < 1) {
    clearInterval(progbarConfig.progressTimer);
  }
};

const sourceAllStorylineCovers = async (title) => {
  progbarConfig.progressAmt = getComic(title).storylines.length;
  const storylinesWithCoverImages = await Promise.all(
    getComic(title).storylines.map(async (storyline, index) => {
      const imgSrc =
        storyline.pages[0].img.original ||
        (await getImageFromPage(storyline.pages[0].href)); // Don't fetch if image is already present
      storyline.pages[0].img.original = imgSrc;
      progbarConfig.progressAmt -= 1;
      return storyline;
    })
  );
  storeComicData();
  return storylinesWithCoverImages;
};

const sourceAllImagesInStoryline = async (title, storynum) => {
  progbarConfig.progressAmt = getComic(title).storylines[storynum].pages.length;
  const comicWithAllStorylineImages = await Promise.all(
    getComic(title).storylines[storynum].pages.map(async (pageObj, index) => {
      const imgSrc =
        pageObj.img.original || (await getImageFromPage(pageObj.href)); // Don't fetch if image is already present
      pageObj.img.original = imgSrc;
      progbarConfig.progressAmt -= 1;
      return pageObj;
    })
  );
  storeComicData();
  console.log(comicData);
  return comicWithAllStorylineImages;
};

const getComic = (title) => {
  const selectedComic = comicData.comics.filter(
    (comic) => comic.name === title
  )[0];
  return selectedComic;
};

const getPopulatedComic = async (title) => {
  const selectedComic = getComic(title);
  if (!selectedComic.storylines) {
    // TODO: Find a better way to determine whether to skip the Archive parsing process.
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

const getImagesForStoryline = async (title, storylinenum) => {
  const storylineWithAllImages = await sourceAllImagesInStoryline(
    title,
    storylinenum
  );
  return storylineWithAllImages;
};

const getAllComics = () => {
  return comicData;
};

export {
  getComic,
  getPopulatedComic,
  getCoversForComic,
  getImagesForStoryline,
  getAllComics,
  generateProgressbar,
};
