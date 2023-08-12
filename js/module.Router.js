// import { templater } from './module.Templater.js';
import { gotoZone } from './module.Zonesystem.js';
import { gotoTab } from './module.Tabsystem.js';
import { initGrid } from './module.Grid.js';
import { buildSubscriptions } from './module.Subscriptions.js';
import { buildStorylines } from './module.Storylines.js';
import { buildSettings } from './module.Settings.js';
import { buildInterstitial } from './module.Interstitial.js';
import { initComic } from './module.Comicreader.js';
import { setAllUpatesFromRSS } from './module.Feedparser.js';

const gotoHome = (pathdata) => {
  initGrid();
  buildSubscriptions();
  buildSettings();
  gotoZone('home');
  gotoTab('homenav', pathdata[1] || 'comiclist');
};

const gotoIntro = () => {
  setAllUpatesFromRSS();
  gotoZone('rack', 'Comic Viewer');
};

const gotoRack = (pathdata) => {
  buildStorylines(pathdata[1]);
  gotoZone('rack');
  gotoTab('aboutcomic', pathdata[2] || 'intro');
};

const gotoInterstitial = (pathdata) => {
  buildInterstitial(pathdata[1], pathdata[2]);
  gotoZone('interstitial');
};

const gotoComic = (pathdata) => {
  // if no pathdata, just navigate
  initComic(pathdata[1], pathdata[2], pathdata[3]);
  gotoZone('comic', null, 'chapter-menu');
};

const doRoute = {
  '/': gotoIntro,
  '/home': gotoHome,
  '/intro': gotoIntro,
  '/rack': gotoRack,
  '/comic': gotoComic,
  '/interstitial': gotoInterstitial,
};

const render = (path, writestate = true) => {
  const workpath = decodeURIComponent(path);
  const pathdata = workpath.split(':');
  console.log(decodeURIComponent(workpath));
  // TODO: If requested route is the same as existing route, do nothing.
  doRoute[pathdata[0]](pathdata);
  if (writestate) {
    history(workpath);
  }
};

const history = (path) => {
  const pathEncoded = path
    .substring(1)
    .split(':')
    .map((pathcomponent) => encodeURIComponent(pathcomponent))
    .join(':');
  window.history.pushState(null, '', '/' + pathEncoded);
};

window.addEventListener('popstate', () => {
  render(new URL(window.location.href).pathname, false);
});

export { render, history };
