import {
  getComic,
  getPopulatedComic,
  getCoversForComic,
  bufferStorylineImages,
  generateProgressbar,
} from './module.Comicdata.js';
import { templater } from './module.Templater.js';
import {
  getPagesFromArchive,
  getImageFromPage,
  optimizeImage,
} from './module.Archiveparser.js';
import { initAdvancers, setAdvancersActive } from './module.Touch.js';
import { render } from './module.Router.js';

const app = document.querySelector('#app');
const readingState = { pageIndex: 0 };

app.addEventListener('advance', (e) => {
  transitionPage(e.detail);
});

const goToRack = () => {
  render(`/rack:${readingState.title}`);
};

const updatePageNumber = () => {
  app.querySelector('#comicsreadernav .op-page').textContent =
    parseInt(readingState.pageIndex, 10) + 1;
};

const buildChapterProgressBar = () => {
  const selectedComic = getComic(readingState.title);
  const progBar = generateProgressbar();
  const progbarBox = templater('progressbar', [
    selectedComic.name + ':',
    selectedComic.storylines[readingState.storyIndex].name,
    progBar,
  ]);
  app.querySelector('#comicpages').replaceChildren(progbarBox);
};

const buildComic = async (title, storyNum = 0, pageNum = 0) => {
  readingState.title = title;
  readingState.storyIndex = storyNum;
  readingState.pageIndex = pageNum;
  readingState.stack = getComic(title).storylines[storyNum].pages;
  buildChapterProgressBar();
  bufferStorylineImages(readingState.stack, readingState.pageIndex);
  const ghostMount = await generateGhostMount(pageNum);
  const comicReader = templater('comicreader', ghostMount);
  app.querySelector('#comicpages').replaceChildren(comicReader);
  initAdvancers();
};

const generateGhostMount = async (pageNum) => {
  const ghostPagePrev = document.createElement('img');
  const activePage = document.createElement('img');
  const ghostPageNext = document.createElement('img');

  const ghostProgBar = document.createElement('progress');
  ghostProgBar.classList.add('progbar');

  app.querySelector('#comicpages').appendChild(ghostProgBar);
  activePage.onload = () => {
    ghostProgBar.remove();
  };

  if (pageNum > 0) {
    const ghostPagePrevOrig =
      readingState.stack[pageNum - 1]?.img?.original ||
      (await getImageFromPage(readingState.stack[pageNum - 1].href));
    ghostPagePrev.src = optimizeImage(ghostPagePrevOrig, 800);
  }
  const activePageOrig =
    readingState.stack[pageNum]?.img?.original ||
    (await getImageFromPage(readingState.stack[pageNum].href));
  activePage.src = optimizeImage(activePageOrig, 800);
  if (pageNum < readingState.stack.length - 1) {
    const ghostPageNextOrig =
      readingState.stack[pageNum + 1]?.img?.original ||
      (await getImageFromPage(readingState.stack[pageNum + 1].href));
    ghostPageNext.src = optimizeImage(ghostPageNextOrig, 800);
  }

  const ghostMount = templater('ghostmount', [
    ghostPagePrev,
    activePage,
    ghostPageNext,
  ]);

  return ghostMount;
};

const removeGhostMount = (ghostMount) => {
  // ghostMount.classList.add('banish');
  ghostMount.remove();
};

const transitionPage = async (advDir) => {
  const requestedPageIndex = readingState.pageIndex + advDir;
  if (requestedPageIndex < 0) {
    goToRack();
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

  bufferStorylineImages(readingState.stack, readingState.pageIndex);
};

const completeSlide = async () => {
  const ghostMount = app.querySelector(
    '#ghostmount-region > .comicpages-ghostmount'
  );
  ghostMount.removeEventListener('transitionend', completeSlide);

  const newGhostMount = await generateGhostMount(readingState.pageIndex);
  ghostMount.parentNode.appendChild(newGhostMount);

  setTimeout(removeGhostMount, 10, ghostMount);

  updatePageNumber();
  setAdvancersActive(true);
};

export { buildComic };
