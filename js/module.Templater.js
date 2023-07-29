const generateHTMLTemplate = async (templatename) => {
  const template = document.createElement('template');
  const resp = await fetch(`./templates/${templatename}`);
  template.innerHTML = await resp.text();
  return template;
};

const main = await generateHTMLTemplate('main.html');

const storylines = await generateHTMLTemplate('storylines.html');

const comicreader = await generateHTMLTemplate('comicreader.html');

const header = document.createElement('template');
header.innerHTML = `
  <nav id="headernav">
    <button id="tohome" class="headerbutton" data-tabhed="Browse All Comics"></button> 
    <button id="headertitle"></button>
    <button id="toggleadjustments" class="headerbutton">Show adjustments</button>
  </nav>
`;

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

const templates = {
  main,
  header,
  comicreader,
  progressbar,
  ghostmount,
  square,
  loading,
  storylines,
  storylinecover,
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
