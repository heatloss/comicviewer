import { setPrevZone } from './module.Zonesystem.js';

const app = document.querySelector('#app');
let advancementDisabled = false;
let advanceButtons;

const touchConfig = {};

const unCache = (evtData) => {
  const index = touchConfig.evcache.findIndex(
    (cachedEvt) => cachedEvt.pointerId === evtData.pointerId
  );
  touchConfig.evcache.splice(index, 1);
};

const setStackEdges = (edge, selector) => {
  if (edge === 'prev') {
    touchConfig.prevzone = app.querySelector(selector);
  } else if (edge === 'next') {
    touchConfig.nextzone = app.querySelector(selector);
  } else {
    touchConfig.prevzone = null;
    touchConfig.nextzone = null;
  }
};

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

const initSwiper = (swipeSelector) => {
  if (window.matchMedia('(pointer:coarse)').matches) {
    touchConfig.swipezone = app.querySelector(swipeSelector); // The swipe zone is where we listen for touches
    touchConfig.swipezone.addEventListener('touchstart', startDrag, {
      passive: true,
    });
    window.addEventListener('orientationchange', initParams);
    initParams();
    resetSwiper();
  }
};

const initParams = () => {
  touchConfig.screenWidth = window.innerWidth;
  touchConfig.dragMax = window.innerWidth;
  touchConfig.dragMin = -1 * window.innerWidth;
  touchConfig.snaps = [touchConfig.dragMin, 0, touchConfig.dragMax];
  touchConfig.evcache = [];
};

const resetSwiper = () => {
  touchConfig.drag = 0;
  touchConfig.touching = false;
  touchConfig.x = 0;
  touchConfig.y = 0;
  touchConfig.previndex = 1;
  if (touchConfig.prevzone) {
    touchConfig.prevzone.classList.remove('snapping');
    touchConfig.prevzone.style.transform = '';
    setPrevZone(''); // Prevents the Zone system from animating to the left-hand zone
  }
  if (touchConfig.nextzone) {
    touchConfig.nextzone.classList.remove('snapping');
    touchConfig.nextzone.style.transform = '';
    setPrevZone(''); // Prevents the Zone system from animating to the right-hand zone
  }
};

const startDrag = (e) => {
  if (advancementDisabled) return false;
  // if (touchConfig.evcache.length > 1) return false;
  if (e.targetTouches.length > 1) return false;

  const evtData = e.targetTouches[0];
  touchConfig.x = evtData.pageX;
  touchConfig.y = evtData.pageY;
  touchConfig.dir = 0;
  touchConfig.primaryDir = '';
  touchConfig.swiper = touchConfig.swipezone.querySelector('.swiper');
  touchConfig.swipezone.addEventListener('touchmove', moveDrag, {
    passive: true,
  });
  window.addEventListener('touchend', endDrag);
  touchConfig.touching = true;
  touchConfig.tapped = true;
  touchConfig.swiped = false;
  touchConfig.evcache.push(evtData);
  requestAnimationFrame(updateAnim);
};

const moveDrag = (e) => {
  const evtData = e.targetTouches[0];
  const xPos = evtData.pageX;
  const yPos = evtData.pageY;
  const xDelta = xPos - touchConfig.x;
  const yDelta = yPos - touchConfig.y;
  if (
    touchConfig.primaryDir === '' &&
    Math.abs(xDelta) + Math.abs(yDelta) > 1
  ) {
    // The drag axis needs a minimum delta to be set; can't be changed until the touch is released.
    touchConfig.primaryDir =
      Math.abs(xDelta) > Math.abs(yDelta * 2.83) ? 'x' : 'y'; // Initial horizontal movement must be 2.83x the vertical movement in order to trigger a swipe.
    if (touchConfig.primaryDir === 'x') {
      touchConfig.swiper.classList.add('dragging');
      touchConfig.swiped = true;
    }
  }
  if (touchConfig.primaryDir === 'x') {
    e.preventDefault();
    e.stopPropagation();
    swipeLimiter(xDelta);
    touchConfig.x = xPos;
    touchConfig.y = yPos;
  }
  touchConfig.tapped = false;
};

const endDrag = (evtData) => {
  touchConfig.swipezone.removeEventListener('touchmove', moveDrag);
  window.removeEventListener('touchend', endDrag);
  touchConfig.touching = false;
  touchConfig.swiper.classList.remove('dragging');
  if (touchConfig.swiped) {
    calcSnap();
  } else {
    touchConfig.swiper.style.transform = ''; // Remove inline transform style to un-block transition animation.
  }
  unCache(evtData);
};

const updateAnim = () => {
  if (!touchConfig.touching) return;
  requestAnimationFrame(updateAnim); // Use of requestAnimationFrame improves performance on slower CPUs.
  transformPages();
};

const transformPages = () => {
  touchConfig.swiper.style.transform = `translateX(${touchConfig.drag}px)`;
  if (touchConfig.prevzone) {
    touchConfig.prevzone.style.transform = `translateX(calc(-100vw + ${touchConfig.drag}px))`;
  }
  if (touchConfig.nextzone) {
    touchConfig.nextzone.style.transform = `translateX(calc(100vw + ${touchConfig.drag}px))`;
  }
};

const calcSnap = () => {
  const closestNum = touchConfig.snaps.reduce((a, b) => {
    return Math.abs(b - touchConfig.drag) < Math.abs(a - touchConfig.drag)
      ? b
      : a;
  });
  const closestIndex = touchConfig.snaps.indexOf(closestNum);
  let snapIndex = closestIndex;
  const goalIndex = 1 + touchConfig.dir;
  if (closestIndex !== goalIndex) {
    const dragDistance =
      touchConfig.drag - touchConfig.snaps[touchConfig.previndex];
    const spanDistance = touchConfig.screenWidth;
    const dragPercent = dragDistance / spanDistance;
    if (dragPercent * touchConfig.dir > 0.1) {
      snapIndex = goalIndex;
    }
  }
  snapSwiper(snapIndex);
};

const swipeLimiter = (x) => {
  touchConfig.drag += x;
  if (Math.abs(x) > 0) {
    touchConfig.dir = x / Math.abs(x); // The dir can flip back and forth with the drag direction, but won't go back to zero until the touch is released.
  }
  touchConfig.drag =
    touchConfig.drag < touchConfig.dragMax
      ? touchConfig.drag
      : touchConfig.drag - touchConfig.screenWidth;
  touchConfig.drag =
    touchConfig.drag > touchConfig.dragMin
      ? touchConfig.drag
      : touchConfig.drag + touchConfig.screenWidth;
};

const snapSwiper = (snapIndex = touchConfig.previndex) => {
  if (touchConfig.drag !== touchConfig.snaps[snapIndex]) {
    touchConfig.swiper.addEventListener('transitionend', endSnapping);
    touchConfig.drag = touchConfig.snaps[snapIndex];
    if (touchConfig.prevzone) {
      touchConfig.prevzone.classList.add('snapping');
    }
    if (touchConfig.nextzone) {
      touchConfig.nextzone.classList.add('snapping');
    }
    transformPages(touchConfig.drag);
    setAdvancersActive(false);
  }
  touchConfig.previndex = snapIndex;
};

const endSnapping = () => {
  touchConfig.swiper.removeEventListener('transitionend', endSnapping);
  setAdvancersActive(true);
  const dirVector = 1 - touchConfig.previndex;
  if (dirVector !== 0) {
    touchConfig.swiper.dataset.transition = 'completed';
    requestAdvancement(dirVector);
  }
  resetSwiper();
};

export { initAdvancers, setAdvancersActive, initSwiper, setStackEdges };
