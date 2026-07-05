---
title: Model Catalog
description: Centralized pricing and metadata for all LLM models — catalog backends, seeding, and the admin API.
---

The model catalog is Candela's centralized registry of LLM models, their pricing, and metadata. Every cost calculation, budget check, and dashboard query resolves model pricing through the catalog. You can run it as a static config file (zero infrastructure) or as a dynamic Firestore-backed store with an admin API.

## Catalog Backends

Candela supports two catalog backends, configured via `catalog.backend` in your `config.yaml`:

| Backend | Mutability | Best For |
|---------|-----------|----------|
| `config` | Read-only | Single-team setups, static pricing, no Firestore dependency |
| `firestore` | Read/write | Multi-team orgs, dynamic pricing, admin UI editing |

### Config Backend (default)

The `config` backend loads model pricing from compiled-in defaults and optional YAML overrides. It requires no external services.

```yaml
# config.yaml
catalog:
  backend: "config"

# Optional: override built-in pricing for specific models
pricing:
  discount_percent: 0.0  # global discount (0.15 = 15% off)
  models:
    - provider: openai
      model: gpt-4o
      input_per_million: 2.00     # negotiated rate
      output_per_million: 8.00
    - provider: google
      model: gemini-2.5-pro
      input_per_million: 1.00
      output_per_million: 8.00
      discount_percent: 0.10      # additional 10% off this model
```

The config backend always returns `ErrReadOnly` for create/update/delete operations. Use the `pricing.models` section to override individual model prices.

### Firestore Backend

The `firestore` backend stores catalog entries in a Cloud Firestore collection, enabling runtime updates via the admin API or the Candela UI.

```yaml
# config.yaml
catalog:
  backend: "firestore"
  firestore:
    collection: "model_catalog"    # Firestore collection name (default)
    project_id: ""                 # GCP project (defaults to server's project_id)
```

Document IDs are deterministic: `{provider}_{model_id}` (URL-encoded to handle slashes in model names like `meta-llama/Llama-3`).

:::tip
You can override the backend at runtime with the `CANDELA_CATALOG_BACKEND` environment variable — useful for testing Firestore locally while keeping `config` in your checked-in YAML.
:::

---

## Catalog Entry

Every model in the catalog is represented by an `Entry` with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `model_id` | string | Canonical model identifier (e.g. `gemini-2.5-pro`) |
| `provider` | string | Provider name (e.g. `openai`, `anthropic`, `google`) |
| `display_name` | string | Human-friendly label (e.g. "Gemini 2.5 Pro") |
| `input_per_million` | float | Base tier: USD per 1M input tokens |
| `output_per_million` | float | Base tier: USD per 1M output tokens |
| `enabled` | bool | Whether the model is available for routing |
| `category` | string | Grouping label (e.g. `flagship`, `lite`, `reasoning`) |
| `context_window` | int | Maximum context length in tokens |
| `input_per_million_high` | float | High tier: USD per 1M input tokens (optional) |
| `output_per_million_high` | float | High tier: USD per 1M output tokens (optional) |
| `tier_threshold_tokens` | int | Token count threshold for high-tier pricing |
| `aliases` | string[] | Alternative model names that resolve to this entry |
| `required_access` | string[] | Access tags required to use this model (empty = unrestricted). See [Model Access Control](/governance/model-access/) |
| `allowed_tenants` | string[] | Tenant IDs allowed to access this model (empty = all tenants). See [Model Access Control](/governance/model-access/) |
| `discount_percent` | float | Model-specific discount (0.0–1.0) |
| `updated_at` | timestamp | Last modification time (server-set for Firestore) |

### Tiered Pricing

Some models (notably Gemini) have tiered pricing where costs increase after a token threshold. When `tier_threshold_tokens` is set, the cost engine uses the `_high` rates for the portion of input tokens exceeding the threshold.

### Access Control Fields

The `required_access` and `allowed_tenants` fields enable tag-based model gating. When set, Candela enforces access checks as a pre-flight gate before proxying the request:

- **`required_access`**: A list of access tag strings. The requesting user must have at least one matching tag in their `access_tags` to use the model. If empty, the model is open to everyone. Admin users bypass this check.
- **`allowed_tenants`**: A list of tenant ID strings. The request's `X-Candela-Tenant-Id` must match one of the listed tenants. If empty, all tenants can access the model.

Both gates are fail-closed — errors in the catalog or user store result in a `500`, never silent pass-through. See [Model Access Control](/governance/model-access/) for full documentation.

---

## Seeding the Catalog

The `seed-catalog` CLI populates a Firestore catalog collection with Candela's built-in default pricing. This is the fastest way to bootstrap a Firestore-backed catalog.

### Usage

```bash
# Preview what would be written (safe — no Firestore writes)
go run ./cmd/seed-catalog/ \
  --project-id=your-gcp-project \
  --dry-run

# Seed the catalog
go run ./cmd/seed-catalog/ \
  --project-id=your-gcp-project \
  --collection=model_catalog
```

### Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--project-id` | _(required)_ | GCP project ID for Firestore |
| `--collection` | `model_catalog` | Firestore collection name |
| `--dry-run` | `false` | Print entries without writing |

The seeder pulls pricing from the built-in `costcalc.Calculator.Defaults()` table — the same data that powers the `config` backend. Each entry is written via `FirestoreStore.Update()`, which performs a full document `Set` (upsert).

:::note
Running `seed-catalog` is idempotent. Re-running it updates all entries to the latest built-in pricing without duplicating documents.
:::

---

## Admin API

When the catalog backend is `firestore`, admins can manage entries via the ConnectRPC `ModelCatalogService`. All mutation endpoints require admin role — non-admin callers receive `PERMISSION_DENIED`.

### ListModelCatalog

Returns all models in the catalog. Non-admin callers only see enabled models regardless of `include_disabled`.

```bash
buf curl --protocol connect \
  https://candela.example.com/candela.v1.ModelCatalogService/ListModelCatalog \
  -d '{"include_disabled": true}'
```

Response includes `source` (e.g. `"firestore"`) and `admin_editable` (true for writable backends).

### UpdateModelCatalogEntry

Creates or updates a single model entry. Supports field masks for partial updates — only the specified fields are modified, preventing accidental data loss.

```bash
# Create a new entry
buf curl --protocol connect \
  https://candela.example.com/candela.v1.ModelCatalogService/UpdateModelCatalogEntry \
  -d '{
    "entry": {
      "provider": "openai",
      "model_id": "gpt-4.1-nano",
      "display_name": "GPT-4.1 Nano",
      "input_per_million": 0.10,
      "output_per_million": 0.40,
      "enabled": true,
      "category": "lite"
    }
  }'

# Partial update — only change pricing
buf curl --protocol connect \
  https://candela.example.com/candela.v1.ModelCatalogService/UpdateModelCatalogEntry \
  -d '{
    "entry": {
      "provider": "openai",
      "model_id": "gpt-4.1-nano",
      "input_per_million": 0.08,
      "output_per_million": 0.35
    },
    "updateMask": "inputPerMillion,outputPerMillion"
  }'
```

Supported field mask paths: `enabled`, `displayName`, `inputPerMillion`, `outputPerMillion`, `inputPerMillionHigh`, `outputPerMillionHigh`, `tierThresholdTokens`, `discountPercent`, `category`, `contextWindow`, `aliases`, `requiredAccess`, `allowedTenants`.

### GetModelCatalogEntry

Retrieve a single entry by provider and model ID:

```bash
buf curl --protocol connect \
  https://candela.example.com/candela.v1.ModelCatalogService/GetModelCatalogEntry \
  -d '{"provider": "openai", "model_id": "gpt-4.1-nano"}'
```

### DeleteModelCatalogEntry

Remove a model from the catalog:

```bash
buf curl --protocol connect \
  https://candela.example.com/candela.v1.ModelCatalogService/DeleteModelCatalogEntry \
  -d '{"provider": "openai", "model_id": "gpt-4.1-nano"}'
```

Returns `NOT_FOUND` if the entry doesn't exist. Returns `UNIMPLEMENTED` if the catalog backend is read-only (`config`).

---

## Pricing Flow

The catalog feeds directly into Candela's cost engine. Here's how pricing resolves for each proxied LLM request:

```
LLM response received (with token counts)
        │
        ▼
┌──────────────────┐
│  Catalog Lookup  │  Get(provider, model_id)
│  (config or      │  → Entry with pricing
│   firestore)     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Cost Engine     │  Applies tiered pricing,
│  (costcalc)      │  model discount, global
│                  │  discount
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Budget Deduct   │  cost → user budget
│  & Record Span   │  cost → span record
└──────────────────┘
```

The degradation chain for pricing resolution:
1. **Catalog entry** — exact match by provider + model ID
2. **Alias match** — check `aliases` field for alternative names
3. **Built-in defaults** — compiled-in pricing table
4. **Zero cost** — if no pricing found, cost is $0.00 (logged as warning)

---

## Configuration Reference

```yaml
# Full catalog configuration block
catalog:
  # Backend: "config" (default) or "firestore"
  # Override at runtime: CANDELA_CATALOG_BACKEND env var
  backend: "config"

  # Firestore settings (only used when backend: "firestore")
  firestore:
    collection: "model_catalog"  # Firestore collection name
    project_id: ""               # GCP project (defaults to server project)

# Pricing overrides (used by config backend)
pricing:
  discount_percent: 0.0          # Global discount (0.0–1.0)
  models:                        # Per-model overrides
    - provider: openai
      model: gpt-4o
      input_per_million: 2.00
      output_per_million: 8.00
```
