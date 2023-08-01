const app = document.querySelector('#app');

const gotoZone = (zoneID, zoneHed) => {
  prepareZoneTransition();
  const allZones = app.querySelectorAll('[data-zoneid]');
  allZones.forEach((zone) => {
    zone.removeAttribute('data-zoneactive');
    if (zone.dataset.zoneid === zoneID) {
      zone.setAttribute('data-zoneactive', '');
      if (zoneHed) {
        app.querySelector('#headertitle').textContent = zoneHed;
      }
    }
  });
};

const prepareZoneTransition = () => {
  const zoneFrame = app.querySelector('#zonesFrame');
  zoneFrame.classList.add('transitioning');
  zoneFrame.addEventListener('transitionend', concludeZoneTransition);
};

const concludeZoneTransition = () => {
  const zoneFrame = app.querySelector('#zonesFrame');
  app.querySelector('#zonesFrame').classList.remove('transitioning');
  zoneFrame.removeEventListener('transitionend', concludeZoneTransition);
};

const reverseZones = () => {
  const zoneFrame = app.querySelector('#zonesFrame');
  zoneFrame.classList.add('reverse');
  zoneFrame.addEventListener('transitionend', unReverseZones);
  console.log('REVERSE');
};

const unReverseZones = () => {
  const zoneFrame = app.querySelector('#zonesFrame');
  setTimeout(removeReverse, 10);
  // zoneFrame.classList.remove('reverse');
  zoneFrame.removeEventListener('transitionend', unReverseZones);
  console.log('REVERSE REVERSED');
};

const removeReverse = (zoneFrame) => {
  app.querySelector('#zonesFrame').classList.remove('reverse');
};

const initZones = () => {}; // Presumably zones will need some global event listeners?

export { initZones, gotoZone, reverseZones };
