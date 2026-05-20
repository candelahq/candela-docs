---
title: Cline
description: Connect Cline (VS Code) to Candela for traced AI coding.
---

[Cline](https://github.com/cline/cline) is an autonomous AI coding agent that runs inside VS Code. It supports custom OpenAI-compatible endpoints.

## Configuration

1. Open Cline settings in VS Code (`Cmd+Shift+P` → "Cline: Open Settings")
2. Set **API Provider** to `OpenAI Compatible`
3. Configure:

| Setting | Value |
|---------|-------|
| **Base URL** | `http://localhost:1234/v1` |
| **API Key** | `candela` |
| **Model ID** | `gemini-3.5-pro` (or any model from `/v1/models`) |

### Alternative: Settings JSON

Add to your VS Code `settings.json`:

```json
{
  "cline.apiProvider": "openai-compatible",
  "cline.openaiBaseUrl": "http://localhost:1234/v1",
  "cline.openaiApiKey": "candela",
  "cline.openaiModelId": "gemini-3.5-pro"
}
```

## Using with Local Models

Switch to a local model for free, private AI coding:

```json
{
  "cline.openaiModelId": "llama3.2:3b"
}
```

Candela still traces every request — you get full token counts and latency metrics even for local models (cost will show `$0.00`).

## Using with Continue

[Continue](https://continue.dev) (another popular VS Code AI extension) works the same way:

```json
{
  "models": [
    {
      "title": "Candela — Gemini Pro",
      "provider": "openai",
      "apiBase": "http://localhost:1234/v1",
      "apiKey": "candela",
      "model": "gemini-3.5-pro"
    },
    {
      "title": "Candela — Local Llama",
      "provider": "openai",
      "apiBase": "http://localhost:1234/v1",
      "apiKey": "candela",
      "model": "llama3.2:3b"
    }
  ]
}
```

:::tip[Autonomous mode]
When Cline runs multi-step tasks autonomously, every individual LLM call is traced separately. Check the Candela traces UI to see the full chain of reasoning steps with per-step token usage and cost.
:::

---

## Official Candela Cline Plugin

For deeper integration, install the official `candela-cline` plugin package. This enables Cline to run custom tools inside its workspace to query session spend, check daily budgets, and ensure proxy health.

### Features
* **Session Cost Summaries**: Formats a detailed summary of token usage, requests, spend, and cache savings for the active coding session.
* **Live Budget Check**: Inspects daily budget limits, current consumption percentage, remaining allowance, and active grant waterfall breakdown (including expiries).
* **Automatic Health Check**: Ensures that the local `candela` daemon is active and responsive before running heavy automated tasks.

### Installation

Install the package in your project's development dependencies:

```bash
npm install --save-dev candela-cline
```

### Usage as Custom Tools

You can register these custom tools inside your workspace or configure Cline's MCP tools. If you are developing extensions or wrappers around Cline, import the methods directly:

```typescript
import { 
  getSessionSummary, 
  getBudgetStatus, 
  checkCandelaHealth 
} from "candela-cline";

// Print summary of the last 2 hours of work
console.log(await getSessionSummary("http://localhost:8181", 2));

// Print budget status progress bar and active grants
console.log(await getBudgetStatus("http://localhost:8181"));
```

#### Example Output: Session Summary
```
📊 Session Cost Summary (Past 1h)
---------------------------------
Requests:     12 calls
Tokens:       45.2K (28.4K in / 16.8K out)
Cache Savings: 32.4K tokens ($0.12 saved)
Total Spend:  $0.18
```

#### Example Output: Budget Status
```
💰 Daily Budget Status
Daily: [████████████░░░░░░░░] 60%  $3.00 / $5.00
🎁 Grant: $10.00 / $10.00 — hackathon sprint (expires May 25)
Total available: $12.00
```

