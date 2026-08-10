---
title: OpenCode
description: Connect OpenCode to Candela for traced AI coding sessions with real-time cost tracking, budget guardrails, and spending intelligence.
---

[OpenCode](https://github.com/opencode-ai/opencode) is a terminal-native AI coding agent with MCP support. It uses the OpenAI-compatible API and can be pointed at Candela with minimal config.

## Configuration

Edit your OpenCode config (`~/.config/opencode/config.json` or project-level `.opencode.json`):

```json
{
  "provider": {
    "name": "openai",
    "apiBase": "http://localhost:1234/v1",
    "apiKey": "candela",
    "model": "gemini-3.5-pro"
  }
}
```

### Using Cloud Models

For cloud models routed through candela in Solo + Cloud mode:

```json
{
  "provider": {
    "name": "openai",
    "apiBase": "http://localhost:1234/v1",
    "apiKey": "candela",
    "model": "gemini-3.5-pro"
  }
}
```

candela handles Vertex AI authentication via ADC — no API key needed.

### Using Local Models

For Ollama models running locally:

```json
{
  "provider": {
    "name": "openai",
    "apiBase": "http://localhost:1234/v1",
    "apiKey": "candela",
    "model": "llama3.2:3b"
  }
}
```

## Verifying

```bash
# Start candela
candela start

# In another terminal, start OpenCode
opencode

# Check traces at http://localhost:8181/_local/
```

Every prompt and response flows through Candela with full token counting and cost tracking.

---

## Official Candela Plugin (v0.8.2)

The official `@candelahq/opencode` plugin hooks directly into OpenCode's execution lifecycle to provide real-time cost visibility, budget guardrails, spending intelligence, and 13 slash commands — all inside your terminal.

[➡️ View on npm](https://www.npmjs.com/package/@candelahq/opencode) · [📦 GitHub](https://github.com/candelahq/opencode-candela)

### Features

| Category | What you get |
|:---|:---|
| 💰 **Real-Time Cost Tracking** | Per-response cost deltas, session totals, and 24h spend in status bar and sidebar |
| 📊 **Budget Monitoring** | Threshold toasts at 80/90/100%, budget pacing forecast, reset countdown |
| 🔀 **Smart Model Routing** | Opt-in suggestions to swap to cheaper models when budget is tight |
| 📏 **Context Window Gauge** | Token usage tracking with compaction warnings at 80%+ |
| 🎯 **Daily Cost Goals** | Set spending targets, track progress with visual pacing |
| 🛑 **Session Cost Alerts** | Per-session cost tracking with 80%/100% warning toasts |
| 📈 **Cost Forecasting** | Extrapolate session cost based on current call rate |
| 🔇 **Quiet Mode** | Suppress info toasts, keep warnings and errors |
| 🏷️ **Session Tagging** | Tag sessions by activity (auto-detects git branch) |
| 📂 **Repo Attribution** | Auto-tracks costs per git repository |
| 📜 **Session History** | Browse past sessions with cost, duration, and tool usage |
| ⏰ **Time-of-Day Patterns** | Discover when you spend the most |
| 🛠️ **Tool Cost Breakdown** | See which tools cost the most per call |
| 📝 **Git Commit Annotation** | Prepare cost metadata for commit messages |
| 📦 **Export** | JSON + CSV export of session data |
| 🗄️ **Local Analytics** | JSONL event log with 90-day auto-rotation and 10MB cap |

### Intelligence Layer

Beyond basic tracking, the plugin builds a **spending intelligence profile**:

- **Cost Streaks** — Track consecutive under-budget days
- **Anomaly Detection** — Alert when session cost is 2x+ your average
- **Budget Pacing** — Estimate budget exhaustion time from hourly burn rate
- **Model Efficiency** — Score models by cost-per-call vs effectiveness
- **Weekly Digest** — Week-over-week spending comparison
- **Time Patterns** — Morning vs afternoon vs evening vs night cost analysis

### Installation

```bash
npm install @candelahq/opencode
```

Add to your OpenCode config (`~/.config/opencode/config.json` or `.opencode.json`):

```json
{
  "plugins": ["@candelahq/opencode"]
}
```

:::tip[Zero config]
The plugin works out of the box when Candela is running on `localhost:8181`. No additional configuration needed.
:::

### Slash Commands

| Command | Aliases | Description |
|:---|:---|:---|
| `/cost` | `/spend` | Session cost + 24h total breakdown |
| `/budget` | `/remaining` | Budget remaining, grants, reset time |
| `/models` | — | Top models by spend and call count |
| `/dashboard` | `/dash` | Open Candela web dashboard |
| `/export` | `/dump` | Export session data to JSON + CSV |
| `/goal` | — | Set or view daily cost goal |
| `/quiet` | `/shh` | Toggle quiet mode |
| `/tag` | `/label` | Tag session for cost attribution |
| `/cap` | — | Set per-session cost cap |
| `/history` | `/sessions` | Browse recent sessions |
| `/patterns` | `/when` | Time-of-day cost analysis |
| `/annotate` | `/commit-cost` | Git commit cost metadata |
| `/tools` | `/tool-cost` | Tool cost breakdown |

### Sidebar Dashboard

The plugin renders a live sidebar with real-time metrics:

```text
📊 $4.20 · 24h
🗄️ Cache hit rate: 72%
🏷️ feat/context-gauge
⚡ Session: $1.80 · 12 calls
📈 Forecast: ~$3.30 if 10 more calls
📏 Context: 45k tokens 🟩 ~35%
🎯 Goal: $4.20/$20 🟩 21%
⏱️ Budget exhausted by 4:30 PM
  claude-sonnet: $2.10 (8 calls)
  gpt-4o: $1.30 (4 calls)
```

### Environment Variables

| Variable | Type | Default | Description |
|:---|:---|:---|:---|
| `CANDELA_PROXY_URL` | String | `http://localhost:8181` | Candela proxy URL |
| `CANDELA_CONFIG` | String | — | Path to Candela config YAML (for port discovery) |
| `CANDELA_SMART_ROUTING` | Boolean | `false` | Enable cost-conscious model routing |
| `CANDELA_ROUTING_THRESHOLD` | Float (0–1) | `0.7` | Budget fraction to trigger routing |
| `CANDELA_ROUTING_SAVINGS_THRESHOLD` | Float (0–1) | `0.5` | Min savings to suggest model swap |
| `CANDELA_DAILY_GOAL` | Number (USD) | — | Daily spending target |
| `CANDELA_QUIET` | Boolean | `false` | Suppress info-level toasts |
| `CANDELA_SESSION_CAP` | Number (USD) | — | Per-session cost alert threshold |

### Settings File

Persistent settings at `~/.config/opencode/candela-settings.json`. Resolution priority: **env vars > settings file > defaults**.

---

## Troubleshooting

### OpenCode Hangs, Shows Stale Models, or Behaves Unexpectedly

If OpenCode hangs, shows stale models, or behaves unexpectedly after config changes, delete the OpenCode database:

```bash
rm -rf ~/.local/share/opencode/opencode.db*
```

Then restart OpenCode. This clears cached state (model lists, provider connections, etc.) and forces a fresh sync.

### Model Not Found Errors

Ensure the model IDs in your `.opencode.json` match what the provider expects. Model versions get retired (e.g. `codestral-2501` → `codestral-2`). Check the Candela server logs for the exact model ID being sent.

### `no pricing configured for model X`

The model needs a pricing entry in Candela. Contact your admin or add it to the cost calculator.

### Connection Refused on `localhost:8181`

Make sure the Candela server is running (`candela server` or the Cloud Run instance).

---

## Mission Orchestration Plugin

For multi-step autonomous workflows, install the companion `@candelahq/missions` plugin.

This plugin provides structured mission orchestration, allowing the agent to plan, execute, and validate complex goals across multiple child sessions.

### Features
- Breaks down large goals into discrete milestones (`mission_plan`).
- Dispatches isolated child sessions for focused work (`mission_next`).
- Validates milestone completion with test commands (`mission_validate`).
- Tracks progress across sessions and restarts.
- Exposes 5 core tools for the agent: `mission_plan`, `mission_next`, `mission_validate`, `mission_status`, `mission_cancel`.

### Installation

Install the package in your project:

```bash
npm install @candelahq/missions
```

Then add it to your `.opencode.json`:

```json
{
  "plugins": [
    "@candelahq/opencode",
    "@candelahq/missions"
  ]
}
```

### Integration with `@candelahq/opencode`

When run alongside `@candelahq/opencode`, child sessions spawned by the missions plugin automatically inject the `CANDELA_MISSION_ID` environment variable. This translates to the `X-Mission-Id` HTTP header in API requests, enabling grouped cost tracking and budget attribution for the entire multi-step mission.

[➡️ View on GitHub](https://github.com/candelahq/candela-missions)
