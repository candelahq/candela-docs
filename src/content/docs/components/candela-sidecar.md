---
title: candela-sidecar
description: Lightweight production proxy for container environments.
---

The Candela Sidecar is a lightweight Go proxy (< 5MB) built for production container environments. It provides LLM request proxying, OpenTelemetry tracing, cost calculation, and budget enforcement with minimal overhead.

## Key Features

- **Zero-config GCP auth** via Application Default Credentials (ADC)
- **W3C Trace Context propagation** — `traceparent`/`tracestate` headers
- **Async span export** via Google Cloud Pub/Sub or OTLP
- **Cost calculation** with the shared `costcalc` engine
- **Budget enforcement** via Firestore
- **Single static binary** — < 5MB, no runtime dependencies

## Supported Providers

| Route | Provider | Auth |
|-------|----------|------|
| `/proxy/google/*` | Google Gemini (native format) | ADC |
| `/proxy/openai/*` | OpenAI API | API key in config |
| `/proxy/anthropic/*` | Anthropic (via Vertex AI) | ADC |

## Configuration

Environment variables:

| Variable | Required | Description |
|----------|:--------:|-------------|
| `GCP_PROJECT` | ✅ | GCP project for Vertex AI and Pub/Sub |
| `GCP_REGION` | | Vertex AI region (default: `us-central1`) |
| `PUBSUB_TOPIC` | | Pub/Sub topic for span export |
| `OTLP_ENDPOINT` | | OTLP HTTP endpoint for span export |
| `PORT` | | Listen port (default: `8080`) |
| `FIRESTORE_DB` | | Firestore database for budget enforcement |

## Deployment

### Docker

```bash
docker run -p 8080:8080 \
  -e GCP_PROJECT=my-project \
  -e PUBSUB_TOPIC=candela-spans \
  ghcr.io/candelahq/candela-sidecar:latest
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      containers:
        - name: app
          image: my-app:latest
          env:
            - name: LLM_BASE_URL
              value: "http://localhost:8080/proxy/google"
        - name: candela-sidecar
          image: ghcr.io/candelahq/candela-sidecar:latest
          ports:
            - containerPort: 8080
          env:
            - name: GCP_PROJECT
              value: my-project
            - name: PUBSUB_TOPIC
              value: candela-spans
          resources:
            requests:
              memory: "32Mi"
              cpu: "50m"
            limits:
              memory: "64Mi"
              cpu: "100m"
```

### Cloud Run (Multi-Container)

```yaml
# service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: my-service
spec:
  template:
    spec:
      containers:
        - image: my-app:latest
          ports:
            - containerPort: 3000
        - image: ghcr.io/candelahq/candela-sidecar:latest
          env:
            - name: GCP_PROJECT
              value: my-project
```

## Sidecar vs. Server

| | `candela-sidecar` | `candela-server` |
|-|-------------------|------------------|
| **Best for** | Containers, CI, production | Local dev with UI |
| **Size** | < 5MB binary | Full server |
| **Storage** | Pub/Sub + OTLP export | DuckDB, SQLite, BigQuery |
| **Budget enforcement** | Yes (via Firestore) | Yes (via local store) |
| **UI** | None | Dashboard at `:3000` |
| **Default port** | `:8080` | `:8181` |

## Health Check

```bash
curl http://localhost:8080/healthz
```

## Related

- [ADK Integration](/candela-docs/guides/adk-integration/) — Route ADK agents through the sidecar
- [Architecture](/candela-docs/architecture/storage/) — Storage backend details
