import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(root, "../../data.json"), "utf8"));

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FILTERS = ["All", "Food", "Coffee", "Sights", "Photo", "Transport"];
const SHEET = "https://docs.google.com/spreadsheets/d/1tlPG1bMpZtP4Xrfu5OGCd6bi5qppr4oCkTY3lsZL07Y/edit#gid=1769366264";

for (const day of data.days) {
  for (const step of day.steps) {
    step.ideas = [];
    step.conf = step.conf || [];
    step.dayof = step.dayof || [];
    step.deadlines = step.deadlines || [];
  }
  for (const idea of day.ideas || []) {
    const parent = day.steps[idea.pi];
    if (parent) parent.ideas.push(idea);
  }
  for (const hotel of day.hotels || []) {
    hotel.conf = hotel.conf || [];
    hotel.dayof = hotel.dayof || [];
    hotel.deadlines = hotel.deadlines || [];
  }
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function emojiOf(step) {
  let rest = String(step.text || "");
  let out = "";
  for (;;) {
    const match = /^\p{Extended_Pictographic}\uFE0F?(?:\u200D\p{Extended_Pictographic}\uFE0F?)*/u.exec(rest);
    if (!match) break;
    out += (out ? " " : "") + match[0];
    rest = rest.slice(match[0].length).replace(/^\s+/, "");
    if (!/^\p{Extended_Pictographic}/u.test(rest)) break;
  }
  return out || step.ic || "";
}

function mealCase(meal) {
  return meal.charAt(0) + meal.slice(1).toLowerCase();
}

function hasMaps(step) {
  if (!step.link && !step.dest && /^Teas:/.test(step.label || step.place || "")) return true;
  return Boolean(step.dest || step.link);
}

function hrefOf(step) {
  if (!step.link && !step.dest && /^Teas:/.test(step.label || step.place || "")) return SHEET;
  if (step.dest) {
    const mode = (step.mode && step.mode.tm) || "transit";
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(step.dest)}&travelmode=${mode}`;
  }
  return step.link || "#";
}

function timeHtml(timeText) {
  if (!timeText) return `<span class="flex">Flexible</span>`;
  const safe = esc(timeText)
    .replace(/\//g, "/<wbr>")
    .replace(/–/g, "–<wbr>")
    .replace(/~/g, "~<wbr>");
  return safe;
}

function norm(value) {
  return String(value || "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\(reserved\)/gi, "")
    .replace(/\bconf(?:irmation)?\b\s*[:#]?\s*[A-Z0-9-]*/gi, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function showDetails(day, step) {
  const joined = norm(
    day.steps
      .filter((other) => other.cells.some((cell) => step.cells.includes(cell)))
      .map((other) => [other.timeText, other.label || other.place, other.travelRow].join(" "))
      .join(" "),
  );
  const maps = hrefOf(step);
  return (step.srcs || []).some((src) => {
    const urls = src.match(/https?:\/\/\S+/g) || [];
    return joined.indexOf(norm(src)) < 0 || urls.some((url) => url !== maps);
  });
}

function clockLabel(hour, minute) {
  const h = hour % 12 || 12;
  const m = String(minute).padStart(2, "0");
  return `${h}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function updatedLabel() {
  const stamp = new Date(Date.parse(data.generatedAt) + 8 * 60 * 60 * 1000);
  return `Updated ${MON[stamp.getUTCMonth()]} ${stamp.getUTCDate()}, ${clockLabel(stamp.getUTCHours(), stamp.getUTCMinutes())} Taiwan/SG`;
}

function schedule(day, nowMin, today) {
  const steps = day.steps;
  const past = steps.map(() => false);
  if (!today) return { past, cur: -1, next: -1 };
  let last = -1;
  steps.forEach((step, index) => {
    if (step.time && step.time.start <= nowMin) last = index;
  });
  steps.forEach((step, index) => {
    if (index < last) past[index] = true;
    if (index === last && step.time) {
      const end = step.time.end;
      const ended = end != null ? end <= nowMin : nowMin > step.time.start && index < steps.length - 1;
      if (ended) past[index] = true;
    }
  });
  let cur = -1;
  let next = -1;
  for (let index = 0; index < steps.length; index += 1) {
    if (past[index]) continue;
    if (cur < 0) cur = index;
    else {
      next = index;
      break;
    }
  }
  const started = cur >= 0 && (!steps[cur].time || steps[cur].time.start <= nowMin);
  if (cur >= 0 && !started) {
    next = cur;
    cur = -1;
  }
  return { past, cur, next };
}

function titleInner(step) {
  const label = String(step.label || step.place || "");
  const emoji = emojiOf(step);
  const mark = emoji ? `<span class="em">${esc(emoji)}</span>` : "";
  if (!hasMaps(step)) return `<span class="pl">${mark}<span class="name">${esc(label)}</span></span>`;
  return `<a class="pl" href="${esc(hrefOf(step))}"><span class="go" aria-hidden="true">↗</span>${mark}<span class="name">${esc(label)}</span></a>`;
}

function chips(confs) {
  return (confs || [])
    .filter((conf) => conf.doc)
    .map((conf) => `<a class="chip" href="${esc(conf.doc)}">View Confirmation</a>`)
    .join("");
}

function flags(kind) {
  if (kind === "now") return `<span class="badge now">NOW</span>`;
  if (kind === "next") return `<span class="badge nx">NEXT</span>`;
  return "";
}

function kindOf(index, state) {
  if (index === state.cur) return "now";
  if (index === state.next) return "next";
  if (state.past[index]) return "past";
  return "";
}

function ideaGroups(ideas) {
  const groups = [];
  for (const idea of ideas) {
    let group = groups.find((item) => item.area === (idea.area || ""));
    if (!group) {
      group = { area: idea.area || "", items: [] };
      groups.push(group);
    }
    group.items.push(idea);
  }
  return groups
    .map((group) => {
      const head = group.area ? `<div class="ia">${esc(group.area)}</div>` : "";
      const items = group.items
        .map((idea) => {
          const emoji = idea.step && idea.step.ic ? `<span class="em">${esc(idea.step.ic)}</span>` : "";
          const linked = idea.step && hasMaps(idea.step);
          const go = linked ? `<span class="go" aria-hidden="true">↗</span>` : "";
          const body = `${emoji}<span class="name">${esc(idea.text)}</span>${go}`;
          if (!linked) return `<div class="idea">${body}</div>`;
          return `<a class="idea" href="${esc(hrefOf(idea.step))}">${body}</a>`;
        })
        .join("");
      return head + items;
    })
    .join("");
}

function row(day, step, index, state, opts) {
  const kind = kindOf(index, state);
  const done = opts.done.has(index);
  const openIdeas = opts.expand.has(`i${index}`);
  const openDetails = opts.expand.has(`d${index}`);
  const details = showDetails(day, step);
  const bits = [`<span class="tag">${esc(step.catLabel)}</span>`];
  if (step.meal) bits.push(`<span class="tag meal">${esc(mealCase(step.meal))}</span>`);
  if (step.booked) bits.push(`<span class="tag booked">Booked</span>`);
  const conf = chips(step.conf);
  const pick = step.pick
    ? `<a class="rowlink" href="${esc(step.pick)}"><span class="name"><span class="em">🗺️</span>Pick from saved list</span><span class="go" aria-hidden="true">↗</span></a>`
    : "";
  const ideas = step.ideas.length
    ? `<button class="exp${openIdeas ? " open" : ""}" aria-expanded="${openIdeas}"><span class="name"><span class="em">💡</span>Ideas · ${step.ideas.length}</span><span class="chev" aria-hidden="true"></span></button>${openIdeas ? `<div class="panel">${ideaGroups(step.ideas)}</div>` : ""}`
    : "";
  const det = details
    ? `<button class="exp${openDetails ? " open" : ""}" aria-expanded="${openDetails}"><span class="name">Details</span><span class="chev" aria-hidden="true"></span></button>${openDetails ? `<div class="panel det">${(step.srcs || []).map((src) => `<div>${esc(src)}</div>`).join("")}</div>` : ""}`
    : "";
  const travel = step.travelRow ? `<div class="trv">${esc(step.travelRow)}</div>` : "";
  const notes = (step.dayof || []).map((item) => `<div class="note">✅ Day of: ${esc(item.text)}</div>`).join("")
    + (step.deadlines || []).map((item) => `<div class="note">⏳ Booking deadline (from confirmation): ${esc(item.text)}</div>`).join("");
  return `<article class="row ${kind}${done ? " is-done" : ""}" id="s${index}">
    <div class="when">${timeHtml(step.timeText)}</div>
    <div class="ttl">${titleInner(step)}</div>
    <button class="done" aria-pressed="${done}" aria-label="${done ? "Done" : "Mark done"}: ${esc(emojiOf(step))} ${esc(step.label || step.place)}"></button>
    <div class="meta">${flags(kind)}${bits.join("")}${conf}</div>
    ${travel}${notes}${pick}${ideas}${det}
  </article>`;
}

function hotelBlock(day) {
  const hotels = (day.hotels || [])
    .map((hotel) => {
      const split = hotel.full.indexOf(" (");
      const name = split < 0 ? esc(hotel.full) : `${esc(hotel.full.slice(0, split))}<span class="hnote">${esc(hotel.full.slice(split))}</span>`;
      const link = hotel.link
        ? `<a class="rowlink" href="${esc(hotel.link)}"><span class="name"><span class="em">🏨</span>${name}</span><span class="go" aria-hidden="true">↗</span></a>`
        : `<div class="rowlink"><span class="name"><span class="em">🏨</span>${name}</span></div>`;
      const notes = (hotel.dayof || []).map((item) => `<div class="note">✅ Day of: ${esc(item.text)}</div>`).join("")
        + (hotel.deadlines || []).map((item) => `<div class="note">⏳ Booking deadline (from confirmation): ${esc(item.text)}</div>`).join("");
      const conf = chips(hotel.conf);
      return `${link}${notes}${conf ? `<div class="meta hotelconf">${conf}</div>` : ""}`;
    })
    .join("");
  const route = day.routeLink
    ? `<a class="rowlink" href="${esc(day.routeLink)}"><span class="name"><span class="em">🗺️</span>Day route in Maps</span><span class="go" aria-hidden="true">↗</span></a>`
    : "";
  if (!hotels && !route) return "";
  return `<section class="stay">${hotels}${route}</section>`;
}

function contents(day, state, open) {
  const rows = day.steps
    .map((step, index) => {
      const kind = kindOf(index, state);
      const emoji = emojiOf(step);
      return `<button class="crow ${kind}"><span class="when">${timeHtml(step.timeText)}</span><span class="on">${emoji ? `<span class="em">${esc(emoji)}</span>` : ""}<span class="name">${esc(step.label || step.place)}</span></span></button>`;
    })
    .join("");
  return `<details class="contents"${open ? " open" : ""}><summary><span>Contents · ${day.steps.length} stops</span><span class="chev" aria-hidden="true"></span></summary>${rows}</details>`;
}

function nowbox(day, state) {
  if (!state.today) return "";
  const line = (kind, index) => {
    if (index < 0) return "";
    const step = day.steps[index];
    const emoji = emojiOf(step);
    return `<button class="nl"><span class="when"><span class="badge ${kind === "now" ? "now" : "nx"}">${kind === "now" ? "NOW" : "NEXT"}</span></span><span class="on">${emoji ? `<span class="em">${esc(emoji)}</span>` : ""}<span class="name">${esc(step.label || step.place)}</span></span></button>`;
  };
  const body = line("now", state.cur) + line("next", state.next);
  return `<section class="nowbox">${body || `<div class="note">Nothing left on today's plan</div>`}<button class="exp" aria-expanded="false"><span class="name"><span class="em">🏃</span>Running late</span><span class="chev" aria-hidden="true"></span></button></section>`;
}

function page(theme, day, opts) {
  const state = schedule(day, opts.nowMin, opts.today);
  state.today = opts.today;
  const index = day.n;
  const progress = Math.round((100 * index) / (data.days.length));
  const todayMark = opts.today ? " · today" : "";
  const flag = day.countries[0] === "Singapore" ? "🇸🇬" : "🇹🇼";
  const city = day.countries[0] === "Singapore" ? "singapore" : "taipei";
  const alarm = day.noAlarm
    ? ""
    : `<div class="alarm"><span class="em">⏰</span> ${day.alarm ? `<span class="al">Alarm (computed)</span> <span class="big">${esc(day.alarm)}</span>` : "No alarm set"}</div>`;
  const filters = FILTERS.map((name) => `<button class="fchip${name === "All" ? " on" : ""}" aria-pressed="${name === "All"}">${name}</button>`).join("");
  const rows = day.steps.map((step, i) => row(day, step, i, state, opts)).join("");
  const kath = day.kath && day.kath.length
    ? `<details class="kath"><summary><span>💙 Katherine's plan · read-only · ${day.kath.length}</span><span class="chev" aria-hidden="true"></span></summary>${day.kath.map((item) => `<div class="k">${esc(item.v)}</div>`).join("")}</details>`
    : "";
  return `<!doctype html>
<html lang="en" data-theme="${theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=393">
<title>Day ${day.n}</title>
<style>
${css()}
</style>
</head>
<body class="${opts.full ? "full" : ""}">
<header>
  <div class="top">
    <div class="brand">
      <h1>Trip Playbook</h1>
      <div class="clock">Taiwan/SG now ${esc(opts.clock)}</div>
    </div>
    <button class="all">All days</button>
  </div>
  <div class="days">
    <button class="nav" aria-label="Previous day">‹</button>
    <button class="daysel">Day ${day.n} · ${DOW[day.dow]} ${day.mo}/${day.d}${todayMark}</button>
    <button class="nav" aria-label="Next day">›</button>
  </div>
  <div class="meter">
    <div class="prog" aria-hidden="true"><i style="width:${progress}%"></i></div>
    <span class="pn">Day ${day.n} of ${data.days.length}</span>
  </div>
</header>
<main>
  <div class="plate ${city}"><img src="../img/${city}.jpg" alt=""></div>
  <section class="dayhead">
    <div class="dnum">${day.d}</div>
    <div class="dtop"><span class="em">${flag}</span>${DOW[day.dow]} · ${MON[day.mo - 1]}</div>
    <div class="areas">${esc(day.areas.join(" · "))}</div>
    ${alarm}
  </section>
  ${hotelBlock(day)}
  ${nowbox(day, state)}
  <div class="filters" role="group">${filters}</div>
  ${contents(day, state, opts.openContents)}
  <div class="plan">${rows}</div>
  ${kath}
  <footer class="foot"><span>${esc(updatedLabel())}</span><button class="refresh">↻ Refresh</button></footer>
</main>
</body>
</html>`;
}

function css() {
  return `
    :root {
      --ink: #141414;
      --muted: #5c5a54;
      --rule: #ddd9d0;
      --page: #f3f1eb;
      --now: #141414;
      --now-ink: #fff;
      --chip: #141414;
      --chip-ink: #fff;
      --plate: transparent;
      --plate-ink: #141414;
      --bar: #141414;
    }
    [data-theme="plate"] {
      --ink: #142019;
      --muted: #3e5148;
      --rule: #d5ddd6;
      --page: #eef3ec;
      --now: #c4321a;
      --now-ink: #fff;
      --chip: transparent;
      --chip-ink: #142019;
      --plate: #163028;
      --plate-ink: #f4f7f2;
      --bar: #c4321a;
    }
    [data-theme="poster"] {
      --ink: #111111;
      --muted: #595959;
      --rule: #e6e6e6;
      --page: #ffffff;
      --now: #ffe14a;
      --now-ink: #111111;
      --chip: transparent;
      --chip-ink: #111111;
      --plate: transparent;
      --plate-ink: #111111;
      --bar: #ffe14a;
    }
    [data-theme="board"] {
      --ink: #f6f1e7;
      --muted: #b3a89a;
      --rule: #322e29;
      --page: #141210;
      --now: #f0b429;
      --now-ink: #1c1406;
      --chip: transparent;
      --chip-ink: #f6f1e7;
      --plate: transparent;
      --plate-ink: #f6f1e7;
      --bar: #f0b429;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 393px; overflow-x: clip; }
    body {
      background: var(--page);
      color: var(--ink);
      font-family: Inter, "WenQuanYi Micro Hei", "Noto Color Emoji", sans-serif;
      font-size: 16px;
      line-height: 22px;
      letter-spacing: -0.011em;
    }
    button, a { font: inherit; color: inherit; background: none; border: 0; padding: 0; text-align: left; text-decoration: none; }
    button, a, summary { -webkit-tap-highlight-color: transparent; }
    :focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
    button:active, a:active, summary:active { background: rgba(0, 0, 0, 0.06); }
    header { position: sticky; top: 0; z-index: 3; background: var(--page); }
    body.full header { position: static; }
    .top, .days, .meter, main { padding-left: 16px; padding-right: 16px; }
    .top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-height: 52px;
      padding-top: 8px;
    }
    [data-theme="rail"] .top {
      background: #141414;
      color: #fff;
      margin: 0;
      padding: 8px 16px 0;
    }
    h1 { margin: 0; font-size: 17px; line-height: 22px; font-weight: 600; letter-spacing: -0.02em; }
    .clock { margin-top: 1px; font-size: 13px; line-height: 18px; font-weight: 500; color: var(--muted); letter-spacing: 0; }
    [data-theme="rail"] .clock { color: #c8c8c8; }
    .all, .nav, .daysel, .refresh {
      min-width: 44px;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }
    .all { justify-content: flex-end; padding: 0 2px; }
    .days { display: flex; align-items: center; gap: 0; }
    .nav { width: 44px; font-size: 26px; line-height: 1; }
    .daysel { flex: 1; min-width: 0; font-size: 16px; font-weight: 500; letter-spacing: -0.015em; }
    .meter { display: flex; align-items: center; gap: 8px; padding-bottom: 8px; }
    .prog { flex: 1; height: 3px; background: var(--rule); }
    .prog i { display: block; height: 100%; background: var(--ink); }
    [data-theme="rail"] .prog i { background: #141414; }
    .pn { font-size: 13px; line-height: 18px; font-weight: 500; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
    .dayhead, .stay, .nowbox {
      display: grid;
      grid-template-columns: 64px minmax(0, 1fr) 44px;
      column-gap: 8px;
    }
    .dayhead {
      align-items: baseline;
      padding-top: 16px;
    }
    [data-theme="plate"] .dayhead {
      background: var(--plate);
      color: var(--plate-ink);
      margin: 8px -16px 0;
      padding: 12px 16px 12px;
    }
    .dnum {
      grid-column: 1;
      grid-row: 1;
      text-align: left;
      font-size: 40px;
      line-height: 1;
      font-weight: 700;
      letter-spacing: -0.045em;
      font-variant-numeric: tabular-nums;
    }
    [data-theme="poster"] .dnum { font-size: 48px; line-height: 0.85; }
    [data-theme="rail"] .dnum, [data-theme="rail"] .when, [data-theme="rail"] .contents .when, [data-theme="rail"] .nl .when {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-weight: 500;
      letter-spacing: 0;
    }
    [data-theme="rail"] .when, [data-theme="rail"] .contents .when { font-size: 12px; }
    .dtop { grid-column: 2 / -1; grid-row: 1; font-size: 16px; line-height: 22px; font-weight: 600; }
    .areas { grid-column: 2 / -1; margin-top: 8px; font-size: 16px; line-height: 22px; font-weight: 500; }
    .alarm { grid-column: 2 / -1; margin-top: 8px; font-size: 13px; line-height: 18px; font-weight: 400; }
    .al { color: var(--muted); font-weight: 400; }
    [data-theme="plate"] .al { color: #c5d2c8; }
    .big { font-size: 16px; line-height: 22px; font-weight: 600; font-variant-numeric: tabular-nums; }
    .em { font-family: "Noto Color Emoji", sans-serif; font-style: normal; margin-right: 4px; vertical-align: -0.125em; }
    .stay { margin-top: 8px; }
    .rowlink, .exp, .idea {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
      min-height: 44px;
      padding: 8px 0;
      font-size: 16px;
      line-height: 22px;
      font-weight: 500;
    }
    .rowlink .name, .exp .name, .idea .name, .pl .name { flex: 1; min-width: 0; overflow-wrap: break-word; }
    .rowlink .go, .idea .go, .exp .chev { margin-left: auto; flex: 0 0 auto; }
    .go { display: inline-block; min-width: 16px; text-align: right; font-weight: 500; }
    .pl .go { float: right; margin: 1px 0 0 8px; }
    .hnote { display: block; margin-top: 2px; font-weight: 500; color: var(--muted); }
    .note { padding: 8px 0; font-size: 16px; line-height: 22px; color: var(--muted); overflow-wrap: anywhere; }
    .nowbox { margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--rule); }
    .nl {
      display: grid;
      grid-template-columns: subgrid;
      grid-column: 1 / -1;
      align-items: start;
      width: 100%;
      min-height: 44px;
      text-align: left;
    }
    .nowbox > .exp { grid-column: 2 / -1; }
    .nl .on { grid-column: 2 / -1; }
    .nl .when, .contents .when { padding-top: 11px; text-align: right; }
    .nl .on, .crow .on {
      min-width: 0;
      padding: 11px 0;
      font-size: 16px;
      line-height: 22px;
      font-weight: 600;
      overflow-wrap: break-word;
    }
    .filters { display: flex; flex-wrap: wrap; align-items: center; border-bottom: 1px solid var(--rule); }
    .fchip {
      min-width: 44px;
      min-height: 44px;
      padding: 0 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--muted);
      font-size: 13px;
      line-height: 18px;
      font-weight: 500;
      letter-spacing: 0;
      position: relative;
    }
    .fchip.on { color: var(--ink); font-weight: 600; }
    .fchip.on::after {
      content: "";
      position: absolute;
      left: 8px;
      right: 8px;
      bottom: 8px;
      height: 2px;
      background: var(--ink);
    }
    .kath { border-top: 1px solid var(--rule); }
    summary {
      display: flex;
      align-items: center;
      gap: 16px;
      min-height: 44px;
      padding: 8px 0;
      font-size: 16px;
      line-height: 22px;
      font-weight: 600;
      cursor: pointer;
      list-style: none;
    }
    summary::-webkit-details-marker { display: none; }
    summary .chev, .exp .chev { margin-left: auto; }
    .chev {
      width: 8px;
      height: 8px;
      margin-right: 4px;
      border-top: 2px solid currentColor;
      border-right: 2px solid currentColor;
      transform: rotate(45deg);
      flex: 0 0 auto;
    }
    details[open] > summary .chev, .exp.open .chev { transform: rotate(135deg); margin-top: 0; }
    .crow {
      display: grid;
      grid-template-columns: 64px minmax(0, 1fr);
      column-gap: 8px;
      align-items: start;
      width: 100%;
      min-height: 44px;
      border-top: 1px solid var(--rule);
      text-align: left;
    }
    .plan {
      border-top: 1px solid var(--rule);
    }
    [data-theme="rail"] .plan {
      background-image: linear-gradient(#cfcabe, #cfcabe);
      background-size: 1px 100%;
      background-repeat: no-repeat;
      background-position: 64px 0;
    }
    .row {
      display: grid;
      grid-template-columns: 64px minmax(0, 1fr) 44px;
      column-gap: 8px;
      align-items: start;
      border-bottom: 1px solid var(--rule);
      min-width: 0;
    }
    .when {
      grid-column: 1;
      grid-row: 1;
      padding-top: 11px;
      text-align: right;
      font-size: 13px;
      line-height: 22px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0;
    }
    .when .flex { font-weight: 600; }
    .ttl { grid-column: 2; grid-row: 1; min-width: 0; }
    .pl {
      display: block;
      min-height: 44px;
      min-width: 44px;
      padding: 11px 0 4px;
      font-size: 16px;
      line-height: 22px;
      font-weight: 600;
      overflow-wrap: break-word;
    }
    [data-theme="poster"] .pl, [data-theme="poster"] .dtop { letter-spacing: -0.02em; }
    .done {
      grid-column: 3;
      grid-row: 1;
      position: relative;
      width: 44px;
      height: 44px;
      min-width: 44px;
      min-height: 44px;
    }
    .done::before {
      content: "";
      position: absolute;
      left: 13px;
      top: 13px;
      width: 18px;
      height: 18px;
      border: 1.5px solid var(--ink);
      background: transparent;
    }
    .done[aria-pressed="true"]::before { background: var(--ink); }
    .done[aria-pressed="true"]::after {
      content: "";
      position: absolute;
      left: 17px;
      top: 18px;
      width: 10px;
      height: 6px;
      border-left: 2px solid #fff;
      border-bottom: 2px solid #fff;
      transform: rotate(-45deg);
    }
    .meta, .trv, .note, .rowlink, .exp, .panel { grid-column: 2 / -1; }
    .meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      min-width: 0;
      padding: 0 0 4px;
    }
    .hotelconf { padding-top: 0; }
    .tag { font-size: 13px; line-height: 18px; font-weight: 500; color: var(--muted); white-space: nowrap; }
    .tag.meal, .tag.booked { color: var(--ink); }
    .badge {
      display: inline-flex;
      align-items: center;
      height: 18px;
      padding: 0 5px;
      font-size: 11px;
      line-height: 16px;
      font-weight: 700;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }
    .badge.now { background: var(--now); color: var(--now-ink); }
    .badge.nx { background: transparent; color: var(--ink); box-shadow: inset 0 0 0 1px var(--ink); }
    .chip {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      min-width: 44px;
      padding: 0 12px;
      border: 1px solid var(--ink);
      background: var(--chip);
      color: var(--chip-ink);
      font-size: 13px;
      line-height: 18px;
      font-weight: 600;
    }
    [data-theme="plate"] .chip, [data-theme="poster"] .chip { background: transparent; }
    .trv { margin: 0 0 4px; font-size: 16px; line-height: 22px; color: var(--muted); overflow-wrap: break-word; }
    .panel { padding: 0 0 8px; }
    .ia {
      padding-top: 8px;
      font-size: 13px;
      line-height: 18px;
      font-weight: 600;
      letter-spacing: 0;
      color: var(--muted);
    }
    .det div { padding: 8px 0; color: var(--muted); overflow-wrap: anywhere; white-space: pre-wrap; }
    .row.now .when { box-shadow: inset 3px 0 0 var(--bar); }
    .row.past .pl, .row.past .when, .row.past .tag, .row.past .trv,
    .crow.past .on, .crow.past .when { color: #6a6862; }
    [data-theme="poster"] .row.past .pl, [data-theme="poster"] .row.past .when, [data-theme="poster"] .row.past .tag,
    [data-theme="poster"] .crow.past .on, [data-theme="poster"] .crow.past .when { color: #6e6e6e; }
    .row.is-done .pl, .row.is-done .when { color: var(--muted); }
    .kath { margin-top: 16px; }
    .k { padding: 8px 0; border-top: 1px solid var(--rule); color: var(--muted); white-space: pre-wrap; overflow-wrap: anywhere; }
    .foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 12px;
      padding-top: 4px;
      font-size: 13px;
      line-height: 18px;
      color: var(--muted);
    }
    .refresh { font-size: 16px; color: var(--ink); }
    .plate { display: none; }
    [data-theme="board"] { --rule: #5e564e; }
    [data-theme="board"] .plate {
      display: block;
      margin: 8px -16px 0;
      height: 112px;
      overflow: hidden;
      background: #0c0b09;
      border-bottom: 1px solid #5e564e;
    }
    [data-theme="board"] .plate img {
      display: block;
      width: 100%;
      height: 112px;
      object-fit: cover;
      object-position: center 40%;
    }
    [data-theme="board"] .plate.singapore img { object-position: center 62%; }
    [data-theme="board"] .dayhead { align-items: center; padding-top: 12px; }
    [data-theme="board"] .dnum { font-size: 56px; line-height: 0.8; }
    [data-theme="board"] .areas,
    [data-theme="board"] .alarm { grid-column: 1 / -1; }
    [data-theme="board"] .big {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-weight: 500;
      font-size: 15px;
      letter-spacing: 0;
    }
    [data-theme="board"] .when,
    [data-theme="board"] .contents .when,
    [data-theme="board"] .nl .when {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-weight: 500;
      font-size: 12px;
      letter-spacing: 0;
      color: #f6f1e7;
    }
    [data-theme="board"] .when .flex,
    [data-theme="board"] .contents .when .flex { color: #9c9388; font-weight: 500; }
    [data-theme="board"] .row.now .when {
      background: #f0b429;
      color: #1c1406;
      box-shadow: none;
    }
    [data-theme="board"] .badge.nx {
      color: #f6f1e7;
      box-shadow: inset 0 0 0 1px #f6f1e7;
    }
    [data-theme="board"] .meta { grid-column: 2; padding-left: 0; padding-bottom: 8px; }
    [data-theme="board"] .pl .go { margin-right: 8px; }
    [data-theme="board"] .crow .on { font-weight: 500; }
    [data-theme="board"] .done::before { border-color: #9c9388; }
    [data-theme="board"] .fchip.on::after { bottom: 0; left: 6px; right: 6px; }
    [data-theme="board"] .row.past .pl,
    [data-theme="board"] .row.past .tag,
    [data-theme="board"] .row.past .trv,
    [data-theme="board"] .crow.past .on,
    [data-theme="board"] .row.is-done .pl { color: #a89f93; }
    [data-theme="board"] .row.past .when,
    [data-theme="board"] .crow.past .when,
    [data-theme="board"] .row.is-done .when { color: #9c9388; background: transparent; }
    [data-theme="board"] .done[aria-pressed="true"]::before { background: #f6f1e7; border-color: #f6f1e7; }
    [data-theme="board"] .done[aria-pressed="true"]::after { border-color: #141210; }
    [data-theme="board"] button:active,
    [data-theme="board"] a:active,
    [data-theme="board"] summary:active { background: rgba(255, 255, 255, 0.08); }
  `;
}

const themes = ["board"];
const outDir = join(root, "html");
mkdirSync(outDir, { recursive: true });

const screens = [
  {
    id: "day4",
    day: 4,
    today: false,
    nowMin: 15 * 60 + 18,
    clock: "3:18 PM",
    openContents: false,
    expand: [],
    done: [],
  },
  {
    id: "expanded",
    day: 4,
    today: false,
    nowMin: 15 * 60 + 18,
    clock: "3:18 PM",
    openContents: false,
    expand: ["i8"],
    done: [],
  },
  {
    id: "contents",
    day: 4,
    today: false,
    nowMin: 15 * 60 + 18,
    clock: "3:18 PM",
    openContents: true,
    expand: [],
    done: [],
  },
  {
    id: "now",
    day: 14,
    today: true,
    nowMin: 9 * 60 + 30,
    clock: "9:30 AM",
    openContents: false,
    expand: [],
    done: [0],
  },
];

for (const theme of themes) {
  for (const screen of screens) {
    const day = data.days.find((item) => item.n === screen.day);
    const opts = {
      ...screen,
      expand: new Set(screen.expand),
      done: new Set(screen.done),
      full: false,
    };
    const html = page(theme, day, opts);
    writeFileSync(join(outDir, `${theme}-${screen.id}.html`), html);
  }
}

const probe = schedule(data.days.find((day) => day.n === 14), 9 * 60 + 30, true);
if (probe.cur !== 1 || probe.next !== 2 || !probe.past[0]) {
  throw new Error(`NOW/NEXT mismatch ${JSON.stringify(probe)}`);
}
console.log("wrote", themes.length * screens.length, "html files");
console.log("day 14 now", probe);
