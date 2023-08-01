import { templater } from './module.Templater.js';
import { gotoZone } from './module.Zonesystem.js';
import { gotoTab } from './module.Tabsystem.js';
import { buildStorylines } from './module.Storylines.js';
import { buildInterstitial } from './module.Interstitial.js';
import { buildComic } from './module.Comicreader.js';

const app = document.querySelector('#app');
const leadingdir = window.location.pathname.replace(/\/$/, '');

const gotoHome = (pathdata) => {
  gotoZone('home');
  gotoTab('homenav', pathdata[1]);
};

const gotoIntro = (updatestate) => {
  gotoZone('rack', 'Comic Viewer');
};

const gotoRack = (pathdata) => {
  gotoZone('rack');
  buildStorylines(pathdata[1]);
  gotoTab('comicintro', 'storylines');
  // GENERATE STORYLINE VIEW FOR THAT COMIC
};

const gotoInterstitial = (pathdata) => {
  gotoZone('interstitial');
  buildInterstitial(pathdata[1], pathdata[2]);
  // GENERATE INTER-CHAPTER VIEW FOR THAT COMIC
};

const gotoComic = (pathdata) => {
  gotoZone('comic');
  // if no pathdata, just navigate
  buildComic(pathdata[1], pathdata[2], pathdata[3]);
  // GENERATE COMIC VIEW FOR THAT COMIC, STORYLINE & PAGE
};

const goRoutes = {
  '/': gotoHome,
  '/home': gotoHome,
  '/intro': gotoIntro,
  '/rack': gotoRack,
  '/comic': gotoComic,
  '/interstitial': gotoInterstitial,
};

const render = (path) => {
  const pathdata = path.split(':');
  goRoutes[pathdata[0]](pathdata);
  window.history.replaceState(null, pathdata[0], path);
};

// window.addEventListener('popstate', (e) =>
//   render(new URL(window.location.href).pathname)
// );

// render("/");

export { render };
