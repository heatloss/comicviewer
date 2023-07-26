import { templater } from './module.Templater.js';
import { getAllComics } from './module.Comicdata.js';
import { render } from './module.Router.js';

const app = document.querySelector('#app');

const comics = getAllComics().comics;

const sortingMethods = {
  alpha: (a, b) => a.sortname.localeCompare(b.sortname),
  shuffle: (a, b) => 0.5 - Math.random(),
};

const goToComicChapterScreen = (e) => {
  e.stopPropagation();
  const title = e.currentTarget.dataset.name;
  render(`/rack:${title}`);
};

const buildGrid = (style = 'shuffle') => {
  comics.sort(sortingMethods[style]);
  const gridList = app.querySelector('#comicslist > .comicsgrid');
  const fragment = document.createElement('div');
  fragment.classList.add('thumbsgrid');
  comics.forEach((comic) => {
    const thumbImg = document.createElement('img');
    thumbImg.classList.add('thumb-image');
    thumbImg.src = 'img/' + comic.thumb;
    thumbImg.alt = comic.name;
    const comicThumb = templater('thumb', [thumbImg, comic.name]);
    comicThumb.dataset.name = comic.name;
    comicThumb.addEventListener('click', goToComicChapterScreen);
    fragment.appendChild(comicThumb);
  });
  gridList.appendChild(fragment);
};

export { buildGrid };
