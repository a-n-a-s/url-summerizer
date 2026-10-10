/**
 * Standalone scraper test — run with: npx tsx scripts/test-scraper.ts
 * Verifies the scraping + text-extraction logic without needing an AI key.
 */
import { scrapeUrl } from "../src/lib/scraper";
import { summarize } from "../src/lib/summarizer";

async function main() {
  const url = process.argv[2] || "https://en.wikipedia.org/wiki/Web_scraping";
  console.log(`Scraping: ${url}\n`);
  const { title, text } = await scrapeUrl(url);
  console.log(`TITLE: ${title}`);
  console.log(`TEXT LENGTH: ${text.length} chars\n`);
  console.log(`PREVIEW:\n${text.slice(0, 600)}\n`);

  // Check summarizer error handling without a key
  try {
    await summarize(title, text);
  } catch (e: unknown) {
    console.log(`Summarizer without key => OK: ${(e as Error).message}`);
  }
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
