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
import { reverseZone } from './module.Zonesystem.js';

const app = document.querySelector('#app');
const readingState = { pageIndex: 0 };

// app.addEventListener('advance', (e) => {
//   transitionComicPage(e.detail);
// });

const updatePageNumber = (msg) => {
  app.querySelector('#comicsreadernav .op-page').textContent =
    msg || parseInt(readingState.pageIndex, 10) + 1;
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

const buildComic = async (title, storyNumParam = 0, pageNumParam = 0) => {
  readingState.title = title;
  readingState.storyIndex = parseInt(storyNumParam, 10);
  readingState.pageIndex = parseInt(pageNumParam, 10);
  console.log(readingState);
  readingState.stack =
    getComic(title).storylines[readingState.storyIndex].pages;
  buildChapterProgressBar();
  bufferStorylineImages(readingState.stack, readingState.pageIndex);
  const ghostMount = await generateGhostMount(readingState.pageIndex);
  const comicReader = templater('comicreader', ghostMount);
  app.querySelector('#comicpages').replaceChildren(comicReader);
  updatePageNumber();
  initAdvancers();
  app.addEventListener('advance', transitionComicPage);
};

const generateGhostMount = async (pageNum) => {
  const ghostPagePrev = document.createElement('img');
  const activePage = document.createElement('img');
  const ghostPageNext = document.createElement('img');

  activePage.onload = () => {
    app.querySelector('#ghostProg')?.remove();
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

const transitionComicPage = async (e) => {
  const advDir = typeof e === 'number' ? e : e.detail;

  const gotoRack = () => {
    app.removeEventListener('advance', transitionComicPage);
    render(`/rack:${readingState.title}`);
  };
  const gotoInterstitial = (storyidx = readingState.storyIndex) => {
    app.removeEventListener('advance', transitionComicPage);
    render(`/interstitial:${readingState.title}:${storyidx}`);
  };

  const requestedPageIndex = readingState.pageIndex + advDir;
  if (requestedPageIndex < 0) {
    if (readingState.storyIndex > 0) {
      // TODO: Swap the transition side in this scenario.
      reverseZone('#interstitial');
      setTimeout(gotoInterstitial, 1, readingState.storyIndex - 1);
    } else {
      gotoRack();
    }
    return false;
  } else if (requestedPageIndex > readingState.stack.length - 1) {
    gotoInterstitial();
    return false;
  }
  console.log(`${advDir < 0 ? '<-' : '->'} ${requestedPageIndex}`);

  setAdvancersActive(false);
  updatePageNumber(requestedPageIndex + 1);
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

  const ghostProgBar = document.createElement('progress');
  ghostProgBar.id = 'ghostProg';
  ghostProgBar.classList.add('progbar');
  app.querySelector('#comicpages').appendChild(ghostProgBar);

  const newGhostMount = await generateGhostMount(readingState.pageIndex);
  ghostMount.parentNode.appendChild(newGhostMount);

  setTimeout(removeGhostMount, 10, ghostMount);

  updatePageNumber();
  setAdvancersActive(true);
};

export { buildComic };
