const main = document.createElement("template");
main.innerHTML = `
  <div>
    <header id="headernav" class="showheader">
      <button id="togglegrid" class="headerbutton">Browse other comics</button> 
      <h3 id="headertitle"></h3>
      <button id="toggledarkmode" class="headerbutton">Toggle dark/light mode</button> 
    </header>
    <aside id="grid">
      <div id="comicslist"></div>
    </aside>
    <nav id="storylines"></nav>
    <section id="comicpages"></section>
  </div>`;

const comic = document.createElement("template");
comic.innerHTML = `
	<article class="comic-frame">
		<div class="comic-image" data-templater></div>
	</article>`;

const thumb = document.createElement("template");
thumb.innerHTML = `
	<figure class="thumb-frame">
		<span data-templater></span>
		<figcaption class="thumb-title" data-templater></figcaption>
	</figure>`;

const intro = document.createElement("template");
intro.innerHTML = `
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

const loading = document.createElement("template");
loading.innerHTML = `
	<div class="loading">
		<h2 class="loading-hed">
			Loading storylines for<br/><span id="feedname" data-templater></span>...
		</h2>
		<div class="lds-dual-ring"></div>
	</div>`;

const storylines = document.createElement("template");
storylines.innerHTML = `
	<div class="storylines-frame">
		<h3 class="storylines-desc" data-templater></h3>
		<div class="storylines-list" data-templater></div>
	</div>`;

const toggle = document.createElement("h1");
const label = document.createTextNode("click me");
toggle.addEventListener("click", ()=>{toggle.classList.toggle("clicked")});
toggle.appendChild(label);

const templates = {
  main,
  comic,
  thumb,
  intro,
  loading,
  storylines,
};

const templater = (templatename, content) => {
  const tmpl =
    templates[templatename].content.firstElementChild.cloneNode(true);
  if (content) {
    content = Array.isArray(content) ? content : [content];
    tmpl.querySelectorAll("[data-templater]").forEach((tmplnode, index) => {
      if (typeof content[index] === "string") {
        tmplnode.textContent = content[index];
      } else {
        tmplnode.replaceChildren(content[index]);
      }
    });
  }
  return tmpl;
};

export { templater, toggle };
