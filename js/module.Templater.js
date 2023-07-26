const generateHTMLTemplate = async (templatename) => {
  const template = document.createElement('template');
  const resp = await fetch(`./templates/${templatename}`);
  template.innerHTML = await resp.text();
  return template;
};

const main = await generateHTMLTemplate('main.html');

const storylines = await generateHTMLTemplate('storylines.html');

const header = document.createElement('template');
header.innerHTML = `
  <nav id="headernav">
    <button id="tohome" class="headerbutton" data-tabhed="Browse All Comics"></button> 
    <button id="headertitle"></button>
    <button id="toggleadjustments" class="headerbutton">Show adjustments</button>
  </nav>
`;

const comic = document.createElement('template');
comic.innerHTML = `
	<article class="comic-frame">
		<div class="comic-image" data-templater></div>
	</article>`;

const thumb = document.createElement('template');
thumb.innerHTML = `
	<figure class="thumb-frame">
		<span data-templater></span>
		<figcaption class="thumb-title" data-templater></figcaption>
	</figure>`;

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
  comic,
  thumb,
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
