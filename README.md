# 🔎 AI Web Scraper + Summarizer

A simple full-stack app built with **Next.js**: paste any webpage URL, the backend scrapes the page's main text with **Cheerio**, sends it to a **free AI API** (Groq or Google Gemini — your choice), and the frontend displays a short summary with a nice loading state.

[Live demo](YOUR_DEPLOYED_URL_HERE) · [GitHub repo](https://github.com/your-username/ai-web-scraper)

---

## ✨ Features

- 🦾 **Scraping** — plain `fetch` + [Cheerio](https://cheerio.js.org/). No headless browser needed. Strips scripts, nav bars, ads, and keeps the largest readable text block (`<article>` → `<main>` → `<body>` fallback).
- 🤖 **AI** — works with **two free providers**, auto-detected from whichever key you set:
  | Provider | Free key | Default model |
  |-----------|----------|----------------|
  | Groq (recommended — fastest) | https://console.groq.com/keys | `llama-3.1-8b-instant` |
  | Google Gemini | https://aistudio.google.com/apikey | `gemini-3.5-flash-lite` |
- ⏳ **Loading state** — animated "Loading…" card while the backend processes.
- ⚠️ **Friendly errors** — bad URLs, non-HTML pages, failed fetches, and API errors are all caught and shown in the UI.
- 🧩 **One codebase** — frontend and backend (API route) live in the same Next.js app and deploy together.

## 📁 Project structure

```
.
├── src/
│   ├── lib/
│   │   ├── scraper.ts        # fetches URL & extracts main text (Cheerio)
│   │   └── summarizer.ts     # Groq + Gemini AI providers
│   ├── pages/
│   │   ├── _app.tsx          # app wrapper (global styles)
│   │   ├── index.tsx         # frontend UI (input, button, loading, result)
│   │   └── api/
│   │       └── summarize.ts  # backend endpoint: POST /api/summarize
│   └── styles/
│       └── globals.css       # light theme styling
├── .env.example              # template for your API key
├── .gitignore                # keeps .env out of git
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## 🚀 How to run locally

### 1. Prerequisites

- **Node.js 18.17+** (Node 18+ is required for the built-in `fetch` API)
- npm (comes with Node)

### 2. Clone and install

```bash
git clone https://github.com/your-username/ai-web-scraper.git
cd ai-web-scraper
npm install
```

### 3. Get a FREE AI API key

Pick **either** provider (both have generous free tiers — no credit card required):

**Option A — Groq (recommended, it's very fast):**
1. Go to https://console.groq.com/keys
2. Sign in / create a free account
3. Click **"Create API Key"**, copy the key (starts with `gsk_`)

**Option B — Google Gemini:**
1. Go to https://aistudio.google.com/apikey
2. Sign in with any Google account
3. Click **"Create API key"**, copy the key

### 4. Create the `.env` file

The `.env` file goes in the **project root** (same folder as `package.json`). Copy the example and paste your key:

```bash
cp .env.example .env
```

Then open `.env` and fill in **one** key:

```ini
# Option A: Groq
GROQ_API_KEY=gsk_your_key_here

# Option B: Gemini
# GEMINI_API_KEY=your_key_here
```

> ⚠️ Never commit your `.env` file — it is ignored by `.gitignore`.
> If both keys are set, Groq is used.
> Optional: set `GROQ_MODEL` or `GEMINI_MODEL` to override the default models.

### 5. Start the dev server

```bash
npm run dev
```

Open **http://localhost:3000**, paste a URL (e.g. `https://en.wikipedia.org/wiki/Web_scraping`), and hit **Summarize**. 🎉

---

## 🔌 API

### `POST /api/summarize`

```jsonc
// Request body
{ "url": "https://example.com/article" }

// 200 Response
{
  "title": "Example article title",
  "summary": "3-5 sentence AI summary…",
  "provider": "groq",        // or "gemini"
  "model": "llama-3.1-8b-instant",
  "charCount": 12345          // chars of text scraped
}

// 4xx/5xx Response
{ "error": "Human-readable error message" }
```

You can test it with curl while the dev server is running:

```bash
curl -X POST http://localhost:3000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"url":"https://en.wikipedia.org/wiki/Web_scraping"}'
```

---

## ☁️ Deployment (Vercel)

The app deploys to Vercel as a single Next.js project (the API route becomes a serverless function automatically).

1. Push this repo to your GitHub account:
   ```bash
   git init && git add -A && git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/ai-web-scraper.git
   git push -u origin main
   ```
2. Go to **https://vercel.com/new**, import your new repo, framework preset auto-detects **Next.js** — no build config needed.
3. Before clicking Deploy, open **Environment Variables** and add `GROQ_API_KEY` (or `GEMINI_API_KEY`) with your key. **Do not** add it in code.
4. Deploy. Done — the live URL is your demo link.

> Vercel's Hobby plan (free) runs the serverless functions fine; Groq/Gemini free tiers cover the AI calls.

Alternative hosts that work the same way: **Render** (Node Service: build `npm install && npm run build`, start `npm start`, add the env var), **Fly.io**, **Railway**.

---

## 🛠️ Tech stack

| Layer | Choice |
|-------|--------|
| Frontend + Backend | Next.js 14 (React 18, TypeScript, Pages Router API routes) |
| Scraping | native `fetch` + Cheerio (no browser) |
| AI | Groq free tier (`llama-3.1-8b-instant`) **or** Gemini free tier (`gemini-3.5-flash-lite`) |
| Styling | Plain CSS (light theme, no UI framework) |

## ⚠️ Notes & limitations

- Scraping uses plain HTTP fetch — it can't render client-side JavaScript-only sites (per the task's "keep it simple" instruction).
- Page text is capped at ~30,000 characters before being sent to the AI, to stay within free-tier context limits.
- Wikipedia works great; sites with heavy bot-protection (Cloudflare challenges, etc.) may refuse automated visitors.
