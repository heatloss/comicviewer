import {
  getComic,
  getPopulatedComic,
  getCoversForComic,
} from './module.Comicdata.js';
import { templater } from './module.Templater.js';
import {
  getPagesFromArchive,
  getImageFromPage,
} from './module.Archiveparser.js';
import { initAdvancers } from './module.Touch.js';

const app = document.querySelector('#app');
const readingState = { pageIndex: 0 };

document.addEventListener('advance', (e) => {
  advancePage(e.detail);
});
// function singleUseListener(e, func) {
//   readingState.eventregistry[e] = () => {
//     func();
//     window.removeEventListener(e, readingState.eventregistry[e]);
//   };
//   window.addEventListener(e, readingState.eventregistry[e]);
// }

const buildComic = async (title, storyNum = 0, pageNum = 0) => {
  const selectedComic = getComic(title);
  readingState.stack = selectedComic.storylines[storyNum].pages;
  readingState.pageIndex = pageNum;
  // FETCH THREE PAGES
  const ghostPagePrev = document.createElement('img');
  const activePage = document.createElement('img');
  const ghostPageNext = document.createElement('img');
  if (pageNum > 0) {
    ghostPagePrev.src =
      readingState.stack[pageNum - 1]?.img?.full ||
      (await getImageFromPage(readingState.stack[pageNum - 1].href));
  }
  activePage.src =
    readingState.stack[pageNum]?.img?.full ||
    (await getImageFromPage(readingState.stack[pageNum].href));
  if (pageNum < readingState.stack.length - 1) {
    ghostPageNext.src =
      readingState.stack[pageNum + 1]?.img?.full ||
      (await getImageFromPage(readingState.stack[pageNum + 1].href));
  }

  const comicPage = templater('comicreader', [
    ghostPagePrev,
    activePage,
    ghostPageNext,
  ]);

  app.querySelector('#comicpages').replaceChildren(comicPage);
  initAdvancers();

  /*
  window.scrollTo(0, 0);
  headernavTitle.textContent = '';
  const target = e.currentTarget;
	const loadingmsg = templates.loading.content.firstElementChild.cloneNode(true);
	loadingmsg.querySelector("#feedname").textContent = `${target.dataset.title}`;
	comicLayout.replaceChildren(loadingmsg);
  closeSidebar(true);


      headernavTitle.textContent = title;
      const items = data.querySelectorAll('item');
      const fragment = document.createElement('div');
      fragment.classList.add('comicpagesbox');
      const itemsReversed = [...items].reverse();
      itemsReversed.forEach((el) => {
        const comicpage = comictmpl.content.firstElementChild.cloneNode(true);
        const elcomicbody =
          rssType === 'wp' ?
          el.querySelector('encoded').textContent :
          el.querySelector('description').textContent;
        const pendingImage = document.createElement('img');
        pendingImage.classList.add('pending');
        const imageFrame = comicpage.querySelector('.comic-image');
        fragment.appendChild(comicpage);
        processImage(comicpage, elcomicbody, rssType).then((processedbox) => {
          const processedimage = processedbox.firstElementChild;
          imageFrame.appendChild(processedimage);
          observer.observe(processedimage);
        });
      });
      comicLayout.replaceChildren(fragment);
 */
};

const advancePage = (advDir) => {
  const requestedPageIndex = readingState.pageIndex + advDir;
  if (requestedPageIndex < 0) {
    // Transition to #rack
    console.log('BACK TO RACK');
    return false;
  }
  if (requestedPageIndex > readingState.stack.length - 1) {
    // Transition to #endofchapter
    console.log('END OF CHAPTER');
    return false;
  }

  console.log(`Transition to page index ${requestedPageIndex}`);
  readingState.pageIndex = requestedPageIndex;

  // comicStack.allPages[comicStack.activePageIndex].classList.remove('active');
  // const nextPage = comicStack.allPages[pageTarget - 1];
  // nextPage.classList.add('active');
  // comicStack.addEventListener('transitionend', completeSlide);
  // comicStack.style.transform =
  //   'translateX(' + (pageTarget * -100 + 100) + 'vw)';
  // comicStack.activePageIndex = pageTarget - 1;
  // comicStack.pageIndicator.textContent = pageTarget.toString();
};

function completeSlide() {
  comicStack.removeEventListener('transitionend', completeSlide);
  // Reset the ghosts
}

export { buildComic };
