# Design source

Backup of the "PS3 Digital Legacy design" canvas (18 artboards: 8 screens in desktop and mobile, style guide, component board).

- Live canvas (private, owner only): https://claude.ai/artifact/RWtzf9QXD25qPcrayE6n4a
- `*.dc.html`: one file per artboard. `styles.css`: shared design tokens and components. `canvas.json`: artboard layout.
- The `.dc.html` files need the canvas runtime (`support.js`) to render, so they are a source backup, not standalone pages. For reference in code, read `styles.css` (tokens at the top) and the HTML markup.
- Keep in sync: if the canvas changes, re-copy these files.

## Changes since the first export

- Desktop content width is capped at 80% (10% gutters on `.top`, `.nav`, `.wrap`, `.foot`); see the end of `styles.css`.
- My list shows two progress bars: digital-only games and DLC (MyList-Desktop and MyList-Mobile).
- Sign-in shows Google only for now (SignIn-* still show the four planned providers).
- Buy me a coffee is a yellow button (#FFDD00, black outline) in the app; the artboards still show the outlined red one.
- Home (desktop and mobile) is built (`/`). "Today's picks" and "Trophy hunters" show random games that change daily; the artboard titles and counts are sample data. Every desktop artboard and the menu drawer now has a Home tab. `.preview/` has standalone HTML copies that open in any browser.

## PS Vita update (catalog covers PS3 and PS Vita)

`data/psvita-digital.json` (894 games, 660 digital only, 8,198 DLC) is added next to the PS3 file. The artboards were updated for two platforms; all numbers are sample data from 2026-11-16.

- **Platform badge:** PS3 stays solid dark; PS VITA is solid blue (`--vita`, `.bd-vita` in `styles.css`). Same shape, label only.
- **Catalog and filters:** a new "Platform" group is the first filter group (checkboxes on desktop, pills in the mobile sheet), plus a "Platform: PS Vita" chip when only one platform is selected (Main, Catalog-Mobile, Filters-Mobile). Default is both platforms.
- **Home:** copy and stats cover both platforms; new "Browse by platform" tiles (`.ptiles`); progress is split per platform (`.pgrid`).
- **My list:** the two progress groups (games, DLC) each show PS3 and PS Vita bars; a platform pill filter (All, PS3, PS Vita) sits above the Want to buy / Bought tabs.
- **Search:** each result shows its platform; the same title can appear twice, once per platform.
- **Game details:** platform badge in the header row, an "Also on" link to the other platform's page (same `igdbId`), a free DLC example ("Free").
- **Wording:** "Disc release" became "Physical release" (a Vita game is on a game card, not a disc).
- **Unchanged on purpose:** the "PS3 Digital Legacy" logo and name (open decision, see CLAUDE.md), the sign-in, menu, settings and popover artboards.

## Total of this list (built)

On My list (MyList-Desktop) a pill badge `.bd-total` sits at the right end of the Want to buy / Bought tab row: "Total of this list **$74.96** + 7.99 EUR", the sum of prices of the games and DLC in the active tab. Want to buy is red-tinted, Bought uses `.bd-total.paid` (green).

- Prices use the selected currency with the existing fallback chain (selected, USD, EUR). Currencies are never converted, so a total can read `$74.96 + 7.99 EUR`.
- Items without any price are not counted; the badge tooltip (and aria text) says how many.
- Bought is the sum of today's store prices, not what the user paid; the tooltip says "Last known store prices".
- Hidden when the active tab is empty (so MyList-Mobile, an empty state, has no badge). On mobile it wraps under the tabs.

## Language picker (built)

`.preview/Language.html` (standalone, open in any browser) shows the new picker. The EN | PL switch is replaced by a searchable list, the same pattern as the currency picker: a popover on desktop, a bottom sheet on mobile (menu drawer, Settings row).

- 28 languages, one or more per currency in the data (all 33 currencies are covered). The map is in the preview and in `src/lib/languages.ts`.
- Order: detected browser language first (badge "Detected from your browser"), then English, then A to Z by English name. Native name is the main label, English name sits under it, the currencies of that language show as small chips. Search matches native name, English name, locale tag and currency code.
- Detection is unchanged: saved choice, then browser language, then English.
- Arabic and Hebrew set `dir="rtl"` on `<html>`; prices and codes stay left-to-right.
- The artboards (`Popovers-Desktop`, `Menu-Mobile`) still show the old two-language list; the preview is the source of truth for this component.
