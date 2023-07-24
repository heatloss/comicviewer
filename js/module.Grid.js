import { templater } from './module.Templater.js';
import { getAllComics } from './module.Comicdata.js';
import { render } from './module.Router.js';

const app = document.querySelector('#app');

const comics = getAllComics().comics;

const sortAlphabetic = (a, b) => a.sortname.localeCompare(b.sortname);
const sortRandom = (a, b) => 0.5 - Math.random();

const goToComicChapterScreen = async (e) => {
  e.stopPropagation();
  const title = e.currentTarget.dataset.name;
  render(`/rack:${title}`);
};

const buildGrid = (sortstyle = 'random') => {
  comics.sort(sortRandom);
  const gridList = app.querySelector('#comicslist > .tabgroup');
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
