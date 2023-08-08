const emptyUserData = {
  readComics: {},
  subscribedComics: [],
};

const userData = JSON.parse(localStorage.getItem('userdata')) || emptyUserData;

const storeUserData = () => {
  localStorage.setItem('userdata', JSON.stringify(userData));
  console.log(userData);
};

const getUserData = () => {
  return userData;
};

const setReadingPosition = (title, storylineNum, pageNum) => {
  if (!userData.readComics[title]) {
    userData.readComics[title] = { storyline: 0, page: 0 };
  }
  userData.readComics[title].storyline = storylineNum;
  userData.readComics[title].page = pageNum;
  storeUserData();
};

const addSubscription = (title) => {
  userData.subscribedComics.push(title);
  storeUserData();
};

const removeSubscription = (title) => {
  userData.subscribedComics = userData.subscribedComics.filter(
    (item) => item !== title
  );
  storeUserData();
};

export {
  storeUserData,
  getUserData,
  addSubscription,
  removeSubscription,
  setReadingPosition,
};
