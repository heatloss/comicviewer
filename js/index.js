// import Feedparser from './class.Feedparser.js'
import comics from './comics.js';
import { templater } from './module.Templater.js';
import { initTabs } from './module.Tabsystem.js';
import { buildGrid } from './module.Grid.js';
import { buildHeader } from './module.Header.js';

import { render } from './module.Router.js';

const app = document.querySelector('#app');

function debug(message) {
  const output = app.querySelector('#debug');
  const msg = document.createElement('pre');
  msg.appendChild(document.createTextNode(message));
  output.appendChild(msg);
}

async function run() {
  const main = templater('main');
  app.replaceChildren(main);
  buildHeader();

  initTabs('homenav');
  render('/intro'); // Navigates to Home:FAQ
}

run().then((data) => {
  buildGrid();
});
