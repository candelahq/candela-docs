---
title: ConnectRPC Services
description: API reference for Candela's ConnectRPC service definitions.
---

Candela components use **ConnectRPC** (over HTTP/2 or HTTP/1.1 via the Connect protocol) for high-performance dashboard population, user governance, post-hoc annotations, and local runtime orchestration.

Port mappings for ConnectRPC services:
* **`candela-server` / `candela` CLI**: Listen on `:8181` by default.

---

## 1. DashboardService

Provides aggregated metrics and usage data for visualization, chart rendering, and status displays.

### `GetDashboardData`

Consolidates usage summaries, model breakdowns, and user budget status in a single round-trip.

* **Request**: `GetDashboardDataRequest`
  ```protobuf
  message GetDashboardDataRequest {
    string project_id = 1;
    candela.types.TimeRange time_range = 2;
    string environment = 3;
    bool include_budget = 4; // Set true to request user budget context
  }
  ```
* **Response**: `GetDashboardDataResponse`
  ```protobuf
  message GetDashboardDataResponse {
    GetUsageSummaryResponse summary = 1;
    repeated ModelUsage models = 2;
    BudgetContext budget_context = 3; // Populated only if include_budget=true + auth
  }
  ```

### `GetLatencyPercentiles`

Retrieves latency distributions (`p50`, `p90`, `p95`, `p99`) and a time-series history for charts.

* **Request**: `GetLatencyPercentilesRequest`
  ```protobuf
  message GetLatencyPercentilesRequest {
    string project_id = 1;
    candela.types.TimeRange time_range = 2;
    string model = 3; // optional: filter by model
  }
  ```
* **Response**: `GetLatencyPercentilesResponse`
  ```protobuf
  message GetLatencyPercentilesResponse {
    double p50_ms = 1;
    double p90_ms = 2;
    double p95_ms = 3;
    double p99_ms = 4;
    repeated TimeSeriesPoint latency_over_time = 10;
  }
  ```

### Deprecated Endpoints

The following endpoints are deprecated and should not be used in new integrations:
* `GetUsageSummary` *(use `GetDashboardData` instead)*
* `GetModelBreakdown` *(use `GetDashboardData` instead)*
* `GetMyUsage` *(use `GetDashboardData` with `include_budget=true` or `UserService.GetMyBudget` instead)*

---

## 2. UserService

Manages user accounts, active grants, and daily budget limits. It supports both admin commands and developer self-service.

### Self-Service Endpoints (Current User)

#### `GetCurrentUser`

Returns the profile, role, status, and active budget details for the authenticated session.

* **Request**: `GetCurrentUserRequest`
  ```protobuf
  message GetCurrentUserRequest {}
  ```
* **Response**: `GetCurrentUserResponse`
  ```protobuf
  message GetCurrentUserResponse {
    candela.types.User user = 1;
    candela.types.UserBudget budget = 2;
    repeated candela.types.BudgetGrant active_grants = 3;
    double total_remaining_usd = 4; // Combined: grants + budget remaining
  }
  ```

#### `GetMyBudget`

Retrieves a lightweight, high-performance budget summary. This is the endpoint polled by IDE plugins to display status bar spend and remaining credits.

* **Request**: `GetMyBudgetRequest`
  ```protobuf
  message GetMyBudgetRequest {}
  ```
* **Response**: `GetMyBudgetResponse`
  ```protobuf
  message GetMyBudgetResponse {
    candela.types.UserBudget budget = 1;
    repeated candela.types.BudgetGrant active_grants = 2;
    double total_remaining_usd = 3;
    double budget_remaining_usd = 4;
    double grants_remaining_usd = 5;
    int64 tokens_used_today = 10;
    string period_key = 20;
    string period_resets_at = 21;
  }
  ```

### Admin Endpoints

Requires admin credentials (OAuth2/ID token with appropriate roles).

* **User Lifecycle**:
  * `CreateUser`: Provision a new user with email and default daily budget.
    * **Request**: `CreateUserRequest`
      ```protobuf
      message CreateUserRequest {
        string email = 1;
        string display_name = 2;
        candela.types.UserRole role = 3;
        double daily_budget_usd = 5;
      }
      ```
    * **Response**: `CreateUserResponse`
      ```protobuf
      message CreateUserResponse {
        candela.types.User user = 1;
        candela.types.UserBudget budget = 2;
      }
      ```
  * `ListUsers`: Paginated list of users, with optional status filters (`ACTIVE`, `INACTIVE`).
  * `GetUser`: Get detailed user status, including active/expired grants.
    * **Request**: `GetUserRequest`
      ```protobuf
      message GetUserRequest {
        string id = 1;
      }
      ```
    * **Response**: `GetUserResponse`
      ```protobuf
      message GetUserResponse {
        candela.types.User user = 1;
        candela.types.UserBudget budget = 2;
        repeated candela.types.BudgetGrant active_grants = 3;
      }
      ```
  * `UpdateUser`: Update display names or roles using a `FieldMask`.
  * `DeactivateUser` / `ReactivateUser`: Enable or disable proxy traffic permissions.
  * `DeleteUser`: Permanently purge a deactivated user account.
