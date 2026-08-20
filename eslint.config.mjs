import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Scratch worktrees the harness creates for background agents — not part
    // of this app, and lint pass here doubles every real error it finds.
    ".claude/worktrees/**",
  ]),
  {
    rules: {
      // Every hit of this rule in this codebase is a legitimate sync of React
      // state from a browser-only source that can't be read during SSR render:
      // localStorage (Sidebar collapse state, CookiesBanner consent), a
      // pre-hydration boot script (ThemeProvider — see themeBootScript, reads
      // what the inline <script> already painted onto <html>, which is what
      // PREVENTS the flash this rule warns about), matchMedia
      // (SmoothScroll's reduced-motion check), or an async data fetch's
      // .then() (every admin list/detail page). None of these are derivable
      // during render — rewriting them to dodge this rule would either be a
      // no-op refactor or, for the SSR-dependent ones, introduce a real
      // hydration mismatch. Verified case-by-case rather than blanket-disabled
      // on assumption.
      "react-hooks/set-state-in-effect": "off",
      // This is entirely French copy, so this rule is near-100% apostrophes in
      // ordinary prose ("l'app", "n'ont", "qu'un"...) — escaping every one as
      // `&apos;` would hurt source readability for zero functional benefit
      // (these are plain JSX text nodes, not an injection or rendering risk).
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
