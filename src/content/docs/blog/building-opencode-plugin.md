---
title: "Building an OpenCode Plugin from Scratch — Hooks, Tools, and the AI Event Loop"
date: 2026-08-09
authors:
  - candela
tags:
  - ai
  - typescript
  - opensource
  - tutorial
excerpt: "A technical walkthrough of OpenCode's plugin SDK. How hooks, tools, events, and system prompt injection actually work — with real code from an open-source plugin."
---

[OpenCode](https://opencode.ai) is an open-source AI coding agent that runs in your terminal. It has a plugin SDK that lets you hook into the AI lifecycle — intercept requests, inject context, define custom tools, and listen to session events.

I built an OpenCode plugin for [Candela](https://github.com/candelahq/candela) (an LLM cost tracking proxy). This post walks through the SDK patterns I used, with real code from the [open-source plugin](https://github.com/candelahq/opencode-candela).

## The Plugin Contract

An OpenCode plugin is a function that receives a context object and returns hooks:

```typescript
import type { Plugin } from "@opencode-ai/plugin";

export const myPlugin: Plugin = async ({ client, $, directory }) => {
  // client — log messages, read/write config
  // $ — Bun shell for subprocess execution
  // directory — current working directory

  return {
    // hooks go here
  };
};
```

The `PluginInput` gives you:
- `client` — OpenCode's API client (logging, config read/write)
- `$` — Bun shell for running commands
- `directory` / `worktree` — filesystem context
- `serverUrl` — OpenCode's server URL

What you return is a `Hooks` object. This is where the interesting stuff happens.

## Hook #1: Custom Tools

The most powerful hook. You define tools that the AI agent can call conversationally — the user says "how much have I spent today?" and the AI calls your tool to find out.

```typescript
import { tool } from "@opencode-ai/plugin";

const costSummary = tool({
  description: "Get a summary of LLM costs for the current session or time period",
  args: {
    scope: tool.schema
      .enum(["session", "1h", "24h", "7d"])
      .default("24h")
      .describe("Time scope for the cost query"),
    model_filter: tool.schema
      .string()
      .optional()
      .describe("Filter results to a specific model"),
  },
  async execute(args, context) {
    // context gives you: sessionID, messageID, abort signal, directory
    const data = await fetchCostData(args.scope);
    return `You've spent ${data.totalCost} across ${data.requestCount} requests.`;
  },
});
```

Key details:
- `tool.schema` is built on Zod — you get type-safe argument parsing
- `.describe()` annotations help the LLM choose the right arguments
- The return value is a string that goes back into the AI's context
- `context.abort` gives you an `AbortSignal` for cancellation

To register tools, return them from your plugin:

```typescript
return {
  tool: {
    my_cost_tool: costSummary,
    my_config_tool: configTool,
  },
};
```

The AI discovers these tools automatically and can call them when relevant.

## Hook #2: Events

OpenCode emits lifecycle events. You listen with the `event` hook:

```typescript
return {
  event: async ({ event }) => {
    if (event.type === "session.created") {
      // A new chat session started
      // Good for: capturing baseline metrics, resetting state
    }

    if (event.type === "session.idle") {
      // The AI finished responding, waiting for user input
      // Good for: showing summaries, logging analytics
    }

    if (event.type === "file.watcher.updated") {
      // A file in the project changed
      const filePath = event.properties?.file;
    }

    if (event.type === "todo.updated") {
      // A task/subtask was created or completed
      const { id, title, active } = event.properties;
    }
  },
};
```

In the Candela plugin, I use `session.created` to capture a baseline of spend metrics, and `session.idle` to compute the delta — giving you exact per-session costs without any server-side session indexing.

## Hook #3: System Prompt Injection

This is the hook that makes AI tools "cost-aware." You can dynamically inject context into the system prompt:

```typescript
return {
  "experimental.chat.system.transform": async (input, output) => {
    const budget = await getBudgetStatus();

    output.system.push(
      `[Cost Context] Budget: ${budget.percentUsed}% used. ` +
      `Remaining: $${budget.remaining}. ` +
      `Resets in ${budget.resetLabel}.`
    );
  },
};
```

Now when the user asks "am I over budget?", the AI already knows — it's in the system prompt.

**Design decision I learned the hard way:** Don't inject on every message. System prompt tokens add up. In Candela, I only inject on the first prompt of each session when budget is healthy (<80%). When budget hits ≥80%, I inject on every prompt so the AI can proactively warn the user.

## Hook #4: Request Headers

You can attach custom headers to every LLM API request:

```typescript
return {
  "chat.headers": (input, output) => {
    if (sessionId) {
      output.headers["X-Session-Id"] = sessionId;
    }
    if (activeTaskId) {
      output.headers["X-Task-Id"] = activeTaskId;
    }
  },
};
```

This is how Candela traces requests back to specific sessions and tasks — the proxy reads these headers and includes them in the cost log.

## Hook #5: Shell Environment

Inject environment variables into every subprocess OpenCode runs:

```typescript
return {
  "shell.env": (input, output) => {
    output.env["CANDELA_PROXY_URL"] = "http://localhost:8181";
    output.env["OPENAI_BASE_URL"] = "http://localhost:8181/proxy/openai/v1";
  },
};
```

This means when the AI runs a test suite or a build script, those subprocesses automatically route through the proxy too. Transparent instrumentation.

## Hook #6: TUI (Slash Commands)

OpenCode plugins can also export a TUI module for terminal UI features:

```typescript
import type { TuiPlugin } from "@opencode-ai/plugin/tui";

