import {
  getPopulatedComic,
  getCoversForComic,
  bufferCoverImages,
} from './module.Comicdata.js';
import { templater } from './module.Templater.js';
import { render } from './module.Router.js';
import { initTabs } from './module.Tabsystem.js';
import { optimizeImage } from './module.Archiveparser.js';

const app = document.querySelector('#app');

const handleExternalLink = (e) => {
  console.log(e.target);
};

const buildStorylines = async (title) => {
  const gotoComicPage = (e) => {
    const storylineData = e.currentTarget.dataset;
    render(
      `/comic:${storylineData.storytitle}:${storylineData.storyindex || 0}:${
        storylineData.pageindex || 0
      }`
    );
  };
  app.querySelector('#headertitle').textContent = title;

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
};

export { buildStorylines };
