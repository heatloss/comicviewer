import { getPopulatedComic } from "./module.Comicdata.js";
import { templater } from "./module.Templater.js";
import { render } from "./module.Router.js";
import { buildComic } from "./module.Comicreader.js";

const app = document.querySelector("#app");

const selectTab = (e) => {
  const toTabId = e.target.dataset.tabpos;
  const selectorsAndTabs = e.target
    .closest(".tabsystem")
    .querySelectorAll(".tabselector > li, .tabgroup > .tab");
  selectorsAndTabs.forEach((tabelem) => {
    tabelem.removeAttribute("data-tabselect");
    if (tabelem.dataset.tabpos === toTabId) {
      tabelem.setAttribute("data-tabselect", "");
    }
  });
};

const goToComicCover = (e) => {
  render(
    `/comic:${e.target.dataset.storytitle}:${e.target.dataset.storyindex}`
  );
  console.log(
    `Load ${e.target.dataset.storytitle} storyline #${
      parseInt(e.target.dataset.storyindex, 10) + 1
    }`
  );
};

const buildStorylines = async (title) => {
  app.querySelector("#comictitle").textContent = title;

  const loadingmsg = templater("loading", title);
  app.querySelector("#storylines").replaceChildren(loadingmsg);

  const comic = await getPopulatedComic(title);
  const splashImage = document.createElement("img");
  splashImage.classList.add("splash-image");
  splashImage.src = "img/" + comic.thumb;
  const storylineUl = document.createElement("ul");
  comic.storylines.forEach((storyline, index) => {
    const storylineLi = document.createElement("li");
    storylineLi.textContent = storyline.name;
    storylineLi.dataset.storytitle = title;
    storylineLi.dataset.storyindex = index;
    storylineLi.addEventListener("click", goToComicCover);
    storylineUl.appendChild(storylineLi);
  });

  const storylineBox = templater("storylines", [
    splashImage,
    comic.description,
    storylineUl,
  ]);

  app.querySelector("#storylines").replaceChildren(storylineBox);

  // render(`/comic:${title}`);
  // Now we need separate render and navigate options.

  // buildComic(title);

  document.querySelectorAll("#storylines .tabselector").forEach((elem) => {
    elem.addEventListener("click", selectTab);
  });
  // COMIC ARCHIVE DATA IS NOW AVAILABLE

  /*
  window.scrollTo(0, 0);
  comicHeaderTitle.textContent = '';
  const target = e.currentTarget;
	const loadingmsg = templates.loading.content.firstElementChild.cloneNode(true);
	loadingmsg.querySelector("#feedname").textContent = `${target.dataset.title}`;
	comicLayout.replaceChildren(loadingmsg);
  closeSidebar(true);


      comicHeaderTitle.textContent = title;
      const items = data.querySelectorAll('item');
      const fragment = document.createElement('div');
      fragment.classList.add('comicpagesbox');
      const itemsReversed = [...items].reverse();
      itemsReversed.forEach((el) => {
        const comicpage = comictmpl.content.firstElementChild.cloneNode(true);
        const elcomicbody =
          rssType === 'wp' ?
          el.querySelector('encoded').textContent :
          el.querySelector('description').textContent;
        const pendingImage = document.createElement('img');
        pendingImage.classList.add('pending');
        const imageFrame = comicpage.querySelector('.comic-image');
        fragment.appendChild(comicpage);
        processImage(comicpage, elcomicbody, rssType).then((processedbox) => {
          const processedimage = processedbox.firstElementChild;
          imageFrame.appendChild(processedimage);
          observer.observe(processedimage);
        });
      });
      comicLayout.replaceChildren(fragment);
 */
};

export { buildStorylines };