export const tui: TuiPlugin = async (api) => {
  api.command.register(() => [
    {
      title: "Candela: Cost Summary",
      value: "candela.cost",
      slash: { name: "cost", aliases: ["spend"] },
      onSelect: async () => {
        const data = await fetchCosts();
        api.ui.toast({
          title: "💰 Cost Summary",
          message: `Today: $${data.today} · This week: $${data.week}`,
          variant: "info",
        });
      },
    },
  ]);
};
```

Slash commands show up when users type `/` in the chat. Toasts are non-blocking notifications.

**Architecture note:** OpenCode separates server hooks and TUI hooks into different execution contexts. Your `package.json` exports both from the same package, but they run on different threads.

## Putting It Together

Here's the minimal skeleton of a real plugin:

```typescript
// src/index.ts
import type { Plugin } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";

export const server: Plugin = async ({ client }) => {
  const alive = await checkMyService();

  if (!alive) {
    await client.app.log({
      body: {
        service: "my-plugin",
        level: "warn",
        message: "Service not running. Start it with: my-service start",
      },
    });
  }

  return {
    tool: alive ? {
      my_tool: tool({
        description: "Query my service",
        args: { query: tool.schema.string() },
        async execute(args) {
          return await queryService(args.query);
        },
      }),
    } : {},

    event: async ({ event }) => {
      if (event.type === "session.created") {
        // setup
      }
      if (event.type === "session.idle") {
        // teardown / summary
      }
    },
  };
};

// Re-export TUI
export { tui } from "./tui.js";
```

Install with:
```bash
opencode plugin my-plugin-name
```

## What I'd Do Differently

1. **Start with one tool, not seven.** I built 10 tools before any user tried the plugin. Consolidated to 7 after realizing the AI gets confused with too many similar options.

2. **Test with fake timers.** Every time-dependent feature (cache TTL, session duration, budget resets) needs `vi.useFakeTimers()` in tests. I learned this after flaky CI runs.

3. **Graceful degradation matters.** When the external service is down, the plugin should still load — just with reduced functionality. Returning `undefined` for hooks is fine.

## Resources

- [OpenCode](https://opencode.ai) — the AI coding agent
- [`@opencode-ai/plugin`](https://www.npmjs.com/package/@opencode-ai/plugin) — the SDK
- [opencode-candela](https://github.com/candelahq/opencode-candela) — the full plugin source (MIT)
- [Candela docs](https://candelahq.github.io/candela-docs/) — the observability platform

---

*Building an OpenCode plugin? I'd love to see what you make. Drop a link in the comments.*
