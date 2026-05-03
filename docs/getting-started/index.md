# Getting Started

Welcome to Candela! This guide will help you get up and running with LLM observability in minutes.

## What is Candela?

Candela is an open-source observability platform that gives you full visibility into your LLM traffic. It consists of two main components:

| Component | What it does |
|---|---|
| **Candela Desktop** | A Flutter desktop app for managing LLM providers, viewing traces, and monitoring costs |
| **Candela Sidecar** | A lightweight Go proxy (< 5MB) that intercepts, traces, and routes LLM requests |

## Choose Your Path

=== "Local Development"

    Use **Candela Desktop** to manage local LLM providers and view traces from your development machine.

    [Install Desktop →](installation.md)

=== "Production / Containers"

    Deploy the **Candela Sidecar** as a proxy next to your application containers for zero-touch LLM observability.

    [Deploy Sidecar →](../sidecar/deployment.md)

=== "Google ADK"

    Integrate Candela with your ADK agents for end-to-end distributed tracing.

    [ADK Integration →](../guides/adk-integration.md)

## Next Steps

1. [Install Candela](installation.md)
2. [Quick Start — Send your first traced request](quickstart.md)
3. [Explore the Desktop App](../desktop/index.md)
