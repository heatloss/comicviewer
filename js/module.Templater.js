const generateHTMLTemplate = async (templatename) => {
  const template = document.createElement('template');
  const resp = await fetch(`./templates/${templatename}`);
  template.innerHTML = await resp.text();
  return template;
};

const main = await generateHTMLTemplate('main.html');

const header = await generateHTMLTemplate('header.html');

const storylines = await generateHTMLTemplate('storylines.html');

const comicreader = await generateHTMLTemplate('comicreader.html');

const interstitial = await generateHTMLTemplate('interstitial.html');

const ghostmount = document.createElement('template');
ghostmount.innerHTML = `
  <article class="comicpages-ghostmount">
    <section class="comicpage ghost pos-prev" data-templater></section>
    <section class="comicpage active" data-templater></section>
    <section class="comicpage ghost pos-next" data-templater></section>
  </article>
`;

const square = document.createElement('template');
square.innerHTML = `
  <figure class="thumb-frame">
    <span data-templater></span>
    <figcaption class="thumb-title" data-templater></figcaption>
  </figure>`;

const squarecategory = document.createElement('template');
squarecategory.innerHTML = `
    <div class="category-block">
      <h5 class="section-subhed" data-templater></h5>
      <div class="thumbs-block" data-templater></div>
    </div>`;

const progressbar = document.createElement('template');
progressbar.innerHTML = `
  <div class="progressframe">
    <h4 class="progress-hed" data-templater></h4>
    <h5 class="progress-subhed" data-templater></h5>
    <div class="progressbox" data-templater></div>
  </div>`;

const loading = document.createElement('template');
loading.innerHTML = `
  <div class="loading">
	  <h2 class="loading-hed">
		  Loading content for<br/><span id="feedname" data-templater></span>...
	  </h2>
	  <div class="lds-dual-ring"></div>
  </div>`;

const storylinecover = document.createElement('template');
storylinecover.innerHTML = `
  <li>
    <figure class="storyline-cover">
      <div class="cover-image-frame" data-templater></div>
      <figcaption class="cover-title" data-templater></figcaption>
    </figure>
  </li>`;

const storylinenavbtns = document.createElement('template');
storylinenavbtns.innerHTML = `
  <menu class="nav-btn-group"> 
    <li class="nav-btn" data-btntype="forward" data-templater></li>
    <li class="nav-btn tabproxy mobile-only" data-btntype="forward" data-tabsysid="aboutcomic" data-tabpos="covers">Covers</li>
    <li class="nav-btn" data-btntype="forward" data-templater></li>
  </menu>`;

const gridsortmenu = document.createElement('template');
gridsortmenu.innerHTML = `
  <div class="header-menu-contents">
      <h6 class="menu-hed">Sort comics:</h6>
      <menu class="menu-group" data-templater></menu>
  </div>`;

const comicchaptermenu = document.createElement('template');
comicchaptermenu.innerHTML = `
  <div class="header-menu-contents" data-header-nav="comic-chapters">
    <h6 class="menu-hed">Quick actions:</h6>
    <menu class="menu-group">
      <li class="menu-btn" data-btntype="subscribe">Add to Subscriptions</li>
      <li class="menu-btn" data-btntype="back">Back to Comic Intro</li>
    </menu>
    <h6 class="menu-hed">Jump to chapter:</h6>
    <menu class="menu-group" data-templater></menu>
  </div>`;

const templates = {
  main,
  header,
  comicreader,
  progressbar,
  ghostmount,
  interstitial,
  squarecategory,
  square,
  loading,
  storylines,
  storylinecover,
  storylinenavbtns,
  gridsortmenu,
  comicchaptermenu,
};

const templater = (templatename, content, classnames) => {
  const tmpl =
    templates[templatename].content.firstElementChild.cloneNode(true);
  if (content) {
    content = Array.isArray(content) ? content : [content];
    tmpl.querySelectorAll('[data-templater]').forEach((tmplnode, index) => {
      if (typeof content[index] === 'string') {
        tmplnode.textContent = content[index];
      } else {
        tmplnode.replaceChildren(content[index]);
      }
    });
  }
  if (classnames) {
    tmpl.classList.add(classnames);
  }

  return tmpl;
};

export { templater };
