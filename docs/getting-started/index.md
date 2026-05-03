# Getting Started

Welcome to Candela! This guide will help you get up and running with LLM observability in minutes.

## What is Candela?

Candela is an open-source observability platform that gives you full visibility into your LLM traffic. It consists of four components:

| Component | What it does |
|---|---|
| **candela-local** | Developer proxy + runtime manager — run local & cloud models with observability from your machine |
| **candela-server** | Full backend — API server, LLM proxy, dashboard UI, deployed on Cloud Run |
| **candela-sidecar** | Lightweight production proxy (< 5MB) for containers — traces, cost, budget enforcement |
| **candela-desktop** | Flutter desktop app for managing providers and viewing traces |

## Choose Your Path

=== "Solo Developer"

    Use **candela-local** for instant LLM observability on your machine — local models via Ollama, cloud models via ADC, all traced to SQLite.

    ```bash
    go install github.com/candelahq/candela/cmd/candela-local@latest
    ```

    [candela-local docs →](../local/index.md)

=== "Team / Production"

    Deploy **candela-server** on Cloud Run with BigQuery storage, Firebase auth, and a dashboard UI. Developers connect via candela-local in Team Mode.

    [candela-server docs →](../server/index.md)

=== "Container Sidecar"

    Drop **candela-sidecar** next to your application containers for zero-touch LLM tracing in production.

    [candela-sidecar docs →](../sidecar/index.md)

=== "Google ADK"

    Integrate Candela with your ADK agents for end-to-end distributed tracing with W3C Trace Context propagation.

    [ADK Integration →](../guides/adk-integration.md)

## Next Steps

1. [Install Candela](installation.md)
2. [Quick Start — Send your first traced request](quickstart.md)
3. [Explore candela-local](../local/index.md)
