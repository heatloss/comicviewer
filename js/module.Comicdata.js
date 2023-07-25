import comics from './comics.js';
import {
  getPagesFromArchive,
  getImageFromPage,
} from './module.Archiveparser.js';

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

const populateAllStorylineCovers = async (title) => {
  const storylinesWithCoverImages = await Promise.all(
    getComic(title).storylines.map(async (storyline) => {
      const imgSrc =
        storyline.pages[0].img.full ||
        (await getImageFromPage(storyline.pages[0].href)); // Don't fetch if image is already present
      storyline.pages[0].img.full = imgSrc;
      return storyline;
    })
  );
  storeComicData();
  console.log(comicData);
  return storylinesWithCoverImages; // T
};

const populateAllImagesInStoryline = async (title, storylinenum) => {
  const comicWithAllStorylineImages = await Promise.all(
    getComic(title).storylines[storylinenum].pages.map(async (pageObj) => {
      const imgSrc = pageObj.img.full || (await getImageFromPage(pageObj.href)); // Don't fetch if image is already present
      pageObj.img.full = imgSrc;
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
  const archiveAndChapters = await getPagesFromArchive(
    selectedComic.archiveurl
  );
  Object.assign(selectedComic, archiveAndChapters);
  return selectedComic;
};

const getCoversForComic = async (title) => {
  const storylinesWithCovers = await populateAllStorylineCovers(title);
  // console.log(comicWithCovers);
  return storylinesWithCovers;
};

const getAllComics = () => {
  return comicData;
};

export { getComic, getPopulatedComic, getCoversForComic, getAllComics };
