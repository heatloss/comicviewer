export const header = document.createElement("template");
header.innerHTML = `
  <header id="comicheader" class="showheader">
    <button id="togglegrid" class="headerbutton">Browse other comics</button> 
    <h3 id="headertitle">
    </h3>
    <button id="toggledarkmode" class="headerbutton">Toggle dark/light mode</button> 
  </header>`;

export const grid = document.createElement("template");
grid.innerHTML = `
  <aside id="grid">
    <ul id="comicslist">
    </ul>
  </aside>`;

export const main = document.createElement("template");
main.innerHTML = `
  <section id="comicpages">
  </section>`;

export const comic = document.createElement("template");
comic.innerHTML = `
	<article class="comic-frame">
		<div class="comic-image"></div>
	</article>`;

export const thumb = document.createElement("template");
thumb.innerHTML = `
	<figure class="thumb-frame">
		<img class="thumb-image" />
		<figcaption class="thumb-title"></figcaption>
	</figure>`;

export const intro = document.createElement("template");
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

export const loading = document.createElement("template");
loading.innerHTML = `
	<div class="loading">
		<h2 class="loading-hed">
			Loading storylines for<br/><span id="feedname"></span>...
		</h2>
		<div class="lds-dual-ring"></div>
	</div>`;

export const storylines = document.createElement("template");
storylines.innerHTML = `
	<div class="storylines-frame">
		<h2 class="storylines-hed"></h2>
		<h3 class="storylines-desc"></h3>
		<ul class="storylines-list"></ul>
	</div>`;
