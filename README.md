# Team Time Bros — Sorting Machine Prototypes

Interactive 3D prototype gallery and build journal for **Team Time Bros** (Destination Imagination · 2026–27). Built with React 19, Three.js, React Three Fiber, Drei, Vite, and Tailwind CSS v4.

**Live Site:** [https://malcolmnicholas1.github.io/sorting-machine/](https://malcolmnicholas1.github.io/sorting-machine/)

## Interactive Prototypes

Each 3D scene supports orbit/zoom camera controls (`Drag` to orbit, `Scroll` to zoom), simulation pause/resume (`⏸ PAUSE` / `▶ PLAY`), and a fullscreen modal view (`⛶` / `Esc`):

1. **Design 01A · Mechanical Sorter — Option 1 (Stationary Deck + Sweep Paddles)** — Four stationary platter decks with fixed interior drop-through holes and a rotating 4-blade sweep paddle spider on the central shaft that pushes shapes through passive mechanical gauges:
   - *Station 01 (V-Groove)*: Filters green spheres
   - *Station 02 (Feeler Gate)*: Filters red cubes
   - *Station 03 (Tri-Nest)*: Filters blue pyramids
   - *Station 04 (Unsorted Catch Tray)*: Collects remaining items
2. **Design 01B · Mechanical Sorter — Option 2 (Solid Turntable + External Rim Funnel)** — Four solid rotating turntable discs (no holes) paired with stationary angled wiper plows that sweep rejected shapes off the outer edge into external perimeter drop funnels leading to the next level.
3. **Design 02 · Vision-Guided Pick & Place** — Overhead vision sensor classifying incoming shapes on a conveyor while an articulated robotic arm picks and places each item into its matching bin.
4. **Design 03 · The Unexpected Arrival** — Story-integration concept where a wormhole portal opens, an influential visitor steps through, and the startled carrier spills a box of mixed shapes.

## Tech Stack

- **Framework:** [React 19](https://react.dev/) + [Vite 8](https://vite.dev/)
- **3D Rendering:** [Three.js](https://threejs.org/), [@react-three/fiber](https://r3f.docs.pmnd.rs/), [@react-three/drei](https://drei.docs.pmnd.rs/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`)
- **Linting:** [Oxlint](https://oxc.rs/docs/guide/usage/linter.html)

## Local Development

Requires **Node.js 22+** and `npm`.

```bash
# Install dependencies
npm install

# Start the Vite dev server with HMR
npm run dev
```

### Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start local development server |
| `npm run build` | Build production bundle into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint static analysis |

## Deployment

Pushes to `main` (or manual runs via `workflow_dispatch`) automatically build and deploy `dist/` to GitHub Pages via [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml). Note that [`vite.config.js`](vite.config.js) sets `base: '/sorting-machine/'` to match the GitHub Pages project subpath.
