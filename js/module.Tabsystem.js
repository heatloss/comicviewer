import { activateHeaderMenu, deactivateHeaderMenu } from './module.Header.js';
import { history } from './module.Router.js';

const app = document.querySelector('#app');

const gotoTab = (tabsystem, tabpos) => {
  const selectorsAndTabs = app.querySelectorAll(`
    .tabsystem.tabselector[data-tabsysid="${tabsystem}"] > .tabselectormenu > li,
    .tabsystem.tabgroup[data-tabsysid="${tabsystem}"] > .tab`);
  selectorsAndTabs.forEach((tabelem) => {
    tabelem.removeAttribute('data-tabactive');
    if (tabelem.dataset.tabpos === tabpos) {
      tabelem.setAttribute('data-tabactive', '');
      if (tabelem.dataset.tabhed) {
        app.querySelector('#headertitle').textContent = tabelem.dataset.tabhed;
      }
      if (tabelem.dataset.tabheadermenu) {
        activateHeaderMenu();
      } else {
        deactivateHeaderMenu();
      }
    }
  });
};

const selectTab = (e) => {
  e.stopPropagation();
  const tabPos = e.currentTarget.dataset.tabpos;
  const tabSystemId =
    e.currentTarget.dataset.tabsysid ||
    e.currentTarget.closest('.tabsystem').dataset.tabsysid;
  const currentPath = decodeURIComponent(window.location.pathname).split(':');
  const historyPath =
    currentPath[0] === '/rack'
      ? `${currentPath[0]}:${currentPath[1]}:${tabPos}`
      : `${currentPath[0]}:${tabPos}`;
  console.log(historyPath);
  history(historyPath);
  gotoTab(tabSystemId, tabPos);
};

const initTabs = (tabsysid) => {
  app
    .querySelectorAll(
      `.tabsystem.tabselector[data-tabsysid="${tabsysid}"] > .tabselectormenu > li,
      .tabproxy[data-tabsysid="${tabsysid}"]`
    )
    .forEach((elem) => {
      elem.addEventListener('click', selectTab);
    });
};

export { initTabs, selectTab, gotoTab };
