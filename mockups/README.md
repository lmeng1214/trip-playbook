# Mockups

Static phone screens for Wednesday 25 (11/25) and Thursday 3 (12/3). Each viewport PNG is 1179×2556, which is 393×852 at device pixel ratio 3. The full-page PNGs are the same width. The HTML copies the real rows and has no app logic. `index.html` was not changed from these files.

Round 1 is the only round. The fresh-context critic was not run, so every direction is unscored.

## a. Typeled

Seed-derived idea. The place name is the large type, the time is a small caption, and the page is white with space between rows instead of rules.

Score. Unscored.

- `mockups/r1/a-typeled-1125.png`
- `mockups/r1/a-typeled-1125-full.png`
- `mockups/r1/a-typeled-1203.png`
- `mockups/r1/a-typeled-1203-full.png`
- `mockups/html/a-typeled-1125.html`
- `mockups/html/a-typeled-1203.html`

## b. Plain

Seed-derived idea. A native list on white. The stop name and the time are close in size, and a hairline separates the rows.

Score. Unscored.

- `mockups/r1/b-plain-1125.png`
- `mockups/r1/b-plain-1125-full.png`
- `mockups/r1/b-plain-1203.png`
- `mockups/r1/b-plain-1203-full.png`
- `mockups/html/b-plain-1125.html`
- `mockups/html/b-plain-1203.html`

## c. Grouped

Seed-derived idea. An inset white card on a gray page, with the stops inside the card and a hairline between rows.

Score. Unscored.

- `mockups/r1/c-grouped-1125.png`
- `mockups/r1/c-grouped-1125-full.png`
- `mockups/r1/c-grouped-1203.png`
- `mockups/r1/c-grouped-1203-full.png`
- `mockups/html/c-grouped-1125.html`
- `mockups/html/c-grouped-1203.html`

`mockups/render.mjs` rebuilds the six HTML files from `data.json`. It does not print booking codes.
