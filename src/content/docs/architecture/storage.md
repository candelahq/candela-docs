---
title: Storage & CQRS Architecture
description: How Candela stores and queries trace data with a CQRS pattern.
---

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

- **Write API**: DuckDB `Appender` (columnar batch insert)
- **Attributes**: `ARRAY<STRUCT<key VARCHAR, value VARCHAR>>`
- **No PRIMARY KEY** — OLAP convention, duplicates rare

### SQLite

**Best for**: Lightweight development, embedded testing.

```yaml
storage:
  backend: "sqlite"
  sqlite:
    path: "candela.db"
```

- **Driver**: `modernc.org/sqlite` (pure Go, CGO-free)
- **Attributes**: JSON-serialized `TEXT` column

### BigQuery

**Best for**: Production at scale, serverless analytics.

```yaml
storage:
  backend: "bigquery"
  bigquery:
    project_id: "my-gcp-project"
    dataset: "candela"
    table: "spans"
    location: "US"
```

- **Write API**: Streaming insert with dedup keys
- **Partitioning**: `start_time` by DAY
- **Clustering**: `(project_id, trace_id)`
- **Auth**: Application Default Credentials

### Pub/Sub (Sink Only)

```yaml
sinks:
  pubsub:
    enabled: true
    project_id: "my-gcp-project"
    topic: "candela-spans"
```

:::note
Write-only `SpanWriter` — does NOT implement `SpanReader`.
:::

### OTLP Export (Sink Only)

Forward traces to any OpenTelemetry-compatible backend:

```yaml
sinks:
  otlp:
    enabled: true
    endpoint: "http://localhost:4318/v1/traces"
    protocol: "http"
    compression: "gzip"
```

## Schema

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

## Adding a New Backend

1. Create `pkg/storage/mybackend/mybackend.go`
2. Implement `storage.SpanWriter` (minimum) or `storage.TraceStore` (full)
3. Add config struct and `initStorage` case in `cmd/candela-server/main.go`
4. For write-only sinks, add to the `sinks` config section
