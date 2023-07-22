// import Feedparser from './class.Feedparser.js'
import comics from './comics.js';
import { templater } from './module.Templater.js';
import { initTabs } from './module.Tabsystem.js';
// import { getPagesFromRSS, getImageFromPage } from "./module.Feedparser.js";
// import {
//   getPagesFromArchive,
//   getImageFromPage,
// } from "./module.Archiveparser.js";

import { initializeGrid } from './module.Grid.js';

import { render } from './module.Router.js';

const app = document.querySelector('#app');

function debug(message) {
  const output = document.querySelector('#debug');
  const msg = document.createElement('pre');
  msg.appendChild(document.createTextNode(message));
  output.appendChild(msg);
}

async function run() {
  // debug("Testing...");

  const main = templater('main');
  app.replaceChildren(main);
  initTabs('homenav');

  // document.querySelector('#tohome').addEventListener('click', () => {
  //   render('/grid'); // WRONG, need to toggle it on and off
  // });

  render('/home:faq'); // Navigates to Home:FAQ
}

run().then((data) => {
  initializeGrid();
});
