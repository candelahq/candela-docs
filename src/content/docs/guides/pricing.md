---
title: Pricing & Cost Calculator
description: How Candela calculates LLM costs, supported providers, and custom pricing overrides.
---

Candela's cost engine calculates the USD cost of every proxied LLM request based on token counts and model pricing. Pricing is built-in for popular models and can be overridden via config for enterprise discounts.

## How It Works

1. Proxy captures `input_tokens` and `output_tokens` from the LLM response
2. Cost engine resolves pricing: **config override → built-in default → model-name fallback**
3. Applies model-level discount, then global discount
4. Final cost is recorded on the span and deducted from the user's budget

```
cost = (input_tokens / 1M × input_per_million + output_tokens / 1M × output_per_million)
       × (1 - model_discount)
       × (1 - global_discount)
```

**Local models** (Ollama, vLLM, LM Studio) always return `$0.00` — they run on your hardware.

## Supported Providers

Candela routes to cloud models through **Vertex AI** (Google's unified AI platform), which provides access to Google, Anthropic, and open-source models — all authenticated via Application Default Credentials (ADC). OpenAI models are called directly via API key.

Any model available in your Vertex AI Model Garden or via direct API is supported. Candela ships with built-in pricing for the most common models:

| Provider | Key Models | Auth |
|----------|-----------|------|
| **Google Gemini** | Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.0 Flash | ADC (Vertex AI) |
| **Anthropic** | Claude Sonnet, Claude Opus, Claude Haiku | ADC (Vertex AI) |
| **OpenAI** | GPT-4o, o3, o1 | API key |
| **Local** | Llama, Qwen, Mistral, DeepSeek — anything in Ollama | Free ($0.00) |

:::note[Source of truth]
For the full list of models with built-in pricing, see [`pkg/costcalc/calculator.go`](https://github.com/candelahq/candela/blob/main/pkg/costcalc/calculator.go). Models not in this list still work — they just report cost as $0.00 until you add a pricing override.
:::

## Custom Pricing Overrides

Override pricing for negotiated rates or enterprise discounts in your `config.yaml`:

```yaml
pricing:
  # Global discount applied to ALL models (0.0–1.0)
  discount_percent: 0.15  # 15% off all models

  # Per-model overrides (takes priority over built-in defaults)
  models:
    - provider: google
      model: gemini-2.5-pro
      input_per_million: 1.00     # negotiated rate
      output_per_million: 8.00
      discount_percent: 0.0       # no additional discount

    - provider: openai
      model: gpt-4o
      input_per_million: 2.00
      output_per_million: 8.00
      discount_percent: 0.10      # additional 10% model discount
```

### Pricing Resolution Order

1. **Config override** (exact `provider/model` match)
2. **Built-in default** (exact `provider/model` match)
3. **Model-name fallback** (provider-agnostic, alphabetical provider tie-break)

This means `gemini-2.5-pro` will match even if the request doesn't specify a provider.

### Unknown Models

If a cloud model has no pricing configured, Candela:
- Logs a warning (once per model, not per request)
- Records cost as `$0.00`
- The request still succeeds — pricing gaps don't block traffic

:::caution[Missing pricing = inaccurate budgets]
If a model shows `$0.00` cost and it's not a local model, check the server logs for `⚠️ missing pricing for cloud model`. Add the model to your config overrides.
:::

## Runtime Pricing Updates

Pricing can be updated at runtime via the Go API (useful for dynamic pricing from a config service):

```go
calc.SetPricing(costcalc.ModelPricing{
    Provider:        "google",
    Model:           "gemini-3.0-ultra",
    InputPerMillion:  5.00,
    OutputPerMillion: 25.00,
})

calc.SetGlobalDiscount(0.20) // 20% off everything
```
