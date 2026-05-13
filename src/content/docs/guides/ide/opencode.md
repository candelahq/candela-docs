---
title: OpenCode
description: Connect OpenCode to Candela for traced AI coding sessions.
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
    "model": "gemini-2.5-pro"
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
    "model": "gemini-2.5-pro"
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
