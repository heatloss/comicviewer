import { templater } from './module.Templater.js';
import { getAllComics } from './module.Comicdata.js';
import { closeMenu, replaceHeaderTitle } from './module.Header.js';
import { render } from './module.Router.js';

const app = document.querySelector('#app');

const comics = getAllComics().comics;

const getSort = (sortid) => {
  return sortingMethods.find((sortmethod) => sortmethod.id === sortid).sortfunc;
};

const sortingMethods = [
  {
    name: 'Alphabetically',
    id: 'alpha',
    sortfunc: (a, b) => a.sortname.localeCompare(b.sortname),
  },
  { name: 'Randomly', id: 'shuffle', sortfunc: () => 0.5 - Math.random() },
  {
    name: 'by Last Update',
    id: 'date',
    sortfunc: (a, b) => a.sortname.localeCompare(b.sortname),
  },
  {
    name: 'by Genre',
    id: 'genre',
  },
];

const doSort = (e) => {
  const style = e.currentTarget ? e.target.dataset.action : e;
  buildGrid(style);
  const sortStyleObj = sortingMethods.find(
    (sortmethod) => sortmethod.id === style
  );
  replaceHeaderTitle(`Sorting: `, style);
  app.querySelector(
    '#homenav #togrid'
  ).dataset.tabhed = `Sorted ${sortStyleObj.name}`;
  app.querySelector('#comicslist > .section-hed').textContent = `All Comics, ${
    sortStyleObj.id === 'shuffle' ? 'Shuffled' : sortStyleObj.name
  }`;
  closeMenu();
  app
    .querySelector(
      '#home > .tabsystem.tabgroup > .tab[data-tabpos="comiclist"]'
    )
    .scrollTo({
      top: 0,
      behavior: 'instant',
    });
};

const generateGenreList = () => {
  const concatenatedGenres = [];
  comics.map((comic) => {
    concatenatedGenres.push(...comic.genres);
  });
  const itemizedGenres = [...new Set(concatenatedGenres)].sort();
  return itemizedGenres;
};

// const getAllDatesFromRSS = () => {
//   console.log('date');
// };

const generateComicGrid = (sortstyle) => {
  switch (sortstyle) {
    case 'alpha': {
      comics.sort(getSort(sortstyle));
      const alphabeticBlock = templater(
        'squarecategory',
        ['Alphabetical', comicSquares()],
        sortstyle
      );

      return alphabeticBlock;
    }
    case 'shuffle': {
      comics.sort(getSort(sortstyle));
      const shuffledBlock = templater(
        'squarecategory',
        ['Shuffled', comicSquares()],
        sortstyle
      );

      return shuffledBlock;
    }
    case 'date':
      console.log('get the dates');
      break;
    case 'genre': {
      const genreList = generateGenreList();
      const populatedGenreList = genreList.map((genrename) => {
        const genreMatchedComicList = comics.filter((comic) =>
          comic.genres.includes(genrename)
        );
        return genreMatchedComicList;
      });
      const fragment = document.createDocumentFragment();
      genreList.forEach((genre, index) => {
        const genreBlock = templater(
          'squarecategory',
          [genre, comicSquares(populatedGenreList[index])],
          sortstyle
        );
        fragment.appendChild(genreBlock);
      });
      return fragment;
    }
    default:
      console.log('error');
  }
};

const gridToRack = (e) => {
  const title = e.currentTarget.dataset.name;
  render(`/rack:${title}`);
};

const comicSquares = (comicset = comics) => {
  const fragment = document.createElement('div');
  fragment.classList.add('thumbsgrid');
  comicset.forEach((comic) => {
    const thumbImg = document.createElement('img');
    thumbImg.classList.add('thumb-image');
    thumbImg.src = 'img/' + comic.square;
    thumbImg.alt = comic.name;
    const comicThumb = templater('square', [thumbImg, comic.name]);
    comicThumb.dataset.name = comic.name;
    comicThumb.addEventListener('click', gridToRack);
    fragment.appendChild(comicThumb);
  });
  return fragment;
};

const initGrid = (style = 'shuffle') => {
  doSort(style);
  buildGridMenu(style);
};

const buildGrid = (style = 'shuffle') => {
  const gridList = app.querySelector('#comicslist > .comicsgrid');
  gridList.replaceChildren(generateComicGrid(style));
};

const buildGridMenu = () => {
  const fragment = document.createDocumentFragment();
  sortingMethods.forEach((sortmethod) => {
    const menuLi = document.createElement('li');
    menuLi.textContent = sortmethod.name;
    menuLi.classList.add('menu-btn');
    menuLi.dataset.action = sortmethod.id;
    menuLi.addEventListener('click', doSort);
    fragment.appendChild(menuLi);
  });
  const gridMenu = templater('gridsortmenu', fragment);
  app.querySelector('#headerframe .header-menu').replaceChildren(gridMenu);
};

export { initGrid };
