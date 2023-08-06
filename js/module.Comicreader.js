import {
  getComic,
  bufferStorylineImages,
  generateProgressbar,
} from './module.Comicdata.js';
import { templater } from './module.Templater.js';
import { getImageFromPage, optimizeImage } from './module.Archiveparser.js';
import { initAdvancers, setAdvancersActive } from './module.Touch.js';
import { render } from './module.Router.js';
import { reverseZone } from './module.Zonesystem.js';
import { closeMenu, replaceHeaderTitle } from './module.Header.js';

const app = document.querySelector('#app');
const readingState = { pageIndex: 0 };

const updatePageNumber = (msg) => {
  app.querySelector('#comicsreadernav .op-page').textContent =
    msg || parseInt(readingState.pageIndex, 10) + 1;
};

const menuToCover = (e) => {
  const coverindex = e.currentTarget.dataset.storyindex;
  closeMenu();
  render(`/comic:${readingState.title}:${coverindex}:0`);
};

const menuToRack = () => {
  app
    .querySelector("#headersystems .header-menu .menu-btn[data-btntype='back']")
    .removeEventListener('click', menuToRack);
  closeMenu();
  render(`/rack:${readingState.title}`);
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

const buildComicMenu = (title = readingState.title) => {
  const storylines = getComic(title).storylines;
  const fragment = document.createDocumentFragment();
  storylines.forEach((storyline, index) => {
    const menuLi = document.createElement('li');
    menuLi.textContent = storyline.name;
    menuLi.classList.add('menu-btn');
    menuLi.dataset.btntype = 'forward';
    menuLi.dataset.storyindex = index;
    menuLi.addEventListener('click', menuToCover);
    fragment.appendChild(menuLi);
  });
  const gridMenu = templater('comicchaptermenu', fragment);
  gridMenu
    .querySelector(".menu-btn[data-btntype='back']")
    .addEventListener('click', menuToRack);

  replaceHeaderTitle(title);
  app.querySelector('#headerframe .header-menu').replaceChildren(gridMenu);
};

const initComic = async (title, storyNumParam = 0, pageNumParam = 0) => {
  // TODO: Make sure this function can initialize the storylines if navigated to directly.
  readingState.title = title;
  readingState.storyIndex = parseInt(storyNumParam, 10);
  readingState.pageIndex = parseInt(pageNumParam, 10);
  readingState.stack =
    getComic(title).storylines[readingState.storyIndex].pages;
  buildChapterProgressBar();
  buildComicMenu();
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

export { initComic };
