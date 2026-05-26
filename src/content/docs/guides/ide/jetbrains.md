---
title: JetBrains AI
description: Connect IntelliJ IDEA, WebStorm, GoLand, and other JetBrains IDEs to Candela.
---

JetBrains IDEs (IntelliJ IDEA, WebStorm, GoLand, PyCharm, etc.) include an **AI Assistant** with LM Studio integration that speaks the OpenAI-compatible API. Since `candela` listens on the same port (`:1234`), it works with zero additional configuration.

## Zero-Config Setup

`candela` is designed to be a drop-in replacement for LM Studio's API endpoint. JetBrains IDEs auto-detect models from `http://localhost:1234/v1/models`.

1. **Start candela**:
   ```bash
   candela start
   ```

2. **Open JetBrains Settings**:
   - Navigate to **Settings → Tools → AI Assistant**
   - Enable **"LM Studio"** as a provider

3. **Select a model** from the dropdown — it auto-populates from Candela's `/v1/models` endpoint, showing both local and cloud models

That's it. Every AI Assistant interaction now flows through Candela.

## What Gets Traced

| Feature | Traced |
|---------|:------:|
| AI chat panel | ✅ |
| Inline code completions | ✅ |
| Code explanations | ✅ |
| Refactoring suggestions | ✅ |
| Commit message generation | ✅ |
| Test generation | ✅ |

## Manual Configuration

If auto-detection doesn't work, configure manually:

1. **Settings → Tools → AI Assistant → LM Studio**
2. Set **URL** to `http://localhost:1234`
3. The model list should populate automatically

### AI Studio Plugin

If you're using the [JetBrains AI Studio](https://plugins.jetbrains.com/plugin/25498-ai-studio) plugin:

1. **Settings → AI Studio → Providers**
2. Add a new **OpenAI-compatible** provider:

| Setting | Value |
|---------|-------|
| **Name** | `Candela` |
| **API URL** | `http://localhost:1234/v1` |
| **API Key** | `candela` |

3. Add models manually or use the auto-detect feature

## Multiple IDE Instances

If you run multiple JetBrains IDEs simultaneously (e.g., GoLand + WebStorm), they all share the same `candela` instance on `:1234`. Traces from all IDEs appear in the same management UI.

:::tip[Port 1234 is intentional]
candela uses `:1234` specifically because it's the standard LM Studio port. Most JetBrains AI features are already configured to look there — no changes needed.
:::

---

## Official JetBrains Plugin (Coming Soon)

A dedicated Candela JetBrains plugin — similar to the [VS Code extension](https://open-vsx.org/extension/candelahq/candela-vscode) — is planned for an upcoming release. It will provide:

* **Status bar cost tracker** with live token counts and spend
* **Budget warnings** with grant waterfall display
* **Quick actions** to open the dashboard and check budget

In the meantime, all JetBrains IDEs work with Candela's proxy — just configure your AI tool's base URL to point at `http://localhost:8181`.
