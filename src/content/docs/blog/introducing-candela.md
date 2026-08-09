---
title: "Introducing Candela: Open-Source LLM Cost Tracking"
date: 2026-08-09
authors:
  - candela
tags:
  - announcement
  - llm
  - cost-tracking
excerpt: "AI coding agents are powerful — but expensive. Candela gives you real-time visibility into what you're spending, per model, per session, per team."
---

AI coding agents are transforming how developers work. Claude Code, OpenCode, Cursor, Windsurf — they can write, debug, and refactor code at superhuman speed.

But they're expensive. And most developers have no idea what they're spending.

## The Problem

A typical AI coding session costs $2–15 depending on the model, context length, and number of tool calls. Multiply that by a team of 10 engineers, 5 sessions a day, and you're looking at **$5,000–15,000/month** in LLM costs — often with zero visibility into where it's going.

Most teams discover this when the invoice arrives.

## What Candela Does

Candela is an open-source LLM observability proxy. It sits between your AI tools and your LLM providers, and gives you:

- **Real-time cost tracking** — see what every request costs as it happens
- **Budget enforcement** — set daily, weekly, or per-session spending limits
- **Model routing** — automatically suggest cheaper models when you're over budget
- **Per-user attribution** — know who's spending what
- **Cache analytics** — understand your prompt cache hit rates

## The OpenCode Plugin

We just shipped `@candelahq/opencode` v0.8.1 — a plugin that brings Candela directly into [OpenCode](https://opencode.ai). Install it with one command:

```bash
opencode plugin @candelahq/opencode
```

You get:
- 💰 **7 AI tools** — ask "how much have I spent today?" and the AI knows
- 📊 **13 slash commands** — `/cost`, `/budget`, `/models`, `/export`, and more
- 🧠 **Intelligence layer** — spending streaks, anomaly detection, budget pacing
- 🔀 **Smart routing** — cost-saving model suggestions when you're over budget

## Getting Started

1. Install Candela: `brew install candelahq/tap/candela`
2. Start the proxy: `candela start`
3. Add the plugin: `opencode plugin @candelahq/opencode`
4. Ask: "how much have I spent today?"

That's it. You'll never fly blind on AI costs again.

---

*Candela is open source. [Star us on GitHub](https://github.com/candelahq/candela) and join the community.*
