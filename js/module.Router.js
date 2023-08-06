// import { templater } from './module.Templater.js';
import { gotoZone } from './module.Zonesystem.js';
import { gotoTab } from './module.Tabsystem.js';
import { initGrid } from './module.Grid.js';
import { buildStorylines } from './module.Storylines.js';
import { buildInterstitial } from './module.Interstitial.js';
import { initComic } from './module.Comicreader.js';

const gotoHome = (pathdata) => {
  gotoZone('home');
  gotoTab('homenav', pathdata[1]);
  initGrid(); // TODO: Skip the re-sort and re-render if the grid has already been rendered.
};

const gotoIntro = () => {
  gotoZone('rack', 'Comic Viewer');
};

const gotoRack = (pathdata) => {
  gotoZone('rack');
  buildStorylines(pathdata[1]);
  gotoTab('aboutcomic', 'intro');
};

const gotoInterstitial = (pathdata) => {
  gotoZone('interstitial');
  buildInterstitial(pathdata[1], pathdata[2]);
};

const gotoComic = (pathdata) => {
  gotoZone('comic', null, 'chapter-menu');
  // if no pathdata, just navigate
  initComic(pathdata[1], pathdata[2], pathdata[3]);
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
  // TODO: If requested route is the same as existing route, do nothing.
  goRoutes[pathdata[0]](pathdata);
  console.log(path);
  window.history.replaceState(null, pathdata[0], path);
};

// window.addEventListener('popstate', (e) =>
//   render(new URL(window.location.href).pathname)
// );

// render("/");

export { render };
