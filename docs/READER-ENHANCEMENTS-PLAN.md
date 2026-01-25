# Reader Enhancements Plan

This document explores future enhancements to the comic reader page, including author notes, alt text display, comments integration, and content warnings. These features will require evolving the ghostmount system beyond its current simple three-image architecture.

**Prerequisite**: STATE-MANAGEMENT-PLAN.md should be implemented first, as these features depend on proper state separation.

## Current Architecture

### GhostMount Structure

```html
<article class="comicpages-ghostmount swiper">
  <section class="comicpage ghost pos-prev">
    <img src="...">
  </section>
  <section class="comicpage active">
    <img src="...">
  </section>
  <section class="comicpage ghost pos-next">
    <img src="...">
  </section>
</article>
```

### Current Page Rendering

```js
const generateGhostMount = async (pageNum) => {
  const activePage = document.createElement('img');
  activePage.src = getDisplayImage(readingState.stack[pageNum]?.img);
  // ... create prev/next similarly
  return templater('ghostmount', [ghostPagePrev, activePage, ghostPageNext]);
};
```

**Limitations**:
- Each section holds only an `<img>`
- No structure for supplementary content
- `replaceChildren()` templating prevents sibling elements

## Features to Support

### 1. Content Warnings

**Source**: `page.contentWarning` (string or null)

**Behavior**:
- Blocks page view until dismissed
- Scrim overlay with warning text and dismiss button
- Dismissed state tracked per-page in session

**UI**: Full-page overlay, highest z-index

### 2. Author Notes

**Source**: `page.authorNote` (string or null)

**Behavior**:
- Optional commentary from the creator
- Should not obstruct the comic by default
- User can toggle visibility

**UI Options**:
- Expandable panel below image
- Slide-out drawer
- Modal/overlay on demand
- Icon indicator when note exists

### 3. Alt Text

**Source**: `page.altText` (string or null)

**Behavior**:
- Primary purpose: screen reader accessibility (`<img alt="...">`)
- Secondary: visible display for users who want it

**UI Options**:
- Always set on `<img alt>` for accessibility
- Optional visible toggle (for users who want to read descriptions)
- Could share UI with author notes panel

### 4. Comments

**Source**: External CMS (per-comic, per-page)

**Behavior**:
- Loaded asynchronously from separate API
- May have zero to many comments per page
- Users may want to read or add comments

**UI Options**:
- Expandable panel/drawer
- Comment count indicator
- Separate "comments view" mode
- Could overlay or push content

## Architectural Approaches

### Approach A: Rich Page Sections

Expand each `.comicpage` section to include all supplementary content:

```html
<section class="comicpage active">
  <!-- Core content -->
  <div class="page-image-wrapper">
    <img src="..." alt="...">
  </div>

  <!-- Overlays (positioned absolute) -->
  <div class="content-warning-scrim" hidden>
    <p class="warning-text"></p>
    <button class="warning-dismiss">View Page</button>
  </div>

  <!-- Supplementary content (below image or as drawer) -->
  <div class="page-supplementary">
    <div class="author-note" hidden>
      <h4>Author Note</h4>
      <p class="note-text"></p>
    </div>
    <div class="page-comments" hidden>
      <h4>Comments (<span class="comment-count">0</span>)</h4>
      <div class="comments-list"></div>
    </div>
  </div>
</section>
```

**Pros**:
- Self-contained: each page has everything it needs
- Slides with page during transitions
- Clear ownership of content

**Cons**:
- Template becomes complex
- Supplementary content duplicated across three pages
- Comments loaded three times?

### Approach B: Persistent Supplementary Panel

Keep ghostmount simple (just images + warnings), add a separate panel for supplementary content:

```html
<div class="comicpages-content">
  <div id="ghostmount-region">
    <!-- Ghostmount with images + content warnings only -->
  </div>

  <!-- Persistent panel, updates based on active page -->
  <aside id="page-info-panel" hidden>
    <div class="author-note-section">...</div>
    <div class="comments-section">...</div>
    <button class="panel-close">Close</button>
  </aside>
</div>
```

**Pros**:
- GhostMount stays simpler
- Panel content loads once, updates on page change
- No duplication across three pages
- Panel can have richer UI (scrolling, tabs, etc.)

