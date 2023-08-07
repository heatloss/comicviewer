const emptyUserData = {
  readComics: [],
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

const addSubscription = (title) => {
  userData.subscribedComics.push(title);
  // console.log(userData.subscribedComics);
  storeUserData();
};

const removeSubscription = (title) => {
  userData.subscribedComics = userData.subscribedComics.filter(
    (item) => item !== title
  );
  // console.log(userData.subscribedComics);
  storeUserData();
};

export { storeUserData, getUserData, addSubscription, removeSubscription };
