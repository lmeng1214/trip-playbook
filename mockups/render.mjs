import { readFileSync, mkdirSync, writeFileSync } from "node:fs";

const data = JSON.parse(readFileSync(new URL("../data.json", import.meta.url), "utf8"));

const days = {
  1125: {
    key: 1125,
    title: "Wednesday 25",
    sub: "🇹🇼 November · Beitou, Tamsui, Ximending",
    alarm: "Alarm (computed) 9:00 AM",
    stops: 10,
    now: 0,
    next: 1,
    past: [],
  },
  1203: {
    key: 1203,
    title: "Thursday 3",
    sub: "🇸🇬 December · Singapore",
    alarm: "Alarm (computed) 6:50 AM",
    stops: 11,
    now: 5,
    next: 6,
    past: [0, 1, 2, 3, 4],
  },
};

const dirs = {
  typeled: {
    id: "a",
    name: "typeled",
    title: 22,
    titleLh: 28,
    time: 13,
    tpad: 0,
    large: 34,
    largeLh: 41,
    gap: 8,
    rpad: 11,
    link: "#0040dd",
    page: "#ffffff",
    card: "transparent",
    inset: 0,
    padY: 0,
    padX: 0,
    margin: 16,
  },
  plain: {
    id: "b",
    name: "plain",
    title: 17,
    titleLh: 22,
    time: 15,
    tpad: 0,
    large: 34,
    largeLh: 41,
    gap: 8,
    rpad: 7,
    link: "#0040dd",
    page: "#ffffff",
    card: "transparent",
    inset: 0,
    padY: 0,
    padX: 0,
    margin: 16,
  },
  grouped: {
    id: "c",
    name: "grouped",
    title: 17,
    titleLh: 22,
    time: 13,
    tpad: 0,
    large: 34,
    largeLh: 41,
    gap: 8,
    rpad: 8,
    link: "#0a4fbf",
    page: "#f2f2f7",
    card: "#ffffff",
    inset: 12,
    padY: 4,
    padX: 12,
    margin: 16,
  },
};

function ee(step) {
  let rest = String(step.text || "");
  let out = "";
  for (;;) {
    const m = /^\p{Extended_Pictographic}\uFE0F?(?:\u200D\p{Extended_Pictographic}\uFE0F?)*/u.exec(rest);
    if (!m) break;
    out += (out ? " " : "") + m[0];
    rest = rest.slice(m[0].length).replace(/^\s+/, "");
    if (!/^\p{Extended_Pictographic}/u.test(rest)) break;
  }
  return out || step.ic || "";
}

function mealCase(meal) {
  return meal.charAt(0) + meal.slice(1).toLowerCase();
}

