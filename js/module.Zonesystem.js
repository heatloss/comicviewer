const app = document.querySelector('#app');

const gotoZone = (zoneID, zoneHed) => {
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

const initZones = () => {}; // Presumably zones will need some global event listeners?

export { initZones, gotoZone };
