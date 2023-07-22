const app = document.querySelector('#app');

const gotoTab = (tabsystem, tabpos) => {
  const selectorsAndTabs = document.querySelectorAll(`
    .tabsystem.tabselector[data-tabsysid="${tabsystem}"] > .tabselectormenu > li,
    .tabsystem.tabgroup[data-tabsysid="${tabsystem}"] > .tab`);
  selectorsAndTabs.forEach((tabelem) => {
    tabelem.removeAttribute('data-tabactive');
    if (tabelem.dataset.tabpos === tabpos) {
      tabelem.setAttribute('data-tabactive', '');

      if (tabelem.dataset.tabhed) {
        console.log(tabelem.dataset.tabhed);

        app.querySelector('#headertitle').textContent = tabelem.dataset.tabhed;
      }
    }
  });
};

const selectTab = (e) => {
  const tabPos = e.target.dataset.tabpos;
  const tabSystemId = e.target.closest('.tabsystem').dataset.tabsysid;
  gotoTab(tabSystemId, tabPos);
};

const initTabs = (tabsysid) => {
  app
    .querySelectorAll(
      `.tabsystem.tabselector[data-tabsysid="${tabsysid}"] > .tabselectormenu > li`,
    )
    .forEach((elem) => {
      elem.addEventListener('click', selectTab);
    });
};
export { initTabs, selectTab, gotoTab };