**Cons**:
- Panel doesn't slide with page during transitions
- Need to sync panel state with active page
- Separate visual element to manage

### Approach C: Hybrid (Indicators + Panel)

Ghostmount pages have minimal indicators; detailed content in persistent panel:

```html
<section class="comicpage active">
  <div class="page-image-wrapper">
    <img src="..." alt="...">
  </div>
  <div class="content-warning-scrim" hidden>...</div>

  <!-- Just indicators, not full content -->
  <div class="page-indicators">
    <button class="indicator-notes" hidden title="Author Note">📝</button>
    <button class="indicator-comments" hidden title="3 Comments">💬 3</button>
    <button class="indicator-alt" hidden title="Show Description">👁</button>
  </div>
</section>
```

Clicking an indicator opens the persistent panel with that content.

**Pros**:
- Best of both: indicators travel with page, detail in stable panel
- Non-intrusive by default
- Users explicitly request more info
- Indicators are lightweight (no content duplication)

**Cons**:
- Two systems to coordinate
- Need clear visual language for indicators

### Approach D: Modal/Overlay System

Keep ghostmount simple, use a modal system for all supplementary content:

```html
<div id="reader-modal" class="modal" hidden>
  <div class="modal-content">
    <header class="modal-header">
      <h3 class="modal-title"></h3>
      <button class="modal-close">&times;</button>
    </header>
    <div class="modal-body"></div>
  </div>
</div>
```

Author notes, alt text, and comments all open as modals.

**Pros**:
- Ghostmount completely unchanged
- One UI pattern for all supplementary content
- Familiar modal interaction

**Cons**:
- Interrupts reading flow more than panels
- May feel heavy for quick author notes
- Multiple modals if user wants notes + comments?

## Recommended Approach

**Hybrid (Approach C)** with these specifics:

### In GhostMount (per-page, slides with content)

1. **Content warning scrim** — full overlay, must dismiss to proceed
2. **Indicator bar** — small buttons showing what's available for this page

### Outside GhostMount (persistent, stable)

3. **Info panel/drawer** — slides out from bottom or side
   - Tabs or sections for: Author Note, Alt Text, Comments
   - Only loads content when opened
   - Updates when active page changes (if panel is open)

### UI Flow

```
User on page 15
  ↓
Page has authorNote + 3 comments
  ↓
Indicators visible: [📝 Note] [💬 3]
  ↓
User taps [📝 Note]
  ↓
Panel slides up with Author Note tab active
  ↓
User can switch to Comments tab, or close panel
  ↓
User swipes to page 16
  ↓
Panel updates to show page 16's note/comments (or closes if none)
```

## State Requirements

Building on STATE-MANAGEMENT-PLAN.md, the comic zone state expands:

```js
zones: {
  comic: {
    storyIndex: 2,
    pageIndex: 5,
    dismissedWarnings: new Set([25]),

    // New state for enhancements
    infoPanelOpen: false,
    infoPanelTab: 'notes',  // 'notes' | 'alt' | 'comments'

    // Comments data (fetched async)
    comments: {
      loading: false,
      byPage: {
        25: [{ id: 1, author: '...', text: '...' }, ...],
      },
    },
  },
}
```

### Actions

```js
actions = {
  // Existing
  dismissWarning: (pageId) => ...,

  // New
  openInfoPanel: (tab = 'notes') => ...,
  closeInfoPanel: () => ...,
  setInfoPanelTab: (tab) => ...,
  loadComments: (pageId) => ...,  // async
  addComment: (pageId, text) => ...,  // if authenticated
};
```

## Template Evolution

### New GhostMount Template

```html
<article class="comicpages-ghostmount swiper">
  <section class="comicpage ghost pos-prev">
    <div class="page-image-wrapper" data-slot="image"></div>
    <div class="page-indicators" data-slot="indicators"></div>
  </section>
  <section class="comicpage active">
    <div class="page-image-wrapper" data-slot="image"></div>
    <div class="page-indicators" data-slot="indicators"></div>
  </section>
  <section class="comicpage ghost pos-next">
    <div class="page-image-wrapper" data-slot="image"></div>
    <div class="page-indicators" data-slot="indicators"></div>
  </section>

  <!-- Scrims as siblings, positioned over their respective sections -->
  <div class="content-warning-scrim pos-prev" hidden>
    <p class="warning-text"></p>
    <button class="warning-dismiss">View Page</button>
  </div>
  <div class="content-warning-scrim pos-active" hidden>
    <p class="warning-text"></p>
    <button class="warning-dismiss">View Page</button>
  </div>
  <div class="content-warning-scrim pos-next" hidden>
    <p class="warning-text"></p>
    <button class="warning-dismiss">View Page</button>
  </div>
</article>
```

