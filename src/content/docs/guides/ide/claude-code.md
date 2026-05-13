---
title: Claude Code
description: Connect Claude Code to Candela for traced AI coding sessions.
---

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) is Anthropic's agentic coding tool that runs in your terminal. It uses the Anthropic Messages API and can be pointed at Candela via the `ANTHROPIC_BASE_URL` environment variable.

## Configuration

Claude Code supports two routing modes through Candela, depending on your authentication setup:

### Option A: Via Vertex AI (Recommended for GCP users)

Route through Candela using your existing Google ADC credentials — no Anthropic API key needed:

```bash
export ANTHROPIC_BASE_URL="http://localhost:8181/proxy/anthropic-vertex"
```

:::tip[Authentication]
This route uses Google Application Default Credentials (ADC) to authenticate with Vertex AI. Run `gcloud auth application-default login` once, and Candela handles the rest.
:::

### Option B: Direct to Anthropic API

Route through Candela using your own Anthropic API key:

```bash
export ANTHROPIC_BASE_URL="http://localhost:8181/proxy/anthropic-direct"
export ANTHROPIC_API_KEY="sk-ant-..."
```

This mode passes your API key through to `api.anthropic.com` — Candela captures the trace but doesn't handle authentication.

## Full Setup

1. **Start candela**:
   ```bash
   candela start
   ```

2. **Set the environment variable** (add to your shell profile for persistence):
   ```bash
   # In ~/.zshrc or ~/.bashrc
   export ANTHROPIC_BASE_URL="http://localhost:8181/proxy/anthropic-vertex"
   ```

3. **Run Claude Code** as usual:
   ```bash
   claude
   ```

   Every LLM request from Claude Code now flows through Candela with full observability.

4. **View traces** at `http://localhost:8181/_local/` — see token counts, cost, latency, and full request/response content for every Claude Code interaction.

## What Gets Traced

| Metric | Source |
|--------|--------|
| Token usage (input/output/cache) | Parsed from Anthropic response |
| Cost (USD) | Calculated by Candela's cost engine |
| Latency & TTFB | Measured at the proxy |
| Request/response content | Captured for debugging |
| Model name | Extracted from the request |

## Route Comparison

| Route | Auth | Use Case |
|-------|------|----------|
| `/proxy/anthropic-vertex` | Google ADC | GCP users with Vertex AI access — no API key needed |
| `/proxy/anthropic-direct` | Anthropic API key | Direct Anthropic account holders |
| `/proxy/anthropic` | Google ADC | Legacy route — translates to OpenAI format internally |

:::note[Which route should I use?]
If you have a GCP project with Claude models enabled in Vertex AI, use `anthropic-vertex`. It's the native Messages API format with zero translation overhead. If you have a direct Anthropic account, use `anthropic-direct`.
:::

## Using with candela-sidecar

In production container environments, point Claude Code at the sidecar instead:

```bash
export ANTHROPIC_BASE_URL="http://localhost:8080/proxy/anthropic-vertex"
```

The sidecar provides the same proxy routes with async span export via Pub/Sub or OTLP.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `401 Unauthorized` | Missing or expired ADC credentials | Run `gcloud auth application-default login` |
| `403 Forbidden` | Claude models not enabled in Vertex AI | Enable Claude in [Vertex AI Model Garden](https://console.cloud.google.com/vertex-ai/model-garden) |
| Claude Code ignores `ANTHROPIC_BASE_URL` | Env var not exported to shell session | Add `export` to your shell profile and restart terminal |
| Cost shows $0.00 | Model not in pricing table | Check server logs; add model to `pricing.models` in config |
| Traces not appearing | candela not running | Run `candela status` to verify, then `candela start` |
