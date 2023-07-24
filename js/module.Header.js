import { templater } from './module.Templater.js';
import { render } from './module.Router.js';

const app = document.querySelector('#app');

const routeToHome = () => {
  render('/home:comiclist'); // Navigates to Home: Grid
};

const toggleAdjustments = () => {
  // handles the adjustments panel
};

const buildHeader = (sortstyle = 'alphabetic') => {
  const headerElem = app.querySelector('#headerframe');
  const headerTmpl = templater('header');
  headerTmpl.querySelector('#tohome').addEventListener('click', routeToHome);
  headerElem.appendChild(headerTmpl);
};

export { buildHeader };
