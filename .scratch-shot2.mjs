import { chromium } from "playwright";

const base = "http://localhost:3000";
const outDir = process.argv[2] || ".";

const browser = await chromium.launch({ args: ["--no-sandbox"] });

async function shot(path, name, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: false });
  const overflow = scrollWidth > clientWidth ? ` OVERFLOW ${scrollWidth}>${clientWidth}` : "";
  console.log(`[${name}] ${errors.length ? "ERRORS:" + JSON.stringify(errors) : "OK"}${overflow}`);
  await context.close();
}

const mobile = { width: 390, height: 844 };

await shot("/login", "fix-01-login-mobile", mobile);
await shot("/account", "fix-02-account-mobile", mobile);
await shot("/dashboard", "fix-03-dashboard-mobile", mobile);
await shot("/directory", "fix-04-directory-mobile", mobile);
await shot("/events", "fix-05-events-mobile", mobile);
await shot("/news", "fix-06-news-mobile", mobile);
await shot("/chat", "fix-07-chat-mobile", mobile);

await browser.close();
