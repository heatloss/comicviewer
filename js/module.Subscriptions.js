import { templater } from './module.Templater.js';
import {
  getUserData,
  addSubscription,
  removeSubscription,
  hasReadingPosition,
  isSubscribed,
} from './module.Userdata.js';
import { getPopulatedComic, getAllComics } from './module.Comicdata.js';
import { render } from './module.Router.js';

const app = document.querySelector('#app');
const userData = getUserData();
const comics = getAllComics().comics;

const generateSubOps = (slug) => {
  const handleSubscription = (e) => {
    const subscribeButton = e.currentTarget;
    const btnSlug = subscribeButton.dataset.slug;
    if (subscribeButton.hasAttribute('data-subscribed')) {
      removeSubscription(btnSlug);
      subscribeButton.textContent = 'Add to Subscriptions';
      subscribeButton.removeAttribute('data-subscribed');
    } else {
      addSubscription(btnSlug);
      subscribeButton.textContent = 'Remove Subscription';
      subscribeButton.dataset.subscribed = '';
    }
  };
  const handleReadMore = (e) => {
    const readData = e.currentTarget.dataset;
    if (
      userData.readComics[readData.slug]?.storyindex &&
      userData.readComics[readData.slug]?.pageindex
    ) {
      render(
        `/comic:${readData.slug}:${readData.storyindex}:${readData.pageindex}`
      );
    } else {
      render(`/rack:${readData.slug}`);
    }
  };

  const isSubbed = isSubscribed(slug);
  const hasReadPos = hasReadingPosition(slug);
  const subOpsArray = [
    `${hasReadPos ? 'Continue' : 'Learn more'}`,
    `${hasReadPos ? 'Continue reading' : 'More about this comic'}`,
    `${isSubbed ? 'Unsubscribe' : 'Subscribe'}`,
    `${isSubbed ? 'Remove from subscriptions' : 'Add to subscriptions'}`,
  ];
  const subsOps = templater('subscriptionops', subOpsArray);
  const subsOpRead = subsOps.querySelector('[data-btntype="forward"]');
  const subsOpSubscribe = subsOps.querySelector('[data-btntype="subscribe"]');
  subsOpRead.dataset.slug = slug;
  subsOpRead.dataset.storyindex = userData.readComics[slug]?.storyindex || 0;
  subsOpRead.dataset.pageindex = userData.readComics[slug]?.pageindex || 0;
  subsOpSubscribe.dataset.slug = slug;
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
  listContents.forEach((slug) => {
    const subscribedComic = comics.find((comic) => comic.slug === slug);
    if (!subscribedComic) return; // Skip if comic not found
    const subOpsList = generateSubOps(slug);
    const thumbImg = document.createElement('img');
    thumbImg.classList.add('thumb-image');
    thumbImg.src = subscribedComic.square;
    thumbImg.alt = subscribedComic.title;
    const subRow = templater('subscriptionrow', [
      subscribedComic.title,
      thumbImg,
      subscribedComic.title,
      subOpsList,
    ]);
    fragment.appendChild(subRow);
  });
  return fragment;
};

const generateRandomList = () => {
  const fragment = document.createElement('div');
  fragment.innerHTML = `<p class="nosubs">No subscriptions found! But here are three comics, selected at random:</p>`;
  const randomSlugs = comics
    .map((comic) => comic.slug)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
  fragment.appendChild(generateSubscriptionsList(randomSlugs));
  return fragment;
};

const buildSubscriptions = async () => {
  if (userData.subscribedComics.length > 0) {
    for (const slug of userData.subscribedComics) {
      await getPopulatedComic(slug);
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
