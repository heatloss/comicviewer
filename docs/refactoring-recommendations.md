# Refactoring Recommendations

Improvements to the existing vanilla JS architecture, without introducing a framework.

---

## 1. Centralized State Store

**Problem**: State is scattered across modules in module-level variables (`readingState`, `zoneConfig`, `comicData`, etc.). Hard to debug, no single source of truth.

**Solution**: A simple pub/sub store that modules can subscribe to.

```javascript
// module.Store.js

const state = {
  // Reading state
  currentComic: null,
  storyIndex: 0,
  pageIndex: 0,

  // UI state
  activeZone: '',
  previousZone: '',
  navBarsVisible: true,

  // Data
  comics: [],
  userData: {
    subscribedComics: [],
    readingPositions: {},
    preferences: {}
  }
};

const listeners = new Map();

const store = {
  get(key) {
    return key ? state[key] : state;
  },

  set(key, value) {
    const oldValue = state[key];
    state[key] = value;
    this._notify(key, value, oldValue);
  },

  update(key, updater) {
    const oldValue = state[key];
    state[key] = updater(oldValue);
    this._notify(key, state[key], oldValue);
  },

  subscribe(key, callback) {
    if (!listeners.has(key)) {
      listeners.set(key, new Set());
    }
    listeners.get(key).add(callback);

    // Return unsubscribe function
    return () => listeners.get(key).delete(callback);
  },

  _notify(key, newValue, oldValue) {
    if (listeners.has(key)) {
      listeners.get(key).forEach(cb => cb(newValue, oldValue));
    }
  }
};

// Persist certain keys to localStorage
const PERSISTED_KEYS = ['comics', 'userData'];

store.subscribe('comics', (value) => {
  localStorage.setItem('comicdata', JSON.stringify(value));
});

store.subscribe('userData', (value) => {
  localStorage.setItem('userdata', JSON.stringify(value));
});

// Initialize from localStorage
const initStore = () => {
  const savedComics = localStorage.getItem('comicdata');
  const savedUserData = localStorage.getItem('userdata');

  if (savedComics) state.comics = JSON.parse(savedComics);
  if (savedUserData) state.userData = JSON.parse(savedUserData);
};

export { store, initStore };
```

**Usage in modules**:

```javascript
// Before (scattered state)
const readingState = { pageIndex: 0 };
readingState.pageIndex = 5;

// After (centralized)
import { store } from './module.Store.js';
store.set('pageIndex', 5);

// React to changes
store.subscribe('pageIndex', (newPage) => {
  updatePageNumber(newPage);
});
```

---

## 2. Named Template Slots

**Problem**: Positional slot filling is fragile.

```javascript
// Current: position-dependent
templater('progressbar', [title, subtitle, progressElement]);
// If you reorder the HTML, this breaks silently
```

**Solution**: Named slots using data attributes.

```javascript
// module.Templater.js (updated)

const templater = (templateName, slots = {}, classNames) => {
  const tmpl = templates[templateName].content.firstElementChild.cloneNode(true);

  // Support both named slots and legacy positional slots
  if (Array.isArray(slots)) {
    // Legacy positional behavior
    tmpl.querySelectorAll('[data-slot]').forEach((node, index) => {
      fillSlot(node, slots[index]);
    });
  } else {
    // Named slots
    Object.entries(slots).forEach(([name, content]) => {
      const node = tmpl.querySelector(`[data-slot="${name}"]`);
      if (node) {
        fillSlot(node, content);
      }
    });
  }

  if (classNames) {
    tmpl.classList.add(...[].concat(classNames));
  }

  return tmpl;
};

const fillSlot = (node, content) => {
  if (content === undefined || content === null) return;

  if (typeof content === 'string') {
    node.textContent = content;
  } else if (content instanceof Node) {
    node.replaceChildren(content);
  } else if (content instanceof Array) {
    node.replaceChildren(...content);
  }
};
```

**Updated template HTML**:

```html
<!-- Before -->
<div class="progressframe">
  <h4 class="progress-hed" data-templater></h4>
  <h5 class="progress-subhed" data-templater></h5>
  <div class="progressbox" data-templater></div>
</div>

<!-- After -->
<div class="progressframe">
  <h4 class="progress-hed" data-slot="title"></h4>
  <h5 class="progress-subhed" data-slot="subtitle"></h5>
  <div class="progressbox" data-slot="progress"></div>
</div>
```

**Usage**:

```javascript
// Before (positional - fragile)
templater('progressbar', [title, subtitle, progressElement]);

// After (named - explicit)
templater('progressbar', {
  title: comic.name,
  subtitle: storyline.name,
  progress: progressElement
});
```

---

## 3. Centralized DOM References

**Problem**: `document.querySelector('#app')` repeated everywhere. Element references scattered.

**Solution**: A DOM registry module.

```javascript
// module.Dom.js

let refs = {};

const dom = {
  init() {
    refs = {
      app: document.querySelector('#app'),
      // These get populated after templates load
      header: null,
      headerTitle: null,
      headerMenu: null,
      zonesFrame: null,
      comicPages: null,
    };
  },

  // Call after main template is mounted
  initDynamic() {
    refs.header = refs.app.querySelector('#headerframe');
    refs.headerTitle = refs.app.querySelector('#headertitle');
    refs.headerMenu = refs.app.querySelector('.header-menu');
    refs.zonesFrame = refs.app.querySelector('#zonesFrame');
    refs.comicPages = refs.app.querySelector('#comicpages');
  },

  get(key) {
    return refs[key];
  },

  // For one-off queries within a known container
  query(key, selector) {
    return refs[key]?.querySelector(selector);
  },

  queryAll(key, selector) {
    return refs[key]?.querySelectorAll(selector);
  }
};

export { dom };
```

