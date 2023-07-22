import { templater } from "./module.Templater.js";
import { buildStorylines } from "./module.Storylines.js";
import { buildComic } from "./module.Comicreader.js";

const showGrid = (updatestate) => {
  document.querySelector("#comicheader").classList.add("showgrid");
};

const hideGrid = (updatestate) => {
  document.querySelector("#comicheader").classList.remove("showgrid");
};

const showStorylines = (updatestate) => {
  document.querySelector("#comicheader").classList.add("showstorylines");
};

const hideStorylines = (updatestate) => {
  document.querySelector("#comicheader").classList.remove("showstorylines");
};

const gotoIntro = () => {
  hideGrid();
  hideStorylines();
  const introMarkup = templater("intro");
  document.querySelector("#comicpages").replaceChildren(introMarkup);
};

const gotoGrid = (updatestate) => {
  // build the grid?
  showGrid();
};

const gotoStorylines = (pathdata) => {
  hideGrid();
  showStorylines();
  // if no pathdata, just navigate
  buildStorylines(pathdata[1]);
  // GENERATE STORYLINE VIEW FOR THAT COMIC
};

const gotoComic = (pathdata) => {
  hideGrid();
  hideStorylines();
  // if no pathdata, just navigate
  buildComic(pathdata[1], pathdata[2], pathdata[3]);
  // GENERATE COMIC VIEW FOR THAT COMIC, STORYLINE & PAGE
};

const routes = {
  "/": gotoIntro,
  "/grid": gotoGrid,
  "/storylines": gotoStorylines,
  "/comic": gotoComic,
};

const render = (path) => {
  const pathdata = path.split(":");
  routes[pathdata[0]](pathdata);
};

window.addEventListener("popstate", (e) =>
  render(new URL(window.location.href).pathname)
);

// render("/");

export { render };
