const header = document.createElement('template');
header.innerHTML = `
  <nav id="headernav">
    <button id="tohome" class="headerbutton" data-tabhed="Browse All Comics"></button> 
    <button id="headertitle"></button>
    <button id="toggleadjustments" class="headerbutton">Show adjustments</button>
  </nav>
`;

const main = document.createElement('template');
main.innerHTML = `
<div class="zonesFrame">
  <header id="headerframe" class="showheader"></header>
  <main id="home" data-zoneid="home">
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
        <h2 class="section-hed">
          Subscriptions 
        </h2>

        </div>
      </section>
      <section class="tab" data-tabpos="user">
        <div id="user">
        <h2 class="section-hed">
          User Profile 
        </h2>
        </div>
      </section>
      <section class="tab" data-tabpos="faq">
        <div id="faq">
        <h2 class="section-hed">
          Frequently Asked Questions 
        </h2>
        </div>
      </section>
      <section class="tab" data-tabpos="settings">
        <div id="settings">
        <h2 class="section-hed">
          Settings 
        </h2>
        </div>
      </section>
    </article>
    <nav id="homenav" class="tabsystem tabselector" data-tabsysid="homenav">
      <menu class="tabselectormenu footernav-btn-group"> 
        <li id="togrid" class="footernav-btn" data-tabpos="comiclist" data-tabhed="Browse All Comics">Comics browser</li>
        <li id="tosubscriptions" class="footernav-btn" data-tabpos="subscriptions" data-tabhed="Subscribed Comics">Subscribed comics</li>
        <li id="touser" class="footernav-btn" data-tabpos="user" data-tabhed="User Profile">User Profile</li>
        <li id="tofaq" class="footernav-btn" data-tabpos="faq" data-tabhed="About Comic Viewer">FAQ</li>
        <li id="tosettings" class="footernav-btn" data-tabpos="settings" data-tabhed="Settings">Settings</li>
      </menu>
    </nav>
  </main>
  <div id="rack" data-zoneid="rack">
    <div class="intro">
      <h2 class="intro-hed">
        Welcome! 
      </h2>
      <p>
        This is a prototype web app built on top of publicly available webcomic feeds. 
      </p>
      <p>
        It is not under active development, as we have no control over the app's contents. 
      </p>
      <p>
        The app's interface references several features that could only exist alongside a comprehensive user-account system, 
        a thing that this prototype does not have the resources to include. But we did our best to fake it, in places.
      </p>
      <p>
        Enjoy! 
      </p>
      <small> To get started, click the home icon in the top left. </small> 
    </div>
  </div>
  <section id="comicpages" data-zoneid="comic">
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
          <li class="covers" data-tabpos="covers">Chapter covers</li>
          <li class="share" data-tabpos="share">About this comic</li>
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
              <li class="nav-btn tabproxy mobile-only" data-tabsysid="comicintro" data-tabpos="covers">Chapters</li>
              <li class="nav-btn">Latest page</li>
            </menu>
          </div>
        </section>
        <section class="tab" data-tabpos="covers">
          <h4 class="storylines-hed">
            Chapters: 
          </h4>
          <div class="storylines-list" data-templater>
          </div>
        </section>
        <section class="tab" data-tabpos="share">
          <h4 class="storylines-hed">
            Links: 
          </h4>
          <div class="link-list" data-templater>
          </div>
        </section>
      </article>
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
