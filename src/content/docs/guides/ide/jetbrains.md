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

## Official Candela JetBrains Plugin

The [`candela-jetbrains`](https://github.com/candelahq/candela-jetbrains) plugin adds real-time cost visibility and budget controls directly inside your JetBrains IDE — no terminal switching required.

### Features

* **Status bar cost tracker** — live `🔥 1.2M · $2.45 · 🟢45%` in the bottom bar, auto-refreshing every 60s
* **Rich hover tooltips** — input/output token splits, request counts, model-by-model breakdown, grant details
* **Budget warning balloons** — notifications when usage crosses your threshold (default 80%), red alerts when exhausted
* **Grant display** — active bonus grants with remaining amounts and expiry countdowns
* **Offline backoff** — shows `🕯️ offline` when Candela isn't running, backs off to 5-minute polling to avoid noise
* **Startup health check** — brief notification on project open confirming connection

### Installation

#### From GitHub Releases (recommended)

1. Go to the [latest release](https://github.com/candelahq/candela-jetbrains/releases/latest)
2. Download **`candela-jetbrains-x.x.x.zip`** (not the source code archives)
3. In your IDE, open **Settings → Plugins**
4. Click the **⚙️ gear icon** → **Install Plugin from Disk…**
5. Select the downloaded `.zip` file
6. Click **OK** and **Restart IDE**

:::note[JetBrains Marketplace]
The plugin is pending review on the JetBrains Marketplace. Once approved, you'll be able to install directly from **Settings → Plugins → Marketplace** by searching for "Candela".
:::

#### Build from Source

```bash
git clone https://github.com/candelahq/candela-jetbrains.git
cd candela-jetbrains
nix develop -c ./gradlew buildPlugin
# Output: build/distributions/candela-jetbrains-*.zip
```

Then install the `.zip` from disk using steps 3–6 above.


### Settings

Configure under **Settings → Tools → Candela**:

| Setting | Default | Description |
|---------|---------|-------------|
| Server URL | `http://localhost:8181` | Candela server URL |
| Status bar enabled | `true` | Show cost tracker in status bar |
| Refresh interval | `60s` | Auto-refresh interval (0 to disable) |
| Budget warning threshold | `80%` | Warning percentage threshold |

### Menu Actions

Access from **Tools → Candela** or via the command palette:

| Action | Description |
|--------|-------------|
| **Show Cost Summary** | Detailed token/cost breakdown with model-by-model stats |
| **Check Budget** | Budget meter with remaining balance and active grants |
| **Open Dashboard** | Launch the Candela web dashboard in your browser |
| **Refresh Status** | Force refresh status bar data |

### Development

```bash
# Enter dev shell (JDK 21 + Gradle + Kotlin)
nix develop

# Run sandboxed IDE with plugin loaded
nix develop -c ./gradlew runIde

# Build distribution
nix develop -c ./gradlew buildPlugin

# Run tests
nix develop -c ./gradlew test
```
