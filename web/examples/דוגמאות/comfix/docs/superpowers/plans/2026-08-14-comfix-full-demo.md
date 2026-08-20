# ComFix Full Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn ComFix into a complete portfolio website with working internal navigation, global search, animated route changes, and safe demo-only contact behavior.

**Architecture:** Keep the current vinext route structure and add one client-side experience layer in the root layout. That layer owns the search dialog, navigation curtain, route arrival animation, and demo notifications while all routes remain normal server-rendered pages with real internal links.

**Tech Stack:** vinext, React 19, TypeScript, CSS, Node test runner, Sites hosting.

## Global Constraints

- Preserve Hebrew RTL rendering and the existing ComFix visual identity.
- Keep every internal route as a real URL.
- Do not send or persist form data.
- Do not open WhatsApp, telephone, or email destinations.
- Respect reduced motion preferences.

---

### Task 1: Global navigation experience

**Files:**
- Create: `components/NavigationExperience.tsx`
- Create: `lib/site-search.ts`
- Modify: `app/layout.tsx`
- Modify: `components/SiteHeader.tsx`

**Interfaces:**
- Consumes: normal same-origin anchor navigation and the existing route tree.
- Produces: `NavigationExperience`, `openComfixSearch()`, and `showComfixDemoNotice()`.

- [ ] Add the static page and product search index.
- [ ] Add an accessible search dialog with keyboard closing and live results.
- [ ] Add the animated navigation curtain and route arrival state.
- [ ] Add active menu state, a visible home link, and a search control in the persistent header.
- [ ] Verify every menu route and search result points to an internal URL.

### Task 2: Demo-safe contact behavior

**Files:**
- Create: `components/DemoAction.tsx`
- Modify: `components/SiteFooter.tsx`
- Modify: `app/repairs/page.tsx`
- Modify: `app/contact/page.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `showComfixDemoNotice(message?: string)`.
- Produces: buttons that explain the demo state without external navigation.

- [ ] Replace telephone, email, and WhatsApp anchors with semantic buttons.
- [ ] Keep the floating contact action while turning it into a demo notice.
- [ ] Confirm forms still validate locally and never submit or persist data.

### Task 3: Motion and responsive styling

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: state classes rendered by the navigation experience.
- Produces: search overlay, transition curtain, route arrival, active navigation, and demo toast styling.

- [ ] Add desktop and mobile search dialog layouts.
- [ ] Add paired transition panels and staggered route arrival animation.
- [ ] Isolate the sticky header visually during navigation.
- [ ] Add complete reduced-motion overrides.

### Task 4: Verification and delivery

**Files:**
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: built server bundle and all public routes.
- Produces: automated coverage for internal navigation and the absence of live outbound contact links.

- [ ] Add assertions for home navigation and global search on every route.
- [ ] Add assertions that rendered HTML contains no `wa.me`, `tel:`, or `mailto:` destinations.
- [ ] Run `npm test` and `npm run lint`.
- [ ] Verify desktop and 390 pixel layouts, navigation, search, form behavior, overflow, and console output.
- [ ] Publish the verified commit and copy the project to `examples/דוגמאות/comfix` without build artifacts.
