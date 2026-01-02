# Reader Accounts Specification

Design options for managing comic reader accounts, separate from CMS creator accounts.

---

## The Problem

The CMS has a `users` collection with roles: `reader`, `creator`, `editor`, `admin`. However:

1. **Scale mismatch**: A few dozen creators vs. potentially thousands of readers
2. **Access mismatch**: Readers don't need CMS admin panel access
3. **Data mismatch**: Reader profiles need different fields (reading progress, subscriptions) than creator profiles

Mixing them in one collection creates unnecessary coupling.

---

## What Reader Accounts Need

### Core Features
- **Authentication**: Email/password or social login (Google, etc.)
- **Reading progress**: Sync last-read position per comic across devices
- **Subscriptions**: "Follow" comics to see updates
- **Preferences**: Dark mode, tap behavior, reading direction

### Nice-to-Have (Future)
- Comments on pages
- Ratings/reviews
- Reading lists/collections
- Notification preferences

---

## Option 1: Extend the CMS

Use Payload's existing `users` collection with the `reader` role.

### Implementation

```javascript
// Add reader-specific fields to users collection
{
  name: 'readerProfile',
  type: 'group',
  admin: {
    condition: (data) => data.role === 'reader'
  },
  fields: [
    {
      name: 'readingProgress',
      type: 'json',
      // { "comic-slug": { chapterId: 2, pageId: 15, updatedAt: "..." } }
    },
    {
      name: 'subscriptions',
      type: 'relationship',
      relationTo: 'comics',
      hasMany: true
    },
    {
      name: 'preferences',
      type: 'group',
      fields: [
        { name: 'darkMode', type: 'checkbox' },
        { name: 'tapBehavior', type: 'select', options: ['advance', 'hidesBars', 'unset'] }
      ]
    }
  ]
}
```

### New Endpoints

```
POST /api/register          — Already exists, creates reader role
POST /api/users/login       — Already exists
GET  /api/me/progress       — Get reading progress
POST /api/me/progress       — Update reading progress
GET  /api/me/subscriptions  — Get subscribed comics
POST /api/me/subscriptions  — Add subscription
DELETE /api/me/subscriptions/:slug — Remove subscription
PATCH /api/me/preferences   — Update preferences
```

### Pros
- No new auth system to build
- Payload handles sessions, password reset, etc.
- Single source of truth for all users

### Cons
- Readers appear in CMS admin alongside creators (cluttered)
- D1 database shared between CMS operations and reader traffic
- Payload's auth overhead for simple read operations
- Harder to scale reader traffic independently

### Verdict
**Workable for small scale** (hundreds of readers). Gets awkward at thousands.

---

## Option 2: Separate Auth Service

Build a dedicated reader authentication system outside the CMS.

### Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Comic Reader  │     │   CMS Admin     │
│      SPA        │     │    Panel        │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  Reader Auth    │     │   Payload CMS   │
│    Service      │     │  (Creators)     │
│  (Cloudflare    │     │                 │
│   Workers + D1) │     │                 │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   Reader D1     │     │    CMS D1       │
│   Database      │     │   Database      │
└─────────────────┘     └─────────────────┘
```

### Database Schema (Reader D1)

```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Reading progress
CREATE TABLE reading_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  comic_slug TEXT NOT NULL,
  chapter_id INTEGER,
  page_id INTEGER,
  global_page_number INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, comic_slug)
);

-- Subscriptions
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  comic_slug TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, comic_slug)
);

