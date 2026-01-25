# State Management Plan

This document outlines the plan to introduce a centralized view model for the Comic Viewer SPA, replacing the current pattern of DOM-as-state.

## Problem Statement

### Current Architecture

The app currently stores state in multiple locations:

| State | Current Location |
|-------|------------------|
| Current route | `window.location.pathname` + `routeConfig.prevpath` |
| Active zone | `[data-zoneactive]` DOM attribute |
| Previous zone | `zoneConfig.prevzone` (JS variable) |
| Active tab | `[data-tabactive]` DOM attribute |
| Tab metadata | `data-tabhed`, `data-tabheadermenu` attributes |
| Reading position | `readingState` object in Comicreader.js |
| User preferences | `userData` object / localStorage |

### Issues

1. **No single source of truth** — to know app state, you must query URL + DOM attributes + JS variables
2. **DOM as database** — active zone/tab determined by querying `[data-zoneactive]` and `[data-tabactive]`
3. **Tight coupling** — template changes break state access since code queries specific selectors
4. **Hard to extend** — adding new state (e.g., content warnings) requires deciding where it lives and how to sync
5. **Debugging difficulty** — state is scattered, can't easily snapshot or inspect

### Example: Current Tab State

```js
// To know active tab, must query DOM:
app.querySelector('[data-tabactive]')

// Tab system reads URL to figure out context:
const currentPath = decodeURIComponent(window.location.pathname).split(':');
```

## Proposed Architecture

### Principle: Unidirectional Data Flow

```
URL (serialization)       View Model (source of truth)      DOM (presentation)
───────────────────────────────────────────────────────────────────────────────
/comic:slug:2:5    →      { zone, slug, story, page }   →   [data-*] attributes
                           ↑                                 (write-only)
                   app reads/writes this
```

- **URL**: Serialization format for bookmarking/sharing — read on navigation, written after state changes
- **View Model**: JavaScript object that is the source of truth for all UI state
- **DOM attributes**: Written by the app to drive CSS, never read to determine state

### Hybrid State Model

Given the four-zone architecture (home, rack, comic, interstitial), use a hybrid model with global context plus zone-specific state:

```js
const viewModel = {
  // ─── Global Context ───
  activeZone: 'comic',        // 'home' | 'rack' | 'comic' | 'interstitial'
  currentSlug: 'automans-daughter',

  // ─── Zone-Specific View State ───
  zones: {
    home: {
      tab: 'comiclist',       // 'comiclist' | 'subscriptions' | 'settings'
    },
    rack: {
      tab: 'intro',           // 'intro' | 'covers'
    },
    comic: {
      storyIndex: 2,
      pageIndex: 5,
      dismissedWarnings: new Set([25]),  // page IDs with dismissed content warnings
      navBarsVisible: true,
    },
    interstitial: {
      // minimal state, mostly derived from global context
    },
  },
};
```

### Why Hybrid?

| Approach | Pros | Cons |
|----------|------|------|
| Single flat model | Simple, shared state natural | Naming collisions, unclear ownership |
| Fully namespaced | Clean isolation, matches DOM | Duplication (slug in multiple zones) |
| **Hybrid** | Shared context global, view state isolated | Need to decide what's global vs zone-specific |

The hybrid approach reflects reality:
- "What comic are we viewing" is global (user is in one comic at a time)
- "What page/tab/UI state" is zone-specific (each zone has its own view configuration)

## Implementation

### New Module: `module.State.js`

```js
// module.State.js

const createStore = (initialState) => {
  let state = structuredClone(initialState);
  const listeners = new Set();

  return {
    getState: () => state,

    get: (path) => {
      // Support dot notation: get('zones.comic.pageIndex')
      return path.split('.').reduce((obj, key) => obj?.[key], state);
    },

    setState: (updater) => {
      const prevState = state;
      state = typeof updater === 'function'
        ? updater(structuredClone(state))
        : { ...state, ...updater };
      listeners.forEach(fn => fn(state, prevState));
    },

    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
};

// Initial state
const initialState = {
  activeZone: 'home',
  currentSlug: null,
  zones: {
    home: { tab: 'comiclist' },
    rack: { tab: 'intro' },
    comic: {
      storyIndex: 0,
      pageIndex: 0,
      dismissedWarnings: new Set(),
      navBarsVisible: true,
    },
    interstitial: {},
  },
};

export const store = createStore(initialState);

// ─── Actions ───
// Named functions that encapsulate state changes

export const actions = {
  navigateToZone: (zone) => {
    store.setState(state => ({ ...state, activeZone: zone }));
  },

  setCurrentComic: (slug) => {
    store.setState(state => ({ ...state, currentSlug: slug }));
  },

  setTab: (zone, tab) => {
    store.setState(state => ({
      ...state,
      zones: {
        ...state.zones,
        [zone]: { ...state.zones[zone], tab },
      },
    }));
  },

  setComicPosition: (storyIndex, pageIndex) => {
    store.setState(state => ({
      ...state,
      zones: {
        ...state.zones,
        comic: { ...state.zones.comic, storyIndex, pageIndex },
      },
    }));
  },

  dismissWarning: (pageId) => {
    store.setState(state => {
      const dismissed = new Set(state.zones.comic.dismissedWarnings);
      dismissed.add(pageId);
      return {
        ...state,
        zones: {
          ...state.zones,
          comic: { ...state.zones.comic, dismissedWarnings: dismissed },
        },
      };
    });
  },

  setNavBarsVisible: (visible) => {
    store.setState(state => ({
      ...state,
      zones: {
        ...state.zones,
        comic: { ...state.zones.comic, navBarsVisible: visible },
      },
    }));
  },
};

// ─── Selectors ───
// Derived state, computed from current state

export const selectors = {
  isAtChapterStart: (state, stack) => state.zones.comic.pageIndex === 0,

  isAtChapterEnd: (state, stack) =>
    state.zones.comic.pageIndex === stack.length - 1,

  isWarningDismissed: (state, pageId) =>
    state.zones.comic.dismissedWarnings.has(pageId),

  currentZoneState: (state) => state.zones[state.activeZone],
};
```

