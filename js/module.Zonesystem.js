import { activateHeaderMenu, deactivateHeaderMenu } from './module.Header.js';

const zoneConfig = { prevzone: '' };
const app = document.querySelector('#app');

const setPrevZone = (zoneID) => {
  zoneConfig.prevzone = zoneID;
};

const gotoZone = (zoneID, zoneHed, headerMenu) => {
  // Don't transition if the zone hasn't changed.
  if (zoneConfig.prevzone !== zoneID) {
    // Don't add transition class on initial load.
    if (zoneConfig.prevzone !== '') {
      prepareZoneTransition();
    }
    const allZones = app.querySelectorAll('[data-zoneid]');
    allZones.forEach((zone) => {
      zone.removeAttribute('data-zoneactive');
      if (zone.dataset.zoneid === zoneID) {
        zone.setAttribute('data-zoneactive', '');
        setPrevZone(zoneID);
      }
    });
  }
  deactivateHeaderMenu();
  if (zoneHed) {
    app.querySelector('#headertitle').textContent = zoneHed;
  }
  if (headerMenu) {
    activateHeaderMenu();
  }
};

const prepareZoneTransition = () => {
  const zoneFrame = app.querySelector('#zonesFrame');
  zoneFrame.classList.add('transitioning');
  zoneFrame.addEventListener('transitionend', concludeZoneTransition);
};

const concludeZoneTransition = () => {
  const zoneFrame = app.querySelector('#zonesFrame');
  app.querySelector('#zonesFrame').classList.remove('transitioning');
  app.querySelectorAll('[data-zoneid].reverse').forEach((zone) => {
    zone.classList.remove('reverse');
  });
  zoneFrame.removeEventListener('transitionend', concludeZoneTransition);
};

const reverseZone = (zoneid) => {
  app.querySelector(zoneid).classList.add('reverse');
  app.querySelector('[data-zoneactive]').classList.add('reverse');
  // zoneFrame.addEventListener('transitionend', unReverseZones);
};

const initZones = () => {}; // Presumably zones will need some global event listeners?

export { initZones, gotoZone, reverseZone, setPrevZone };
