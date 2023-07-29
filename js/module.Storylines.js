import { getPopulatedComic, getCoversForComic } from './module.Comicdata.js';
import { templater } from './module.Templater.js';
import { render } from './module.Router.js';
import { buildComic } from './module.Comicreader.js';
import { initTabs } from './module.Tabsystem.js';
import { optimizeImage } from './module.Archiveparser.js';

const app = document.querySelector('#app');

const goToComicCover = (e) => {
  const storylineData = e.currentTarget.dataset;
  render(`/comic:${storylineData.storytitle}:${storylineData.storyindex}`);
  // console.log(
  //   `Load ${storylineData.storytitle} storyline #${
  //     parseInt(storylineData.storyindex, 10) + 1
  //   }`
  // );
};

const handleExternalLink = (e) => {
  console.log(e.target);
};

const buildStorylines = async (title) => {
  app.querySelector('#headertitle').textContent = title;

  const loadingmsg = templater('loading', title);
  app.querySelector('#rack').replaceChildren(loadingmsg);

  const comic = await getPopulatedComic(title);
  const storylineArray = await getCoversForComic(title);

  const splashImage = document.createElement('img');
  splashImage.classList.add('splash-image');
  splashImage.src = 'img/' + comic.square;

  const coversList = document.createElement('ul');
  coversList.classList.add('covers-list');
  storylineArray.forEach((storyline, index) => {
    const coverImage = document.createElement('img');
    coverImage.classList.add('cover-image');
    coverImage.src = optimizeImage(storyline.pages[0].img?.original);
    const coverLi = templater(
      'storylinecover',
      [coverImage, storyline.name],
      'cover-list-item'
    );
    coverLi.dataset.storytitle = title;
    coverLi.dataset.storyindex = index;
    coverLi.addEventListener('click', goToComicCover);
    coversList.appendChild(coverLi);
  });

  const linksUl = document.createElement('ul');
  comic.links.forEach((link, index) => {
    const externalLi = document.createElement('li');
    externalLi.innerHTML = `<a class="external-link" data-linktype="${link.linktext.toLowerCase()}" href="${
      link.linkurl
    }">${link.linktext}</a>`;
    externalLi.addEventListener('click', handleExternalLink);
    linksUl.appendChild(externalLi);
  });

  const storylineBox = templater('storylines', [
    splashImage,
    comic.description,
    coversList,
    linksUl,
  ]);

  app.querySelector('#rack').replaceChildren(storylineBox);

  initTabs('comicintro');

  // render(`/comic:${title}`);
  // Now we need separate render and navigate options.

  // buildComic(title);

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

export { buildStorylines };
