import { templater } from './module.Templater.js';
import { getAllComics } from './module.Comicdata.js';
import { render } from './module.Router.js';

const comics = getAllComics().comics;

const goToComicChapterScreen = async (e) => {
  const title = e.currentTarget.dataset.name;
  render(`/`);
  render(`/storylines:${title}`);
};

const initializeGrid = (sortstyle = 'alphabetic') => {
  comics.sort((a, b) => a.sortname.localeCompare(b.sortname));
  const gridList = document.querySelector('#comicslist > .tabgroup');
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

export { initializeGrid };
