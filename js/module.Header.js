import { templater } from './module.Templater.js';
import { render } from './module.Router.js';

const headerselectors = {};
const app = document.querySelector('#app');

const routeToHome = () => {
  render('/home:comiclist'); // Navigates to Home: Grid
};

const initDarkMode = () => {
  const themeMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
  document.documentElement.setAttribute('data-theme', themeMode);
};

const toggleMode = () => {
  const themeMode =
    document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', themeMode);
};

const activateHeaderMenu = () => {
  headerselectors.systems.dataset.menuActive = '';
  // app.querySelector('#headertitle').disabled = false;
};

const deactivateHeaderMenu = () => {
  headerselectors.systems.removeAttribute('data-menu-active');
  // app.querySelector('#headertitle').disabled = true;
};

const handleMenu = () => {
  if (headerselectors.systems.hasAttribute('data-menu-active')) {
    if (headerselectors.systems.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  }
};

const openMenu = () => {
  headerselectors.systems.classList.add('open');
  app.addEventListener('pointerdown', handleCloseMenu);
};

const handleCloseMenu = (e) => {
  if (!e.composedPath().includes(headerselectors.systems)) {
    event.stopPropagation();
    closeMenu();
  }
};

const closeMenu = () => {
  headerselectors.systems.classList.remove('open');
  app.removeEventListener('pointerdown', handleCloseMenu);
};

const replaceHeaderTitle = (title, customdata) => {
  headerselectors.title.textContent = title;
  if (customdata) {
    headerselectors.title.dataset.custom = customdata;
  } else {
    headerselectors.title.removeAttribute('data-custom');
  }
};

const initHeader = () => {
  initDarkMode();
  const headerElem = app.querySelector('#headerframe');
  const headerTmpl = templater('header');
  headerTmpl.querySelector('#tohome').addEventListener('click', routeToHome);
  headerTmpl
    .querySelector('#toggleadjustments')
    .addEventListener('click', toggleMode);
  headerTmpl
    .querySelector('#headertitle')
    .addEventListener('click', handleMenu);
  headerElem.appendChild(headerTmpl);
  headerselectors.systems = app.querySelector('#headersystems');
  headerselectors.title = app.querySelector('#headertitle');
};

export {
  initHeader,
  openMenu,
  closeMenu,
  replaceHeaderTitle,
  activateHeaderMenu,
  deactivateHeaderMenu,
};
