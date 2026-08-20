# ComFix Motion System Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Replace the flickering generic page transition with a seamless destination-specific motion system, then add restrained route-specific atmosphere and image motion across every page.

**Architecture:** Keep the existing reliable hard navigation and persist the destination variant in `sessionStorage`. A tiny pre-paint script marks the incoming document before its first paint, while shared transition markup and CSS provide the outgoing cover and incoming reveal. A route-aware client component renders decorative ambient shapes, and existing image frames receive transform-only motion.

**Tech Stack:** Next.js, React, TypeScript, CSS animations, Node test runner, vinext/Sites build.

---

### Task 1: Lock the motion contract with tests

**Files:**
- Modify: `tests/rendered-html.test.mjs`

1. Add assertions for the pre-paint bridge, all six destination variants, the ambient layer on all routes, and reduced-motion coverage.
2. Run the focused test file and confirm the new assertions fail before implementation.

### Task 2: Build seamless destination-specific navigation

**Files:**
- Modify: `components/NavigationExperience.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

1. Map each destination to its own motion variant.
2. Store the destination transition before navigation and wait only until the outgoing cover is opaque.
3. Add the pre-paint script and persistent transition stage to the root layout.
4. Replace the generic curtain CSS with six subtle outgoing and incoming patterns.
5. Preserve same-page anchors, modified clicks, search behavior, and reduced-motion behavior.

### Task 3: Add route-specific ambient motion

**Files:**
- Create: `components/PageAtmosphere.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

1. Resolve the current route to one of six atmosphere themes.
2. Render decorative, inaccessible CSS elements behind page content.
3. Limit mobile density and keep movement slow, low-opacity, and transform-only.

### Task 4: Add subtle image motion

**Files:**
- Modify: `app/globals.css`

1. Add gentle long-duration motion to editorial image frames.
2. Restrict product image movement to hover-capable pointers.
3. Disable travel under reduced-motion preferences.

### Task 5: Verify, mirror, and prepare publication

**Files:**
- Verify: all application and test files
- Mirror: `/Users/mymac/דפי נחיתה ואתרים/ds-videoart/web/examples/דוגמאות/comfix`

1. Run tests, lint, and production build.
2. Verify all routes, menu transitions, search, console, and 390px overflow in a browser.
3. Commit the implementation and mirror the source while excluding build caches.
4. Save a new Sites version and request publication approval if required.
