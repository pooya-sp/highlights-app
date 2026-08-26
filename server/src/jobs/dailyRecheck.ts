import cron from "node-cron";
import Link from "../models/linkModel.js";
import { checkLink } from "../services/linkCheckerService.js";
import { extractPreview } from "../services/previewScraperService.js";

const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES_MS = 1000;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

// Simple sleep helper.
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Process a single link: re-check + re-scrape if alive.
async function processLink(link: any): Promise<void> {
  const result = await checkLink(link.url);

  link.status = result.status;
  link.httpStatus = result.httpStatus;
  link.lastCheckedAt = new Date();

  if (result.status === "ok") {
    try {
      const res = await fetch(link.url, {
        method: "GET",
        redirect: "follow",
        headers: { "User-Agent": USER_AGENT },
      });
      const html = await res.text();
      const preview = extractPreview(html.slice(0, 100_000));
      link.title = preview.title;
      link.description = preview.description;
      link.imageUrl = preview.imageUrl;
      link.siteName = preview.siteName;
    } catch {
      // If scraping fails, keep the old preview data — don't overwrite
      // with nulls just because one fetch hiccuped.
    }
  } else {
    // Link is dead — clear preview so the UI shows "no preview available"
    // instead of stale data from when the link was alive.
    link.title = null;
    link.description = null;
    link.imageUrl = null;
    link.siteName = null;
  }

  await link.save();
}

// The main job: fetch all links, process in batches.
async function runRecheck(): Promise<void> {
  console.log("🔄 Daily re-check: starting...");

  // Use a cursor instead of find().limit() to avoid loading all links
  // into memory at once. For thousands of links this matters.
  const cursor = Link.find().cursor();
  let processed = 0;
  let batch: any[] = [];

  for await (const link of cursor) {
    batch.push(link);

    if (batch.length >= BATCH_SIZE) {
      await Promise.all(batch.map(processLink));
      processed += batch.length;
      batch = [];
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  // Process any remaining links in the final partial batch.
  if (batch.length > 0) {
    await Promise.all(batch.map(processLink));
    processed += batch.length;
  }

  console.log(`🔄 Daily re-check: done. Processed ${processed} links.`);
}

// "0 3 * * *" = at 03:00 every day.

export function startDailyRecheck(): void {
  cron.schedule("0 3 * * *", () => {
    runRecheck().catch((err) => {
      console.error("❌ Daily re-check failed:", err);
    });
  });

  console.log("📅 Daily re-check scheduled (every day at 03:00).");
}
