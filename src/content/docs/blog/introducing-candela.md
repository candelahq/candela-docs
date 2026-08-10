---
title: "The AI Cost Problem Nobody's Tracking"
date: 2026-08-09
authors:
  - candela
tags:
  - ai
  - cost-tracking
  - opensource
  - devops
excerpt: "Every major AI coding tool hides your costs. Here's why that matters and what you can do about it."
---

Open Claude Code. Open Cursor. Open Windsurf. Open Copilot.

Now tell me: how much did your last coding session cost?

You can't. None of them show you.

## The Visibility Gap

AI coding tools have a strange relationship with money. They charge you — sometimes per-seat, sometimes per-token, sometimes through your API key — but they never show you what individual sessions, requests, or tasks actually cost.

Here's what the pricing pages tell you:

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Claude Sonnet 4 | $3.00 | $15.00 |
| GPT-4.1 | $2.00 | $8.00 |
| Gemini 2.5 Pro | $1.25 | $10.00 |

Here's what they don't tell you: how many tokens a typical coding session actually uses. A file read is ~1K tokens. A grep across a codebase is ~5K. A 10-round debug loop with full context replay can hit 200K+. You're multiplying these prices by numbers you can't see.

The result: monthly invoices that are either a relief or a surprise, with no way to understand what drove them.

## Why This Matters

For solo developers, it's an annoyance. For teams, it's a budget problem.

Consider:
- **No per-session attribution.** You can't tell which task or feature drove a cost spike.
- **No per-user visibility.** Engineering managers see a total bill, not per-engineer spend.
- **No budget enforcement.** There's no way to set a daily limit and have the tool respect it.
- **No model efficiency data.** Are you using Opus for tasks where Haiku would suffice? You'll never know.

Cloud computing went through this exact phase. Early AWS bills were a mystery. Then tools like CloudWatch, Cost Explorer, and third-party observability platforms matured. Teams got visibility, set budgets, and optimized.

LLM spend is where cloud spend was in 2010. The tools don't exist yet.

## Building the Missing Layer

That's why we're building [Candela](https://github.com/candelahq/candela) — an open-source LLM observability proxy.

The idea is simple: Candela sits between your AI tool and your LLM provider. Every request passes through, gets logged with cost/latency/token data, and continues to its destination. No code changes, no SDK integration, no vendor lock-in.

```
AI Tool  →  Candela Proxy  →  LLM Provider
                 ↓
          Cost per request
          Token counts
          Cache hit rates
          Model breakdown
          Budget enforcement
```

It works with anything that speaks the OpenAI-compatible API format — which is most AI coding tools today.

## What You Get

**Per-request cost tracking.** Every API call is logged with input tokens, output tokens, model, latency, and computed cost. Not estimated — computed from the actual token counts × the model's pricing.

**Budget enforcement.** Set a daily spending limit. When you hit it, Candela can warn you or block requests. No more surprise invoices.

**Model analytics.** See which models you're using, how often, and what they cost. Spot the $15/day Claude Opus habit when Sonnet would work.

**Cache monitoring.** Prompt caching can cut costs 50-90% — but only if you know your hit rate. Candela tracks cache read/write tokens per request.

## The OpenCode Plugin

We built a plugin that surfaces Candela data directly in [OpenCode](https://opencode.ai):

```bash
opencode plugin @candelahq/opencode
```

It gives you 7 AI tools (so you can ask "how much have I spent today?" in natural language) and 13 slash commands (`/cost`, `/budget`, `/export`, etc.).

The plugin is open source: [`@candelahq/opencode`](https://www.npmjs.com/package/@candelahq/opencode) on npm.

## Get Involved

If you're using AI coding tools professionally, you should know what they cost. Candela is early, open source, and free.

- ⭐ [Star the repo](https://github.com/candelahq/candela)
- 📖 [Read the docs](https://candelahq.github.io/candela-docs/)
- 💬 Open an issue if you want support for your tool/workflow
