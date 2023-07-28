import {
  getComic,
  getPopulatedComic,
  getCoversForComic,
  getImagesForStoryline,
  generateProgressbar,
} from './module.Comicdata.js';
import { templater } from './module.Templater.js';
import {
  getPagesFromArchive,
  getImageFromPage,
  optimizeImage,
} from './module.Archiveparser.js';
import { initAdvancers, setAdvancersActive } from './module.Touch.js';

const app = document.querySelector('#app');
const readingState = { pageIndex: 0 };

app.addEventListener('advance', (e) => {
  transitionPage(e.detail);
});

const buildComic = async (title, storyNum = 0, pageNum = 0) => {
  const selectedComic = getComic(title);
  // INSERT LOADING ANIMATION
  generateProgressbar('#comicpages');
  const fullySourcedStoryline = await getImagesForStoryline(title, storyNum);
  readingState.stack = fullySourcedStoryline;
  readingState.pageIndex = pageNum;
  const ghostMount = await generateGhostMount(pageNum);
  const comicReader = templater('comicreader', ghostMount);
  app.querySelector('#comicpages').replaceChildren(comicReader);
  initAdvancers();
};

const generateGhostMount = async (pageNum) => {
  const ghostPagePrev = document.createElement('img');
  const activePage = document.createElement('img');
  const ghostPageNext = document.createElement('img');
  if (pageNum > 0) {
    const ghostPagePrevOrig =
      readingState.stack[pageNum - 1]?.img?.original ||
      (await getImageFromPage(readingState.stack[pageNum - 1].href));
    ghostPagePrev.src = optimizeImage(ghostPagePrevOrig);
  }
  const activePageOrig =
    readingState.stack[pageNum]?.img?.original ||
    (await getImageFromPage(readingState.stack[pageNum].href));
  activePage.src = optimizeImage(activePageOrig);
  if (pageNum < readingState.stack.length - 1) {
    const ghostPageNextOrig =
      readingState.stack[pageNum + 1]?.img?.original ||
      (await getImageFromPage(readingState.stack[pageNum + 1].href));
    ghostPageNext.src = optimizeImage(ghostPageNextOrig);
  }

  const ghostMount = templater('ghostmount', [
    ghostPagePrev,
    activePage,
    ghostPageNext,
  ]);

  return ghostMount;
};

const transitionPage = (advDir) => {
  const requestedPageIndex = readingState.pageIndex + advDir;
  if (requestedPageIndex < 0) {
    // Transition to #rack
    console.log('BACK TO RACK');
    return false;
  } else if (requestedPageIndex > readingState.stack.length - 1) {
    // Transition to #endofchapter
    console.log('END OF CHAPTER');
    return false;
  }
  console.log(`${advDir < 0 ? '<-' : '->'} ${requestedPageIndex}`);

  setAdvancersActive(false);

  const ghostMount = app.querySelector(
    '#ghostmount-region > .comicpages-ghostmount'
  );
  ghostMount.classList.add(advDir > 0 ? 'movePrev' : 'moveNext');
  ghostMount.addEventListener('transitionend', completeSlide);
  readingState.pageIndex = requestedPageIndex;
};

const completeSlide = async () => {
  const ghostMount = app.querySelector(
    '#ghostmount-region > .comicpages-ghostmount'
  );

  ghostMount.removeEventListener('transitionend', completeSlide);

  const newGhostMount = await generateGhostMount(readingState.pageIndex);

  ghostMount.parentNode.appendChild(newGhostMount);

  ghostMount.remove();
  setAdvancersActive(true);
};

export { buildComic };
