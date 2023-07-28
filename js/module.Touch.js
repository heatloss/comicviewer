const app = document.querySelector('#app');
let advancementDisabled = false;
let advanceButtons;

const initAdvancers = () => {
  advanceButtons = app.querySelectorAll('[data-pageadvance]');
  advanceButtons.forEach((elem) => {
    elem.addEventListener('click', requestAdvancement);
  });
  const checkKey = (e) => {
    if (e.keyCode == '38') {
      // up arrow
    } else if (e.keyCode == '40') {
      // down arrow
    } else if (e.keyCode == '37') {
      // left arrow
      requestAdvancement(-1);
    } else if (e.keyCode == '39') {
      // right arrow
      requestAdvancement(1);
    }
  };
  document.onkeydown = checkKey;
};

const requestAdvancement = (e) => {
  if (advancementDisabled) return false;
  const dir =
    typeof e === 'number'
      ? e
      : parseInt(e.currentTarget.dataset.pageadvance, 10);
  const pageAdvancer = new CustomEvent('advance', {
    detail: dir,
  });
  app.dispatchEvent(pageAdvancer);
};

const setAdvancersActive = (active) => {
  advancementDisabled = !active;
  advanceButtons.forEach((elem) => {
    elem.disabled = advancementDisabled;
  });
};

export { initAdvancers, setAdvancersActive };
