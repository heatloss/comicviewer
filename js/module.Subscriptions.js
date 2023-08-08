import { templater } from './module.Templater.js';
import {
  getUserData,
  addSubscription,
  removeSubscription,
} from './module.Userdata.js';
import { getComic, getAllComics } from './module.Comicdata.js';
import { render } from './module.Router.js';

const app = document.querySelector('#app');
const userData = getUserData();
const comics = getAllComics().comics;

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

const handleReadMore = (e) => {
  const readData = e.currentTarget.dataset;
  console.log(readData);
  if (userData[readData.title]?.storyline && userData[readData.title]?.page) {
    render(`/comic:${readData.title}:${readData.storyline}:${readData.page}`);
  } else {
    render(`/rack:${readData.title}`);
  }
};

const generateSubOps = (title) => {
  const isSubscribed = userData.subscribedComics.includes(title);
  const hasReadingPosition =
    userData.readComics[title]?.storyline && userData.readComics[title]?.page;
  const getArchivePageNum = () => {
    return (
      getComic(title).storylines[userData.readComics[title]?.storyline].pages[
        userData.readComics[title]?.page
      ].archivepageindex + 1
    );
  };
  const subOpsArray = [
    `${hasReadingPosition ? 'Continue' : 'Learn more'}`,
    `${
      hasReadingPosition
        ? 'Continue from Page ' + getArchivePageNum()
        : 'More about this comic'
    }`,
    `${isSubscribed ? 'Unsubscribe' : 'Subscribe'}`,
    `${isSubscribed ? 'Remove from subscriptions' : 'Add to subscriptions'}`,
  ];
  const subsOps = templater('subscriptionops', subOpsArray);
  const subsOpRead = subsOps.querySelector('[data-btntype="forward"]');
  const subsOpSubscribe = subsOps.querySelector('[data-btntype="subscribe"]');
  subsOpRead.dataset.title = title;
  subsOpRead.dataset.storyline = userData.readComics[title]?.storyline || 0;
  subsOpRead.dataset.page = userData.readComics[title]?.page || 0;
  subsOpSubscribe.dataset.title = title;
  if (isSubscribed) {
    subsOpSubscribe.dataset.subscribed = '';
  }
  subsOpRead.addEventListener('click', handleReadMore);
  subsOpSubscribe.addEventListener('click', handleSubscription);
  return subsOps;
};

const generateSubscriptionsList = (
  listContents = userData.subscribedComics
) => {
  const fragment = document.createElement('ul');
  fragment.classList.add('subs-list');
  listContents.forEach((subscription) => {
    const subscribedComic = comics.find((comic) => comic.name === subscription);
    const subOpsList = generateSubOps(subscription);
    const thumbImg = document.createElement('img');
    thumbImg.classList.add('thumb-image');
    thumbImg.src = 'img/' + subscribedComic.square;
    thumbImg.alt = subscribedComic.name;
    const subRow = templater('subscriptionrow', [
      subscribedComic.name,
      thumbImg,
      subscribedComic.name,
      subOpsList,
    ]);
    // subRow.dataset.title = subscribedComic.name;
    fragment.appendChild(subRow);
  });
  return fragment;
};

const generateRandomList = () => {
  const fragment = document.createElement('div');
  fragment.innerHTML = `<p class="nosubs">No subscriptions found! But here are three comics, selected at random:</p>`;
  const comicsTitlesRandomizedThree = comics
    .map((comic) => {
      return comic.name;
    })
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
  fragment.appendChild(generateSubscriptionsList(comicsTitlesRandomizedThree));
  return fragment;
};

const buildSubscriptions = () => {
  console.log('Rebuild');
  const subscriptionsTab = app.querySelector('#subscriptions');
  const subscriptionsList =
    userData.subscribedComics.length > 0
      ? generateSubscriptionsList()
      : generateRandomList();
  const subscriptionsPage = templater('subscriptions', subscriptionsList);
  subscriptionsTab.replaceChildren(subscriptionsPage);
};

export { buildSubscriptions };
