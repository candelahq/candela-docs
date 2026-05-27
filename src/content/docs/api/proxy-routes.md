---
title: Proxy Routes
description: API reference for Candela proxy endpoints.
---

All Candela proxy components (`candela`, `candela-server`, `candela-sidecar`) expose the same route structure.

## Provider Routes

| Route | Provider | Format | Auth |
|-------|----------|--------|------|
| `/proxy/google/*` | Google Gemini | Native Gemini API | ADC |
| `/proxy/gemini-oai/*` | Gemini (OpenAI-compatible) | OpenAI Chat Completions | ADC |
| `/proxy/openai/*` | OpenAI | OpenAI Chat Completions | API key |
| `/proxy/anthropic/*` | Anthropic (via Vertex AI) | Messages API (Legacy/Translated) | ADC |
| `/proxy/anthropic-vertex/*` | Anthropic (via Vertex AI) | Native Messages API | ADC |
| `/proxy/anthropic-direct/*` | Anthropic (direct API) | Native Messages API | Anthropic API key |
| `/proxy/anthropic-bedrock/*` | Anthropic (via AWS Bedrock) | Native Messages API | AWS SigV4 |

## OpenAI-Compatible Endpoints

### Local (`candela` on `:1234`)

`candela` exposes an LM Studio-compatible endpoint on `:1234`:

| Route | Description |
|-------|-------------|
| `GET /v1/models` | List all available models (local + cloud merged) |
| `POST /v1/chat/completions` | Chat completions (auto-routes to correct backend) |

### Server (`candela-server` on `:8181`)

The Candela server also exposes OpenAI-compatible endpoints. The model list is **auto-derived from the pricing table** — every model with a pricing entry is available:

| Route | Description |
|-------|-------------|
| `GET /v1/models` | List all server-known models (derived from pricing table) |
| `POST /v1/chat/completions` | Chat completions (routes to the correct upstream provider) |

## Health Check

```
GET /healthz
```

Returns `200 OK` with `{"status": "ok"}`.

## Management API (candela only)

| Route | Description |
|-------|-------------|
| `GET /_local/` | Management UI |
| `GET /_local/api/traces` | Recent traces (default: 50, max: 200) |
| `GET /_local/api/health` | Runtime health status |
| `POST /_local/api/pull` | Pull a model from Ollama |
| `POST /_local/api/start` | Start the runtime backend |
| `POST /_local/api/stop` | Stop the runtime backend |
| `GET /_local/api/config` | Runtime configuration (cache TTL, Gemini cache price multiplier) |
| `POST /_local/api/config` | Update runtime configuration |

### Example: Query Traces

```bash
curl http://localhost:8181/_local/api/traces?limit=20
```

```json
{
  "spans": [
    {
      "span_id": "abc123...",
      "model": "llama3.2:3b",
      "provider": "local",
      "input_tokens": 150,
      "output_tokens": 42,
      "total_tokens": 192,
      "cost_usd": 0.0,
      "duration_ms": 1230,
      "status": "ok",
      "timestamp": "2026-04-19T22:15:00Z"
    }
  ],
  "count": 1
}
```

## Headers

### Request Headers

| Header | Description |
|--------|-------------|
| `Authorization` | `Bearer <token>` — Required for candela-server (OIDC ID token or OAuth2 access token) |
| `Proxy-Authorization` | `Bearer <oidc-token>` — IAP authentication token (impersonated SA OIDC). Used when connecting through IAP; IAP validates this header instead of `Authorization` |
| `X-Candela-Auth` | `Bearer <access-token>` — Developer's OAuth2 access token for user identity behind IAP. **Takes priority** over `Authorization` when present |
| `traceparent` | W3C Trace Context — enables unified trace trees |
| `tracestate` | W3C Trace State — forwarded to upstream |

:::note[IAP dual-token flow]
Behind IAP, the `Authorization` header is replaced by IAP's own JWT. `candela` sends the developer's real identity via `X-Candela-Auth`, which the server checks **first**. If absent, the server falls back to the `Authorization` header. See [Security — Dual-Token Auth](/architecture/security/#strategy-15-dual-token-for-iap-user-adc--iap_service_account) for the full flow.
:::

### Response Headers

| Header | Description |
|--------|-------------|
| `X-Candela-Span-Id` | Span ID for this proxy request |
| `X-Candela-Trace-Id` | Trace ID (matches caller's if `traceparent` was provided) |
