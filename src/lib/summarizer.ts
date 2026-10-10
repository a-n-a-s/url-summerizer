export type SummaryResult = {
  provider: "groq" | "gemini";
  model: string;
  summary: string;
};

const SYSTEM_PROMPT =
  "You are a helpful assistant that summarizes web pages. " +
  "You will be given the extracted text of a webpage, possibly with its title. " +
  "Respond ONLY with a clear, concise summary of the page's main content in 3-5 sentences. " +
  "Do not mention that the input was scraped or truncated. Plain text only, no markdown headings.";

/**
 * Summarize scraped page text using whichever free AI provider has a key:
 *   - Groq   (GROQ_API_KEY)   — free tier, llama models, very fast
 *   - Gemini (GEMINI_API_KEY) — free tier, gemini models
 * If both are set, Groq is preferred.
 */
export async function summarize(
  title: string,
  pageText: string
): Promise<SummaryResult> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!groqKey && !geminiKey) {
    throw new Error(
      "No AI API key configured. Set GROQ_API_KEY or GEMINI_API_KEY in your .env file."
    );
  }

  if (groqKey) return groqSummarize(title, pageText, groqKey);
  return geminiSummarize(title, pageText, geminiKey!);
}

async function groqSummarize(
  title: string,
  pageText: string,
  apiKey: string
): Promise<SummaryResult> {
  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 500,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Page title: ${title}\n\nPage content:\n\n${pageText}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq API error (HTTP ${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const summary = data?.choices?.[0]?.message?.content?.trim();
  if (!summary) throw new Error("Groq returned an empty summary.");
  return { provider: "groq", model, summary };
}

async function geminiSummarize(
  title: string,
  pageText: string,
  apiKey: string
): Promise<SummaryResult> {
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [{ text: `Page title: ${title}\n\nPage content:\n\n${pageText}` }],
          },
        ],
        generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
      }),
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Gemini API error (HTTP ${res.status}): ${body.slice(0, 300)}`
    );
  }

  const data = await res.json();
  const summary = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("")
    .trim();
  if (!summary) throw new Error("Gemini returned an empty summary.");
  return { provider: "gemini", model, summary };
}