function hasLink(step) {
  if (!step.link && !step.dest && /^Teas:/.test(step.label || "")) return true;
  return !!(step.dest || step.link);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function withArrow(label, linked) {
  const safe = esc(label);
  if (!linked) return safe;
  const words = String(label).split(" ");
  const last = words.pop();
  const head = words.length ? esc(words.join(" ")) + " " : "";
  return `${head}<span class="end">${esc(last)}<span class="go">↗</span></span>`;
}

function row(step, i, spec) {
  const time = step.timeText || "Flexible";
  const flex = step.timeText ? "" : " flex";
  const mk = ee(step);
  const state = i === spec.now ? " now" : i === spec.next ? " nx" : spec.past.includes(i) ? " past" : "";
  const bits = [esc(step.catLabel)];
  if (step.meal) bits.push(esc(mealCase(step.meal)));
  if (step.booked) bits.push("Booked");
  const badge = i === spec.now ? '<span class="badge now">NOW</span>' : i === spec.next ? '<span class="badge nx">NEXT</span>' : "";
  const conf = (step.conf || []).some((c) => c.doc) ? '<a class="act">View Confirmation</a>' : "";
  const pick = step.pick ? '<a class="act">🗺️ Pick from saved <span class="end">list<span class="go">↗</span></span></a>' : "";
  return `<article class="row${state}">
    <div class="when${flex}">${esc(time)}</div>
    <div class="body">
      <div class="ttl">${mk ? `<span class="mk">${esc(mk)}</span> ` : ""}${withArrow(step.label, hasLink(step))}</div>
      <div class="meta">${badge}${esc(bits.join(" · "))}</div>
      ${conf}${pick}
    </div>
    <button class="done" aria-label="Mark done"></button>
  </article>`;
}

function page(dir, spec) {
  const day = data.days.find((d) => d.key === spec.key);
  const hotel = day.hotels[0];
  const kath = day.kath && day.kath.length
    ? `<article class="row quiet"><div class="when"></div><div class="body"><div class="ttl">💙 Katherine's plan · read-only · ${day.kath.length}</div></div><div class="done ghost"></div></article>`
    : "";
  const rules = dir.name === "typeled" ? "none" : "inset 0 0.5px 0 var(--line)";
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(spec.title)}</title>
<style>
  :root {
    --ink: #1c1c1e;
    --mut: #636366;
    --line: rgba(60, 60, 67, 0.29);
    --link: ${dir.link};
    --now: #b42318;
    --page: ${dir.page};
    --card: ${dir.card};
    --gap: ${dir.gap}px;
    --title: ${dir.title}px;
    --tlh: ${dir.titleLh}px;
    --time: ${dir.time}px;
    --tpad: ${dir.tpad}px;
    --large: ${dir.large}px;
    --llh: ${dir.largeLh}px;
    --rpad: ${dir.rpad}px;
    --side: ${dir.margin}px;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: var(--page); color: var(--ink); }
  body {
    font: 17px/22px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
    letter-spacing: -0.022em;
    padding: 0 0 28px;
  }
  button, a { font: inherit; color: inherit; background: none; border: 0; padding: 0; text-align: left; text-decoration: none; }
  .bar {
    display: flex;
    align-items: center;
    min-height: 44px;
    padding: 0 4px;
    position: sticky;
    top: 0;
    background: var(--page);
    z-index: 2;
  }
  .nav, .all {
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--link);
    font-weight: 400;
    font-size: 17px;
  }
  .nav { font-size: 28px; width: 44px; }
  .all { margin-left: auto; padding: 0 12px; font-weight: 400; }
  h1 {
    margin: 2px var(--side) 0;
    font-size: var(--large);
    line-height: var(--llh);
    font-weight: 700;
    letter-spacing: -0.4px;
  }
  .sub {
    margin: 0 var(--side);
    color: var(--mut);
    font-size: 15px;
    line-height: 20px;
    font-weight: 400;
  }
  .tools {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 2px var(--side) 0;
    min-height: 44px;
  }
  .alarm {
    flex: 1;
    min-width: 0;
    margin: 0;
    color: var(--mut);
    font-size: 15px;
    line-height: 20px;
    font-weight: 400;
  }
  .late {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--link);
    font-size: 15px;
    font-weight: 400;
    white-space: nowrap;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    margin: 0 var(--side) 2px;
  }
  .filters span {
    display: inline-flex;
    align-items: center;
    min-width: 44px;
    min-height: 44px;
    padding: 0 14px 0 0;
    color: var(--mut);
    font-size: 15px;
    font-weight: 400;
  }
  .filters .on { color: var(--ink); font-weight: 600; }
  .sheet {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr) 44px;
    column-gap: var(--gap);
    align-items: baseline;
    margin: 0 var(--side);
    padding: ${dir.padY}px ${dir.padX}px;
    background: var(--card);
    border-radius: ${dir.name === "grouped" ? "12px" : "0"};
  }
  .row {
    display: grid;
    grid-template-columns: subgrid;
    grid-column: 1 / -1;
    align-items: baseline;
    padding: var(--rpad) 0;
  }
  .row + .row .body { box-shadow: ${rules}; }
  .when, .ttl { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif; }
  .when {
    grid-column: 1;
    justify-self: stretch;
    text-align: right;
    font-size: var(--time);
    line-height: var(--tlh);
    padding-top: var(--tpad);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0;
    color: var(--ink);
    white-space: nowrap;
  }
  .when.flex { color: var(--mut); }
  .body { grid-column: 2; min-width: 0; }
  .ttl {
    font-size: var(--title);
    line-height: var(--tlh);
    font-weight: 600;
    letter-spacing: -0.02em;
    overflow-wrap: break-word;
  }
  .end { white-space: nowrap; }
  .mk { font-weight: 400; }
  .go { color: var(--link); font-weight: 400; margin-left: 12px; }
  .meta {
    margin-top: 1px;
    color: var(--mut);
    font-size: 13px;
    line-height: 18px;
    font-weight: 400;
  }
  .badge {
    display: inline-block;
    margin-right: 6px;
    padding: 0 5px;
    border-radius: 4px;
    font-size: 11px;
    line-height: 16px;
    font-weight: 700;
    letter-spacing: 0.04em;
    vertical-align: 1px;
  }
  .badge.now { background: var(--now); color: #fff; }
  .badge.nx { color: var(--ink); box-shadow: inset 0 0 0 1px rgba(28, 28, 30, 0.45); }
  .acts { display: flex; flex-wrap: wrap; column-gap: 16px; }
  .act {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--link);
    font-size: 15px;
    font-weight: 400;
    line-height: 20px;
  }
  .done {
    grid-column: 3;
    align-self: start;
    width: 44px;
    height: 44px;
    margin-top: calc(var(--rpad) * -1);
    position: relative;
  }
  .done::before {
    content: "";
    position: absolute;
    left: 11px;
    top: calc(var(--rpad) + (var(--tlh) - 22px) / 2);
    width: 22px;
    height: 22px;
    border: 1.5px solid var(--ink);
    border-radius: 50%;
  }
  .done.ghost::before { border-color: transparent; }
  .past .ttl, .past .when, .past .meta { color: var(--mut); font-weight: 400; }
  .past .done::before { border-color: #8e8e93; }
  .contents {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
    margin: 12px var(--side) 0;
    font-size: 17px;
    font-weight: 400;
  }
  .grouped .contents {
    background: #fff;
    border-radius: 12px;
    padding: 0 16px;
    min-height: 44px;
  }
  .contents::after {
    content: "";
    width: 8px;
    height: 8px;
    margin-right: 4px;
    border-right: 1.5px solid var(--mut);
    border-bottom: 1.5px solid var(--mut);
    transform: rotate(-45deg);
  }
  .foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 8px var(--side) 0;
    color: var(--mut);
    font-size: 13px;
    line-height: 18px;
  }
  .foot b {
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    color: var(--link);
    font-weight: 400;
  }
