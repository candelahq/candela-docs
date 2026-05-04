---
title: candela-desktop
description: Flutter desktop app for provider management and trace visualization.
---

Candela Desktop is a Flutter-based desktop application for managing LLM providers and visualizing distributed traces.

## Features

| Feature | Description |
|---------|-------------|
| **Provider Management** | Add, configure, and switch between LLM providers |
| **Trace Viewer** | Visualize distributed traces with span details |
| **Cost Monitoring** | Track token usage and estimated costs per request |
| **Secure Storage** | API keys stored in the OS keychain (macOS Keychain, Windows DPAPI, Linux libsecret) |
| **Dark/Light Mode** | Adaptive UI with system theme detection |

## Installation

Download the latest release for your platform from [GitHub Releases](https://github.com/candelahq/candela-desktop/releases).

| Platform | Format |
|----------|--------|
| macOS | `.dmg` |
| Linux | `.AppImage` |
| Windows | `.exe` installer |

## Provider Configuration

Candela Desktop supports multiple LLM providers:

- **OpenAI** — GPT-4o, GPT-4, GPT-3.5
- **Google Gemini** — Gemini 2.5 Pro, Gemini 2.0 Flash
- **Anthropic** — Claude Sonnet, Claude Haiku
- **Ollama** — Local models (auto-discovered)
- **LM Studio** — Local models via OpenAI-compatible API

Each provider is configured with:
- Display name and endpoint URL
- API key (securely stored in OS keychain)
- Model selection and parameters
- Optional proxy routing through candela-local or candela-sidecar

## Trace Viewer

The trace viewer displays a waterfall view of distributed traces:

- **Span hierarchy** — Nested tree showing parent/child relationships
- **Timing** — Start time, duration, and TTFB for each span
- **Token counts** — Input and output tokens per LLM call
- **Cost** — Estimated cost based on provider pricing
- **Attributes** — Full span attributes including model, provider, and custom metadata

## Development

```bash
git clone https://github.com/candelahq/candela-desktop.git
cd candela-desktop
flutter pub get
flutter run -d macos  # or linux, windows
```

## Related

- [candela-local](/candela-docs/components/candela-local/) — Local proxy that Desktop can connect to
- [candela-server](/candela-docs/components/candela-server/) — Cloud backend for team features
