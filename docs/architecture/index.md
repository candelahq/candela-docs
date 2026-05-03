# Architecture

## Overview

Candela uses a **CQRS (Command Query Responsibility Segregation)** storage architecture. This separates write and read concerns into distinct interfaces, enabling flexible multi-sink configurations.

## Interface Design

```go
// SpanWriter is a write-only destination for spans.
type SpanWriter interface {
    IngestSpans(ctx context.Context, spans []Span) error
    Ping(ctx context.Context) error
}

// SpanReader is a read-only source for querying spans and traces.
type SpanReader interface {
    GetTrace(ctx context.Context, traceID string) (*Trace, error)
    QueryTraces(ctx context.Context, query TraceQuery) (*TraceResult, error)
    SearchSpans(ctx context.Context, query SpanQuery) (*SpanResult, error)
    GetUsageSummary(ctx context.Context, query UsageQuery) (*UsageSummary, error)
    GetModelBreakdown(ctx context.Context, query UsageQuery) ([]ModelUsage, error)
    Ping(ctx context.Context) error
}

// TraceStore combines both for backends that support full read/write.
type TraceStore interface {
    SpanWriter
    SpanReader
}
```

## Data Flow

```
                    ┌─────────────┐
                    │  Proxy /    │
                    │  ConnectRPC │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    Span     │
                    │  Processor  │  ← batches spans, applies cost calc
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┬────────────┐
              ▼            ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  DuckDB  │ │ BigQuery │ │  Pub/Sub │ │   OTLP   │
        │ (Writer  │ │ (Writer  │ │ (Writer  │ │ (Writer  │
        │ + Reader)│ │ + Reader)│ │  Only)   │ │  Only)   │
        └──────────┘ └──────────┘ └──────────┘ └──────────┘
              │            │                        │
              ▼            ▼                        ▼
        ┌──────────────────────┐          ┌──────────────────┐
        │   Dashboard / API    │          │ External OTel    │
        │  (ConnectRPC + REST) │          │ (Datadog, Tempo, │
        │  ← reads from one   │          │  Jaeger, etc.)   │
        │    SpanReader        │          └──────────────────┘
        └──────────────────────┘
```

## Storage Backends

### DuckDB (Default)

**Best for**: Local dev, edge deployments, single-server production.

```yaml
storage:
  backend: "duckdb"
  duckdb:
    path: "candela.duckdb"
```

- **Driver**: `github.com/duckdb/duckdb-go/v2` (official)
- **Write API**: DuckDB `Appender` (columnar batch insert, not SQL INSERT)
- **Schema**: OLAP-optimized — no `PRIMARY KEY` (duplicates rare, handled at query time)
- **Attributes**: `ARRAY<STRUCT<key VARCHAR, value VARCHAR>>`

### SQLite

**Best for**: Lightweight development, embedded testing.

```yaml
storage:
  backend: "sqlite"
  sqlite:
    path: "candela.db"  # or ":memory:" for ephemeral
```

- **Driver**: `modernc.org/sqlite` (pure Go, CGO-free)
- **Write API**: Batched SQL INSERT with transaction wrapping
- **Attributes**: JSON-serialized `TEXT` column

### BigQuery

**Best for**: Production at scale, serverless analytics.

```yaml
storage:
  backend: "bigquery"
  bigquery:
    project_id: "my-gcp-project"
    dataset: "candela"
    table: "spans"       # default
    location: "US"       # default
```

- **Driver**: `cloud.google.com/go/bigquery`
- **Write API**: Streaming insert with dedup keys (`trace_id-span_id`)
- **Schema**: Auto-provisioned with time partitioning (`start_time`, DAY) and clustering (`project_id`, `trace_id`)
- **Auth**: Application Default Credentials (ADC)

### Pub/Sub (Sink Only)

**Best for**: Event-driven fan-out to downstream consumers.

```yaml
sinks:
  pubsub:
    enabled: true
    project_id: "my-gcp-project"
    topic: "candela-spans"
```

!!! note
    Write-only `SpanWriter` — does NOT implement `SpanReader`.

### OTLP Export (Sink Only)

**Best for**: Forwarding traces to any OpenTelemetry-compatible backend (Datadog, Grafana Tempo, Jaeger, Elastic, Honeycomb, etc.).

```yaml
sinks:
  otlp:
    enabled: true
    endpoint: "http://localhost:4318/v1/traces"
    protocol: "http"
    compression: "gzip"
    timeout_sec: 30
    required: false
    headers:
      Authorization: "Bearer <token>"
```

## Schema Design

All backends share the same logical schema:

| Column | DuckDB | BigQuery | SQLite |
|--------|--------|----------|--------|
| `span_id` | VARCHAR | STRING | TEXT |
| `trace_id` | VARCHAR | STRING | TEXT |
| `parent_span_id` | VARCHAR | STRING | TEXT |
| `name` | VARCHAR | STRING | TEXT |
| `gen_ai_model` | VARCHAR | STRING | TEXT |
| `gen_ai_provider` | VARCHAR | STRING | TEXT |
| `gen_ai_input_tokens` | BIGINT | INT64 | INTEGER |
| `gen_ai_output_tokens` | BIGINT | INT64 | INTEGER |
| `gen_ai_cost_usd` | DOUBLE | FLOAT64 | REAL |
| `attributes` | STRUCT[] | STRUCT[] | TEXT (JSON) |

### Key Design Decisions

1. **No PRIMARY KEY** (DuckDB/BigQuery): OLAP convention. Duplicates are rare in tracing and handled at query time.
2. **Structured attributes** (DuckDB/BigQuery): `ARRAY<STRUCT<key, value>>` instead of JSON enables efficient per-key filtering.
3. **Time partitioning** (BigQuery): `start_time` partitioned by DAY reduces scan costs.
4. **Clustering** (BigQuery): `(project_id, trace_id)` optimizes the two most common access patterns.

## Adding a New Backend

1. Create `pkg/storage/mybackend/mybackend.go`
2. Implement `storage.SpanWriter` (minimum) or `storage.TraceStore` (full)
3. Add config struct and `initStorage` case in `cmd/candela-server/main.go`
4. For write-only sinks, add to the `sinks` config section instead
