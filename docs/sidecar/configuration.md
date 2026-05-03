# Sidecar Configuration

The Candela Sidecar is configured via environment variables or a YAML config file.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `CANDELA_PORT` | `8080` | Port the sidecar listens on |
| `CANDELA_PROVIDER` | `gemini` | Default LLM provider |
| `CANDELA_LOG_LEVEL` | `info` | Log level (`debug`, `info`, `warn`, `error`) |
| `CANDELA_EXPORT_METHOD` | `otlp` | Span export method (`otlp`, `pubsub`, `stdout`) |
| `CANDELA_PUBSUB_TOPIC` | — | Pub/Sub topic for span export |
| `CANDELA_OTLP_ENDPOINT` | — | OTLP collector endpoint |
| `CANDELA_BODY_LIMIT` | `10MB` | Maximum request body size |

## Config File

Alternatively, use a `candela.yaml`:

```yaml
server:
  port: 8080
  body_limit: 10MB

provider:
  default: gemini
  
export:
  method: otlp
  otlp:
    endpoint: http://otel-collector:4317
    insecure: true

logging:
  level: info
  format: json
```

!!! tip "Precedence"
    Environment variables take precedence over config file values.
