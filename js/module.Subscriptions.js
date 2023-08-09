import { templater } from './module.Templater.js';
import {
  getUserData,
  addSubscription,
  removeSubscription,
  hasReadingPosition,
  isSubscribed,
} from './module.Userdata.js';
import {
  getComic,
  getPopulatedComic,
  getAllComics,
} from './module.Comicdata.js';
import { render } from './module.Router.js';

const app = document.querySelector('#app');
const userData = getUserData();
const comics = getAllComics().comics;

const generateSubOps = (title) => {
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
    console.log(readData, userData);
    if (
      userData.readComics[readData.title]?.storyindex &&
      userData.readComics[readData.title]?.pageindex
    ) {
      render(
        `/comic:${readData.title}:${readData.storyindex}:${readData.pageindex}`
      );
    } else {
      render(`/rack:${readData.title}`);
    }
  };
  const getArchivePageNum = () => {
    return (
      getComic(title).storylines[userData.readComics[title]?.storyindex].pages[
        userData.readComics[title]?.pageindex
      ].archivepageindex + 1
    );
  };
  const isSubbed = isSubscribed(title);
  const hasReadPos = hasReadingPosition(title);
  const subOpsArray = [
    `${hasReadPos ? 'Continue' : 'Learn more'}`,
    `${
      hasReadPos
        ? 'Continue from Page ' + getArchivePageNum()
        : 'More about this comic'
    }`,
    `${isSubbed ? 'Unsubscribe' : 'Subscribe'}`,
    `${isSubbed ? 'Remove from subscriptions' : 'Add to subscriptions'}`,
  ];
  const subsOps = templater('subscriptionops', subOpsArray);
  const subsOpRead = subsOps.querySelector('[data-btntype="forward"]');
  const subsOpSubscribe = subsOps.querySelector('[data-btntype="subscribe"]');
  subsOpRead.dataset.title = title;
  subsOpRead.dataset.storyindex = userData.readComics[title]?.storyindex || 0;
  subsOpRead.dataset.pageindex = userData.readComics[title]?.pageindex || 0;
  subsOpSubscribe.dataset.title = title;
  if (isSubbed) {
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

const buildSubscriptions = async () => {
  console.log(userData.subscribedComics);
  if (userData.subscribedComics.length > 0) {
    for (const title of userData.subscribedComics) {
      await getPopulatedComic(title);
    }
  }
  const subscriptionsTab = app.querySelector('#subscriptions');
  const subscriptionsList =
    userData.subscribedComics.length > 0
      ? generateSubscriptionsList()
      : generateRandomList();
  const subscriptionsPage = templater('subscriptions', subscriptionsList);
  subscriptionsTab.replaceChildren(subscriptionsPage);
};

export { buildSubscriptions };
