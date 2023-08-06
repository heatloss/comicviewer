// import Feedparser from './class.Feedparser.js'
// import comics from './comics.js';
import { initTemplates, templater } from './module.Templater.js';
import { initTabs } from './module.Tabsystem.js';
// import { initGrid } from './module.Grid.js';
import { initHeader } from './module.Header.js';

import { render } from './module.Router.js';

const app = document.querySelector('#app');

async function run() {
  await initTemplates();
  const main = templater('main');
  app.replaceChildren(main);
  initHeader();
  initTabs('homenav');
  render('/intro'); // Navigates to Intro, a custom insert rendered into the #comicpages zone
}

run();