### New Info Panel Template

```html
<aside id="page-info-panel" class="info-panel" hidden>
  <header class="panel-header">
    <nav class="panel-tabs">
      <button class="panel-tab" data-tab="notes">Author Note</button>
      <button class="panel-tab" data-tab="alt">Description</button>
      <button class="panel-tab" data-tab="comments">Comments</button>
    </nav>
    <button class="panel-close">&times;</button>
  </header>

  <div class="panel-body">
    <section class="panel-content" data-tab="notes">
      <p class="author-note-text"></p>
    </section>
    <section class="panel-content" data-tab="alt">
      <p class="alt-text-content"></p>
    </section>
    <section class="panel-content" data-tab="comments">
      <div class="comments-list"></div>
      <form class="comment-form" hidden>
        <textarea placeholder="Add a comment..."></textarea>
        <button type="submit">Post</button>
      </form>
    </section>
  </div>
</aside>
```

### Indicators Template

```html
<template id="page-indicators-template">
  <div class="page-indicators">
    <button class="indicator" data-indicator="notes" hidden>
      <span class="indicator-icon">📝</span>
      <span class="indicator-label">Note</span>
    </button>
    <button class="indicator" data-indicator="alt" hidden>
      <span class="indicator-icon">👁</span>
      <span class="indicator-label">Description</span>
    </button>
    <button class="indicator" data-indicator="comments" hidden>
      <span class="indicator-icon">💬</span>
      <span class="indicator-count">0</span>
    </button>
  </div>
</template>
```

## generateGhostMount Evolution

```js
const generateGhostMount = async (pageNum) => {
  const state = store.getState();
  const { dismissedWarnings } = state.zones.comic;
  const stack = state.zones.comic.stack;

  // Build each page position
  const positions = [
    { index: pageNum - 1, position: 'prev' },
    { index: pageNum, position: 'active' },
    { index: pageNum + 1, position: 'next' },
  ];

  const ghostMount = templater('ghostmount');

  positions.forEach(({ index, position }) => {
    const page = stack[index];
    if (!page) return;

    const section = ghostMount.querySelector(`.comicpage.${position === 'active' ? 'active' : 'ghost'}.pos-${position}`);

    // Image
    const img = document.createElement('img');
    img.src = getDisplayImage(page.img);
    img.alt = page.altText || '';
    section.querySelector('.page-image-wrapper').appendChild(img);

    // Indicators
    const indicators = buildIndicators(page, position === 'active');
    section.querySelector('.page-indicators').replaceChildren(indicators);

    // Content warning scrim
    if (page.contentWarning && !dismissedWarnings.has(page.id)) {
      const scrim = ghostMount.querySelector(`.content-warning-scrim.pos-${position}`);
      scrim.hidden = false;
      scrim.querySelector('.warning-text').textContent = page.contentWarning;

      if (position === 'active') {
        scrim.querySelector('.warning-dismiss').addEventListener('click', () => {
          actions.dismissWarning(page.id);
          scrim.hidden = true;
        });
      }
    }
  });

  return ghostMount;
};

const buildIndicators = (page, isActive) => {
  const indicators = templater('page-indicators');

  if (page.authorNote) {
    const noteBtn = indicators.querySelector('[data-indicator="notes"]');
    noteBtn.hidden = false;
    if (isActive) {
      noteBtn.addEventListener('click', () => actions.openInfoPanel('notes'));
    }
  }

  if (page.altText) {
    const altBtn = indicators.querySelector('[data-indicator="alt"]');
    altBtn.hidden = false;
    if (isActive) {
      altBtn.addEventListener('click', () => actions.openInfoPanel('alt'));
    }
  }

  // Comments indicator - may need async count
  const commentsBtn = indicators.querySelector('[data-indicator="comments"]');
  commentsBtn.hidden = false;  // Always show, even if 0?
  if (isActive) {
    commentsBtn.addEventListener('click', () => actions.openInfoPanel('comments'));
  }

  return indicators;
};
```

