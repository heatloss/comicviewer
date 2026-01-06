import { templater } from './module.Templater.js';
import {
  getUserData,
  setColorMode,
  setGridSort,
  setComicTap,
} from './module.Userdata.js';
import { getAllComics } from './module.Comicdata.js';
import { render } from './module.Router.js';

const userdataSetConfig = {
  colormode: setColorMode,
  gridsort: setGridSort,
  comictap: setComicTap,
};

const app = document.querySelector('#app');
const userData = getUserData();
const comics = getAllComics().comics;

const settingsToRack = (e) => {
  const slug = e.currentTarget.dataset.slug;
  render(`/rack:${slug}`);
};

const doSetting = (e) => {
  userdataSetConfig[e.currentTarget.name](e.currentTarget.value); // Sets user data
  if (e.currentTarget.name === 'colormode') {
    document.documentElement.setAttribute('data-theme', e.currentTarget.value);
  }
};

const generateSubsList = () => {
  const fragment = document.createDocumentFragment();
  userData.subscribedComics.forEach((slug) => {
    const subscribedComic = comics.find((comic) => comic.slug === slug);
    if (!subscribedComic) return;
    const subsLi = document.createElement('li');
    subsLi.classList.add('nav-btn');
    subsLi.textContent = subscribedComic.title;
    subsLi.dataset.slug = slug;
    subsLi.addEventListener('click', settingsToRack);
    fragment.appendChild(subsLi);
  });
  return fragment;
};

const buildSettings = async () => {
  const settingsTab = app.querySelector('#settings');
  const subscriptionsList = generateSubsList();
  const settingsPage = templater('settings', subscriptionsList);
  if (userData.subscribedComics.length > 0) {
    settingsPage.querySelector('.settings-subhed').innerHTML =
      '<span>You are subscribed to</span> <span>the following comics:</span>';
  }
  const settingsControls = settingsPage.querySelectorAll(
    '.settings-controls select'
  );
  settingsControls.forEach((select) => {
    const associatedSetting = userData[select.name];
    select.value = associatedSetting;
    select.addEventListener('change', doSetting);
  });
  settingsTab.replaceChildren(settingsPage);
};

export { buildSettings };
