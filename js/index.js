// import Feedparser from './class.Feedparser.js'
import comics from "./comics.js";
import { templater } from "./module.Templater.js";
// import { getPagesFromRSS, getImageFromPage } from "./module.Feedparser.js";
// import {
//   getPagesFromArchive,
//   getImageFromPage,
// } from "./module.Archiveparser.js";

import { initializeGrid } from "./module.Grid.js";

import { render } from "./module.Router.js";

const app = document.querySelector("#app");

function debug(message) {
  const output = document.querySelector("#debug");
  const msg = document.createElement("pre");
  msg.appendChild(document.createTextNode(message));
  output.appendChild(msg);
}

const selectTab = (e) => {
  const toTabId = e.target.dataset.tabpos;
  const selectors = e.target
    .closest(".tabsystem")
    .querySelectorAll(".tabselector > li");
  selectors.forEach((tabelem) => {
    tabelem.removeAttribute("data-tabselect");
    if (tabelem.dataset.tabpos === toTabId) {
      tabelem.setAttribute("data-tabselect", "");
    }
  });
};

async function run() {
  // debug("Testing...");

  const main = templater("main");
  // main.querySelector("#comicpages").replaceChildren(templater("intro"))
  app.replaceChildren(main);

  document.querySelector("#togglegrid").addEventListener("click", () => {
    render("/grid"); // WRONG, need to toggle it on and off
  });

  document
    .querySelector("#grid .tabselector")
    .addEventListener("click", selectTab);

  render("/"); // Creates the intro
}

run().then((data) => {
  initializeGrid();
});
