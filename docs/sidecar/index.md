# Candela Sidecar

The Candela Sidecar is a lightweight Go proxy (< 5MB) that intercepts LLM requests, adds OpenTelemetry tracing, and routes them to the configured provider.

## How It Works

```mermaid
sequenceDiagram
    participant App as Your Application
    participant Sidecar as Candela Sidecar
    participant LLM as LLM Provider
    participant Export as Span Exporter

    App->>Sidecar: LLM Request
    Sidecar->>Sidecar: Create trace span
    Sidecar->>LLM: Proxied request + traceparent
    LLM-->>Sidecar: Response
    Sidecar->>Sidecar: Record tokens, latency, cost
    Sidecar-->>App: Response
    Sidecar->>Export: Export span (async)
```

## Key Features

- **Zero-config GCP auth** — Automatic Application Default Credentials (ADC)
- **W3C Trace Context** — Full `traceparent`/`tracestate` propagation
- **Async span export** — Fire-and-forget via Pub/Sub or OTLP
- **Minimal footprint** — Single static binary, < 5MB

## Next Steps

- [Configuration](configuration.md) — Customize sidecar behavior
- [Deployment](deployment.md) — Run in production containers
