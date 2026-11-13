import pw from "/tmp/pw/node_modules/playwright-core/index.js";

const { chromium } = pw;
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const htmlDir = join(root, "html");
const outDir = join(root, process.argv[2] || "r1");
mkdirSync(outDir, { recursive: true });

const themes = process.env.THEME ? process.env.THEME.split(",") : ["board"];
const screens = [
  { id: "day4", scroll: null, full: true },
  { id: "expanded", scroll: "s4", full: false },
  { id: "contents", scroll: null, full: false },
  { id: "now", scroll: null, full: false },
];

const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars", "--font-render-hinting=none"],
});

const problems = [];

for (const theme of themes) {
  for (const screen of screens) {
    const page = await browser.newPage({
      viewport: { width: 393, height: 852 },
      deviceScaleFactor: 1,
    });
    const file = `file://${join(htmlDir, `${theme}-${screen.id}.html`)}`;
    await page.goto(file, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    if (screen.scroll) {
      await page.evaluate((id) => {
        const header = document.querySelector("header").offsetHeight;
        const el = document.getElementById(id);
        const y = el.getBoundingClientRect().top + window.scrollY - header - 4;
        window.scrollTo(0, Math.max(0, y));
      }, screen.scroll);
    }
    const report = await page.evaluate(() => {
      const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      const small = [...document.querySelectorAll("button, a")].filter((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return false;
        return rect.width < 43.5 || rect.height < 43.5;
      }).map((el) => ({
        t: (el.getAttribute("aria-label") || el.innerText || "").trim().slice(0, 48),
        w: Math.round(el.getBoundingClientRect().width),
        h: Math.round(el.getBoundingClientRect().height),
        c: el.className,
      }));
      const align = [...document.querySelectorAll(".row")].slice(0, 4).map((row) => {
        const when = row.querySelector(".when");
        const pl = row.querySelector(".pl");
        const wr = when.getBoundingClientRect();
        const pr = pl.getBoundingClientRect();
        return { t: pl.innerText.slice(0, 28), d: Math.round((wr.top - pr.top) * 10) / 10 };
      });
      return { overflow, small, align, scrollW: document.documentElement.scrollWidth };
    });
    if (report.overflow || report.small.length || report.align.some((item) => Math.abs(item.d) > 1)) {
      problems.push({ theme, screen: screen.id, report });
    }
    await page.screenshot({ path: join(outDir, `${theme}-${screen.id}.png`) });
    if (screen.full) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: join(outDir, `${theme}-day4-full.png`), fullPage: true });
    }
    await page.close();
    console.log("shot", theme, screen.id);
  }
}

await browser.close();
console.log(problems.length ? JSON.stringify(problems, null, 2) : "no layout problems");