</style>
</head>
<body class="${dir.name}">
  <header class="bar">
    <button class="nav" aria-label="Previous day">‹</button>
    <button class="nav" aria-label="Next day">›</button>
    <button class="all">All days</button>
  </header>
  <h1>${esc(spec.title)}</h1>
  <p class="sub">${esc(spec.sub)}</p>
  <div class="tools">
    <p class="alarm">⏰ ${esc(spec.alarm)}</p>
    <button class="late">🏃 Running late</button>
  </div>
  <div class="filters"><span class="on">All</span><span>Food</span><span>Coffee</span><span>Sights</span><span>Photo</span><span>Transport</span></div>
  <section class="sheet">
    <article class="row">
      <div class="when"></div>
      <div class="body">
        <div class="ttl">🏨 ${withArrow(hotel.full, true)}</div>
        <div class="acts">
          <a class="act">View Confirmation</a>
          <a class="act">🗺️ Day route in <span class="end">Maps<span class="go">↗</span></span></a>
        </div>
      </div>
      <div class="done ghost"></div>
    </article>
    ${day.steps.map((step, i) => row(step, i, spec)).join("")}
    ${kath}
  </section>
  <div class="contents">Contents · ${spec.stops} stops</div>
  <footer class="foot"><span>Updated Nov 13, 2:48 PM Taiwan/SG</span><b>Refresh</b></footer>
</body>
</html>`;
}

mkdirSync(new URL("./html/", import.meta.url), { recursive: true });
for (const dir of Object.values(dirs)) {
  for (const spec of Object.values(days)) {
    const name = `${dir.id}-${dir.name}-${spec.key}.html`;
    writeFileSync(new URL(`./html/${name}`, import.meta.url), page(dir, spec));
    console.log(name);
  }
}
