const refs = {
  app: document.querySelector('#app'),
};

const initDOM = () => {
  refs.headerTitle = refs.app.querySelector('#headertitle');
  refs.headerMenu = refs.app.querySelector('#headerframe .header-menu');
  refs.comicPages = refs.app.querySelector('#comicpages');
  refs.zonesFrame = refs.app.querySelector('#rack');
};

export { initDOM, refs };
