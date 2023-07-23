import {
  getComic,
  getPopulatedComic,
  getCoversForComic,
} from './module.Comicdata.js';
import { templater } from './module.Templater.js';
import {
  getPagesFromArchive,
  getImageFromPage,
} from './module.Archiveparser.js';

const app = document.querySelector('#app');

const buildComic = async (title, storyNum = 0, pageNum = 0) => {
  const selectedComic = getComic(title);
  const comicURLToLoad = selectedComic.storylines[storyNum].pages[pageNum].href;
  const comicImage = document.createElement('img');
  comicImage.src = await getImageFromPage(comicURLToLoad);
  const comicBox = document.createElement('div');
  comicBox.classList.add('comicpagesbox');
  const comicPage = templater('comic', comicImage);
  comicBox.appendChild(comicPage);
  app.querySelector('#comicpages').replaceChildren(comicBox);

  // COMIC ARCHIVE DATA IS NOW AVAILABLE

  /*
  window.scrollTo(0, 0);
  headernavTitle.textContent = '';
  const target = e.currentTarget;
	const loadingmsg = templates.loading.content.firstElementChild.cloneNode(true);
	loadingmsg.querySelector("#feedname").textContent = `${target.dataset.title}`;
	comicLayout.replaceChildren(loadingmsg);
  closeSidebar(true);


      headernavTitle.textContent = title;
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

export { buildComic };
