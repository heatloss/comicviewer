import {
  getPopulatedComic,
  getCoversForComic,
  bufferCoverImages,
} from './module.Comicdata.js';
import { templater } from './module.Templater.js';
import { render } from './module.Router.js';
import { initTabs } from './module.Tabsystem.js';
import { optimizeImage } from './module.Archiveparser.js';
import { initAdvancers, setAdvancersActive } from './module.Touch.js';

const app = document.querySelector('#app');
const rackState = {};

const handleExternalLink = (e) => {
  console.log(e.target);
};

const rackToHome = (e) => {
  app.removeEventListener('advance', exitRack);
  render('/home:comiclist');
};

const rackToComicPage = (e) => {
  app.removeEventListener('advance', exitRack);
  const storylineData = e.currentTarget ? e.currentTarget.dataset : e;
  render(
    `/comic:${storylineData.storytitle}:${storylineData.storyindex || 0}:${
      storylineData.pageindex || 0
    }`
  );
};

const buildStorylines = async (title) => {
  const gotoComicPage = (e) => {
    app.removeEventListener('advance', exitRack);
    const storylineData = e.currentTarget.dataset;
    render(
      `/comic:${storylineData.storytitle}:${storylineData.storyindex || 0}:${
        storylineData.pageindex || 0
      }`
    );
  };
  app.querySelector('#headertitle').textContent = title;
  rackState.title = title;

  const loadingmsg = templater('loading', title);
  app.querySelector('#rack').replaceChildren(loadingmsg);

  const comic = await getPopulatedComic(title);
  const storylineArray = await getCoversForComic(title);

  const splashImage = document.createElement('img');
  splashImage.classList.add('splash-image');
  splashImage.src = 'img/' + comic.square;

  const coversList = document.createElement('ul');
  coversList.classList.add('covers-list');
  storylineArray.forEach((storyline, index) => {
    const coverImage = document.createElement('img');
    coverImage.classList.add('cover-image');
    coverImage.src = optimizeImage(storyline.pages[0].img.original, 200);
    const coverLi = templater(
      'storylinecover',
      [coverImage, storyline.name],
      'cover-list-item'
    );
    coverLi.dataset.storytitle = title;
    coverLi.dataset.storyindex = index;
    coverLi.addEventListener('click', gotoComicPage);
    coversList.appendChild(coverLi);
  });
  bufferCoverImages(storylineArray);
  const linksUl = document.createElement('ul');
  comic.links.forEach((link, index) => {
    const externalLi = document.createElement('li');
    externalLi.innerHTML = `<a class="external-link" data-linktype="${link.linktext.toLowerCase()}" href="${
      link.linkurl
    }">${link.linktext}</a>`;
    externalLi.addEventListener('click', handleExternalLink);
    linksUl.appendChild(externalLi);
  });

  const storylineBox = templater('storylines', [
    splashImage,
    comic.description,
    coversList,
    linksUl,
  ]);

  const firstPageBtn = storylineBox.querySelector(
    "li.nav-btn[data-btntype='forward']:first-child"
  );
  const lastPageBtn = storylineBox.querySelector(
    "li.nav-btn[data-btntype='forward']:last-child"
  );
  firstPageBtn.dataset.storytitle = title;
  lastPageBtn.dataset.storytitle = title;
  lastPageBtn.dataset.storyindex = comic.storylines.length - 1;
  lastPageBtn.dataset.pageindex =
    comic.storylines[comic.storylines.length - 1].pages.length - 1;

  firstPageBtn.addEventListener('click', gotoComicPage);
  lastPageBtn.addEventListener('click', gotoComicPage);

  app.querySelector('#rack').replaceChildren(storylineBox);

  initTabs('comicintro');
  initAdvancers();
  app.addEventListener('advance', exitRack);
};

const exitRack = async (e) => {
  const advDir = e.detail;
  const eData = { storytitle: rackState.title };
  if (advDir === -1) {
    rackToHome();
  } else if (advDir === 1) {
    rackToComicPage(eData); // First-page cover
  }
  console.log(`${advDir < 0 ? '<- HOME' : '-> CHAPTER 1 COVER'}`);
};

export { buildStorylines };
