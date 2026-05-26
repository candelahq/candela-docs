---
title: Security & Authentication
description: Authentication strategies, RBAC, data isolation, and security hardening for Candela deployments.
---

Candela uses a **multi-strategy authentication** system designed to serve three distinct client types: browser users, developer CLI tools, and service accounts.

## Authentication Flow

```mermaid
flowchart TD
    REQ[Incoming Request] --> SKIP{Path = /healthz?}
    SKIP -->|yes| PASS[Pass through]
    SKIP -->|no| DEV{Dev Mode?}
    DEV -->|yes| SYNTH["Inject synthetic admin<br/>(admin@localhost)"]
    DEV -->|no| TOK{Has Bearer Token?}
    TOK -->|no| DENY["401 Unauthorized"]
    TOK -->|yes| S1["Strategy 1:<br/>Firebase ID Token"]
    S1 -->|valid| AUTH[Authenticated ✓]
    S1 -->|invalid| S2["Strategy 2:<br/>Google ID Token"]
    S2 -->|valid| AUTH
    S2 -->|invalid| S3["Strategy 3:<br/>OAuth2 Access Token"]
    S3 -->|valid| AUTH
    S3 -->|invalid| DENY
    AUTH --> CTX["User injected into<br/>request context"]
    CTX --> HANDLER[ConnectRPC Handler]
```

The middleware tries three strategies in sequence — the first successful validation wins:

| # | Strategy | Client | Token Source |
|---|----------|--------|-------------|
| 1 | **Firebase ID Token** | Browser UI | Firebase JS SDK |
| 2 | **Google ID Token** | Service accounts, `candela` CLI | `idtoken.NewTokenSource(audience)` |
| 3 | **OAuth2 Access Token** | `candela` with user ADC | `candela auth login` (or `gcloud auth application-default login`) |

:::note
Strategy 3 calls Google's userinfo endpoint, adding ~50ms latency. This is the only way to validate user-scoped ADC that `candela` uses with `candela auth login` (or `gcloud auth application-default login`).
:::

---

## Service Account Policy

Candela uses a **deny-by-default** service account policy. All service account tokens are rejected with `403 Forbidden` unless explicitly allowlisted:

```yaml
# config.yaml
auth:
  allowed_service_accounts:
    - "candela-ci@my-project.iam.gserviceaccount.com"
```

If the `allowed_service_accounts` list is empty or omitted, **all** service accounts are blocked. This prevents unmetered cost vectors — SA traffic bypasses per-user budget deduction.

---

## Role-Based Access Control (RBAC)

### Roles

| Role | Description |
|------|-------------|
| `developer` | Use proxy, view own traces/costs, self-service RPCs |
| `admin` | Full access: manage users, budgets, view all data |

### RPC Access Matrix

**Self-Service RPCs** (any authenticated user):

| RPC | Description |
|-----|-------------|
| `GetCurrentUser` | Returns the caller's own profile, budget, and active grants |
| `GetMyBudget` | Returns the caller's budget and current-period spending |

**Admin-Only RPCs**:

| Category | RPCs |
|----------|------|
| **Users** | `CreateUser`, `ListUsers`, `GetUser`, `UpdateUser`, `DeactivateUser`, `ReactivateUser` |
| **Budgets** | `SetBudget`, `GetBudget`, `ResetSpend` |
| **Grants** | `CreateGrant`, `ListGrants`, `RevokeGrant` |
| **Audit** | `ListAuditLog` |

---

## Per-User Data Isolation

Non-admin developers can only see their own traces. This is enforced at two levels:

1. **Query-time filtering** — All list/search endpoints inject `user_id` filters into storage queries. Admins see all data; developers see only their own.

2. **Post-fetch auth gate** — `GetTrace` (which queries by trace ID, not user) fetches the full trace, extracts the owner, and returns `PermissionDenied` on mismatch.

All storage backends (BigQuery, DuckDB, SQLite) apply the filter in SQL:
```sql
AND (? = '' OR user_id = ?)
```

---

## `candela` CLI Authentication

| Mode | Auth Required | How |
|------|:------------:|-----|
| **Solo** | No | All requests to `:1234` and `:8181` are unauthenticated |
| **Solo + Cloud** | ADC only | `candela auth login` — tokens used for upstream Vertex AI calls |
| **Team** | OIDC | `candela` injects Google ID tokens into requests to the Candela server |

### Team Mode Token Flow

```
IDE → candela (:1234)
         │
         ├── Local model → Ollama (no auth)
         └── Cloud model → Candela Server (Cloud Run)
                              │ Authorization: Bearer <google-id-token>
                              ▼
                         Auth Middleware (Strategy 2 or 3)
```

#### Strategy 1.5: SA Impersonation for IAP ID Tokens

When `iap_service_account` is set in the config, `candela` uses the developer's ADC to **impersonate** a designated service account and mint an IAP-scoped OIDC ID token:

```
User ADC → impersonate SA → generateIdToken(audience) → IAP ID token
```

This uses a custom **`iapIdTokenCreator`** IAM role bound to the service account, which grants only:

| Permission | Included |
|------------|:--------:|
| `iam.serviceAccounts.getOpenIdToken` | ✅ |
| `iam.serviceAccounts.getAccessToken` | ❌ |

:::note[Why not `getAccessToken`?]
Granting `getAccessToken` would let developers impersonate the SA to call any GCP API — including direct LLM API access that bypasses the Candela proxy and its budget enforcement. By only granting `getOpenIdToken`, developers can authenticate through IAP but **cannot** bypass the proxy for direct LLM API access.
:::

---

## Input Validation

All requests are validated server-side using [`protovalidate`](https://github.com/bufbuild/protovalidate). Key constraints:

| Field | Constraint |
|-------|------------|
| IngestSpans batch | Max 1,000 spans |
| GenAI content fields | Max 1 MB |
| Pagination page_size | [0, 1000] |
| All ID fields | Max 128 chars |

---

## Security Hardening Checklist

| Item | Status |
|------|:------:|
| Token validation on all non-health endpoints | ✅ |
| Email claim normalization (lowercase) | ✅ |
| Admin role enforcement via ConnectRPC interceptor | ✅ |
| Per-user trace/span data isolation | ✅ |
| Internal error message sanitization | ✅ |
| Rate limiting per user | ✅ |
| Budget enforcement before proxy calls | ✅ |
| Secrets not baked into container images | ✅ |
| ADC token auto-refresh | ✅ |
| API key hashing (bcrypt) | ✅ |
| Proxy does not store upstream API keys | ✅ |
| CORS origin allowlist | ✅ |
| Audit logging for admin actions | ✅ |
| eBPF enforcement (Tetragon + Cilium + iptables) | ✅ |
| Circuit breaker resilience for upstream providers | ✅ |
| Fuzz testing for proxy SSE parser | ✅ |
| Tetragon gRPC audit pipeline with graceful shutdown | ✅ |
| Multi-cloud auth (GCP OAuth2 + AWS SSO) | ✅ |

:::caution[Dev Mode]
When `auth.dev_mode: true`, all requests get full admin access with no token validation. **Never enable in production.**
:::

## Related

- [Budgets & Cost Control](/guides/budgets/) — Budget enforcement and grant management
- [Deployment](/architecture/deployment/) — Production deployment topology
