

/* jshint esversion: 8 */
const RSSPROXY = 'https://comic-viewer-proxy.glitch.me/proxy?url=';
let state = {
  status: 'home'
};
let pagesloaded = false;

const comicLayout = document.querySelector('#comicpages');
const comicHeader = document.querySelector('#comicheader');
const comicSidebar = document.querySelector('#sidebar');
const comicHeaderTitle = comicHeader.querySelector('#comictitle');

const comictmpl = document.createElement('template');
comictmpl.innerHTML = `
	<article class="comic-frame">
		<div class="comic-image"></div>
	</article>`;

const thumbtmpl = document.createElement('template');
thumbtmpl.innerHTML = `
	<figure class="thumb-frame">
		<img class="thumb-image" />
		<figcaption class="thumb-title"></figcaption>
	</figure>`;

const hometmpl = document.createElement('template');
hometmpl.innerHTML = `
	<div class="intro">
		<h2 class="intro-hed">
			Comic Viewer
		</h2>
		<p>
			This is a proof-of-concept web app built on top of publicly available RSS feeds. 
		</p>
		<p>
			It is not under active development, as we have no control over the app's contents. 
		</p>
		<p>
			Still, it works pretty okay, considering these comics were never formatted for phones.
			(Don't forget, you can turn it sideways…)
		</p>
		<p>
			Enjoy! 
		</p>
		<small>
			To get started, click the menu icon in the top left.
		</small>
	</div>`;

const loadingtmpl = document.createElement('template');
loadingtmpl.innerHTML = `
	<div class="loading">
		<h2 class="loading-hed">
			Loading RSS feed for<br/><span id="feedname"></span>...
		</h2>
		<div class="lds-dual-ring"></div>
	</div>`;
		
const toggleSidebar = () => {
  if (state.status === 'sidebaropen') {
    closeSidebar(true);
  }
  else {
    openSidebar(true);
  }
};

const openSidebar = (updatestate) => {
  if (updatestate) {
    state.status = 'sidebaropen';
    window.history.pushState(state, null, '');
    comicHeader.classList.add('showsidebar');
  }
  else {
    comicSidebar.style.transitionDuration = '0s';
    comicHeader.classList.add('showsidebar');
    setTimeout(() => {
      comicSidebar.style.transitionDuration = '';
    }, 1);
  }
};

const closeSidebar = (updatestate) => {
  if (updatestate) {
    state.status = 'sidebarclosed';
    window.history.pushState(state, null, '');
    comicHeader.classList.remove('showsidebar');
  }
  else {
    comicSidebar.style.transitionDuration = '0s';
    comicHeader.classList.remove('showsidebar');
    setTimeout(() => {
      comicSidebar.style.transitionDuration = '';
    }, 1);
  }
};

const toggleDark = (e) => {
  document.body.classList.toggle('darkmode');
};

const handleIntersection = (entries) => {
  if (!pagesloaded) return false;
  entries.map((entry) => {
    if (entry.isIntersecting) {
      loadImage(entry.target);
    }
  });
};
const observer = new IntersectionObserver(handleIntersection);

const loadComic = (e) => {
  e.preventDefault();
  e.stopPropagation();
  window.scrollTo(0, 0);
  comicHeaderTitle.textContent = '';
  const target = e.currentTarget;
  const rssType = target.dataset.rsstype;
  const rssLink = target.dataset.url;
	const loadingmsg = loadingtmpl.content.firstElementChild.cloneNode(true);
	loadingmsg.querySelector("#feedname").textContent = `${target.dataset.title}`;
	comicLayout.replaceChildren(loadingmsg);
  closeSidebar(true);

  fetch(RSSPROXY + rssLink)
    .then((response) => {
      if (response.ok) {
        return response.text();
      }
      throw new Error('Something went wrong');
    })
    .then((str) => new window.DOMParser().parseFromString(str, 'text/xml'))
    .then((data) => {
      const title = data.querySelector('channel > title').textContent;
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
      pagesloaded = true; // Trying to avoid triggering IntersectionObserver until all images are accounted for.
    })
    .catch((error) => {
      console.log(error);
      return Promise.reject();
    });
};

