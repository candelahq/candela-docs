---
title: OpenTelemetry
description: How Candela uses OpenTelemetry for distributed tracing.
---

Candela is built on OpenTelemetry (OTel) for distributed tracing. Every proxied LLM request creates an OTel span with semantic attributes following emerging GenAI observability conventions.

## Span Attributes

Every proxy span includes:

| Attribute | Example | Description |
|-----------|---------|-------------|
| `gen_ai.system` | `google` | Provider name |
| `gen_ai.request.model` | `gemini-2.0-flash` | Requested model |
| `gen_ai.usage.input_tokens` | `150` | Input token count |
| `gen_ai.usage.output_tokens` | `42` | Output token count |
| `gen_ai.response.model` | `gemini-2.0-flash` | Response model |
| `candela.cost_usd` | `0.0023` | Calculated cost |
| `candela.ttfb_ms` | `234` | Time to first byte |

## Export Methods

### OTLP

Send spans to any OTLP-compatible collector (Datadog, Grafana Tempo, Jaeger, Elastic, Honeycomb):

```yaml
# candela-sidecar env
OTLP_ENDPOINT: "http://localhost:4318/v1/traces"
```

### Google Cloud Pub/Sub

Async export for production GCP workloads:

```yaml
# candela-sidecar env
GCP_PROJECT: "my-project"
PUBSUB_TOPIC: "candela-spans"
```

### Stdout (Debug)

Print spans as JSON for local debugging:

```bash
candela-sidecar --export stdout
```

## W3C Trace Context

The sidecar supports full W3C Trace Context propagation:

1. **Incoming** — Extracts `traceparent` header from caller
2. **Span creation** — Uses caller's trace ID for unified trace tree
3. **Outgoing** — Forwards updated `traceparent` with sidecar's span ID to upstream provider

This enables unified traces across ADK → sidecar → LLM provider.

## Framework Instrumentation

| Framework | How to Integrate |
|-----------|-----------------|
| **Google ADK** | Set `base_url` + OTel env vars. See [ADK Integration](/candela-docs/guides/adk-integration/) |
| **LangChain** | Point `base_url` at Candela; enable `opentelemetry-instrumentation-httpx` |
| **LiteLLM** | Set `api_base` to Candela endpoint |
| **Raw HTTP** | Add `traceparent` header for trace correlation |
