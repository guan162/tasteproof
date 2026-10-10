# TasteProof — Cross-Market Discovery Prototype

An open-source educational prototype for exploring cultural research questions and designing small validation experiments.

## What is published

- **Interactive public demo source:** [docs/index.html](docs/index.html) — a standalone, browser-only comparison of up to three target cities using **clearly fictional sample tags**.
- **Small local API sample:** [app.py](app.py) — lightweight Python server, also using fictional sample data.
- **Automated test starter:** [tests/test_app.py](tests/test_app.py) and [CI](.github/workflows/test.yml).
- **License:** [MIT](LICENSE).

> **Important:** The GitHub repository is public, but the demo website may not be live yet. GitHub Pages must first be enabled in the repository Settings. **No Qloo API key is used in this published demo.**

## Publish the demo with GitHub Pages

In repository **Settings → Pages**, under **Build and deployment**, select:

1. **Source:** Deploy from a branch
2. **Branch:** `main`
3. **Folder:** `/docs`
4. Click **Save**

Once GitHub deploys it, the expected URL is `https://guan162.github.io/tasteproof/`. **Do not treat this expected URL as verified until it actually loads.**

## Local Python API demo

```bash
python app.py
# http://127.0.0.1:8000/
python -m unittest discover -s tests -v
```

Only Python standard library is required for this sample.

## Provenance and status

- The current GitHub Pages demo is self-contained, with **invented data** and no Qloo integration.
- The separate local v0.3 package has additional scan and live-adapter code that is **not yet fully committed to this repository**.
- Real Qloo API calls, public live API backend, Devpost submission, and contest eligibility have **not** been verified.
- **Cash spent: NT$0. Verified revenue: NT$0.**
- This is an exploratory contest submission project, **not** a proven or recurring NT$30,000/month income mechanism.

Official competition: https://qloo.devpost.com/rules


## Phase 2: real Qloo integration — code complete, credentials/deployment pending

The repository now contains a **Cloudflare Worker backend adapter** at [worker/index.mjs](worker/index.mjs), a [live-only UI](docs/live.html), a [deployment configuration](wrangler.toml), and [contract tests](tests/worker.test.mjs).

- The Worker makes server-side calls to Qloo `GET /search` and `GET /v2/insights` with an `X-Api-Key` header.
- An optional reference brand is resolved by **exact brand name**. If no brand is supplied, geographic taste tags are analyzed without brand-specific claims.
- A scan covers one baseline and up to three candidate cities. It never fabricates results if Qloo returns an error.
- The Worker has a built-in request ceiling and requires the Cloudflare Rate Limiting binding for live requests.
- Onboarding must use a **legitimate Qloo API key**, from the official hackathon access process, in a private Cloudflare secret.
- No successful authorized live Qloo round trip has been recorded yet. **Qloo mode is not active on the public site.**

### Deployment procedure (only after API access is approved)

A Cloudflare account is needed. These are administrative operations and must be authorized by the account holder; do not send credentials to a chat.

1. In the project checkout, install Node.js and run `npx wrangler login` with your Cloudflare account.
2. Review [wrangler.toml](wrangler.toml). It uses the allowed GitHub Pages origin and a five-requests-per-minute Cloudflare rate-limit binding.
3. Set the secret with `npx wrangler secret put QLOO_API_KEY` **in the secure interactive prompt**, not in GitHub files. Determine the correct Qloo API host from the approved key's instructions; set `QLOO_API_ORIGIN` accordingly (the public docs use `https://api.qloo.com`).
4. Run `npx wrangler deploy`. Confirm `GET https://YOUR-WORKER.workers.dev/health` reports `qloo_key_configured: true`.
5. Edit [docs/config.js](docs/config.js) to set **only the public Worker origin** (never the key): `window.TASTEPROOF_WORKER_ORIGIN = "https://YOUR-WORKER.workers.dev";`.
6. Test the public [Qloo analysis screen](https://guan162.github.io/tasteproof/live.html) with a supported city pair and a reference brand that Qloo can resolve. Compare results against actual Qloo API responses.
7. Check Qloo usage rights, key quota and Cloudflare limits before allowing external judges or other traffic.

**Do not claim this entry is Qloo-connected or competition-ready before live validation succeeds.** Qloo affinity/tag overlap is neither guaranteed representative demand nor estimated profit. A contest prize is a single payment, not recurring revenue.

Official evidence: [Qloo API documentation](https://github.com/qloo/docs-public), [Agentic Hackathon rules](https://qloo.devpost.com/rules), [Cloudflare rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

### New tests

```sh
node --test tests/worker.test.mjs
```

The tests use stub Qloo data; they validate request structure, secret isolation, schema rejection, rate limiting, and input validation **without representing a real upstream connection**.
