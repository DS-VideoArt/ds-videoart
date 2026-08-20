# ComFix Motion System Design

## Goal

Replace the generic page curtain with a calm, destination-specific motion system that removes the visible flash between hard navigations. Add subtle image movement and low-contrast ambient background objects across every route without making the site feel busy.

## Experience principles

- Motion stays quiet, quick, and purposeful.
- Every destination has a recognizable transition motif.
- The outgoing cover remains fully opaque until the next document is ready to reveal, preventing any white or unstyled frame.
- Route transitions finish quickly. Ambient motion can be slow because it never blocks interaction.
- Animations use transform and opacity only.
- Mobile shows fewer decorative objects.
- Reduced-motion mode removes travel and keeps only a short opacity change where feedback is still useful.
- Search opening, same-page anchors, modified clicks, and external destinations do not trigger a page transition.

## Flicker-free navigation bridge

The navigation layer stores the destination variant in `sessionStorage` before leaving the current document. A small pre-paint script in the root layout reads that value before the next page is painted and marks the document with the matching arrival variant.

The outgoing overlay reaches a fully opaque hold state before `window.location.assign` runs. The next document starts covered, hydration removes the stored state, and the matching arrival animation reveals the prepared page. This keeps the browser background hidden across the document boundary.

The transition budget is approximately 220 to 280 milliseconds before navigation and 240 to 300 milliseconds for the reveal. The visible label is brief and secondary to the motion.

## Destination transition map

### Home

A horizontal ComFix brand line crosses the screen and opens from the center. The arrival retracts toward both sides.

### Repairs

A narrow diagnostic scan band sweeps across the screen. A faint grid appears only while the screen is covered, then the reveal continues in the same direction.

### New computers

A clean blue panel rises from the lower edge with a small light streak. The arrival panel continues upward instead of reversing direction.

### Refurbished computers

Two dark translucent shutters meet at the center, representing inspection and renewal. They open away from each other on arrival.

### Accessories

Three short diagonal circuit-like bars travel across the cover at slightly staggered timings. The base layer reveals diagonally in the same visual direction.

### About and contact

A soft navy card-like layer rises a short distance and settles into full coverage. The reveal moves upward gently with a small opacity change.

## Ambient page motion

A reusable `PageAtmosphere` component renders decorative objects for each route. Objects are CSS shapes or lightweight SVG icons with `aria-hidden`, `pointer-events: none`, and low opacity. They stay behind content and never reduce text contrast.

- Home: thin orbit rings, small status dots, and a restrained brand line.
- Repairs: scan ticks, tool-outline shapes, and a faint diagnostic grid.
- New computers: soft blue orbs, small screen rectangles, and a slow vertical light line.
- Refurbished computers: quality-check rings, paired panels, and subtle inspection markers.
- Accessories: circuit traces, connection dots, and small cable curves.
- Contact: message bubbles, rounded cards, and soft mint circles.

Desktop uses three to five visible objects per route. Mobile uses one to three and removes the largest shapes.

Ambient cycles run for roughly 9 to 18 seconds with small translate and rotate values. Durations are deliberately different so objects do not move in lockstep.

## Image motion

Existing hero and editorial images receive a reusable motion class. The default loop uses a very small scale range and a few pixels of translation over 10 to 16 seconds. Product images move only on intentional pointer hover and remain still on touch devices.

Image movement never changes layout size and does not affect loading behavior. The frame keeps `overflow: hidden` so no edges appear during movement.

## Components and responsibilities

### `components/NavigationExperience.tsx`

- Maps routes to motion variants and labels.
- Starts the outgoing animation.
- Persists the arrival variant.
- Navigates only after the opaque hold state is reached.
- Clears arrival state after the reveal.

### `components/PageAtmosphere.tsx`

- Accepts a route variant.
- Renders route-specific decorative shapes.
- Contains no navigation or business logic.

### `app/layout.tsx`

- Adds the pre-paint bridge script.
- Mounts the page atmosphere based on the current route through a small client wrapper.

### `app/globals.css`

- Defines the transition variants, shared timing variables, ambient object motion, image motion, responsive reductions, and reduced-motion rules.

## Verification

- Automated tests confirm every business route has a unique transition variant and that the pre-paint bridge is present.
- Build and lint must complete without errors.
- Public desktop verification repeats navigation through all menu destinations and checks the expected transition class.
- Public 390 pixel verification checks the mobile menu, ambient element count, and horizontal overflow.
- Rapid clicks must not start overlapping navigations.
- Search results must retain working navigation.
- Reduced-motion emulation must remove travel animations.
- The public console must remain free of errors.

## Scope boundaries

- No animation library is added.
- No 3D canvas, video background, or continuous parallax tied to scroll is introduced.
- Product catalog filtering and form behavior remain unchanged.
- External contact actions remain demo-only.