* **Budget Limits**:
  * `SetBudget`: Configure recurring daily spending limits.
  * `GetBudget`: Retrieve limit and spent calculations.
  * `ResetSpend`: Zero out today's spending for emergency relief.
* **Grants**:
  * `CreateGrant`: Issue one-time credits with startup and expiration dates.
  * `ListGrants`: Show active and expired grants.
  * `RevokeGrant`: Cancel/expire an active grant.
* **Audit Trail**:
  * `ListAuditLog`: Retrieve an immutable audit trail of actions taken on a user.

---

## 3. AnnotationService

Provides APIs for post-hoc trace enrichment. Used for business outcome logging, human review labeling, and custom metric evaluation.

Unlike traces (which flow through high-throughput OTLP ingest pipelines), annotations have CRUD semantics and arrive asynchronously after a request completes.

### `SetOutcome`

Records whether a trace succeeded or failed along with a business-level score.

* **Request**: `SetOutcomeRequest`
  ```protobuf
  message SetOutcomeRequest {
    string trace_id = 1;
    bool success = 2;
    double score = 3; // Value from 0.0 to 1.0
    string comment = 4;
  }
  ```
* **Response**: `SetOutcomeResponse`
  ```protobuf
  message SetOutcomeResponse {
    candela.types.Annotation annotation = 1;
  }
  ```

### `AddLabel`

Attaches a human review label to a trace.

* **Request**: `AddLabelRequest`
  ```protobuf
  message AddLabelRequest {
    string trace_id = 1;
    string label = 2;
    string reviewer = 3;
    string comment = 4;
  }
  ```
* **Response**: `AddLabelResponse`
  ```protobuf
  message AddLabelResponse {
    candela.types.Annotation annotation = 1;
  }
  ```

### `LogMetric`

Records a custom numerical metric associated with the trace.

* **Request**: `LogMetricRequest`
  ```protobuf
  message LogMetricRequest {
    string trace_id = 1;
    string metric_name = 2;
    double metric_value = 3;
    string comment = 4;
  }
  ```
* **Response**: `LogMetricResponse`
  ```protobuf
  message LogMetricResponse {
    candela.types.Annotation annotation = 1;
  }
  ```

### `ListAnnotations`

Returns all annotations (outcomes, labels, and metrics) associated with a trace.

* **Request**: `ListAnnotationsRequest`
  ```protobuf
  message ListAnnotationsRequest {
    string trace_id = 1;
    candela.types.AnnotationType type_filter = 2;
  }
  ```
* **Response**: `ListAnnotationsResponse`
  ```protobuf
  message ListAnnotationsResponse {
    repeated candela.types.Annotation annotations = 1;
  }
  ```

---

## 4. RuntimeService

Orchestrates local model servers (Ollama, vLLM, LM Studio) inside the local environment (`candela-local`).

* **Process Control**:
  * `StartRuntime`: Start the configured inference daemon (e.g., Ollama or vLLM).
    * **Request**: `StartRuntimeRequest`
      ```protobuf
      message StartRuntimeRequest {
        string backend = 1;
      }
      ```
    * **Response**: `StartRuntimeResponse`
      ```protobuf
      message StartRuntimeResponse {
        RuntimeStatus status = 1;
      }
      ```
  * `StopRuntime`: Terminate the active inference daemon.
* **Health & Models**:
  * `GetHealth`: Checks state (`STOPPED`, `STARTING`, `RUNNING`, `ERROR`), uptime, and currently loaded models.
    * **Request**: `GetHealthRequest`
      ```protobuf
      message GetHealthRequest {}
      ```
    * **Response**: `GetHealthResponse`
      ```protobuf
      message GetHealthResponse {
        RuntimeStatus status = 1;
        repeated RuntimeModel models = 2;
      }
      ```
  * `ListModels`: List all models available on the disk.
  * `LoadModel` / `UnloadModel`: Load/unload models to/from GPU memory.
    * **Request**: `LoadModelRequest`
      ```protobuf
      message LoadModelRequest {
        string model = 1;
      }
      ```
    * **Response**: `LoadModelResponse`
      ```protobuf
      message LoadModelResponse {
        ModelLoadState state = 1;
      }
      ```
  * `PullModel` / `CancelPull`: Start/cancel asynchronous model downloads from registries.
  * `DeleteModel`: Delete downloaded model files.
* **Discovery**:
  * `ListBackends`: Check which backend engines are installed on the local system `PATH` and which is active.
* **State**:
  * `ResetState`: Clear pull history and app preferences from the local SQLite database.
    * **Request**: `ResetStateRequest`
      ```protobuf
      message ResetStateRequest {}
      ```
    * **Response**: `ResetStateResponse`
      ```protobuf
      message ResetStateResponse {}
      ```

    > [!WARNING]
    > `ResetState` is a destructive operation that permanently clears the local SQLite database containing download history and custom preferences. This action cannot be undone.

* **Catalog**:
  * `ListCatalog`: Retrieve recommended models to install.
