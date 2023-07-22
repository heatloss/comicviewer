import comics from "./comics.js";
import {
  getPagesFromArchive,
  getImageFromPage,
} from "./module.Archiveparser.js";

const comicData = comics;
comicData.comics.map((comic) => {
  comic.sortname = comic.sortname || comic.name;
});

const populateAllStorylineCovers = async (title) => {
  await Promise.all(
    getComic(title).storylines.map(async (storyline) => {
      const imgSrc =
        storyline.pages[0].img.full ||
        (await getImageFromPage(storyline.pages[0].href)); // Don't fetch if image is already present
      storyline.pages[0].img.full = imgSrc;
    })
  );
};

const populateAllImagesInStoryline = async (title, storylinenum) => {
  await Promise.all(
    getComic(title).storylines[storylinenum].pages.map(async (pageObj) => {
      const imgSrc = pageObj.img.full || (await getImageFromPage(pageObj.href)); // Don't fetch if image is already present
      pageObj.img.full = imgSrc;
    })
  );
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
  const comicWithCovers = await populateAllStorylineCovers(title);
  return comicWithCovers;
};

const getAllComics = () => {
  return comicData;
};

export { getComic, getPopulatedComic, getCoversForComic, getAllComics };
