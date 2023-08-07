import { templater } from './module.Templater.js';
import {
  getUserData,
  addSubscription,
  removeSubscription,
} from './module.Userdata.js';
import { getAllComics } from './module.Comicdata.js';
import { render } from './module.Router.js';

const app = document.querySelector('#app');
const userData = getUserData();
const comics = getAllComics().comics;

const handleSubscription = (e) => {
  const subscribeButton = e.target;
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

const generateSubOps = (title, isSubcribed) => {
  const subOpsArray = [
    `${isSubcribed ? 'Continue' : 'Start reading'}`,
    `${isSubcribed ? 'Unsubscribe' : 'Subscribe'}`,
  ];
  // const subsOpsLi = document.createElement('li');
  // subsOpsLi.textContent = `${isSubcribed ? 'Unsubscribe' : 'Subscribe'}`;
  // subsOpsLi.classList.add = 'subs-op';
  // subsOpsLi.dataset.title = title;
  const subsOps = templater('subscriptionops', subOpsArray);
  const subsOpResume = subsOps.querySelector('[data-btntype="forward"]');
  const subsOpSubscribe = subsOps.querySelector('[data-btntype="subscribe"]');
  subsOpResume.dataset.title = title;
  if (isSubcribed) {
    subsOpSubscribe.dataset.subscribed = '';
  }
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
    const subOpsList = generateSubOps(
      subscription,
      listContents === userData.subscribedComics
    );
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
    subRow.dataset.title = subscribedComic.name;
    subRow.addEventListener('click', subscriptionToRack);
    fragment.appendChild(subRow);
  });
  return fragment;
};

const generateRandomList = () => {
  const fragment = document.createElement('div');
  fragment.innerHTML = `<p class="nosubs">No subscriptions found! But here are three randomly selected comics:</p>`;
  const comicsTitlesRandomizedThree = comics
    .map((comic) => {
      return comic.name;
    })
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
  fragment.appendChild(generateSubscriptionsList(comicsTitlesRandomizedThree));
  return fragment;
};

const subscriptionToRack = (e) => {
  const title = e.currentTarget.dataset.name;
  render(`/rack:${title}`);
};

const buildSubscriptions = () => {
  const subscriptionsTab = app.querySelector('#subscriptions');
  const subscriptionsList =
    userData.subscribedComics.length > 0
      ? generateSubscriptionsList()
      : generateRandomList();
  const subscriptionsPage = templater('subscriptions', subscriptionsList);
  subscriptionsTab.replaceChildren(subscriptionsPage);
};

export { buildSubscriptions };
