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

// const sourceAllImagesInStoryline = async (title, storynum) => {
//   progbarConfig.progressAmt = getComic(title).storylines[storynum].pages.length;
//   const comicWithAllStorylineImages = await Promise.all(
//     getComic(title).storylines[storynum].pages.map(async (pageObj, index) => {
//       const imgSrc =
//         pageObj.img.original || (await getImageFromPage(pageObj.href)); // Don't fetch if image is already present
//       pageObj.img.original = imgSrc;
//       progbarConfig.progressAmt -= 1;
//       return pageObj;
//     })
//   );
//   storeComicData();
//   console.log(comicData);
//   return comicWithAllStorylineImages;
// };

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
  console.log(comicData);
  return imageSources;
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

// const getStorylineImageBuffer = async (storypages, pagenum = 0) => {
//   const imageBuffer = await sourceSomeImagesInStoryline(storypages, pagenum);
//   return imageBuffer;
// };

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
};