### Module Impact Assessment

| Module | Current Role | Migration Change |
|--------|--------------|------------------|
| `Router.js` | Parses URL, calls zone/tab functions | Parse URL → call actions → state triggers renders |
| `Zonesystem.js` | Queries/mutates DOM for zone state | Subscribe to `activeZone`, update DOM when it changes |
| `Tabsystem.js` | Queries/mutates DOM for tab state | Subscribe to zone tabs, update DOM when they change |
| `Comicreader.js` | Owns `readingState`, builds DOM | Read from `store.zones.comic`, subscribe and re-render |
| `Touch.js` | Dispatches `advance` events | Call `actions.setComicPosition()` directly |
| `Header.js` | Updates header based on zone/context | Subscribe to relevant state, update header |
| `Userdata.js` | localStorage persistence | Remains separate — persistence layer, not view state |

### Migration Phases

#### Phase 1: Foundation (Non-Breaking)

1. Create `module.State.js` with store, actions, selectors
2. Have Router write to state *in addition to* current behavior
3. Nothing reads from state yet — parallel tracking for validation

**Validation**: Console log state changes, verify they match DOM state

#### Phase 2: Comic Reader Migration

1. Replace `readingState` in Comicreader.js with `store.zones.comic`
2. Have `generateGhostMount()` read from state
3. Implement content warning feature using `dismissedWarnings` state
4. `Touch.js` calls actions instead of dispatching events

**Why start here**: This is where the content warning feature is needed, provides immediate value.

#### Phase 3: Zone System Migration

1. `Zonesystem.js` subscribes to `store.activeZone`
2. Remove DOM queries for `[data-zoneactive]`
3. DOM attributes become write-only (set by subscription callbacks)

#### Phase 4: Tab System Migration

1. `Tabsystem.js` subscribes to zone tab state
2. Remove DOM queries for `[data-tabactive]`
3. `selectTab()` calls `actions.setTab()` instead of manipulating DOM

#### Phase 5: Cleanup

1. Remove parallel DOM-state tracking
2. Remove `zoneConfig.prevzone` (now in store)
3. Remove scattered state variables from modules
4. Update any remaining DOM queries to read from state

## Content Warning Feature

This feature motivated the state management discussion. With the new architecture:

### State

```js
zones: {
  comic: {
    dismissedWarnings: new Set([25, 47]),  // dismissed page IDs
  }
}
```

### In `generateGhostMount()`

```js
const generateGhostMount = (pageNum) => {
  const state = store.getState();
  const { dismissedWarnings } = state.zones.comic;

  // For each of the three pages (prev, current, next):
  [pageNum - 1, pageNum, pageNum + 1].forEach((idx, position) => {
    const page = readingState.stack[idx];
    if (!page) return;

    const hasWarning = page.contentWarning && !dismissedWarnings.has(page.id);

    // Build page element with or without scrim based on hasWarning
  });
};
```

### Dismiss Action

```js
// In dismiss button handler (active page only):
actions.dismissWarning(page.id);

// This triggers re-render via subscription, but since we're on
// the active page, we can also directly update the DOM for immediate feedback
```

## Relationship to Other Documentation

- **docs/refactoring-recommendations.md**: Section 1 outlines a simpler store; this plan supersedes it with the hybrid model
- **MIGRATION-TO-CMS-MANIFESTS.md**: Concerns data fetching, orthogonal to this plan
- **module.Userdata.js**: Handles persistence (localStorage), remains separate from view state

## Open Questions

1. **State persistence**: Should any view state persist across sessions? (e.g., dismissed warnings)
2. **Deep linking**: How to hydrate zone-specific state from URL params?
3. **Preloading**: When navigating to a zone, should we pre-populate its state?

## Success Criteria

- [ ] Single source of truth for all UI state
- [ ] DOM attributes are write-only (never queried for state)
- [ ] Adding new state (like content warnings) is straightforward
- [ ] State can be logged/inspected for debugging
- [ ] Existing functionality preserved throughout migration
