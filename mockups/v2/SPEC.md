# Trip Playbook, night board

Build the phone UI from this spec. The screens in this folder are the night board: a warm-black sheet, a city photograph, and an amber time rail. Content, order, and wording come from `data.json`. Do not invent times, rewrite labels, or drop a row.

Viewport is 393×852 CSS pixels. Nothing scrolls sideways. Nothing truncates. Text wraps. Every control is at least 44×44.

## Grid

Page inset is 16px left and 16px right. The schedule uses one grid:

| Column | Width | What sits there |
| --- | --- | --- |
| Rail | 64px | Day numeral, or the time / Flexible label |
| Gap | 8px | Empty |
| Text | remaining | Names, tags, actions |
| Gap | 8px | Empty |
| Trail | 44px | Done toggle, or a trailing arrow / chevron |

From the screen edge:

- Rail starts at x = 16 and ends at x = 80.
- Text starts at x = 88.
- Trail starts at x = 333 and ends at x = 377.

The day head, hotel block, now/next block, and each stop use this grid. A contents row has no trail column, so its text still starts at x = 88 and runs to x = 377. Header chrome (title, day stepper, progress, filters) uses the 16px inset across the full width.

Tag rows and the ideas panel are indented 22px inside the text column, so the words of a tag sit under the title words rather than under the emoji.

## Type

Font stack: Inter, then WenQuanYi Micro Hei, then Noto Color Emoji. The rail and the alarm clock use JetBrains Mono. Default letter-spacing is -0.011em. Set it to 0 on the clock, the rail, badges, and filters.

| Role | Size / line | Weight | Color |
| --- | --- | --- | --- |
| Day numeral | 40 / 1 | 700 | ink, letter-spacing -0.045em, left in the rail |
| App title | 17 / 22 | 600 | ink, letter-spacing -0.02em |
| Stop title, weekday | 16 / 22 | 600 | ink |
| Neighborhoods, hotel, route, pick, idea, running late | 16 / 22 | 500 | ink |
| Contents row title | 16 / 22 | 500 | ink |
| Alarm time | 16 / 22 | 600 | ink, tabular |
| Rail time | 12 / 22 mono | 500 | `#f0b429` |
| Flexible | 12 / 22 mono | 500 | `#9c9388` |
| Clock, progress, alarm words, footer | 13 / 18 | 500 or 400 | muted |
| Category tag | 13 / 18 | 500 | muted |
| Meal tag, Booked | 13 / 18 | 600 | ink |
| Filter | 13 / 18 | 500, selected 600 | muted, selected ink |
| View Confirmation | 13 / 18 | 600 | ink |
| NOW / NEXT | 11 / 16 | 700 | see color, letter-spacing 0.04em, box height 18 |
| Idea area | 12 / 16 | 600 | muted, letter-spacing 0.08em |

## Color

| Token | Value | Use |
| --- | --- | --- |
| page | `#141210` | Canvas and sticky header |
| ink | `#f6f1e7` | Titles, weekday, progress fill, confirmation border |
| muted | `#b3a89a` | Clock, category tags, alarm words, footer |
| quiet | `#9c9388` | Flexible, past times |
| past | `#a89f93` | Past and done titles and tags |
| rule | `#5e564e` | Hairlines |
| amber | `#f0b429` | Clock times, the current time cell, NOW fill, NEXT stroke |
| now-ink | `#1c1406` | Text on amber |

Corners are square. The only fade is the 28px scrim at the bottom of the city photograph, from transparent to `#141210`. No glow, no shadow on controls.

Pressed: background `rgba(255, 255, 255, 0.08)`. Focus-visible: 2px ink outline, 2px offset.

## Spacing

Use 4, 8, and 16. The 11px figure exists so a 22px line plus padding lands on a 44px target.

- Header title block: padding-top 8px, min-height 52px.
- Stepper row: 44px. Previous and next are 44×44.
- Progress row: 8px between the 3px track and the label, padding-bottom 8px.
- Photograph: 88px tall, margin 8px above, full bleed.
- Day head: padding-top 10px. The weekday is centered on the numeral. Neighborhoods 8px below. Alarm 8px below that.
- Hotel block: margin-top 8px.
- Now block: margin-top 8px, padding-top 8px, hairline on top.
- Action rows: min-height 44, padding 8px 0, at least 16px between the label and the trailing glyph.
- Tag row: gap 8px, padding-bottom 8px, padding-left 22px.
- Stop hairline on the bottom edge. No card padding.

## Baseline alignment

The time or the word Flexible is right-aligned in the 64px rail. Its box has padding-top 11px and line-height 22px. The stop title has the same padding-top and the same line-height. Those line boxes start at the same y, so the first baselines match. The time is not vertically centered on the card.

If a time wraps, break after `/`, `–`, or `~`. The first fragment stays on the title's first line. Later fragments stay in the rail.

The done control is a 44×44 button in the trail column, on the title's row only. The 18×18 box is inset 13px from the top and 13px from the left of that button, with a 1.5px ink stroke. Checked: the box fills `#f6f1e7`, and the check is `#141210`, drawn at left 17px, top 18px, 10×6, 2px borders, rotated -45 degrees.

A map arrow on a title is floated to the top-right of the title block, with margin 1px 8px 0 8px, so it stays on the first line and does not sit on the checkbox. Trailing arrows on hotel, route, pick, and idea rows sit on the shared right edge at x = 377.

