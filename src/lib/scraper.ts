import * as cheerio from "cheerio";

export type ScrapeResult = {
  title: string;
  text: string;
};

const USER_AGENT =
  "Mozilla/5.0 (compatible; AIScraper/1.0; +https://github.com/your-username/ai-web-scraper)";

/**
 * Fetch a URL and extract the page title + main readable text.
 * Uses plain fetch (no headless browser) and strips nav bars, scripts,
 * styles, ads, etc., preferring the largest block of readable text.
 */
export async function scrapeUrl(rawUrl: string): Promise<ScrapeResult> {
  // Basic URL validation & protocol normalization
  let url: URL;
  try {
    url = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
  } catch {
    throw new Error("Invalid URL. Please provide a valid http(s) URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are supported.");
  }

  const res = await fetch(url.href, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch URL (HTTP ${res.status} ${res.statusText}).`
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("xhtml")) {
    throw new Error(
      "URL did not return an HTML page. Only web pages can be scraped."
    );
  }

  return extractFromHtml(await res.text(), url.href);
}

export function extractFromHtml(html: string, baseUrl: string): ScrapeResult {
  const $ = cheerio.load(html);

  // Title: prefer <title>, fall back to first <h1>
  const title =
    ($("title").first().text() || $("h1").first().text()).trim() || "Untitled";

  // Remove things that are never "main content"
  $(
    "script, style, noscript, nav, header, footer, aside, " +
      "form, button, iframe, svg, img, link, meta, " +
      '[role="navigation"], [role="banner"], [role="complementary"], ' +
      ".navbar, .nav, .menu, .sidebar, .footer, .header, .ads, .advert"
  ).remove();

  let text = "";
  const article = $("article").first();
  const main = $("main, [role='main']").first();

  // Heuristic: <article>, then <main>, then fall back to the <body>
  let scope: cheerio.Cheerio<any> = article.length
    ? article
    : main.length
      ? main
      : $("body");

  // If none of those contain much text (very short), fall back to body
  if (scope.text().replace(/\s+/g, " ").trim().length < 250) {
    scope = $("body");
  }

  scope.find("p, h1, h2, h3, h4, h5, h6, li, blockquote, td, pre").each(
    (_i, el) => {
      const chunk = $(el).text().replace(/\s+/g, " ").trim();
      // Keep only meaningful lines, skip tiny boilerplate fragments
      if (chunk.length >= 25 && !/cookie|subscribe|sign in|log in/i.test(chunk)) {
        text += chunk + "\n\n";
      }
    }
  );

  text = text
    .split("\n\n")
    .filter((line, i, arr) => line !== arr[i - 1]) // de-dupe consecutive lines
    .join("\n\n")
    .trim();

  if (text.length < 50) {
    throw new Error(
      `Could not extract meaningful text from ${baseUrl}. The page may be a JS-only app or empty. Try a different URL.`
    );
  }

  // Cap the text sent to the AI (~30k chars) to stay within free-tier limits
  if (text.length > 30_000) {
    text = text.slice(0, 30_000);
  }

  return { title, text };
}
