# TasteProof — Devpost submission draft (NOT YET SUBMITTED)

**Status as of 2026-10-11:** Devpost hackathon registration and Qloo API key application have been completed by the account holder. The Devpost project entry still needs to be created. Qloo key approval, authenticated live API tests, and secure backend deployment are pending. Do **not** submit the unfinished demo as Qloo-powered.

## Project name
TasteProof — Culture-Aware Market Discovery Agent

## Elevator pitch
Discover cultural blind spots before entering a new market—with explainable, Qloo-grounded research, not unsupported AI guesses.

## Inspiration
Small teams expanding across cities often rely on generic market assumptions. TasteProof is designed to help them frame better cross-cultural research questions using Qloo taste-graph evidence and low-cost validation experiments.

## What it does
The currently published static prototype lets someone compare a reference city with up to three candidate cities. It visualizes differences in **fictional sample tags** and recommends hypotheses to validate. This is an illustrative interface, **not Qloo market research**.

The separate Qloo integration code prepared in the repository is designed to resolve an optional reference brand, request geographic taste-tag insights from Qloo on the server side, compare returned tags, expose an evidence trail, and refuse to invent results when the API fails. This capability is **not active in the hosted demo** until the key and backend have been deployed and live-tested.

## How it is built
- GitHub Pages: static, responsive browser interface.
- JavaScript: compare market tags, rank exploratory differences, and display evidence.
- Cloudflare Worker adapter (prepared, deployment pending): server-side Qloo requests with secret storage, origin checks and rate limiting.
- GitHub Actions tests: Python sample app tests and mocked Qloo adapter contract tests.

## Challenges
Designing an understandable cross-market interface without pretending a tag-overlap score represents consumer demand; isolating API secrets; limiting third-party API calls; and preserving provenance from provider data to the visual output.

## Accomplishments to date
- Public interactive demo at https://guan162.github.io/tasteproof/
- Public repository at https://github.com/guan162/tasteproof
- An independently testable Qloo backend adapter and separate live-analysis UI, awaiting authorized deployment.

## Next steps before final submission
1. Obtain authorized Qloo hackathon API key from Qloo.
2. Configure the secret in a backend and deploy it.
3. Validate actual /search and /v2/insights responses from the hackathon API and any necessary parameter corrections.
4. Connect the public live UI to the deployed Worker and confirm a working end-to-end Qloo experience.
5. Revisit agentic behavior, improving autonomous hypothesis selection and evidence-backed next experiments.
6. Check that the repo includes the complete functional source, an open-source license, and reproducible instructions.
7. Finalize Devpost English descriptions **only after** all claims match the shipped version; submit before deadline.

## Links to use in Devpost
**Repository:** https://github.com/guan162/tasteproof

**Public demo (fictional prototype only):** https://guan162.github.io/tasteproof/

**Qloo live-analysis page (requires deployed backend):** https://guan162.github.io/tasteproof/live.html

**Hackathon:** https://qloo.devpost.com/

## Important competition rule
The 2026 Qloo Agentic Hackathon requires a working externally hosted application genuinely integrated with Qloo, a public complete code repository with an open-source license, and an English text description. **A demo video is not required.** The current static demo by itself is insufficient. This is an application for a one-time award, not a recurring revenue system.

## Prize and finance
No prize has been awarded. Verified project revenue: NT$0. Verified cash spent: NT$0.
