import { templater } from './module.Templater.js';
import { render } from './module.Router.js';
import { getComic } from './module.Comicdata.js';
// import { initAdvancers } from './module.Touch.js';
import { reverseZone } from './module.Zonesystem.js';

const app = document.querySelector('#app');
const interstitialState = {};

const interstitialToComicPage = (e) => {
  // app.removeEventListener('advance', exitIterstitial);
  const storylineData = e.currentTarget ? e.currentTarget.dataset : e;
  render(
    `/comic:${storylineData.storytitle}:${storylineData.storyindex || 0}:${
      storylineData.pageindex || 0
    }`
  );
};

const interstitialToHome = (e) => {
  const tab = e.currentTarget.dataset.tab;
  render(`/home:${tab}`);
};

const interstitialToComicPageReversed = (e) => {
  const eData = e.currentTarget ? e.currentTarget.dataset : e;
  reverseZone('#comicpages');
  setTimeout(interstitialToComicPage, 1, eData);
};

const interstitialToRack = () => {
  render(`/rack:${interstitialState.title}`);
};

const buildInterstitial = async (title, storyNumParam) => {
  const storylineIndex = parseInt(storyNumParam, 10);
  app.querySelector('#headertitle').textContent = title;

  const comic = getComic(title);

  const lastChapterName = comic.storylines[storylineIndex].name;
  interstitialState.title = title;
  interstitialState.storylineindex = storylineIndex;

  const interstitialBox =
    storylineIndex === comic.storylines.length - 1
      ? templater('interstitialend', [lastChapterName])
      : templater('interstitial', [lastChapterName]);

  if (storylineIndex === comic.storylines.length - 1) {
    const backToHomeBtn = interstitialBox.querySelector(
      "li.nav-btn[data-btntype='forward']:first-child"
    );
    const backToRackBtn = interstitialBox.querySelector(
      "li.nav-btn[data-btntype='back']"
    );
    const toSubscriptionsBtn = interstitialBox.querySelector(
      "li.nav-btn[data-btntype='forward']:last-child"
    );

    backToHomeBtn.dataset.tab = 'comiclist';
    backToRackBtn.dataset.storytitle = title;
    toSubscriptionsBtn.dataset.tab = 'subscriptions';

    backToHomeBtn.addEventListener('click', interstitialToHome);
    backToRackBtn.addEventListener('click', interstitialToRack);
    toSubscriptionsBtn.addEventListener('click', interstitialToHome);
  } else {
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
  }

  app.querySelector('#interstitial').replaceChildren(interstitialBox);
};

export { buildInterstitial };
