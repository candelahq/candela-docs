# Trace Viewer

The Trace Viewer provides a visual timeline of your LLM requests, showing the full lifecycle from your application through the Candela proxy to the LLM provider.

## Understanding Traces

Each trace represents a single LLM interaction and contains:

- **Spans** — Individual operations within the trace (proxy handling, auth, LLM call)
- **Attributes** — Metadata like model, token count, latency
- **Events** — Notable occurrences during the request

## Trace Attributes

| Attribute | Description |
|---|---|
| `llm.model` | The model used for the request |
| `llm.tokens.input` | Number of input tokens |
| `llm.tokens.output` | Number of output tokens |
| `llm.cost` | Estimated cost in USD |
| `llm.provider` | The upstream provider |
| `http.status_code` | Response status code |

!!! tip "W3C Trace Context"
    Candela propagates W3C `traceparent` and `tracestate` headers, so your application spans and Candela spans appear in the same trace tree.
