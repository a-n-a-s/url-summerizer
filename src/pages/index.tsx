import { useCallback, useState } from "react";

type SummaryResponse = {
  title: string;
  summary: string;
  provider: string;
  model: string;
  charCount: number;
};

type Phase = "idle" | "loading" | "done" | "error";

const EXAMPLES = [
  "https://en.wikipedia.org/wiki/Web_scraping",
  "https://en.wikipedia.org/wiki/Artificial_intelligence",
];

const TODAY = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function Home() {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState("");

  const handleSummarize = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!url.trim() || phase === "loading") return;

      setPhase("loading");
      setError("");

      try {
        const res = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || `Request failed (HTTP ${res.status})`);
        }

        setResult(data as SummaryResponse);
        setPhase("done");
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Something went wrong. Try again."
        );
        setPhase("error");
      }
    },
    [url, phase]
  );

  return (
    <main className="container">
      <header className="masthead">
        <div className="dateline">
          <span>Free AI Edition</span>
          <span>Vol. I · No. 1</span>
          <span>{TODAY}</span>
        </div>
        <h1 className="masthead-title">
          AI Web Scraper <em>+ Summarizer</em>
        </h1>
        <p className="standfirst">
          Paste any webpage URL — we scrape the main content and use a free AI
          model to write a short summary.
        </p>
        <div className="rule-double" aria-hidden="true" />
      </header>

      <form className="url-form" onSubmit={handleSummarize}>
        <label className="field-label" htmlFor="url">
          Submit a URL for summarization
        </label>
        <div className="field-row">
          <input
            id="url"
            type="text"
            value={url}
            onChange={(ev) => setUrl(ev.target.value)}
            placeholder="https://example.com/article-to-summarize"
            disabled={phase === "loading"}
          />
          <button type="submit" disabled={phase === "loading" || !url.trim()}>
            {phase === "loading" ? "Transmitting…" : "Summarize →"}
          </button>
        </div>
      </form>

      <div className="examples">
        <span className="examples-label">From the wire</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            className="example-link"
            onClick={() => setUrl(ex)}
            disabled={phase === "loading"}
          >
            {ex.replace("https://en.wikipedia.org/wiki/", "wiki/")}
          </button>
        ))}
      </div>

      {phase === "loading" && (
        <section className="card state-card loading" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <div>
            <strong>Transmitting</strong>
            <p>Fetching the page and asking the AI to summarize it. This usually takes a few seconds.</p>
          </div>
        </section>
      )}

      {phase === "error" && error && (
        <section className="card state-card error" role="alert">
          <span aria-hidden="true">⚠️</span>
          <div>
            <strong>Something went wrong</strong>
            <p>{error}</p>
          </div>
        </section>
      )}

      {phase === "done" && result && (
        <section className="card result" aria-live="polite">
          <p className="kicker">Summary</p>
          <h2>{result.title}</h2>
          <p className="summary">{result.summary.trim()}</p>
          <div className="meta">
            <span className="chip">🤖 {result.provider}</span>
            <span className="chip">{result.model}</span>
            <span className="chip">
              {result.charCount.toLocaleString()} chars scraped
            </span>
          </div>
        </section>
      )}

      <footer>
        Next.js + Cheerio + free AI (Groq / Gemini) — see the{" "}
        <a href="https://github.com/your-username/ai-web-scraper">README</a> for setup.
      </footer>
    </main>
  );
}
