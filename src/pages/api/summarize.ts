import { NextApiRequest, NextApiResponse } from "next";
import { scrapeUrl } from "@/lib/scraper";
import { summarize } from "@/lib/summarizer";

export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
  },
};

type SummaryResponse = {
  title: string;
  summary: string;
  provider: string;
  model: string;
  charCount: number;
};

type ErrorResponse = {
  error: string;
};

/**
 * POST /api/summarize
 * Body: { "url": "https://example.com/article" }
 * Returns: { title, summary, provider, model, charCount }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SummaryResponse | ErrorResponse>
) {
  // Only allow the frontend's POST request
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { url } = req.body ?? {};
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing 'url' in request body." });
  }

  try {
    // 1. Scrape the page — extract title + main text
    const { title, text } = await scrapeUrl(url);

    // 2. Ask the AI to summarize the extracted text
    const { provider, model, summary } = await summarize(title, text);

    // 3. Send the summary back to the frontend
    return res.status(200).json({
      title,
      summary,
      provider,
      model,
      charCount: text.length,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Something went wrong while processing the URL.";
    console.error("[/api/summarize]", message);
    // If the AI key is missing, hint at setup (helpful for first-time runners)
    if (message.includes("No AI API key configured")) {
      return res.status(500).json({ error: message });
    }
    return res.status(502).json({ error: message });
  }
}
