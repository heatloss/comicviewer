import { templater } from './module.Templater.js';
import { render } from './module.Router.js';
import { getComic } from './module.Comicdata.js';
import { initAdvancers } from './module.Touch.js';
import { reverseZone } from './module.Zonesystem.js';

const app = document.querySelector('#app');
const interstitialState = {};

const interstitialToComicPage = (e) => {
  app.removeEventListener('advance', exitIterstitial);
  const storylineData = e.currentTarget ? e.currentTarget.dataset : e;
  render(
    `/comic:${storylineData.storytitle}:${storylineData.storyindex || 0}:${
      storylineData.pageindex || 0
    }`
  );
};

const interstitialToComicPageReversed = (e) => {
  const eData = e.currentTarget ? e.currentTarget.dataset : e;
  reverseZone('#comicpages');
  setTimeout(interstitialToComicPage, 1, eData);
};

const interstitialToRack = () => {
  app.removeEventListener('advance', exitIterstitial);
  render(`/rack:${interstitialState.title}`);
};

const buildInterstitial = async (title, storyNumParam) => {
  const storylineIndex = parseInt(storyNumParam, 10);
  app.querySelector('#headertitle').textContent = title;

  const comic = getComic(title);
  if (storylineIndex === comic.storylines.length - 1) {
    alert('NO MORE CHAPTERS'); // TODO: Build end interstitial
    return false;
  }

  // const lastChapterNumber = storylineIndex + 1;
  const lastChapterName = comic.storylines[storylineIndex].name;
  interstitialState.title = title;
  interstitialState.storylineindex = storylineIndex;
  const interstitialBox = templater('interstitial', [lastChapterName]);

  const loadNextPageBtn = interstitialBox.querySelector(
    "li.nav-btn[data-btntype='forward']:first-child"
  );
  const backToRackBtn = interstitialBox.querySelector(
    "li.nav-btn[data-btntype='back']"
  );
  const lastPageBtn = interstitialBox.querySelector(
    "li.nav-btn[data-btntype='forward']:last-child"
  );
  loadNextPageBtn.dataset.storytitle = title;
  loadNextPageBtn.dataset.storyindex = storylineIndex + 1;

  backToRackBtn.dataset.storytitle = title;

  lastPageBtn.dataset.storytitle = title;
  lastPageBtn.dataset.storyindex = comic.storylines.length - 1;
  lastPageBtn.dataset.pageindex =
    comic.storylines[comic.storylines.length - 1].pages.length - 1;

  loadNextPageBtn.addEventListener('click', interstitialToComicPageReversed);
  backToRackBtn.addEventListener('click', interstitialToRack);
  lastPageBtn.addEventListener('click', interstitialToComicPage);

  app.querySelector('#interstitial').replaceChildren(interstitialBox);
  initAdvancers();
  app.addEventListener('advance', exitIterstitial);
};

const exitIterstitial = async (e) => {
  const advDir = e.detail;
  const comic = getComic(interstitialState.title);
  const eData = { storytitle: interstitialState.title };
  if (advDir === -1) {
    eData.storyindex = interstitialState.storylineindex;
    eData.pageindex =
      comic.storylines[interstitialState.storylineindex].pages.length - 1;
    comic.storylines[comic.storylines.length - 1].pages.length - 1;
    interstitialToComicPage(eData); // Last page of previous chapter
  } else if (advDir === 1) {
    eData.storyindex = interstitialState.storylineindex + 1;
    interstitialToComicPageReversed(eData);
  }
  console.log(`${advDir < 0 ? '<- END OF PREV CHAPTER' : '-> CONTINUE'}`);
};

export { buildInterstitial };