const processImage = async (node, discardContent, rssType) => {
  const discardBox = new DOMParser().parseFromString(
    discardContent,
    'text/html',
  );
  const keepBox = document.createElement('div');
  if (rssType === 'wp') {
    const theComicP = discardBox.querySelector('p:has(img)');
    keepBox.appendChild(theComicP);
    return keepBox;
  }
  else if (rssType === 'cc') {
    const theComicPageLink = discardBox.querySelector('a').href;
    const theComicRSSThumb = discardBox.querySelector(
      'img[src*="comicsthumbs"]',
    );
    await fetch(RSSPROXY + theComicPageLink)
      .then((res) => res.text())
      .then((responseText) => {
        const doc = new DOMParser().parseFromString(responseText, 'text/html');
        const mainImg = document.createElement('img');
        mainImg.classList.add('pending');
        const theComicMainImg = doc.querySelector('#cc-comic');
        mainImg.dataset.thumbsrc = theComicRSSThumb.src;
        mainImg.dataset.fullsrc = theComicMainImg.src;
        keepBox.appendChild(mainImg);
      });
    return keepBox;
  }
};

const showSidebar = document.querySelector('#togglesidebar');
const darkMode = document.querySelector('#toggledarkmode');
showSidebar.addEventListener('click', toggleSidebar);
darkMode.addEventListener('click', toggleDark);

const sidebarList = document.querySelector('#comicslist');
fetch('js/feeds.json')
  .then((response) => response.json())
  .then((comicsdata) => {
    const fragment = document.createElement('div');
    fragment.classList.add('thumbbox');
    const sortedComics = comicsdata.comics.sort((a, b) =>
      a.sorttitle.localeCompare(b.sorttitle),
    );
    sortedComics.forEach((comic) => {
      const comicThumb = thumbtmpl.content.firstElementChild.cloneNode(true);
      comicThumb.dataset.rsstype = comic.type;
      comicThumb.dataset.url = comic.rssurl;
      comicThumb.dataset.title = comic.title;
      comicThumb.querySelector('.thumb-image').src = 'img/' + comic.thumb;
      comicThumb.querySelector('.thumb-image').alt = comic.title;
      comicThumb.addEventListener('click', loadComic);
      fragment.appendChild(comicThumb);
    });
    sidebarList.appendChild(fragment);
  });

let lastScrollTop = 0;
const manageScroll = (e) => {
  var st = document.documentElement.scrollTop; // Credits: "https://github.com/qeremy/so/blob/master/so.dom.js#L426"
  if (st - lastScrollTop > 10) {
    comicHeader.classList.remove('showheader');
  }
  else if (st - lastScrollTop < -10) {
    comicHeader.classList.add('showheader');
  }
  lastScrollTop = st <= 0 ? 0 : st; // For Mobile or negative scrolling
};

const loadImage = (node) => {
  if (node) {
    // <- Sometimes the intersectionObserver returns an undefined object instead of a node.
    const frameImg = node;
    frameImg.src = frameImg.dataset.thumbsrc;
    frameImg.srcset = frameImg.dataset.fullsrc;
    node.classList.remove('pending');
    observer.unobserve(node);
  }
};

const manageBack = (e) => {
  const toState = e.state || {
    status: ''
  };
  switch (toState.status) {
    case 'sidebaropen':
      openSidebar();
      break;
    case 'sidebarclosed':
      closeSidebar();
      break;
    case 'home':
      closeSidebar();
      const homeMarkup = hometmpl.content.firstElementChild.cloneNode(true);
      comicLayout.replaceChildren(homeMarkup);
      break;
    default:
  }
  state = e.state;
  console.log(`state set to ${state.status}`);
};

window.addEventListener('popstate', manageBack);
window.addEventListener('scroll', manageScroll);
window.history.replaceState(state, null, '');