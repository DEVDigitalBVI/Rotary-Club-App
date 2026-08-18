import { chromium } from "playwright";

const base = "http://localhost:3000";
const outDir = process.argv[2] || ".";

const browser = await chromium.launch({ args: ["--no-sandbox"] });

async function run() {
  // Chat: mobile tap into a thread, send a message
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(base + "/chat", { waitUntil: "networkidle" });
    await page.getByText("Community Service").click();
    await page.waitForTimeout(200);
    await page.getByPlaceholder(/Message/).fill("Testing from the design preview");
    await page.getByPlaceholder(/Message/).press("Enter");
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${outDir}/interact-01-chat-thread-mobile.png` });
    console.log("[chat thread + send]", errors.length ? errors : "OK");
    await context.close();
  }

  // Events: RSVP toggle
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(base + "/events/e-3", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Going", exact: true }).click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${outDir}/interact-02-rsvp-toggle.png` });
    console.log("[rsvp toggle]", errors.length ? errors : "OK");
    await context.close();
  }

  // Directory: open Add Member dialog
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(base + "/directory", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Add member" }).click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${outDir}/interact-03-add-member-dialog.png` });
    console.log("[add member dialog]", errors.length ? errors : "OK");
    await context.close();
  }

  // Directory: search filter
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(base + "/directory", { waitUntil: "networkidle" });
    await page.getByPlaceholder(/Search by name/).fill("marine");
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${outDir}/interact-04-search-filter.png` });
    console.log("[search filter]", errors.length ? errors : "OK");
    await context.close();
  }

  // User menu dropdown
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(base + "/dashboard", { waitUntil: "networkidle" });
    await page.getByText("Jamaal Hodge").click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${outDir}/interact-05-user-menu.png` });
    console.log("[user menu]", errors.length ? errors : "OK");
    await context.close();
  }
}

await run();
await browser.close();
