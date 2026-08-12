# Zoha Ashraf — Personal Site + AI Agent

A personal brand site with a real, working AI agent: a chatbot in the corner that answers
questions about Zoha using her actual resume facts, powered by the Claude API through a
secure serverless backend (your API key never touches the browser).

## What's in here

```
index.html      the page (hero, about, experience, projects, skills, writing, contact)
styles.css      design system — dark navy/ink background, amber + teal accents,
                 Space Grotesk / Inter / JetBrains Mono type
script.js       hero A* pathfinding animation (canvas) + chat widget frontend logic
api/chat.js     serverless function — calls the Claude API server-side, keeps your key secret
package.json    marks this as a Node project so Vercel picks up the /api function
.env.example    template for your local API key
```

The hero's live pathfinding animation is a real A* search running in your browser (visited
cells in amber, frontier in teal, final path traced) — a nod to the search-algorithms
coursework and CSP work in the resume, instead of a generic hero banner.

## 1. Get an Anthropic API key

Sign up / log in at [console.anthropic.com](https://console.anthropic.com), go to
**Settings → API Keys**, and create a key. Anthropic API usage is billed separately from any
Claude.ai subscription — check current pricing at [anthropic.com/pricing](https://www.anthropic.com/pricing)
before deploying, and consider swapping `claude-sonnet-5` for `claude-haiku-4-5-20251001` in
`api/chat.js` if you want a cheaper model for a low-stakes portfolio chatbot.

## 2. Deploy (recommended: Vercel — free tier, and it natively runs `/api` functions)

**Option A — no terminal, from the browser:**
1. Push this folder to a new GitHub repo (or use GitHub's "upload files" in a new repo — no git needed).
2. Go to [vercel.com/new](https://vercel.com/new), import that repo.
3. In the project's **Settings → Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = your key from step 1
4. Deploy. Vercel gives you a live URL like `zoha-ashraf.vercel.app` immediately, and you can
   attach a custom domain later under **Settings → Domains**.

**Option B — from the terminal:**
```bash
npm install -g vercel
cd zoha-site
vercel                      # first deploy, follow the prompts
vercel env add ANTHROPIC_API_KEY production
vercel --prod
```

That's it — the chat widget calls `/api/chat`, which is deployed automatically alongside the
static site.

### Alternative hosts
Netlify and Cloudflare Pages also support serverless functions and work fine, but the function
file location/format differs slightly from Vercel's (`/api/*.js` convention used here). If you
want to host on GitHub Pages instead, note that GitHub Pages is static-only — you'd need to
deploy `api/chat.js` separately (e.g. as a Cloudflare Worker) and point `script.js`'s fetch URL
at it.

## 3. Customize

- **Content**: edit the text directly in `index.html` — projects, experience, skills are plain
  HTML, no build step or template engine.
- **Agent's knowledge**: edit the `SYSTEM_PROMPT` constant at the top of `api/chat.js`. The
  agent only knows what's written there — update it whenever the resume changes, so it never
  goes stale or invents things.
- **Colors/type**: all design tokens are CSS variables at the top of `styles.css` (`:root`).
- **Domain**: buy a domain (e.g. `zohaashraf.dev`) and attach it under your host's Domains
  settings — free custom-domain support is standard on Vercel/Netlify.

## 4. Test locally before deploying

Since `/api/chat.js` needs a Node server (not just static file serving), use the Vercel CLI:
```bash
npm install -g vercel
cd zoha-site
cp .env.example .env        # then paste your real key into .env
vercel dev
```
This runs the site at `http://localhost:3000` with the API route working exactly as it will in
production.

## Notes on the agent's design

- The backend (`api/chat.js`) is the only place the API key lives — it reads
  `process.env.ANTHROPIC_API_KEY` server-side. Never move the API call into `script.js` or any
  client-side code; that would expose your key to anyone who opens dev tools.
- The agent introduces itself as Zoha's AI agent, not as Zoha herself, and is instructed to
  decline questions asking for information not present in its system prompt (phone number, home
  address, salary expectations, etc.) rather than guessing.
- Conversation history is capped and truncated per request as basic hygiene against abuse; for
  a production app fielding real traffic you'd add rate limiting (e.g. Vercel's built-in or
  Upstash) on top of this.
