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
| **Model ID** | `gemini-2.5-pro` (or any model from `/v1/models`) |

### Alternative: Settings JSON

Add to your VS Code `settings.json`:

```json
{
  "cline.apiProvider": "openai-compatible",
  "cline.openaiBaseUrl": "http://localhost:1234/v1",
  "cline.openaiApiKey": "candela",
  "cline.openaiModelId": "gemini-2.5-pro"
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
      "model": "gemini-2.5-pro"
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
