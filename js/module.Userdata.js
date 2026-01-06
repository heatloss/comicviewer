const emptyUserData = {
  readComics: {},
  subscribedComics: [],
  gridsort: 'shuffle',
  colormode: 'unset',
  comictap: 'advances',
};

const userData = JSON.parse(localStorage.getItem('userdata')) || emptyUserData;

const storeUserData = () => {
  localStorage.setItem('userdata', JSON.stringify(userData));
  // console.log(userData);
};

const getUserData = () => {
  return userData;
};

const hasReadingPosition = (slug) => {
  if (userData.readComics[slug]) {
    if (
      userData.readComics[slug].storyindex +
        userData.readComics[slug].pageindex >
      0 // If both values are zero, might as well consider the comic unread.
    ) {
      return true;
    }
  }
  return false;
};

const isSubscribed = (slug) => {
  return userData.subscribedComics.includes(slug);
};

const setReadingPosition = (slug, storylineNum, pageNum) => {
  if (!userData.readComics[slug]) {
    userData.readComics[slug] = { storyindex: 0, pageindex: 0 };
  }
  userData.readComics[slug].storyindex = storylineNum;
  userData.readComics[slug].pageindex = pageNum;
  storeUserData();
};

const addSubscription = (slug) => {
  if (slug) {
    userData.subscribedComics.push(slug);
  }
  storeUserData();
};

const removeSubscription = (slug) => {
  userData.subscribedComics = userData.subscribedComics.filter(
    (item) => item !== slug
  );
  storeUserData();
};

const setColorMode = (colorstate) => {
  userData.colormode = colorstate;
  storeUserData();
};

const setGridSort = (sortstyle) => {
  userData.gridsort = sortstyle;
  storeUserData();
};

const setComicTap = (tappref) => {
  userData.comictap = tappref;
  storeUserData();
};

export {
  storeUserData,
  getUserData,
  addSubscription,
  removeSubscription,
  setReadingPosition,
  hasReadingPosition,
  isSubscribed,
  setColorMode,
  setGridSort,
  setComicTap,
};
