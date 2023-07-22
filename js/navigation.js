import * as templates from "./module.Templates.js";

let state = {
  status: 'home'
};

const comicLayout = document.querySelector('#comicpages');
const comicHeader = document.querySelector('#comicheader');
const comicGrid = document.querySelector('#home');
const comicHeaderTitle = comicHeader.querySelector('#headertitle');
// const showgrid = document.querySelector('#tohome');
// const darkMode = document.querySelector('#toggledarkmode');

const toggleGrid = () => {
  if (state.status === 'gridopen') {
    closeGrid(true);
  }
  else {
    openGrid(true);
  }
};

const openGrid = (updatestate) => {
  if (updatestate) {
    state.status = 'gridopen';
    window.history.pushState(state, null, '');
    comicHeader.classList.add('showgrid');
  }
  else {
    comicGrid.style.transitionDuration = '0s';
    comicHeader.classList.add('showgrid');
    setTimeout(() => {
      comicGrid.style.transitionDuration = '';
    }, 1);
  }
};

const closeGrid = (updatestate) => {
  if (updatestate) {
    state.status = 'gridclosed';
    window.history.pushState(state, null, '');
    comicHeader.classList.remove('showgrid');
  }
  else {
    comicGrid.style.transitionDuration = '0s';
    comicHeader.classList.remove('showgrid');
    setTimeout(() => {
      comicGrid.style.transitionDuration = '';
    }, 1);
  }
};

const toggleDark = (e) => {
  document.body.classList.toggle('darkmode');
};

const manageBack = (e) => {
  const toState = e.state || {
    status: ''
  };
  console.log(toState)
  switch (toState.status) {
    case 'gridopen':
      openGrid();
      break;
    case 'gridclosed':
      closeGrid();
      break;
    case 'home':
      closeGrid();
      const introMarkup = templates.intro.content.firstElementChild.cloneNode(true);
      comicLayout.replaceChildren(introMarkup);
      break;
    default:
  }
  state = e.state;

  console.log(`state set to ${state?.status || null}`);
};

// showgrid.addEventListener('click', toggleGrid);
// darkMode.addEventListener('click', toggleDark);
comicGrid.addEventListener('click', closeGrid);
window.addEventListener('popstate', manageBack);
window.history.replaceState(state, null, '');
