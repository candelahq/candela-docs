---
title: Zed
description: Connect Zed's AI assistant to Candela for LLM observability.
---

[Zed](https://zed.dev) is a high-performance editor with a built-in AI assistant. It supports custom OpenAI-compatible endpoints, making it easy to route through Candela.

## Configuration

Edit your Zed settings (`~/.config/zed/settings.json` or `Cmd+,`):

```json
{
  "language_models": {
    "openai": {
      "api_url": "http://localhost:1234/v1",
      "api_key": "candela",
      "available_models": [
        {
          "name": "gemini-2.5-pro",
          "display_name": "Gemini 2.5 Pro (via Candela)",
          "max_tokens": 8192
        },
        {
          "name": "gemini-2.5-flash",
          "display_name": "Gemini 2.5 Flash (via Candela)",
          "max_tokens": 8192
        },
        {
          "name": "llama3.2:3b",
          "display_name": "Llama 3.2 3B (Local)",
          "max_tokens": 4096
        }
      ]
    }
  },
  "assistant": {
    "default_model": {
      "provider": "openai",
      "model": "gemini-2.5-pro"
    }
  }
}
```

## Using the Assistant

1. Open the AI assistant panel: `Cmd+Shift+?` (macOS) or `Ctrl+Shift+?`
2. Select a Candela model from the model picker
3. Start chatting — all requests are traced

## Inline Completions

Zed can also use Candela for inline code completions:

```json
{
  "features": {
    "inline_completion_provider": "openai"
  }
}
```

:::tip[Model switching]
Add multiple models to `available_models` and switch between local and cloud models from the Zed model picker — all traced through Candela.
:::
