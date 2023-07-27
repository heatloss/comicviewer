const app = document.querySelector('#app');
// const htmlElem = document.documentElement;
const comicStack = document.querySelector('.comicpages-stack');
// comicStack.allPages = comicStack.querySelectorAll('.comicpage');
// comicStack.pageIndicator = document.querySelector(
//   '#comic-navigation .currentPage'
// );
// comicStack.activePageIndex = 0;
// comicStack.allPages.forEach((elem, currentIndex) => {
//   elem.dataset.pageNumber = currentIndex + 1;
//   if (elem.classList.contains('active')) {
//     comicStack.activePageIndex = currentIndex;
//   }
// });

const initAdvancers = () => {
  const advanceButtons = app.querySelectorAll('[data-pageadvance]');
  advanceButtons.forEach((elem) => {
    elem.addEventListener('click', requestAdvancement);
  });
};
// const resetButton = document.querySelector('#comic-logo');
// resetButton.addEventListener('click', resetPage);
// comicStack.allPages[comicStack.activePageIndex].classList.add('active');

// comicStack.style.width = comicStack.allPages.length * 100 + 'vw';
// comicStack.classList.add('stacked');

// function getHashNumber() {
//   return parseInt(window.location.hash.substr(6), 10) || 1;
// }

// function getActivePageNumber() {
//   return comicStack.activePageIndex + 1;
// }

const requestAdvancement = (e) => {
  const dir = parseInt(e.currentTarget.dataset.pageadvance, 10);
  const pageAdvancer = new CustomEvent('advance', {
    detail: dir,
  });
  document.dispatchEvent(pageAdvancer);
};

// function jankPage(vector) {
//   const jankDirectionClass = vector === 1 ? 'jank-right' : 'jank-left';
//   comicStack.addEventListener('animationend', removeJank);
//   comicStack.classList.add(jankDirectionClass);
// }
//
// function removeJank() {
//   comicStack.removeEventListener('animationend', removeJank);
//   comicStack.classList.remove('jank-left', 'jank-right');
// }

// function goToHashedPage() {
//   if (getHashNumber() !== getActivePageNumber()) {
//     gotoPage(getHashNumber());
//   }
// }

// function captureScreenWidth() {
//   htmlElem.style.setProperty('--innerwidth', `${htmlElem.clientWidth}px`);
//   htmlElem.style.setProperty('--scrollbarwidth', `${window.innerWidth - htmlElem.clientWidth}px`);
// }

export { initAdvancers };
