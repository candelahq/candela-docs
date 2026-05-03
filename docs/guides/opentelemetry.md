# OpenTelemetry

Candela is built on OpenTelemetry (OTel) for distributed tracing. This guide covers how Candela uses OTel and how to integrate with your existing observability stack.

## How Candela Uses OpenTelemetry

The Candela Sidecar creates OTel spans for every proxied LLM request with semantic attributes following emerging [LLM observability conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/).

## Exporting Spans

### OTLP (Recommended)

Send spans to any OTLP-compatible collector:

```yaml
export:
  method: otlp
  otlp:
    endpoint: http://otel-collector:4317
    insecure: true
```

### Google Cloud Pub/Sub

For production GCP workloads, export spans asynchronously via Pub/Sub:

```yaml
export:
  method: pubsub
  pubsub:
    topic: projects/my-project/topics/candela-spans
```

### Stdout (Development)

Print spans to stdout for local debugging:

```yaml
export:
  method: stdout
```

## Integrating with Your Stack

Candela spans are standard OTel spans. They work with:

- **Jaeger** — Open-source distributed tracing
- **Google Cloud Trace** — Native GCP tracing
- **Grafana Tempo** — Scalable trace backend
- **Datadog** — Full observability platform
- **Honeycomb** — Event-driven observability

!!! note "Candela Desktop as a Viewer"
    Candela Desktop provides a purpose-built trace viewer for LLM traffic, but you can also export spans to any standard backend for organization-wide observability.