**Usage**:

```javascript
// Before
const app = document.querySelector('#app');
app.querySelector('#comicpages').replaceChildren(comicReader);
app.querySelector('#headerframe .header-menu').replaceChildren(gridMenu);

// After
import { dom } from './module.Dom.js';
dom.get('comicPages').replaceChildren(comicReader);
dom.get('headerMenu').replaceChildren(gridMenu);
```

---

## 4. Fix Router Bug + Improve Path Format

**Bug in current code** (module.Router.js:73-76):

```javascript
const pathEncoded = path
  .substring(1)
  .split(':')
  .map((pathcomponent) => {
    encodeURIComponent(pathcomponent);  // Result discarded!
    return path;  // Returns whole path, not the component
  })
  .join(':');
```

**Fixed version**:

```javascript
const history = (path) => {
  const pathEncoded = path
    .substring(1)
    .split(':')
    .map((component) => encodeURIComponent(component))
    .join(':');

  routeConfig.prevpath = path;
  window.history.pushState(null, '', '/' + pathEncoded);
};
```

**Optional: Standard path format**

If you want more conventional URLs:

```javascript
// Current:  /comic:xkcd:3:15
// Standard: /comic/xkcd/3/15

const render = (path, writestate = true) => {
  if (path === routeConfig.prevpath) return false;

  const workpath = decodeURIComponent(path);
  const segments = workpath.split('/').filter(Boolean);
  const route = '/' + segments[0];
  const params = segments.slice(1);

  doRoute[route]?.(params);
  routeConfig.prevpath = path;

  if (writestate) {
    history(workpath);
  }
};

const history = (path) => {
  const encoded = path
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');

  routeConfig.prevpath = path;
  window.history.pushState(null, '', encoded);
};
```

---

## 5. Event Listener Management

**Problem**: Manual `addEventListener`/`removeEventListener` pairing is error-prone.

**Solution**: A lightweight listener tracker.

```javascript
// module.Events.js

const listenerRegistry = new Map();

const events = {
  // Add a tracked listener
  on(element, event, handler, options) {
    element.addEventListener(event, handler, options);

    if (!listenerRegistry.has(element)) {
      listenerRegistry.set(element, []);
    }
    listenerRegistry.get(element).push({ event, handler, options });

    // Return cleanup function
    return () => this.off(element, event, handler, options);
  },

  // Remove a specific listener
  off(element, event, handler, options) {
    element.removeEventListener(event, handler, options);

    const listeners = listenerRegistry.get(element);
    if (listeners) {
      const idx = listeners.findIndex(l =>
        l.event === event && l.handler === handler
      );
      if (idx > -1) listeners.splice(idx, 1);
    }
  },

  // Remove all listeners from an element (useful before removing from DOM)
  cleanup(element) {
    const listeners = listenerRegistry.get(element);
    if (listeners) {
      listeners.forEach(({ event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
      listenerRegistry.delete(element);
    }
  },

  // One-time listener (auto-removes after first trigger)
  once(element, event, handler, options) {
    const wrappedHandler = (e) => {
      this.off(element, event, wrappedHandler, options);
      handler(e);
    };
    return this.on(element, event, wrappedHandler, options);
  }
};

export { events };
```

**Usage**:

```javascript
// Before
menuLi.addEventListener('click', menuToCover);
// ... later, hope you remember to remove it

// After
import { events } from './module.Events.js';

const cleanup = events.on(menuLi, 'click', menuToCover);
// When done:
cleanup();

// Or before removing element from DOM:
events.cleanup(menuLi);
```

---

## 6. API Client Module

Replace `Feedparser` and `Archiveparser` with a clean API client for CMS integration.

```javascript
// module.Api.js

const API_BASE = '/api';  // Or your CMS endpoint

const api = {
  async getComics() {
    const response = await fetch(`${API_BASE}/comics`);
    if (!response.ok) throw new Error('Failed to fetch comics');
    return response.json();
  },

  async getComic(slug) {
    const response = await fetch(`${API_BASE}/comics/${slug}`);
    if (!response.ok) throw new Error(`Failed to fetch comic: ${slug}`);
    return response.json();
  },

  async getChapters(comicSlug) {
    const response = await fetch(`${API_BASE}/comics/${comicSlug}/chapters`);
    if (!response.ok) throw new Error('Failed to fetch chapters');
    return response.json();
  },

  async getPages(comicSlug, chapterIndex) {
    const response = await fetch(
      `${API_BASE}/comics/${comicSlug}/chapters/${chapterIndex}/pages`
    );
    if (!response.ok) throw new Error('Failed to fetch pages');
    return response.json();
  },

  // Returns page image URLs for a chapter
  async getPageImages(comicSlug, chapterIndex) {
    const pages = await this.getPages(comicSlug, chapterIndex);
    return pages.map(p => p.imageUrl);
  }
};

export { api };
```

---

## Implementation Order

Recommended sequence for minimal disruption:

1. **Fix the router bug** — quick win, no dependencies
2. **Add module.Dom.js** — can coexist with existing code, migrate incrementally
3. **Add module.Store.js** — migrate one module at a time
4. **Update Templater for named slots** — keep backward compat, migrate templates gradually
5. **Add module.Events.js** — use for new code, migrate existing listeners as you touch them
6. **Add module.Api.js** — when ready to integrate CMS

Each step is independent and can be done incrementally without breaking existing functionality.
