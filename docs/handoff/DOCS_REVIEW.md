# Stack docs review — 2026-05-04

Versions resolved against the live npm registry on 2026-05-04. Compatibility verified
against current docs (Next.js, Motion, Lenis, shadcn/ui React 19 guide, Recharts releases).

## Next.js

- **Resolved version:** 16.2.4 (prompt assumed 15.x — using current stable instead)
- **React requirement:** ships with React 19 canary baseline; works with React 19 stable
- **App Router:** included; uses React 19 features (server components, async metadata, etc.)
- **TypeScript / Tailwind / src dir / @/* alias:** all officially supported via `create-next-app` flags
- **Notes:** no breaking config flags required for our flag set

## React

- **Resolved version:** 19.2.5
- **react-dom:** 19.2.5
- **Status:** stable; pulled via Next 16.x default install

## Tailwind CSS

- **Target version:** v3.4.x (prompt locks to v3.4)
- **`create-next-app` default in 2026:** ships Tailwind v4 by default
- **Action:** after bootstrap, downgrade to v3.4 + restore `tailwind.config.ts` + classic `@tailwind base/components/utilities` directives. v3.4 is what the brand-token + plugin-order strategy was designed around.
- **Plugins:** `@tailwindcss/typography` (markdown long-form pages)

## Motion (formerly Framer Motion)

- **Package:** `motion` (rebrand from `framer-motion` happened late 2024)
- **Version:** 12.38.0
- **Import path:** `motion/react`
- **React 19:** compatible (Motion v12 was the React 19 release line)
- **Hard rule:** zero `framer-motion` imports anywhere in the repo

## Lenis

- **Package:** `lenis` (replaces deprecated `@studio-freight/lenis` and `@studio-freight/react-lenis`)
- **Version:** 1.3.23
- **Imports:** `import { ReactLenis, useLenis } from 'lenis/react'`
- **CSS:** `import 'lenis/dist/lenis.css'`
- **Motion sync:** documented pattern — disable Lenis auto-RAF (`autoRaf: false`) and drive from Motion's `frame.update()` if `useScroll` desyncs. Will only enable this if a marketing scroll-effect fights Lenis; default install keeps autoRaf on.
- **Scope:** marketing route group only. NOT admin.

## TanStack Table

- **Package:** `@tanstack/react-table`
- **Version:** 8.21.3
- **React 19:** compatible (headless, no React-version-specific code paths)
- **API used:** `createColumnHelper`, `useReactTable`, `getCoreRowModel`, sort/filter/pagination row models

## Recharts

- **Version:** 3.8.1 (Recharts 3.x rewrote the internals; React 19 ships officially supported)
- **`react-is` peer-dep:** v3.x has cleaner peer deps but the override below is still cheap insurance and matches the shadcn React 19 guide
- **Override applied in `package.json`:**
  ```json
  "overrides": {
    "react-is": "$react"
  }
  ```
  (resolves `react-is` to whatever `react` is — i.e. 19)

## shadcn/ui (React 19)

- **Source of truth:** https://ui.shadcn.com/docs/react-19
- **npm note:** install with `--legacy-peer-deps` if there are peer-dep prompts on first add
- We are NOT generating shadcn primitives via the CLI — we hand-write our own primitives in `src/components/ui/` keyed to brand tokens. The shadcn guide is referenced only for the `react-is` override pattern.

## Vaul

- **Version:** 1.1.2
- **React 19:** compatible
- **Use:** admin drawers (right-side detail panes for users/listings/orders)

## react-hook-form + zod

- **Versions:** react-hook-form latest 7.x, zod 3.x, @hookform/resolvers 3.x
- **React 19:** supported

## cmdk

- **Version:** 1.1.1
- **React 19:** the official README cites React 18, but the library uses only stable hooks (`useId`, `useSyncExternalStore`) that are fully present in React 19. Works in practice; shadcn's React 19 guide treats it as compatible.
- **Use:** admin ⌘K palette only

## date-fns

- **Version:** 3.x latest, React-agnostic
- **Locale:** `fr` (French listings + neighborhoods)

## lucide-react

- **React 19:** supported
- **Tree-shakeable; we import individual icons**

## clsx / tailwind-merge

- React-agnostic. Used together via `cn()` helper in `src/lib/utils/cn.ts`.

## Cross-library conflicts

- **Lenis vs Motion `useScroll`:** known. Mitigated by scope (Lenis marketing-only) and the `autoRaf: false` escape hatch documented above. No collisions expected on admin since admin has no Lenis.
- **Lenis vs admin overlays (Vaul drawer, cmdk dialog, native `<select>`):** prevented by not mounting Lenis in the admin layout. If a marketing surface ever opens an overlay, mark its scroll containers with `data-lenis-prevent`.
- **`react-is` peer-dep on React 19:** resolved by `overrides`.
- **Tailwind v4 default:** create-next-app may scaffold Tailwind v4. We pin to v3.4 and restore the v3 config layout immediately after bootstrap. Logged in BUILD_LOG.

## Substitutions vs prompt

| Prompt assumption | Reality 2026-05-04 | Action |
|---|---|---|
| Next.js 15.x | 16.2.4 stable | Use 16.x |
| Recharts may need react-is RC override | Recharts 3.8.1 has cleaner peers | Still apply `react-is: $react` override (cheap insurance, matches shadcn guide) |
| Tailwind v3.4 explicit | create-next-app may default to Tailwind v4 | Pin v3.4 post-bootstrap |
| `magic` MCP for accelerated components | Not currently registered in this session and `claude mcp add` writes user-scoped config | Skip; hand-write primitives. Documented in BUILD_LOG. |
| Skills `frontend-design`, `impeccable`, `taste-skill` | Not installed in this session | Apply their *principles* manually (typography rigor, density discipline, restrained motion); documented in BUILD_LOG. |

## Required config flags / setup

1. After bootstrap, downgrade Tailwind to v3.4.x and restore classic config.
2. Add `overrides.react-is: "$react"` to `package.json` and reinstall.
3. Wrap **only** `(marketing)/layout.tsx` with `<SmoothScroll>`. Admin layout has no Lenis.
4. Use `next/font/google` to self-host **Instrument Sans** (400/500/600) and **Instrument Serif** (regular + italic).
5. All primitives bind to brand tokens — no raw hex outside `tokens.ts` / `tailwind.config.ts`.
