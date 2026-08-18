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
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: false });
  if (errors.length) {
    console.log(`[${name}] console errors:`, errors);
  } else {
    console.log(`[${name}] OK`);
  }
  await context.close();
}

const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844 };

await shot("/login", "01-login-desktop", desktop);
await shot("/dashboard", "02-dashboard-desktop", desktop);
await shot("/directory", "03-directory-desktop", desktop);
await shot("/directory/m-hodge", "04-member-profile-desktop", desktop);
await shot("/events", "05-events-desktop", desktop);
await shot("/events/e-1", "06-event-detail-desktop", desktop);
await shot("/account", "07-account-desktop", desktop);
await shot("/news", "08-news-desktop", desktop);
await shot("/chat", "09-chat-desktop", desktop);

await shot("/dashboard", "10-dashboard-mobile", mobile);
await shot("/directory", "11-directory-mobile", mobile);
await shot("/chat", "12-chat-mobile", mobile);
await shot("/account", "13-account-mobile", mobile);

await browser.close();
