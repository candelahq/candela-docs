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

## Official Candela OpenCode Plugin

For native integration with the terminal-based OpenCode assistant, you can install the official `opencode-candela` plugin. This plugin hooks directly into OpenCode's execution lifecycle to provide automated budget controls, idle session warnings, shell environment injection, and contextual budget awareness.

### Key Features
1. **Startup & Post-Session Budget Warnings**: Displays remaining budget and warning banners at the start of a session and after running automated tasks.
2. **Idle Session Toasts**: Automatically prints a clean, formatted session usage toast (spend, tokens, requests, and cache savings) when the session goes idle.
3. **Shell Environment Injection**: Automatically exports `CANDELA_PROXY_URL` and `OPENAI_BASE_URL` into any shell tasks spawned by the agent. This ensures scripts, tests, and sub-agents run by OpenCode are tracked automatically.
4. **Agent Budget Awareness**: Automatically appends the user's current remaining daily budget and active grant status into the context sent to the agent during session compaction. This lets the agent plan tasks and decide whether to use smaller/faster models to conserve your budget.

### Installation

To register the plugin, choose one of the following methods depending on your workflow:

#### Option 1: Local Project Registration (Recommended)

Install the plugin in your project workspace:

```bash
npm install --save-dev opencode-candela
```

Then, enable it in your local `.opencode.json` configuration:

```json
{
  "plugins": [
    "opencode-candela"
  ]
}
```

#### Option 2: Global Configuration Registration

If you want the plugin to be active globally across multiple projects, you can copy the source files to your global OpenCode config:

```bash
mkdir -p ~/.config/opencode/plugins/opencode-candela
cp -r node_modules/opencode-candela/src/* ~/.config/opencode/plugins/opencode-candela/
```

Then, add it to your global `~/.config/opencode/config.json`:

```json
{
  "plugins": [
    "opencode-candela"
  ]
}
```

### Configuration Options

You can adjust plugin options in your `.opencode.json` configuration file:

```json
{
  "opencode-candela": {
    "serverUrl": "http://localhost:8181",
    "idleTimeoutSeconds": 60,
    "showStartupWarning": true,
    "injectAgentContext": true
  }
}
```