## Components

### City photograph

Taiwan days use `img/taipei.jpg`. Singapore days use `img/singapore.jpg`. The image is 88px tall, full bleed, `object-fit: cover`. Taipei is positioned at `center 38%`. Singapore is positioned at `center 58%`. A 28px scrim at the bottom fades into the page color. No type sits on the picture.

### Header

Sticky, page color. "Trip Playbook" and "Taiwan/SG now {time}" on the left. "All days" on the right, 44px tall.

The day stepper reads `Day {n} · {Dow} {mo}/{d}` and adds ` · today` when this day is today. Previous and next are `‹` and `›`.

The meter is a 3px track in the rule color, filled with ink to `Math.round(100 * dayNumber / 15)` percent. The label is `Day {n} of 15`.

### Day head

The numeral is the day of the month, left in the rail, centered against `{flag} {Dow} · {Mon}` in the text column. Neighborhoods are the areas joined with ` · `. Alarm is `⏰ Alarm (computed) {time}` when set, otherwise `⏰ No alarm set`. The words are muted. The clock time is ink.

### Hotel and route

`🏨 {name}` is a row. A parenthetical in the hotel name drops to the next line, muted, weight 500. The `↗` is on the right edge. Each confirmation doc is a View Confirmation chip under the name. `🗺️ Day route in Maps` uses the same row, only when the day has a route link.

### Now and next

Shown only when the open day is today. In the summary, the NOW or NEXT badge sits in the rail and the title starts at x = 88. Under them, `🏃 Running late` is a text-column row with a chevron on the right edge.

On the stop itself the badges repeat in the tag row.

- NOW: height 18, padding 0 5px, fill `#f0b429`, text `#1c1406`.
- NEXT: the same box, transparent fill, 1px `#f0b429` inset stroke, amber text.
- The current stop's time cell is filled `#f0b429` with `#1c1406` text. Other clock times stay amber type on the page, with no fill. Flexible stays `#9c9388`.

Which row is current: among stops whose start is at or before now, the latest one that has not ended. A stop with no end is over once now is past its start and a later stop exists. The next row is the following stop that is not past. If the current row has not started, it is NEXT and there is no NOW.

### Filters

All, Food, Coffee, Sights, Photo, Transport. Each is at least 44×44, padding 0 6px. The row has a bottom hairline. Selected (All, in these screens) is ink weight 600 with a 2px ink underline inset 8px from the sides and 8px above the hairline.

### Contents

Summary: `Contents · {count} stops`, weight 600, min-height 44, chevron on the right. Collapsed chevron points right. Open chevron points down. Each row is the time or Flexible, the leading emoji, and the label. The whole row is the button. Past rows use the past color.

### Stop

Order, top to bottom:

1. Time or Flexible, title, done toggle. Same first baseline.
2. Tag row, indented 22px: NOW or NEXT if this is that stop, then the category, then the meal in title case, then Booked if booked, then one View Confirmation chip per doc link.
3. Travel line, if the step has one.
4. Day-of and deadline notes, if any.
5. `🗺️ Pick from saved list` with a trailing `↗`, if the step has a saved-list link. No box around this row.
6. `💡 Ideas · {n}` with a chevron, if the step has ideas.
7. Details with a chevron, only when the step's source text is not already on the card.

The title is the step label. Its leading emoji is the leading pictograph sequence of the step text, 16px, 4px before the words, vertically aligned -0.125em. A maps link adds the floated `↗`.

View Confirmation: min-height 44, min-width 44, padding 0 12px, 1px ink border, transparent fill.

Ideas open under the disclosure, indented another 22px. The area name is the 12px tracked label. Each idea is a 44px row: emoji, text, trailing `↗` when it has a map link.

### Done, past, skipped

- Default checkbox: empty 18px square, ink stroke.
- Done: filled `#f6f1e7` with a `#141210` check. Title and time use the quiet colors above.
- Past: title and tags `#a89f93`. Time `#9c9388`, and the time cell has no amber fill.
- Skipped: the past colors, and the tag row says Skipped instead of NOW or NEXT.

### Chevron

8×8, 2px borders on the top and right. Collapsed, rotated 45 degrees. Open, rotated 135 degrees. 4px from the right edge of its row.

### Footer

`Updated {Mon} {D}, {h:mm AM/PM} Taiwan/SG` in muted 13/18, and `↻ Refresh` at 16px ink, min 44×44.

### Katherine

On days that have her rows, a disclosure under the plan: `💙 Katherine's plan · read-only · {n}`. Rows are muted and pre-wrapped.

## Screens

| File | What it shows |
| --- | --- |
| `day4.png` | Day 4, Wed 11/25, collapsed. Clock 3:18 PM. Taipei photograph. Not today. |
| `day4-full.png` | The same day, full height. |
| `day4-expanded.png` | Scrolled to Spring City Resort Soak, with View Confirmation and its map arrow, and Dinner's ideas open. |
| `contents.png` | Day stepper and Contents open on Day 4. |
| `now.png` | Day 14, Sat 12/5, today, opened on the Singapore photograph. Clock 9:30 AM. Temple is past and done. NOW is Tekka Centre breakfast, with the time cell filled amber. NEXT is Kampong Glam. |

`rejected/` holds the earlier sheets: rail, plate, and the white poster.