-- Preferences
CREATE TABLE preferences (
  user_id INTEGER PRIMARY KEY,
  dark_mode BOOLEAN DEFAULT FALSE,
  tap_behavior TEXT DEFAULT 'advance',
  reading_direction TEXT DEFAULT 'ltr',
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Endpoints

```
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password
GET  /auth/me

GET    /api/reader/progress
POST   /api/reader/progress
GET    /api/reader/subscriptions
POST   /api/reader/subscriptions
DELETE /api/reader/subscriptions/:slug
GET    /api/reader/preferences
PATCH  /api/reader/preferences
```

### Implementation (Cloudflare Workers)

```javascript
// Simple JWT-based auth
import { SignJWT, jwtVerify } from 'jose';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Public routes
    if (url.pathname === '/auth/register') {
      return handleRegister(request, env);
    }
    if (url.pathname === '/auth/login') {
      return handleLogin(request, env);
    }

    // Protected routes - verify JWT
    const user = await verifyAuth(request, env);
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Route to handlers...
  }
};

async function handleRegister(request, env) {
  const { email, password } = await request.json();

  // Hash password (use bcrypt or argon2 via WASM)
  const passwordHash = await hashPassword(password);

  // Insert user
  const result = await env.DB.prepare(
    'INSERT INTO users (email, password_hash) VALUES (?, ?)'
  ).bind(email, passwordHash).run();

  // Generate JWT
  const token = await generateToken({ userId: result.lastRowId }, env);

  return Response.json({ token, user: { id: result.lastRowId, email } });
}

async function handleLogin(request, env) {
  const { email, password } = await request.json();

  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(email).first();

  if (!user || !await verifyPassword(password, user.password_hash)) {
    return new Response('Invalid credentials', { status: 401 });
  }

  const token = await generateToken({ userId: user.id }, env);

  return Response.json({ token, user: { id: user.id, email: user.email } });
}
```

### Pros
- Clean separation of concerns
- Scales independently from CMS
- Optimized for reader workload (mostly reads)
- No Payload overhead for reader requests

### Cons
- Another system to build and maintain
- Duplicate auth logic (password hashing, JWT, etc.)
- Need to handle password reset emails separately

### Verdict
**Best for scale and separation**, but more upfront work.

---

## Option 3: Third-Party Auth Provider

Use a managed auth service: **Clerk**, **Auth0**, **Supabase Auth**, **Firebase Auth**, etc.

### Architecture with Clerk (example)

```
┌─────────────────┐
│   Comic Reader  │
│      SPA        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│     Clerk       │────▶│  Reader Data    │
│  (Auth + Users) │     │  Worker (D1)    │
└─────────────────┘     └─────────────────┘
```

Clerk handles:
- User registration/login
- Password reset
- Social login (Google, GitHub, etc.)
- Session management
- User metadata storage (preferences)

Your Worker handles:
- Reading progress (linked by Clerk user ID)
- Subscriptions
- Any app-specific data

### Implementation

```javascript
// Frontend (SPA)
import { ClerkProvider, SignIn, useUser } from '@clerk/clerk-react';

function App() {
  return (
    <ClerkProvider publishableKey="pk_...">
      <ComicReader />
    </ClerkProvider>
  );
}

function ComicReader() {
  const { isSignedIn, user } = useUser();

  if (!isSignedIn) {
    return <SignIn />;
  }

  // User is authenticated, fetch their progress
  // ...
}
```

```javascript
// Backend Worker - verify Clerk JWT
import { verifyToken } from '@clerk/backend';

export default {
  async fetch(request, env) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    try {
      const payload = await verifyToken(token, {
        secretKey: env.CLERK_SECRET_KEY
      });

      const userId = payload.sub; // Clerk user ID

      // Now fetch/update reader data using userId
      // ...
    } catch {
      return new Response('Unauthorized', { status: 401 });
    }
  }
};
```

### Database (Reader Data Only)

```sql
-- Clerk handles users, we just store app data
CREATE TABLE reading_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clerk_user_id TEXT NOT NULL,  -- Clerk's user ID (string)
  comic_slug TEXT NOT NULL,
  chapter_id INTEGER,
  page_id INTEGER,
  global_page_number INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(clerk_user_id, comic_slug)
);

CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clerk_user_id TEXT NOT NULL,
  comic_slug TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(clerk_user_id, comic_slug)
);
```

### Cost Comparison

| Provider | Free Tier | Paid |
|----------|-----------|------|
| Clerk | 10,000 MAU | $0.02/MAU after |
| Auth0 | 7,500 MAU | $23/mo for 1000 MAU |
| Supabase | 50,000 MAU | $25/mo base |
| Firebase | 50,000 MAU | Pay as you go |

### Pros
- No auth code to write or maintain
- Battle-tested security
- Social login, MFA, etc. built-in
- Scales automatically
- Good DX with SDKs

### Cons
- External dependency
- Cost at scale
- Less control over UX (though Clerk is customizable)
- User data split between provider and your DB

### Verdict
**Best balance of effort vs. features**. Recommended unless you have specific requirements that conflict.

---

## Recommendation

**For this project, I recommend Option 3 (Clerk or Supabase Auth)** because:

1. **You're already on Cloudflare** — Clerk and Supabase both work well with Workers
2. **Reader features are simple** — just progress, subscriptions, preferences
3. **Auth is hard to get right** — password hashing, timing attacks, session management, password reset flows
4. **10K MAU free tier** is plenty for launch

### Suggested Architecture

```
┌────────────────────────────────────────────────────┐
│                  Comic Reader SPA                   │
└──────────────┬─────────────────────┬───────────────┘
               │                     │
               ▼                     ▼
┌──────────────────────┐  ┌─────────────────────────┐
│        Clerk         │  │    Public Content API   │
│   (Authentication)   │  │   (Cloudflare Worker)   │
│                      │  │                         │
│  - Login/Register    │  │  - GET /api/public/*    │
│  - Social auth       │  │  - Comic data           │
│  - User profiles     │  │  - No auth required     │
└──────────────────────┘  └─────────────────────────┘
               │
               ▼
┌──────────────────────┐
│   Reader Data API    │
│  (Cloudflare Worker) │
│                      │
│  - Reading progress  │
│  - Subscriptions     │
│  - Clerk JWT verify  │
│  - D1 database       │
└──────────────────────┘
```

### Reader Data Endpoints (Your Worker)

```
# All require Clerk JWT

GET  /api/reader/progress              — All progress for user
GET  /api/reader/progress/:comicSlug   — Progress for specific comic
POST /api/reader/progress/:comicSlug   — Update progress
      { chapterId, pageId, globalPageNumber }

GET    /api/reader/subscriptions       — List subscribed comics
POST   /api/reader/subscriptions       — Add subscription
        { comicSlug }
DELETE /api/reader/subscriptions/:comicSlug — Remove subscription

GET  /api/reader/preferences           — Get preferences
PATCH /api/reader/preferences          — Update preferences
       { darkMode, tapBehavior, readingDirection }
```

---

## Migration Path

1. **Phase 1**: Launch without accounts (localStorage only, like current app)
2. **Phase 2**: Add Clerk, sync localStorage to server on login
3. **Phase 3**: Add subscriptions, preferences
4. **Phase 4**: Add social features if needed (comments, etc.)

This lets you validate the reader experience before investing in account infrastructure.
