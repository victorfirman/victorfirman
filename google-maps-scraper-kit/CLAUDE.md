# CLAUDE.md — Google Maps Scraper Kit

You are working inside the **Google Maps Scraper Kit**. This folder runs a local Google Maps scraper
and you drive it for the user.

## What this project is
A Docker-based local deployment of the open-source `gosom/google-maps-scraper`, exposed as a REST API
at **`http://localhost:8080`**, plus a skill that teaches you to use it. It scrapes **Google Maps
business listings only** (not social media).

## Indonesia defaults (this fork)
- `lang: "id"` (Indonesian results). Write keywords in Indonesian with the city baked in:
  `"klinik gigi di Jakarta Selatan"`, `"bengkel mobil di Surabaya"`, `"villa di Canggu Bali"`.
- Geocoding is limited to Indonesia (`--country id`), so `--city "Malang"` can't resolve abroad.
  Coordinates for major cities are in `examples/queries.example.json`.
- Output adds a `whatsapp` column (`https://wa.me/62…`) for mobile numbers (08xx / +628xx); landlines
  (021…, 031…) are left blank. Most Indonesian businesses are reached via WhatsApp.
- Batch jobs are de-duplicated by `place_id` (overlapping terms like "dokter gigi" / "klinik gigi").
- CSVs are written as UTF-8 with BOM so Excel shows names correctly. If Excel (Indonesian locale, which
  expects `;`) puts everything in one column, use Data → From Text/CSV, or open in Google Sheets.
- **UU PDP (UU No. 27/2022)** applies to scraped phones/emails of individuals (e.g. sole-proprietor
  numbers). Remind the user: have a lawful basis, honor opt-out requests, don't sell the data. Don't help
  with mass/unsolicited WhatsApp blasts — that's spam and also gets numbers banned by WhatsApp.

## When the user asks to scrape businesses / get a list of places / lead-gen data
**Load and follow the `google-maps-scraper` skill** (`.claude/skills/google-maps-scraper/SKILL.md`).
It has the exact API flow, the required fields, and the best-practice + safety rules. Don't improvise
the API calls from memory — use the skill.

## Slash commands
This kit ships commands in `.claude/commands/` that map to the skill: `/scrape` (single query),
`/scrape-batch` (many queries, one job), `/scrape-setup` (start the scraper), `/scrape-jobs` (list/delete).
Local commands are pre-approved in `.claude/settings.json` so you can run them without prompting the user.

## Rate limits — warn, don't block
If a request is large/high-volume (high `depth`, many keywords, repeated runs, or `email:true`), **proceed**
but first print ONE short warning that over-use can get the user's IP temporarily rate-limited by Google,
and suggest proxies. Do NOT gate or demand confirmation for a normal big scrape. Refuse only clearly
abusive use (surveilling individuals, spam). Full guidance is in the skill.

## Hard facts you must not get wrong
- API base: `http://localhost:8080` — **no auth** (it's localhost-only). Never expose it publicly.
- Create a job: `POST /api/v1/jobs`. **Required** body fields or it 422s:
  `max_time` (in **seconds**, e.g. `300`), `lat` & `lon` (as **strings**), plus `keywords` (array).
- The create response returns `{"id":"<uuid>"}` (lowercase `id`). Status checks use `GET /api/v1/jobs/{id}` whose field is `"Status"` and becomes `"ok"` when done.
- **Poll in the background.** The Bash tool blocks foreground `sleep`; run the poll loop as a
  background command (`run_in_background: true`) and read its output file when notified.
- Before a big job (high depth / many keywords), **confirm with the user** — cost is time + IP-block risk.
- Scraped emails/phones are **personal data** (UU PDP in Indonesia); don't dump huge CSVs into chat — summarize + save to disk.

## Setup
If the container isn't running: `docker compose up -d`, then verify `curl http://localhost:8080/api/v1/jobs`.
Full setup is in `SETUP.md`.

## Attribution
The scraping engine is `gosom/google-maps-scraper` (MIT, © Georgios Komninos), run as its official Docker image. Keep `CREDITS.md` and `LICENSE` intact.
