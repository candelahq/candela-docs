---
title: VS Code Extension
description: Track your live LLM spend, token counts, and daily budget directly in your VS Code status bar.
---

The official **Candela VS Code Extension** (`candela-vscode`) provides real-time visibility into your local LLM usage and daily budgets without leaving your editor. It works in the background by polling your local `candela` instance and displaying live metrics directly in the status bar.

```
┌────────────────────────────────────────────────────────┐
│  File  Edit  Selection  View  Go                       │
│                                                        │
│  ... your code editor workspace ...                    │
│                                                        │
│                                                        │
│                                                        │
│  Ln 42, Col 18   UTF-8   TypeScript   🔥 1.2M · $2.45 · 🟢45%  │
└────────────────────────────────────────────────────────┘
                                         ▲
                             Live Observability Status
```

---

## Features

* **Status Bar Tracker**: Displays today's total tokens (with K/M suffixes), calculated cost, and budget consumption percentage at a glance.
* **Rich Hover Tooltips**: Hover over the status bar item to view a detailed breakdown:
  * Input and output token splits
  * Request counts
  * Budget spent vs. limit with progress status
  * Active grant waterfall showing remaining credits, descriptions, and expiration dates.
* **Failure Backoff & Recovery**: Automatically detects if the local `candela` proxy is offline (displaying `$(circle-slash) Candela: offline`) and increases the polling interval to 5 minutes to prevent system log spam. It restores normal polling immediately once the daemon is back online.
* **Visual Alerts**: If your daily budget usage crosses your configured threshold (default: 80%), the status bar item changes color to indicate a warning.
* **Quick Commands**: Includes commands to view today's cost summaries, print visual budget status indicators in the terminal, or launch the web dashboard.

---

## Installation

1. Open VS Code.
2. Go to **Extensions** (`Cmd+Shift+X` or `Ctrl+Shift+X`).
3. Search for **Candela**.
4. Click **Install**.

---

## Configuration Settings

You can customize the extension via your VS Code Settings (`settings.json`):

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `candela.serverUrl` | `string` | `""` | The Candela API URL. If empty, the extension auto-discovers it. |
| `candela.statusBar.enabled` | `boolean` | `true` | Show or hide the Candela status bar item. |
| `candela.statusBar.showBudget` | `boolean` | `true` | Show the budget percentage indicator alongside tokens/cost. |
| `candela.autoRefresh.intervalSeconds` | `number` | `60` | The refresh interval in seconds for normal polling. |
| `candela.budgetWarning.threshold` | `number` | `80` | Usage percentage threshold at which the status bar turns yellow/warning. |

---

## Commands

The extension exposes the following commands in the command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`):

### `Candela: Show Today's Cost Summary`
Displays an information dialog containing a breakdown of today's requests, token counts, total spend, and usage by model/provider. Also includes a button to open the web dashboard.

### `Candela: Check Budget & Grants`
Outputs a clean text diagram of your budget consumption, spent/limit details, and any active grants including expirations.
```
💰 Budget Status
Daily: [████████████░░░░░░░░] 60%  $3.00 / $5.00
🎁 Grant: $10.00 / $10.00 — hackathon sprint (expires May 25)
Total available: $12.00
```

### `Candela: Refresh Status`
Invalidates the client cache (which has a 30s TTL by default) and forces an immediate reload of the usage telemetry.

### `Candela: Open Web Dashboard`
Launches your default browser pointing to the local dashboard UI (usually `http://localhost:8181/_local/`).
