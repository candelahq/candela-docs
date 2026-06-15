---
title: Self-Hosting
description: Deploy Candela on your own infrastructure — Docker, Cloud Run, or Kubernetes.
---

Candela is designed to run on your infrastructure. This guide covers deploying the server with Docker Compose for local development, Cloud Run for production, and the full configuration reference.

## Prerequisites

Before deploying, ensure you have:

- **GCP project** with billing enabled
- **Firebase** project linked to your GCP project (for user management and Firestore)
- **APIs enabled** in your GCP project:
  - Vertex AI API (`aiplatform.googleapis.com`)
  - Cloud Firestore API (`firestore.googleapis.com`)
  - BigQuery API (`bigquery.googleapis.com`) — if using BigQuery storage
- **Docker** installed locally (for building images)
- **gcloud CLI** authenticated (`gcloud auth login`)

### Required IAM Roles

The service account running Candela needs these roles:

| Role | Purpose |
|------|---------|
| `roles/aiplatform.user` | Proxy requests to Vertex AI models |
| `roles/datastore.user` | Read/write Firestore (users, budgets, catalog) |
| `roles/bigquery.dataEditor` | Write spans to BigQuery (production storage) |
| `roles/bigquery.jobUser` | Run BigQuery queries (dashboard) |

---

## Quick Start with Docker Compose

The fastest way to run Candela locally:

```bash
# From the candela repo root
docker compose -f deploy/docker-compose.yml up
```

This starts the Candela server with:
- **DuckDB** storage (local file, no external dependencies)
- **Dev mode** auth (no Firebase token validation)
- **All proxy providers** enabled
- UI on `http://localhost:3000`, API on `http://localhost:8181`

Health check endpoint: `http://localhost:8181/readyz`

---

## Docker Image

Candela provides a multi-stage Dockerfile that builds the Go backend with DuckDB support:

```bash
# Build the server image
docker build -f deploy/Dockerfile -t candela-server .

# Run with DuckDB storage
docker run -p 8181:8181 \
  -e CANDELA_STORAGE_BACKEND=duckdb \
  candela-server
```

The image runs as a non-root `candela` user (CIS Docker Benchmark 4.1) and uses Debian Bookworm slim for glibc compatibility with DuckDB.

:::note
DuckDB requires glibc — Alpine/musl-based images are not supported.
:::

---

## Cloud Run Deployment

For production, deploy to Cloud Run with BigQuery storage:

### 1. Build and Push

```bash
# Build and push to Artifact Registry
gcloud builds submit \
  --tag us-docker.pkg.dev/YOUR_PROJECT/candela/candela-server:latest \
  --dockerfile deploy/Dockerfile
```

### 2. Deploy

```bash
gcloud run deploy candela-server \
  --image us-docker.pkg.dev/YOUR_PROJECT/candela/candela-server:latest \
  --region us-central1 \
  --port 8181 \
  --memory 1Gi \
  --cpu 2 \
  --min-instances 1 \
  --set-env-vars "\
CANDELA_STORAGE_BACKEND=bigquery,\
CANDELA_BQ_PROJECT=YOUR_PROJECT,\
CANDELA_BQ_DATASET=candela,\
CANDELA_BQ_LOCATION=US,\
CANDELA_PROXY_ENABLED=true,\
CANDELA_VERTEX_PROJECT=YOUR_PROJECT,\
CANDELA_VERTEX_REGION=us-east5,\
CANDELA_FIRESTORE_PROJECT=YOUR_PROJECT,\
CANDELA_FIRESTORE_DATABASE=candela,\
CANDELA_DEV_MODE=false,\
CANDELA_DEFAULT_DAILY_BUDGET=5.00"
```

### 3. Verify

```bash
curl https://candela-server-HASH-uc.a.run.app/readyz
# {"status":"ok"}
```

---

## Environment Variables

The entrypoint script generates `config.yaml` from environment variables at startup, so you never need to bake secrets into the image.

| Variable | Default | Description |
|----------|---------|-------------|
| `CANDELA_STORAGE_BACKEND` | `duckdb` | Storage backend: `duckdb`, `sqlite`, `bigquery` |
| `CANDELA_BQ_PROJECT` | _(empty)_ | BigQuery GCP project ID |
| `CANDELA_BQ_DATASET` | `candela` | BigQuery dataset name |
| `CANDELA_BQ_LOCATION` | `US` | BigQuery dataset location |
| `CANDELA_PROXY_ENABLED` | `false` | Enable the LLM proxy |
| `CANDELA_VERTEX_PROJECT` | _(empty)_ | Vertex AI GCP project ID |
| `CANDELA_VERTEX_REGION` | `us-east5` | Vertex AI region |
| `CANDELA_CACHING_MODE` | `auto` | Prompt caching: `off`, `auto`, `system-only` |
| `CANDELA_CACHE_TTL` | _(empty)_ | Vertex AI cache TTL (`5m` or `1h`) |
| `CANDELA_DEV_MODE` | `false` | Skip Firebase auth validation |
| `CANDELA_FIRESTORE_PROJECT` | _(empty)_ | Firestore GCP project ID |
| `CANDELA_FIRESTORE_DATABASE` | `candela` | Firestore database ID |
| `CANDELA_DEFAULT_DAILY_BUDGET` | `5.00` | Default daily budget for new users (USD) |
| `CANDELA_SERVICE_ACCOUNT` | _(empty)_ | Allowed service account email |
| `CANDELA_MISTRAL_REGION` | `us-central1` | Vertex AI region for Mistral models |

