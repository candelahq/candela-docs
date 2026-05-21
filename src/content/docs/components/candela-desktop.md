---
title: candela-desktop
description: Flutter desktop app for provider management, trace visualization, and CLI lifecycle management.
---

Candela Desktop is a native application for managing LLM providers, visualizing distributed traces, and orchestrating the `candela` CLI proxy.

## Features

| Feature | Description |
|---------|-------------|
| **Today View** | At-a-glance dashboard showing today's LLM spend, request count, and top models — auto-refreshes every 30s |
| **Provider Dashboard** | Connect and monitor OpenAI, Google Gemini, Anthropic (Vertex), Ollama, vLLM, LM Studio |
| **Traces Screen** | Full-screen trace browser with search, filtering, and span-level detail — mirrors the web UI |
| **Trace Viewer** | Waterfall view with span hierarchy, timing, token counts, and cost |
| **Config Editor** | Live YAML editor for `~/.config/candela/config.yaml` with validation |
| **Mode Switcher** | Toggle between Solo, Solo + Cloud, and Team modes |
| **Auto-Start Proxy** | Starts the `candela` CLI proxy on launch if installed but not running |
| **CLI Install/Upgrade** | Detects missing CLI, offers one-click `brew install`, shows upgrade banners |
| **Self-Update** | Upgrade Desktop via `brew upgrade --cask` from the system tray |
| **Dark/Light Mode** | Adaptive UI with system theme detection |
| **Secure Storage** | API keys stored in the system's secure storage (macOS Keychain, Windows DPAPI, or Linux libsecret) |

## Installation

### macOS (Recommended)

```bash
brew install --cask candelahq/tap/candela-desktop
```

:::tip
The Homebrew cask handles Gatekeeper quarantine automatically. If you download the `.dmg` manually, you may need to run `xattr -cr /Applications/Candela.app`.
:::

### All Platforms

Download the latest release from [GitHub Releases](https://github.com/candelahq/candela-desktop/releases).

| Platform | Format |
|----------|--------|
| macOS | `.dmg` |
| Linux | `.AppImage` |
| Windows | `.exe` installer |

## CLI Integration

Candela Desktop works best alongside the [`candela` CLI](/components/candela/):

```bash
brew install candelahq/tap/candela
```

On launch, Desktop automatically:

1. **Detects** whether the `candela` CLI is installed via Homebrew
2. **Installs** it with a one-click banner if missing
3. **Starts** the proxy in the background if installed but not running
4. **Checks for updates** and shows an upgrade banner when a newer CLI version is available

### Self-Update

The Desktop app can upgrade itself from the system tray menu:
- **Tray → Check for Updates** — runs `brew upgrade --cask candelahq/tap/candela-desktop` and relaunches

## Provider Configuration

Candela Desktop supports multiple LLM providers:

- **OpenAI** — GPT-4o, GPT-4, GPT-3.5
- **Google Gemini** — Gemini 2.5 Pro, Gemini 2.0 Flash
- **Anthropic** — Claude Sonnet, Claude Haiku (via Vertex AI)
- **Ollama** — Local models (auto-discovered)
- **LM Studio** — Local models via OpenAI-compatible API

Each provider is configured with:
- Display name and endpoint URL
- API key (securely stored in OS keychain)
- Model selection and parameters
- Optional proxy routing through candela or candela-sidecar

## Trace Viewer

The trace viewer displays a waterfall view of distributed traces:

- **Span hierarchy** — Nested tree showing parent/child relationships
- **Timing** — Start time, duration, and TTFB for each span
- **Token counts** — Input and output tokens per LLM call
- **Cost** — Estimated cost based on provider pricing
- **Attributes** — Full span attributes including model, provider, and custom metadata

## Architecture

### State Management

Candela Desktop uses [Riverpod 3.x](https://riverpod.dev) with `@riverpod` code generation for all state management. The provider hierarchy flows from configuration → services → controllers:

| Layer | Examples | Role |
|-------|----------|------|
| **Config Providers** | `candelaHostProvider`, `configProvider` | Environment and user settings |
| **Service Providers** | `connectApiServiceProvider`, `cliServiceProvider` | RPC clients and system integration |
| **State Controllers** | `DashboardController`, `TracesNotifier` | Async state that drives the UI |

**`DashboardController`** is the central state controller — a class-based `@riverpod` Notifier that provides:
- **Reactive polling** — auto-rebuilds when upstream providers change
- **Immutable state snapshots** — all updates use `state.copyWith()`
- **Disposal guards** — prevents state mutation after `ref.onDispose()`
- **Imperative bridge** — `onStateChanged()` callback for non-widget consumers (e.g., system tray)

All UI screens consume state via `ref.watch(dashboardControllerProvider)` — no `ListenableBuilder` or manual listeners.

### RPC Layer

Desktop communicates with the `candela` proxy via [ConnectRPC](https://connectrpc.com). Dart stubs are generated from protobuf definitions hosted on the Buf Schema Registry (BSR):

```bash
buf generate   # requires buf + BUF_TOKEN
```

### Authentication

Desktop uses `CandelaAuthService` for native Application Default Credentials (ADC) authentication:
- Reads credentials directly from `~/.config/gcloud/application_default_credentials.json` (macOS/Linux)
- Windows ADC support is welcome (see [#82](https://github.com/candelahq/candela-desktop/issues/82)) — the expected path is `%APPDATA%\gcloud\application_default_credentials.json`
- Refreshes access tokens against `oauth2.googleapis.com`
- No dependency on the `gcloud` CLI

### Testing

```bash
flutter test                     # ~855 unit + widget tests
flutter test integration_test/   # E2E (requires macOS runner)
flutter analyze                  # static analysis + lint
```

The integration test suite covers app boot, dashboard empty state, onboarding flow, navigation, and settings.

## Upgrade

```bash
# Upgrade Desktop (macOS)
brew upgrade --cask candelahq/tap/candela-desktop

# Upgrade CLI
brew upgrade candelahq/tap/candela
```

## Development

```bash
git clone https://github.com/candelahq/candela-desktop.git
cd candela-desktop
flutter pub get
flutter run -d macos  # or linux, windows
```

## Related

- [candela](/components/candela/) — CLI proxy that Desktop auto-starts and manages
- [candela-server](/components/candela-server/) — Cloud backend for team features
