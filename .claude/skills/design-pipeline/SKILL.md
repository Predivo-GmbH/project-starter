---
name: design-pipeline
description: >
  Start the design-first pipeline for a new project. POINTER skill — the canonical, current
  workflow lives in DESIGN_PIPELINE.md; this skill does not restate it. Use when starting a
  new project's design or when the user says "design pipeline", "new project design",
  "start design system".
argument-hint: "[product name or description]"
---

# Design Pipeline (pointer skill)

> **Reference, never copy.** This skill deliberately does NOT restate the pipeline steps. The single canonical, current design workflow is:
>
> **`C:\Business\Templates\project-starter\docs\DESIGN_PIPELINE.md`** (registered in `C:\Business\Templates\CANONICAL_SOURCES.md`).

Read and follow that file. Start at **§0.0 route selection → §0.1 DEFINE** (which covers the Firecrawl brand scrape — use the shared Firecrawl key from `docs/Credentials.txt` / the standard, NEVER hardcode a key here) and go through **IMPLEMENT / VALIDATE**. Current mockup tools are **Stitch / Claude Design 2.0 / Pencil.dev** (co-equal, pick per route, §0.0d); Figma/Bolt are not-adopted.

> The old 7-step `.pen` / Pencil-canvas content this skill used to embed, and a hardcoded Firecrawl API key, were removed 2026-08-14 (knowledge-consolidation pass) — the embedded steps had drifted from the canonical doc and the key was a git-exposed secret. Do not reconstruct steps from memory or a project-local copy.
