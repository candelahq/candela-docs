---
title: Pricing & Cost Calculator
description: How Candela calculates LLM costs, supported providers, and custom pricing overrides.
---

Candela's cost engine calculates the USD cost of every proxied LLM request based on token counts and model pricing. Pricing is built-in for popular models and can be overridden via config for enterprise discounts.

## How It Works

1. Proxy captures `input_tokens` and `output_tokens` from the LLM response
2. **Cache normalization** — adjusts input tokens to account for prompt caching discounts (see below)
3. Cost engine resolves pricing: **config override → built-in default → model-name fallback**
4. Applies model-level discount, then global discount
5. Final cost is recorded on the span and deducted from the user's budget

```
cost = (normalized_input / 1M × input_per_million + output_tokens / 1M × output_per_million)
       × (1 - model_discount)
       × (1 - global_discount)
```

**Local models** (Ollama, vLLM, LM Studio) always return `$0.00` — they run on your hardware.

## Supported Providers

Candela routes to cloud models through **Vertex AI** (Google's unified AI platform), which provides access to Google, Anthropic, and open-source models — all authenticated via Application Default Credentials (ADC). OpenAI models are called directly via API key.

Any model available in your Vertex AI Model Garden or via direct API is supported. Candela ships with built-in pricing for the most common models:

| Provider | Key Models | Auth |
|----------|-----------|------|
| **Google Gemini** | Gemini 3.5 Pro/Flash, Gemini 3.1 Pro/Flash, Gemini 2.5 Pro/Flash, Gemini 2.0 Flash | ADC (Vertex AI) |
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
      model: gemini-3.5-flash
      input_per_million: 0.40     # negotiated rate (list: $0.50)
      output_per_million: 2.40    # negotiated rate (list: $3.00)
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
    Model:           "gemini-2.5-pro",
    InputPerMillion:  5.00,
    OutputPerMillion: 25.00,
})

calc.SetGlobalDiscount(0.20) // 20% off everything
```

## Prompt Cache Normalization

When LLMs use [prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching), providers charge less for cached tokens than fresh input. Candela automatically normalizes cached tokens to their **cost-equivalent** value before calculating the final price.

### Cache Discount Rates

| Provider | Cache Read | Cache Write | Source |
|----------|-----------|-------------|--------|
| **Anthropic** | 90% off (0.1×) | 25% surcharge (1.25×) | [Anthropic pricing](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching#pricing) |
| **Google Gemini 2.5+/3.x/3.5** | 90% off (0.1×) | No surcharge | [Vertex AI pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing) |
| **Google Gemini 2.0** | 75% off (0.25×) | No surcharge | Vertex AI pricing |
| **OpenAI** | 50% off (0.5×) | No surcharge | [OpenAI pricing](https://openai.com/api/pricing/) |

### How It Works

Each provider reports cache tokens differently. Candela handles both modes automatically:

- **Inclusive** (OpenAI, Google) — `input_tokens` includes cached tokens as a subset. Candela subtracts them and re-adds at the discounted rate.
- **Additive** (Anthropic) — `input_tokens` is only fresh tokens. Cache tokens are separate fields. Candela adds their discounted equivalents on top.

```
# OpenAI/Google (inclusive): input_tokens = 1000 (includes 800 cached)
normalized = (1000 - 800) + (800 × 0.5) = 200 + 400 = 600

# Anthropic (additive): input_tokens = 200 (fresh only), cache_read = 800
normalized = 200 + (800 × 0.1) = 200 + 80 = 280
```

:::note[Automatic — no config needed]
Cache normalization happens transparently. The raw cache token counts are preserved in the span for observability, while the cost calculation uses the normalized value.
:::

### Custom Cache Discount Overrides

Override cache rates per provider via the Go API (e.g., for negotiated enterprise pricing or new provider integrations):

```go
calc.SetCacheDiscount("anthropic", costcalc.CacheDiscountConfig{
    ReadDiscount:       0.1,   // 90% off cache reads
    CreateMultiplier:   1.25,  // 25% surcharge on cache writes
    InputIncludesCache: false, // Anthropic uses additive mode
})
```

## Tiered Pricing

Some models have different rates based on input context length. Candela supports this automatically:

| Model | Threshold | Below | Above |
|-------|-----------|-------|-------|
| **Gemini 2.5 Pro** | 200K tokens | $1.25 / $10.00 (in/out per M) | $2.50 / $15.00 |

Tiered pricing is also configurable per-model:

```yaml
pricing:
  models:
    - provider: google
      model: gemini-2.5-pro
      input_per_million: 1.25
      output_per_million: 10.00
      input_per_million_high: 2.50
      output_per_million_high: 15.00
      tier_threshold_tokens: 200000
```

