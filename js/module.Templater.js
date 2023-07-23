const header = document.createElement('template');
header.innerHTML = `
  <nav id="headernav">
    <button id="tohome" class="headerbutton" data-tabhed="Browse All Comics"></button> 
    <h3 id="headertitle"></h3>
    <button id="toggleadjustments" class="headerbutton">Show adjustments</button>
  </nav>
`;

const main = document.createElement('template');
main.innerHTML = `
<div>
  <header id="headerframe" class="showheader"></header>
  <aside id="home">
    <article class="tabsystem tabgroup" data-tabsysid="homenav">
      <section class="tab" data-tabpos="comiclist">
        <div id="comicslist">
          <div class="tabsystem tabselector inline" data-tabsysid="comiclist">
            <menu class="tabselectormenu"> 
              <li class="alpha" data-tabpos="alphabetic" data-tabactive>A-Z</li>
              <li class="update" data-tabpos="updated">Updated</li>
              <li class="genre" data-tabpos="genre">Genre</li>
            </menu>
          </div>
          <article class="tabsystem tabgroup" data-tabsysid="comicssorted">
          </article>
        </div>
      </section>
      <section class="tab" data-tabpos="subscriptions">
        <div id="subscriptions">
        </div>
      </section>
      <section class="tab" data-tabpos="user">
        <div id="user">
        </div>
      </section>
      <section class="tab" data-tabpos="faq">
        <div id="faq">
          <div class="intro">
            <h2 class="intro-hed">
              Welcome 
            </h2>
            <p>
              This is a proof-of-concept web app built on top of publicly available webcomic feeds. 
            </p>
            <p>
              It is not under active development, as we have no control over the app's contents. 
            </p>
            <p>
              Still, it works pretty okay, considering these comics were never formatted for phones. (Don't forget, you can turn it sideways…) 
            </p>
            <p>
              Enjoy! 
            </p>
            <small> To get started, click the menu icon in the top left. </small> 
          </div>
        </div>
      </section>
      <section class="tab" data-tabpos="settings">
        <div id="settings">
        </div>
      </section>
    </article>
    <nav id="homenav" class="tabsystem tabselector" data-tabsysid="homenav">
      <menu class="tabselectormenu footernav-btn-group"> 
        <li class="footernav-btn" data-tabpos="comiclist" data-tabhed="Browse All Comics" id="togrid">Comics browser</li>
        <li class="footernav-btn" data-tabpos="subscriptions" data-tabhed="Subscribed Comics" id="tosubscriptions">Subscribed comics</li>
        <li class="footernav-btn" data-tabpos="user" data-tabhed="User Profile" id="touser">User Profile</li>
        <li class="footernav-btn" data-tabpos="faq" data-tabhed="About Comic Viewer" id="tofaq" data-tabactive>FAQ</li>
        <li class="footernav-btn" data-tabpos="settings" data-tabhed="Settings" id="tosettings">Settings</li>
      </menu>
    </nav>
  </aside>
  <div id="storylines">
  </div>
  <section id="comicpages">
  </section>
</div>
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

const storylines = document.createElement('template');
storylines.innerHTML = `
   <div class="storylines-frame">
    <div class="tabsystem tabselector inline mobile-only" data-tabsysid="comicintro">
      <menu class="tabselectormenu"> 
        <li class="intro" data-tabpos="intro" data-tabactive>Intro</li>
        <li class="storylines" data-tabpos="storylines">Chapters</li>
      </menu>
    </div>
    <article class="tabsystem tabgroup" data-tabsysid="comicintro">
      <section class="tab" data-tabpos="intro" data-tabactive>
        <div class="splash-image-frame" data-templater>
        </div>
        <h3 class="storylines-desc" data-templater>
        </h3>
        <div class="nav-btn-box">
          <h4 class="nav-btn-hed">
            Start reading: 
          </h4>
          <menu class="nav-btn-group"> 
            <li class="nav-btn">First page</li>
            <li class="nav-btn tabproxy mobile-only" data-tabsysid="comicintro" data-tabpos="storylines">Chapters</li>
            <li class="nav-btn">Latest page</li>
          </menu>
        </div>
      </section>
      <section class="tab" data-tabpos="storylines">
        <h4 class="storylines-hed">
          Chapters: 
        </h4>
        <div class="storylines-list" data-templater>
        </div>
      </section>
    </article>
  </div>`;

const templates = {
  main,
  header,
  comic,
  thumb,
  loading,
  storylines,
};

const templater = (templatename, content) => {
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
  return tmpl;
};

export { templater };
