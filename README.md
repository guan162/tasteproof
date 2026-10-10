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