---

## Storage Backends

### DuckDB (Development)

DuckDB is an embedded OLAP database — no external services, high-performance analytics, single-file storage.

```yaml
storage:
  backend: "duckdb"
  duckdb:
    path: "candela.duckdb"
```

Best for: local development, single-user setups, demos.

### SQLite

```yaml
storage:
  backend: "sqlite"
  sqlite:
    path: "candela.db"  # Use ":memory:" for ephemeral
```

### BigQuery (Production)

BigQuery provides unlimited scale, built-in analytics, and integration with the GCP ecosystem.

```yaml
storage:
  backend: "bigquery"
  bigquery:
    project_id: "your-gcp-project-id"
    dataset: "candela"
    table: "spans"
    location: "US"
```

Best for: production, multi-user teams, long-term cost analytics.

---

## Full Configuration Reference

```yaml
# Candela Server Configuration
server:
  host: "0.0.0.0"
  port: 8181

storage:
  backend: "duckdb"              # duckdb | sqlite | bigquery
  duckdb:
    path: "candela.duckdb"
  sqlite:
    path: "candela.db"
  bigquery:
    project_id: ""
    dataset: "candela"
    table: "spans"
    location: "US"

proxy:
  enabled: true
  project_id: "default"
  vertex_ai:
    project_id: ""               # GCP project for Vertex AI
    region: "us-east5"           # Vertex AI region
    prompt_caching: true         # Enable Anthropic prompt caching
    cache_ttl: "5m"              # Cache TTL: "5m" or "1h"
    provider_overrides:          # Per-provider region overrides
      mistral:
        region: "us-central1"
  providers:                     # Enabled proxy providers
    - openai
    - google
    - anthropic
    - anthropic-vertex
    - anthropic-direct
    - anthropic-bedrock
    - gemini-oai
    - gemini-vertex
    - mistral
    - deepseek
    - qwen

  # Safety controls
  # max_request_cost_usd: 5.00  # Reject single requests above this cost
  # daily_limits:                # Per-model daily spend caps
  #   - model: "claude-opus-4"
  #     max_daily_usd: 50.00

  # Model allowlist
  # policy:
  #   allowed_models:
  #     - provider: openai
  #       models: ["gpt-4o", "gpt-4o-mini"]

cors:
  allowed_origins:
    - "http://localhost:3000"
    - "http://localhost:8181"

auth:
  dev_mode: false
  # allowed_service_accounts:
  #   - "candela-ci@project.iam.gserviceaccount.com"

catalog:
  backend: "config"              # config | firestore
  # firestore:
  #   collection: "model_catalog"
  #   project_id: ""

pricing:
  discount_percent: 0.0
  # models:
  #   - provider: openai
  #     model: gpt-4o
  #     input_per_million: 2.00
  #     output_per_million: 8.00

firestore:
  enabled: true
  project_id: ""
  database_id: "candela"

worker:
  batch_size: 100
  flush_interval: "2s"

users:
  default_daily_budget_usd: 5.00

# budget:
#   timezone: "America/New_York"

# Export sinks
# sinks:
#   otlp:
#     enabled: true
#     endpoint: "http://localhost:4318"
#     protocol: "http"
#     compression: "gzip"
#     timeout_sec: 30
```

---

## HTTPS and Custom Domains

### Cloud Run

Cloud Run provides HTTPS automatically. To use a custom domain:

```bash
gcloud run domain-mappings create \
  --service candela-server \
  --domain candela.example.com \
  --region us-central1
```

### Behind a Load Balancer

If running on GKE or Compute Engine, terminate TLS at the load balancer and proxy to Candela on port 8181.

---

## Monitoring and Health Checks

### Health Endpoint

Candela exposes `/readyz` for container orchestrator health checks:

```bash
curl http://localhost:8181/readyz
# {"status":"ok"}
```

The Docker Compose configuration includes a built-in health check:

```yaml
healthcheck:
  test: ["CMD", "wget", "-q", "-O", "/dev/null", "http://localhost:8181/readyz"]
  interval: 10s
  timeout: 5s
  retries: 5
```

### Structured Logging

Candela emits structured JSON logs compatible with Cloud Logging. Key log fields:

- `level` — `INFO`, `WARN`, `ERROR`
- `msg` — human-readable message
- `provider`, `model` — for proxy request logs
- `user_id` — for budget and auth events
- `cost_usd`, `tokens` — for cost tracking

### OTLP Export

Export spans to any OpenTelemetry-compatible backend (Datadog, Grafana Tempo, Jaeger, Honeycomb):

```yaml
sinks:
  otlp:
    enabled: true
    required: false                    # fail-open if collector is down
    endpoint: "http://localhost:4318"  # OTel Collector OTLP/HTTP endpoint
    protocol: "http"                   # "http" or "grpc"
    compression: "gzip"
    timeout_sec: 30
    headers:
      Authorization: "Bearer <token>"
```
