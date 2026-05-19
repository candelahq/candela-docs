---
title: Claude Code
description: Connect Claude Code to Candela for traced AI coding sessions.
---

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) is Anthropic's agentic coding tool that runs in your terminal. It uses the Anthropic Messages API and can be pointed at Candela via the `ANTHROPIC_BASE_URL` environment variable.

## Configuration

Claude Code supports three routing modes through Candela, depending on your authentication setup:

### Option A: Via Vertex AI (Recommended for GCP users)

Route through Candela using your existing Google ADC credentials — no Anthropic API key needed:

```bash
export ANTHROPIC_BASE_URL="http://localhost:8181/proxy/anthropic-vertex"
```

:::tip[Authentication]
This route uses Google Application Default Credentials (ADC). Run `candela auth login` once, and Candela handles the rest — no `gcloud` CLI needed.
:::

### Option B: Direct to Anthropic API

Route through Candela using your own Anthropic API key:

```bash
export ANTHROPIC_BASE_URL="http://localhost:8181/proxy/anthropic-direct"
export ANTHROPIC_API_KEY="sk-ant-..."
```

This mode passes your API key through to `api.anthropic.com` — Candela captures the trace but doesn't handle authentication.

### Option C: Via AWS Bedrock

Route through Candela using your AWS credentials with SigV4 authentication:

```bash
export ANTHROPIC_BASE_URL="http://localhost:8181/proxy/anthropic-bedrock"
```

:::tip[Authentication]
Run `candela auth login --provider aws` to validate your AWS credentials. Candela uses your existing AWS credential chain (env vars, `~/.aws/credentials`, SSO) and handles SigV4 request signing automatically.
:::

## Full Setup

1. **Authenticate**:
   ```bash
   # GCP (for Vertex AI routes)
   candela auth login

   # AWS (for Bedrock route)
   candela auth login --provider aws
   ```

2. **Start candela**:
   ```bash
   candela start
   ```

3. **Set the environment variable** (add to your shell profile for persistence):
   ```bash
   # In ~/.zshrc or ~/.bashrc — pick ONE based on your provider:
   export ANTHROPIC_BASE_URL="http://localhost:8181/proxy/anthropic-vertex"   # GCP
   export ANTHROPIC_BASE_URL="http://localhost:8181/proxy/anthropic-bedrock"  # AWS
   export ANTHROPIC_BASE_URL="http://localhost:8181/proxy/anthropic-direct"   # Direct API key
   ```

4. **Run Claude Code** as usual:
   ```bash
   claude
   ```

   Every LLM request from Claude Code now flows through Candela with full observability.

5. **View traces** at `http://localhost:8181/_local/` — see token counts, cost, latency, and full request/response content for every Claude Code interaction.

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
| `/proxy/anthropic-bedrock` | AWS SigV4 | AWS users with Bedrock model access |
| `/proxy/anthropic-direct` | Anthropic API key | Direct Anthropic account holders |
| `/proxy/anthropic` | Google ADC | Legacy route — translates to OpenAI format internally |

:::note[Which route should I use?]
- **GCP**: Use `anthropic-vertex` — native Messages API with zero translation overhead.
- **AWS**: Use `anthropic-bedrock` — Candela handles SigV4 signing and Bedrock model ID mapping.
- **Direct Anthropic account**: Use `anthropic-direct` — passes your API key through.
:::

## Enterprise: Transparent Proxy Mode

In Kubernetes environments with [eBPF enforcement](/governance/ebpf-enforcement/) enabled, Claude Code traffic is automatically intercepted and routed through the Candela sidecar — no `ANTHROPIC_BASE_URL` configuration needed.

The sidecar uses SNI-based routing to identify connections to `api.anthropic.com` or `*.aiplatform.googleapis.com` and transparently proxies them through Candela's observability and policy pipeline.

This ensures **every** Claude Code request is traced and budget-enforced, even if a developer forgets to set the environment variable.

## Using with candela-sidecar

In production container environments, point Claude Code at the sidecar instead:

```bash
export ANTHROPIC_BASE_URL="http://localhost:8080/proxy/anthropic-vertex"
```

The sidecar provides the same proxy routes with async span export via Pub/Sub or OTLP.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `401 Unauthorized` | Missing or expired credentials | Run `candela auth login` (GCP) or `candela auth login --provider aws` (AWS) |
| `403 Forbidden` | Claude models not enabled | Enable Claude in [Vertex AI Model Garden](https://console.cloud.google.com/vertex-ai/model-garden) (GCP) or [Bedrock Model Access](https://console.aws.amazon.com/bedrock) (AWS) |
| Claude Code ignores `ANTHROPIC_BASE_URL` | Env var not exported to shell session | Add `export` to your shell profile and restart terminal |
| Cost shows $0.00 | Model not in pricing table | Check server logs; add model to `pricing.models` in config |
| Traces not appearing | candela not running | Run `candela status` to verify, then `candela start` |
| `InvalidSignatureException` (Bedrock) | Clock skew or wrong region | Verify `aws.region` in config matches Bedrock availability |
