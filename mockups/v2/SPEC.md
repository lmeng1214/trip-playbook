# Trip Playbook, poster day sheet

Build the phone UI from this spec. The winning screens are the white poster sheets in this folder. Content, order, and wording come from `data.json`. Do not invent times, rewrite labels, or drop a row.

Viewport is 393×852 CSS pixels. Nothing scrolls sideways. Nothing truncates. Text wraps.

## Grid

Page inset is 16px on the left and 16px on the right. The schedule uses one grid:

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

The day head, hotel block, now/next block, each stop, and each contents row use this grid. A contents row has no trail column, so its text still starts at x = 88 and runs to x = 377. Header chrome (title, day stepper, progress, filters) uses the 16px inset and the full width between the insets.

## Type

Font stack: Inter, then WenQuanYi Micro Hei, then Noto Color Emoji. Default letter-spacing is -0.011em. Set letter-spacing to 0 on the clock, times, badges, and filters.

| Role | Size / line | Weight | Color |
| --- | --- | --- | --- |
| Day numeral | 48px / 0.85 | 700 | ink, letter-spacing -0.045em |
| App title | 17 / 22 | 600 | ink, letter-spacing -0.02em |
| Stop title, contents row, weekday line | 16 / 22 | 600 | ink, letter-spacing -0.02em on titles and the weekday |
| Neighborhoods, hotel, route, pick, idea, running late | 16 / 22 | 500 | ink |
| Alarm time | 16 / 22 | 600 | ink, tabular figures |
| Time and Flexible | 13 / 22 | 600 | ink, tabular figures |
| Clock, progress label, alarm words, footer | 13 / 18 | 500 for clock and progress, 400 for alarm words and footer | muted |
| Category tag | 13 / 18 | 500 | muted |
| Meal tag, Booked | 13 / 18 | 600 | ink |
| Filter | 13 / 18 | 500, selected 600 | muted, selected ink |
| View Confirmation | 13 / 18 | 600 | ink |
| NOW / NEXT | 11 / 16 | 700 | see color, letter-spacing 0.04em |
| Idea area | 13 / 18 | 600 | muted |

## Color

| Token | Value | Use |
| --- | --- | --- |
| page | `#ffffff` | Canvas and sticky header |
| ink | `#111111` | Text, rules that are marks, checkbox, progress fill |
| muted | `#595959` | Clock, tags, alarm words, footer, past is not this |
| past | `#6e6e6e` | Title, time, and tags of a past stop |
| rule | `#e6e6e6` | Hairlines, progress track |
| now | `#ffe14a` | NOW badge fill and the current-stop bar |
| now-ink | `#111111` | Text on the NOW badge |

Yellow means the current stop only. The done checkbox stays ink. NEXT is an ink outline, not yellow. Corners are square. No shadow, no gradient, no blur.

## Spacing

Use 4, 8, and 16. The 11px figure below exists only so a 22px line plus padding lands on a 44px target.

- Header title block: padding-top 8px, min-height 52px, 8px between the title block and All days.
- Stepper row: 44px tall. Previous and next are 44×44. The day name is centered and flexes.
- Progress row: 8px gap between the 3px track and the label, padding-bottom 8px.
- Day head: padding-top 16px. Neighborhoods 8px below the weekday line. Alarm 8px below the neighborhoods.
- Hotel block: margin-top 8px.
- Now block: margin-top 8px, padding-top 8px, hairline on top.
- Stop meta row: gap 8px, padding-bottom 4px.
- Action rows (hotel, route, pick, ideas, idea links, running late): min-height 44px, padding 8px 0, 16px between the label and the trailing glyph.
- Stop hairline on the bottom edge of the row. No extra card padding.

## Baseline alignment

This is the rule for the time column.

The time or the word Flexible is right-aligned in the 64px rail. Its box has padding-top 11px and line-height 22px. The stop title has the same padding-top 11px and the same line-height 22px. Those two line boxes start at the same y, so the first baselines match. The time is not vertically centered on the card.

If a time wraps, break after `/`, `–`, or `~`. The first fragment stays on the title's first line. Later fragments stay in the rail, right-aligned, and do not cross into the text column.

The done control is a 44×44 button in the trail column, on the title's row only. It does not stretch down the card. The 18×18 box is inset 13px from the top and 13px from the left of that button, with a 1.5px ink stroke. Checked: the box fills ink, and a white check is drawn at left 17px, top 18px, 10×6, with 2px borders, rotated -45 degrees.

The day numeral is left-aligned in the rail, so 5 and 25 share x = 16. It baseline-aligns with the weekday line in the text column. "Wed · Nov" starts at x = 88, the same edge as every stop title.

A map arrow on a title is floated to the top-right of the title block, with margin 1px 0 0 8px. It stays on the first line. It is not glued to the last word, and it does not drop onto its own line. Trailing arrows on hotel, route, pick, and idea rows sit on the shared right edge (x = 377), with at least 16px of space before the glyph.

## Components

### Header

Sticky, page color, solid. "Trip Playbook" and "Taiwan/SG now {time}" on the left. "All days" on the right, 44px tall, weight 600.

The day stepper reads `Day {n} · {Dow} {mo}/{d}` and adds ` · today` when this day is today. Previous and next are `‹` and `›` at 26px. Disabled at the ends of the trip, still 44×44.

