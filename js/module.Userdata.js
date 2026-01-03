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

const hasReadingPosition = (title) => {
  if (userData.readComics[title]) {
    if (
      userData.readComics[title].storyindex +
        userData.readComics[title].pageindex >
      0 // If both values are zero, might as well consider the comic unread.
    ) {
      return true;
    }
  }
  return false;
};

const isSubscribed = (title) => {
  return userData.subscribedComics.includes(title);
};

const setReadingPosition = (title, storylineNum, pageNum) => {
  if (!userData.readComics[title]) {
    userData.readComics[title] = { storyindex: 0, pageindex: 0 };
  }
  userData.readComics[title].storyindex = storylineNum;
  userData.readComics[title].pageindex = pageNum;
  storeUserData();
};

const addSubscription = (title) => {
  if (title) {
    userData.subscribedComics.push(title);
  }
  storeUserData();
};

const removeSubscription = (title) => {
  userData.subscribedComics = userData.subscribedComics.filter(
    (item) => item !== title
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