## Comments Integration

### API Client Addition

```js
// module.Comments.js or extend module.Api.js

const commentsConfig = {
  baseUrl: 'https://comments.chimeracomics.org/api',
};

const getPageComments = async (comicSlug, pageNumber) => {
  const response = await fetch(
    `${commentsConfig.baseUrl}/comics/${comicSlug}/pages/${pageNumber}/comments`
  );
  if (!response.ok) return [];
  return response.json();
};

const postComment = async (comicSlug, pageNumber, text, authorToken) => {
  const response = await fetch(
    `${commentsConfig.baseUrl}/comics/${comicSlug}/pages/${pageNumber}/comments`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authorToken}`,
      },
      body: JSON.stringify({ text }),
    }
  );
  if (!response.ok) throw new Error('Failed to post comment');
  return response.json();
};
```

### Loading Strategy

**Option A: Eager (on page load)**
- Fetch comments for current page + adjacent pages
- Pro: Instant display when panel opens
- Con: Many requests, may fetch for pages never viewed

**Option B: Lazy (on panel open)**
- Fetch comments only when user opens comments tab
- Pro: Fewer requests
- Con: Delay when opening panel

**Option C: Hybrid**
- Fetch comment *counts* eagerly (for indicators)
- Fetch full comments lazily (on panel open)
- Pro: Best UX, indicators accurate, detail on demand
- Con: Two API endpoints needed

**Recommendation**: Option C (Hybrid) — show accurate counts in indicators, load full comments on demand.

## Implementation Phases

### Phase 1: Template Restructure (After State Management)

1. Update ghostmount template with page-image-wrapper and indicators container
2. Update generateGhostMount to use new structure
3. Add content warning scrims as siblings
4. No new features yet — just structural preparation

### Phase 2: Content Warnings

1. Wire up scrim show/hide based on state
2. Wire up dismiss button to action
3. Add CSS for scrim styling

### Phase 3: Info Panel Foundation

1. Add info panel template to comicreader.html
2. Add panel state to store (open, tab)
3. Wire up panel open/close
4. Panel shows placeholder content

### Phase 4: Author Notes & Alt Text

1. Populate author note content when panel opens
2. Populate alt text content when panel opens
3. Add indicators to ghostmount pages
4. Wire indicators to open panel with correct tab

### Phase 5: Comments Integration

1. Create comments API client
2. Add comments state to store
3. Implement comment count fetching (for indicators)
4. Implement full comments loading (on tab open)
5. Display comments in panel
6. (Optional) Comment posting if authenticated

## CSS Considerations

### Indicator Positioning

```css
.page-indicators {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  z-index: 1;
}

.indicator {
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;
}
```

### Info Panel

```css
.info-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 50vh;
  background: var(--ux-bg-color);
  border-top: 1px solid var(--ux-border-color);
  transform: translateY(100%);
  transition: transform 0.25s ease-out;
  z-index: 10;
}

.info-panel[data-open] {
  transform: translateY(0);
}
```

## Open Questions

1. **Panel behavior on page turn**: Close automatically? Stay open and update? User preference?

2. **Comments authentication**: How do users log in to comment? OAuth? Guest comments?

3. **Alt text visibility**: Should there be a global "always show alt text" setting for accessibility?

4. **Indicator design**: Icons? Text? Both? Adapt to light/dark mode?

5. **Mobile UX**: Panel takes 50% of screen — too much? Full screen option?

6. **Offline support**: Cache author notes? Comments probably online-only.

## Success Criteria

- [ ] Content warnings block view until dismissed
- [ ] Author notes accessible via indicator → panel
- [ ] Alt text always present on `<img alt>`, optionally viewable
- [ ] Comment counts visible on indicators
- [ ] Comments loadable on demand
- [ ] Panel doesn't interfere with page swiping
- [ ] Ghost pages have correct indicators during transitions
- [ ] All features work with state management system
