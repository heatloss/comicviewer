import {
  getComic,
  getPopulatedComic,
  getCoversForComic,
} from './module.Comicdata.js';
import {
  getUserData,
  addSubscription,
  removeSubscription,
  hasReadingPosition,
  isSubscribed,
} from './module.Userdata.js';
import { templater } from './module.Templater.js';
import { render } from './module.Router.js';
import { initTabs } from './module.Tabsystem.js';
import { optimizeImage } from './module.Archiveparser.js';
import { initAdvancers } from './module.Touch.js';

const app = document.querySelector('#app');
const rackState = {};
const placeholderImg =
  'data:image/svg+xml;utf8,<svg fill="dimgray" viewBox="0 0 666.667 800" xmlns="http://www.w3.org/2000/svg"><path d="m0 0v800h666.667v-800zm613.333 746.667h-560v-693.334h560z"/></svg>';

const handleExternalLink = (e) => {
  console.log(e.target);
};

const rackToHome = () => {
  app.removeEventListener('advance', exitRack);
  render('/home:comiclist');
};

const rackToComicPage = (e) => {
  app.removeEventListener('advance', exitRack);
  const storylineData = e.currentTarget ? e.currentTarget.dataset : e;
  render(
    `/comic:${storylineData.title}:${storylineData.storyindex || 0}:${
      storylineData.pageindex || 0
    }`
  );
};

const buildStorylines = (title) => {
  app.querySelector('#headertitle').textContent = title;
  rackState.title = title;

  const loadingmsg = templater('loading', title);
  app.querySelector('#rack').replaceChildren(loadingmsg);

  const comic = getComic(title);

  const splashImage = document.createElement('img');
  splashImage.classList.add('splash-image');
  splashImage.src = 'img/' + comic.square;

  const comicCredits = comic.credits || '';
  const comicLastUpdated =
    new Date(comic.lastupdated).toLocaleDateString('en-US') || '';
  const comicDesc = comic.description || '';

  const coversList = document.createElement('ul');
  coversList.classList.add('covers-list');

  const linksUl = document.createElement('ul');
  // const websiteLi = document.createElement('li');
  const extendedLinks = [
    {
      linktext: 'Comic Website',
      linkurl: `https://${new URL(comic.archiveurl).hostname.replace(
        'www.',
        ''
      )}`,
    },
    ...comic.links,
  ];
  extendedLinks.forEach((link) => {
    const externalLi = document.createElement('li');
    externalLi.innerHTML = `<a class="external-link" data-linktype="${link.linktext.toLowerCase()}" href="${
      link.linkurl
    }">${link.linktext}</a>`;
    externalLi.addEventListener('click', handleExternalLink);
    linksUl.appendChild(externalLi);
  });

  const storylineBox = templater('storylines', [
    splashImage,
    comicCredits,
    comicLastUpdated,
    comicDesc,
    coversList,
    linksUl,
  ]);

  app.querySelector('#rack').replaceChildren(storylineBox);
  fillStoryBox(storylineBox);
  initTabs('aboutcomic');
  initAdvancers();
  app.addEventListener('advance', exitRack);
};

const addCoverSources = async (coversListElem) => {
  const title = rackState.title;
  const storylineArray = await getCoversForComic(title);
  // bufferCoverImages(storylineArray); Not sure what this is doing anymore
  storylineArray.forEach((storyline, index) => {
    const coverImage = coversListElem.querySelector(
      `.cover-list-item[data-storyindex='${index}'] img.cover-image`
    );
    const img = new Image();
    img.onload = () => {
      coverImage.src = img.src;
    };
    img.src = optimizeImage(storyline.pages[0].img.original, 200);
  });
};

const fillStoryBox = async (storylineBox) => {
  const gotoComicPage = (e) => {
    app.removeEventListener('advance', exitRack);
    const storylineData = e.currentTarget.dataset;
    render(
      `/comic:${storylineData.title}:${storylineData.storyindex || 0}:${
        storylineData.pageindex || 0
      }`
    );
  };
  const handleSubscription = (e) => {
    const subscribeButton = e.currentTarget;
    const subscribeTitle = subscribeButton.dataset.title;
    if (subscribeButton.hasAttribute('data-subscribed')) {
      removeSubscription(subscribeTitle);
      subscribeButton.textContent = 'Add to Subscriptions';
      subscribeButton.removeAttribute('data-subscribed');
    } else {
      addSubscription(subscribeTitle);
      subscribeButton.textContent = 'Remove Subscription';
      subscribeButton.dataset.subscribed = '';
    }
  };
  const getArchivePageNum = (title = rackState.title) => {
    console.log();
    return (
      getComic(title).storylines[userData.readComics[title]?.storyindex].pages[
        userData.readComics[title]?.pageindex
      ].archivepageindex + 1
    );
  };
  const userData = getUserData();
  const coversListElem = storylineBox.querySelector('.covers-list');
  const title = rackState.title;
  const comic = await getPopulatedComic(title);
  storylineBox.querySelector('.storylines-desc').textContent =
    comic.description;
  comic.storylines.forEach((storyline, index) => {
    const coverImage = document.createElement('img');
    coverImage.classList.add('cover-image');
    coverImage.src = placeholderImg;
    const coverLi = templater(
      'storylinecover',
      [coverImage, storyline.name],
      'cover-list-item'
    );
    coverLi.dataset.title = title;
    coverLi.dataset.storyindex = index;
    coverLi.addEventListener('click', gotoComicPage);
    coversListElem.appendChild(coverLi);
  });
  addCoverSources(coversListElem);
  const firstPageBtn = storylineBox.querySelector(
    "li.nav-btn[data-btntype='forward']:first-child"
  );
  const lastPageBtn = storylineBox.querySelector(
    "li.nav-btn[data-btntype='forward']:last-child"
  );
  const subscribeBtn = storylineBox.querySelector(
    "li.nav-btn[data-btntype='subscribe']"
  );

  if (hasReadingPosition(title)) {
    firstPageBtn.querySelector('.label').textContent = 'Continue from page ';
    firstPageBtn.querySelector('.page').textContent = getArchivePageNum(title);
    firstPageBtn.dataset.storyindex = userData.readComics[title].storyindex;
    firstPageBtn.dataset.pageindex = userData.readComics[title].pageindex;
  }
  if (isSubscribed(title)) {
    subscribeBtn.dataset.subscribed = '';
    subscribeBtn.textContent = 'Remove Subscription';
  }
  firstPageBtn.dataset.title = title;
  lastPageBtn.dataset.title = title;
  subscribeBtn.dataset.title = title;
  lastPageBtn.dataset.storyindex = comic.storylines.length - 1;
  lastPageBtn.dataset.pageindex =
    comic.storylines[comic.storylines.length - 1].pages.length - 1;

  firstPageBtn.addEventListener('click', gotoComicPage);
  lastPageBtn.addEventListener('click', gotoComicPage);
  subscribeBtn.addEventListener('click', handleSubscription);
};

const exitRack = async (e) => {
  const advDir = e.detail;
  const eData = { title: rackState.title };
  if (advDir === -1) {
    rackToHome();
  } else if (advDir === 1) {
    rackToComicPage(eData); // First-page cover
  }
  console.log(`${advDir < 0 ? '<- HOME' : '-> CHAPTER 1 COVER'}`);
};

export { buildStorylines };
