# TasteProof / MarketCheck

**先用證據，再做生意。** / Make decisions with evidence, not fabricated AI guesses.

**Public site:** https://guan162.github.io/tasteproof/

TasteProof now includes a practical, Chinese-language **country-market screening tool**. It uses World Bank World Development Indicators (WDI) to show the population, internet-use share, GDP per capita, and a clearly identified proxy for people who use the internet. Each country/indicator reports its actual **source year** and an official indicator link. It also includes a configurable advertising test break-even calculator.

The cultural-interest proof-of-concept remains separately at [demo.html](docs/demo.html) and is **explicitly labeled as fictional**. The [Qloo live integration screen](docs/live.html) still requires an authorized key and backend deployment; **no Qloo-powered live analysis has been demonstrated yet**.

## What is genuinely useful today?

1. **Compare two countries** among 16 supported economies, including Japan, South Korea, Singapore, Vietnam, Thailand, Malaysia, Indonesia, the Philippines, the US, UK, Australia, Germany, France, India, China, and Brazil.
2. **Check original evidence:** population `SP.POP.TOTL`, internet users `IT.NET.USER.ZS`, and GDP per capita `NY.GDP.PCAP.CD`, with **independent data years** and per-indicator official source links.
3. **Understand reach limitations:** the calculated estimate `population × percent using the internet` is a rough approximation of internet users, **not sales demand, addressable buyers, unique accounts, or a same-year census**.
4. **Simulate a small ad test:** enter price, unit variable cost, total test advertising budget, assumed cost per click, and assumed conversion rate. See order contribution, break-even order count and break-even conversion rate. These are **user-authored assumptions, not revenue forecasts**.
5. **Download a JSON evidence report** including inputs, source links, years and assumptions for independent review.

**The homepage does not invent market forecasts, purchase intent or cultural affinities.** Missing data or failed network requests are surfaced as errors.

## Evidence retrieval and refresh

- Primary cached source: [docs/data/market-data.json](docs/data/market-data.json).
- **Data origin:** World Bank, World Development Indicators (WDI), retrieved from the [official WDI API](https://api.worldbank.org/v2/).
- API keys are not required for this World Bank API.
- A weekly scheduled GitHub Actions job [refresh-market-data.yml](.github/workflows/refresh-market-data.yml) executes [scripts/refresh_data.py](scripts/refresh_data.py), keeps each indicator's latest observed year, rejects fabricated/invalid values, and commits a new public JSON snapshot.
- If the cached snapshot cannot be loaded, the frontend tries an **official WDI API live fetch** for the selected countries. If that also fails, the site displays an error rather than substitute mock data.
- The current country list deliberately **does not represent Taiwan data**; the site discloses this scope limitation.

**License & attribution:** World Bank WDI data, generally CC BY 4.0, with some third-party indicator producers. Data are adapted only in presentation and simple derived calculations, and the World Bank does not endorse this application. See [World Bank terms](https://data.worldbank.org/summary-terms-of-use).

## How to validate

```sh
node --test tests/market.test.mjs
python -m unittest discover -s tests -v
node --test tests/worker.test.mjs
```

GitHub Actions runs the test suites and handles Pages publishing. See [MarketCheck regression tests](.github/workflows/market-tests.yml).

## Qloo hackathon track: work in progress

TasteProof was initially built for the Qloo Agentic Hackathon. The competition API application was submitted and the Devpost entry is a draft, but the project **cannot be described as using live Qloo until an authenticated backend round trip has succeeded**.

Existing source includes:
- [Cloudflare Worker integration](worker/index.mjs) (prepared; not deployed).
- [Qloo Live UI](docs/live.html) (inactive until configured).
- [Deployment configuration](wrangler.toml) and [secure key-handling instructions](QLOO_DEPLOYMENT.md).
- [English Devpost project draft](DEVPOST_SUBMISSION_DRAFT.md).

A valid contest project still requires verified Qloo integration, functioning demonstration, and a completed Devpost submission. **A one-time prize is not a recurring revenue model.**

## Financial status

**Verified cash spent: NT$0. Verified real-world revenue: NT$0.** This is currently a public decision-support prototype, not an autonomous income-generating system.

MIT license applies to the original website source code: [LICENSE](LICENSE).
