import { activateHeaderMenu, deactivateHeaderMenu } from './module.Header.js';

const app = document.querySelector('#app');

const gotoZone = (zoneID, zoneHed, headerMenu) => {
  prepareZoneTransition(); // Except for when the zone being requested is already the active zone...
  deactivateHeaderMenu();
  const allZones = app.querySelectorAll('[data-zoneid]');
  allZones.forEach((zone) => {
    zone.removeAttribute('data-zoneactive');
    if (zone.dataset.zoneid === zoneID) {
      zone.setAttribute('data-zoneactive', '');
      if (zoneHed) {
        app.querySelector('#headertitle').textContent = zoneHed;
      }
      if (headerMenu) {
        activateHeaderMenu();
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

// const startTransition = (zoneFrame) => {
//   zoneFrame.classList.add('transitioning');
// };

const initZones = () => {}; // Presumably zones will need some global event listeners?

export { initZones, gotoZone, reverseZone };