The meter is a 3px track in `rule`, filled with ink to `Math.round(100 * dayNumber / 15)` percent. The label is `Day {n} of 15`.

### Day head

Flag emoji, then `{Dow} · {Mon}` where Mon is the short month. Neighborhoods are the day's areas joined with ` · `. Alarm is `⏰ Alarm (computed) {time}` when set, otherwise `⏰ No alarm set`. The words "Alarm (computed)" are muted 13/400. The clock time is ink 16/600.

### Hotel and route

`🏨 {name}` is a row. A parenthetical note in the hotel name drops to the next line, muted, weight 500. The `↗` is in the trail column. Confirmation docs render as View Confirmation chips in the text column, under the name. `🗺️ Day route in Maps` is the same row pattern, only when the day has a route link.

### Now and next

Shown only when the open day is today. The current stop's badge sits in the rail, right-aligned, and the title starts at x = 88. NEXT uses the same placement. Under them, `🏃 Running late` is a full text-column row with a chevron on the right edge.

NOW and NEXT on the stop itself repeat in the tag row. One system:

- NOW: height 18px, padding 0 5px, fill `#ffe14a`, ink text.
- NEXT: the same box, transparent fill, 1px ink inset stroke.
- The current stop also gets a 3px `#ffe14a` bar on the left edge of its time cell, the height of that cell.

Which row is current: among stops whose start is at or before now, the latest one that has not ended. A stop with no end is over once now is past its start and a later stop exists. The next row is the following stop that is not past. If the current row has not started, it is NEXT and there is no NOW.

### Filters

All, Food, Coffee, Sights, Photo, Transport. One wrapping row, each at least 44×44, padding 0 6px. Selected (All, in these screens) is ink weight 600 with a 2px ink underline inset 8px from the chip's sides and sitting 8px above the row's bottom hairline. The hairline is the bottom border of the filter row. Do not add a second rule directly under that underline.

### Contents

Summary: `Contents · {count} stops`, weight 600, min-height 44, chevron on the right. Collapsed chevron points right. Open chevron points down. Rows use the rail grid. Each row is the time or Flexible, the leading emoji, and the label. The whole row is the button, min-height 44. A hairline separates rows. Past rows use the past color.

### Stop

Order inside the row, top to bottom:

1. Time or Flexible, title, done toggle. Same first baseline.
2. Tag row: NOW or NEXT if this is that stop, then the category, then the meal in title case (Breakfast, Lunch, Dinner, Coffee, Snack), then Booked if booked, then one View Confirmation chip per doc link.
3. Travel line, 16/22 muted, if the step has one.
4. Day-of and deadline notes, if any.
5. `🗺️ Pick from saved list` with a trailing `↗`, if the step has a saved-list link. No box around this row.
6. `💡 Ideas · {n}` with a chevron, if the step has ideas.
7. Details with a chevron, only when the step's source text is not already on the card.

The title is the step label. Its leading emoji is the leading pictograph sequence of the step text, drawn at 16px in Noto Color Emoji, 4px before the words, vertically aligned -0.125em. A maps link adds the floated `↗`. A title with no link is the same text without the arrow.

View Confirmation is an inline chip: min-height 44, min-width 44, padding 0 12px, 1px ink border, transparent fill, 13/18 weight 600. It sits in the tag row. It is not a filled black button.

Ideas open under the disclosure. The area name is one 13/18 muted line. Each idea is a 44px row: emoji, text, trailing `↗` when it has a map link. Chinese and English stay one string, as written.

### Done, past, skipped

- Default checkbox: empty 18px square.
- Done: filled ink square and white check. Title and time switch to muted.
- Past: title, time, and tags use `#6e6e6e`.
- Skipped: same past color, and the tag row says Skipped instead of NOW or NEXT.

Pressed: the control's background is `rgba(0, 0, 0, 0.06)`. Focus-visible: 2px ink outline, 2px offset.

### Chevron

8×8, 2px ink borders on the top and right. Collapsed, rotated 45 degrees (points right). Open, rotated 135 degrees (points down). 4px from the right edge of its row.

### Footer

`Updated {Mon} {D}, {h:mm AM/PM} Taiwan/SG` in muted 13/18, and `↻ Refresh` at 16px ink, min 44×44. 12px above the footer.

### Katherine

On days that have her rows, a disclosure under the plan: `💙 Katherine's plan · read-only · {n}`. Rows are muted, pre-wrapped, separated by hairlines. It is not editable.

## Screens in this folder

| File | What it shows |
| --- | --- |
| `day4.png` | Day 4, Wed 11/25, collapsed. Clock 3:18 PM. Not today, so no NOW or NEXT. |
| `day4-full.png` | The same day, full height. |
| `day4-expanded.png` | Scrolled to Spring City Resort Soak, with View Confirmation and its map arrow, and Dinner's ideas open. |
| `contents.png` | Day stepper and Contents open on Day 4. |
| `now.png` | Day 14, Sat 12/5, today, clock 9:30 AM. Temple is past and done. NOW is Tekka Centre breakfast. NEXT is Kampong Glam. |

`rejected/` holds the round-1 sheets that lost: rail (black masthead, mono times) and plate (dark green day band).
