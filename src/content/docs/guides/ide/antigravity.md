---
title: Antigravity CLI (agy)
description: Observability options for Google's Antigravity coding agent with Candela.
---

[Antigravity CLI (`agy`)](https://cloud.google.com/antigravity) is Google's terminal-based agentic coding assistant powered by Gemini. It uses the Cloud Code backend and Vertex AI for model inference.

## Architecture

Unlike tools such as [Claude Code](/guides/ide/claude-code/) or [OpenCode](/guides/ide/opencode/) that make **direct API calls** to LLM providers, Antigravity uses a managed backend:

```
┌─────────┐     TLS      ┌─────────────────────────┐    internal    ┌───────────────┐
│  agy    │ ──────────── │  cloudcode-pa            │ ────────────  │  Vertex AI    │
│  CLI    │              │  .googleapis.com         │               │  (Gemini)     │
└─────────┘              └─────────────────────────┘               └───────────────┘
```

The CLI authenticates via Google OAuth / ADC, sends requests to `cloudcode-pa.googleapis.com`, which then orchestrates the actual Gemini model calls on Google's infrastructure. This means the LLM inference traffic never leaves Google's network from the client's perspective.

:::caution[Direct proxy routing is not supported]
Because `agy` does not expose a configurable API base URL (unlike `ANTHROPIC_BASE_URL` for Claude Code), you cannot redirect its traffic through Candela's reverse proxy routes like `/proxy/google/`.

Setting `HTTPS_PROXY` to route through Candela will break the OAuth authentication flow.
:::

## What Works Today

### Transparent Proxy (Linux / Kubernetes only)

In Linux environments with [eBPF enforcement](/governance/ebpf-enforcement/) or iptables rules, Candela's transparent proxy can intercept connections to `*-aiplatform.googleapis.com` via SNI matching. This captures Vertex AI traffic from **any** tool — including workloads where `agy` triggers downstream Vertex AI calls.

However, `agy`'s primary traffic flows to `cloudcode-pa.googleapis.com` (not directly to `aiplatform.googleapis.com`), so the transparent proxy will not intercept the CLI's own requests.

### Companion Observability

You can run Candela alongside `agy` to observe your broader LLM spend across other tools. For example, if you use both `agy` and Claude Code:

```bash
# Claude Code traffic → full Candela observability
export ANTHROPIC_BASE_URL="http://localhost:8181/proxy/anthropic-vertex"

# agy traffic → observed via Google Cloud billing/usage
agy
```

This gives you unified cost visibility for the tools that support proxy routing, while `agy` spend is tracked through Google Cloud's native billing.

### Using Candela as an MCP Server

Antigravity supports [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers. You could expose Candela's observability data as an MCP tool, allowing `agy` to **query** its own team's LLM usage:

```json title="~/.gemini/settings.json"
{
  "mcpServers": {
    "candela": {
      "command": "candela",
      "args": ["mcp-server"]
    }
  }
}
```

:::note
The Candela MCP server is on the roadmap and not yet available. This would enable `agy` to access spend dashboards, trace data, and budget status directly within coding sessions.
:::

## Future Integration

Full observability of `agy` traffic through Candela requires one of:

1. **`agy` adds a configurable API endpoint** — Similar to `ANTHROPIC_BASE_URL` or Cursor's `overrideApiBaseUrl`, this would allow routing requests through `http://localhost:8181/proxy/google/`.

2. **Candela MCP server** — Expose observability queries, budget checks, and trace data as MCP tools that `agy` can call directly.

3. **Google Cloud audit integration** — Use Cloud Audit Logs or Vertex AI usage exports to ingest `agy` telemetry into Candela's storage layer for unified dashboarding.

## Configuration Reference

Antigravity CLI stores its configuration at:

| File | Purpose |
|------|---------|
| `~/.gemini/antigravity-cli/settings.json` | CLI preferences, GCP project, location |
| `~/.gemini/settings.json` | Shared settings including MCP server definitions |
| `~/.gemini/antigravity-cli/mcp/` | MCP server tool schemas |

### Current Settings

The `agy` CLI uses the following key settings:

```json title="~/.gemini/antigravity-cli/settings.json"
{
  "gcp": {
    "project": "your-gcp-project",
    "location": "us"
  }
}
```

Model inference is routed through the Cloud Code backend to Vertex AI using the configured GCP project.

## Comparison with Other Tools

| Feature | Claude Code | OpenCode | Antigravity (agy) |
|---------|------------|----------|-------------------|
| Configurable API base URL | ✅ `ANTHROPIC_BASE_URL` | ✅ `baseURL` in config | ❌ Not available |
| Direct LLM API calls | ✅ Client → API | ✅ Client → API | ❌ Client → Cloud Code → Vertex AI |
| Candela proxy routing | ✅ Full support | ✅ Full support | ❌ Not supported |
| Transparent proxy (eBPF) | ✅ Intercepts `api.anthropic.com` | ✅ Intercepts provider APIs | ⚠️ Partial — only downstream Vertex AI calls |
| MCP server support | ❌ | ✅ Plugins | ✅ Native MCP support |
| Cost tracking | Via Candela | Via Candela | Via Google Cloud billing |

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `agy` returns empty output | Model not available in project | Check the log at `~/.gemini/antigravity-cli/log/` for `NOT_FOUND` errors; ensure the selected model is enabled in your GCP project |
| `HTTPS_PROXY` breaks authentication | OAuth flow intercepted by proxy | Remove `HTTPS_PROXY` when using `agy` — it does not support proxied authentication |
| `You are not logged into Antigravity` | Missing or expired OAuth session | Run `agy auth login` or re-authenticate via `gcloud auth login` |
| `NOT_FOUND` for model | Model preview not in project region | Update location in settings or request model access in [Vertex AI Model Garden](https://console.cloud.google.com/vertex-ai/model-garden) |
