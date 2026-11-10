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
