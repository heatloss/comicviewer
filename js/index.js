import { initTemplates, templater } from './module.Templater.js';
import { initTabs } from './module.Tabsystem.js';
import { initHeader } from './module.Header.js';

import { render } from './module.Router.js';

const app = document.querySelector('#app');

async function run() {
  await initTemplates();
  const main = templater('main');
  app.replaceChildren(main);
  initHeader();
  initTabs('homenav');
  render(window.location.pathname);
}

run();
