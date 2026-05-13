---
title: Cursor / Windsurf
description: Connect Cursor or Windsurf to Candela for traced AI coding sessions.
---

[Cursor](https://cursor.com) and [Windsurf](https://codeium.com/windsurf) are AI-native code editors that support custom API endpoints. Both can route LLM requests through Candela for full observability.

## Cursor

### OpenAI-Compatible Models (Gemini, Ollama)

1. Open **Settings → Models**
2. Add a new **OpenAI API** model:

| Setting | Value |
|---------|-------|
| **API Base** | `http://localhost:1234/v1` |
| **API Key** | `candela` |
| **Model** | `gemini-2.5-pro` (or any model from `/v1/models`) |

### Claude Models

Cursor has native Anthropic support. To route Claude through Candela:

1. Open **Settings → Models → Anthropic**
2. Set **API Base URL** to:
   ```
   http://localhost:8181/proxy/anthropic-direct
   ```
3. Enter your Anthropic API key

Or use the Vertex AI route (no API key needed):
   ```
   http://localhost:8181/proxy/anthropic-vertex
   ```

### Environment Variable (Alternative)

```bash
# Route all Cursor Anthropic requests through Candela
export ANTHROPIC_BASE_URL="http://localhost:8181/proxy/anthropic-vertex"
```

---

## Windsurf

Windsurf supports custom OpenAI-compatible endpoints:

1. Open **Settings → AI → Custom Model**
2. Configure:

| Setting | Value |
|---------|-------|
| **Base URL** | `http://localhost:1234/v1` |
| **API Key** | `candela` |
| **Model** | `gemini-2.5-pro` |

---

## What Gets Traced

Both editors generate many LLM calls during a single coding session — inline completions, chat, code actions, and multi-file edits. Candela captures all of them:

| Feature | Traced |
|---------|:------:|
| Chat / inline completions | ✅ |
| Multi-file edits | ✅ |
| Code explanations | ✅ |
| Terminal commands | ✅ |

Check `http://localhost:8181/_local/` to see per-request token counts, cost, and latency across your entire coding session.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Model dropdown empty | Cursor can't reach `/v1/models` | Verify `candela start` is running |
| "Invalid API key" | Cursor validates keys before use | Use `candela` as the key — it passes validation |
| High cost for completions | Many small requests add up | Check traces to identify chatty features |
| Traces not appearing | Wrong base URL | Use `:1234` for OpenAI-compat, `:8181/proxy/*` for provider-specific |
