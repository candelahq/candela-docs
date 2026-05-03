# Installation

All Candela components live in the [candelahq/candela](https://github.com/candelahq/candela) monorepo.

## candela-local (Recommended Start)

The fastest way to get started — a developer proxy that manages local and cloud models with built-in observability.

=== "go install"

    ```bash
    go install github.com/candelahq/candela/cmd/candela-local@latest
    ```

=== "From Source"

    ```bash
    git clone https://github.com/candelahq/candela.git
    cd candela
    nix develop   # or ensure Go 1.26+ is installed
    go run ./cmd/candela-local
    ```

### Configure

Create `~/.candela.yaml`:

```yaml
runtime_backend: ollama
port: 8181
lm_studio_port: 1234
```

!!! tip "Solo + Cloud"
    Add `providers` and `vertex_ai` to also route cloud models (Gemini, Claude) through candela-local. See [candela-local docs](../local/index.md).

---

## candela-server

The full backend with dashboard UI, deployed on Cloud Run.

```bash
git clone https://github.com/candelahq/candela.git
cd candela

# Run locally
nix develop -c go run ./cmd/candela-server
```

See [candela-server docs](../server/index.md) for Cloud Run deployment with Terraform.

---

## candela-sidecar

Lightweight production proxy for container environments.

=== "Docker"

    ```bash
    docker pull ghcr.io/candelahq/candela-sidecar:latest
    ```

=== "Binary"

    ```bash
    go install github.com/candelahq/candela/cmd/candela-sidecar@latest
    ```

=== "From Source"

    ```bash
    git clone https://github.com/candelahq/candela.git
    cd candela
    go build -o candela-sidecar ./cmd/candela-sidecar
    ```

See [candela-sidecar docs](../sidecar/index.md) for Kubernetes and Cloud Run deployment.

---

## candela-desktop

Flutter desktop app for provider management and trace visualization.

Download from [GitHub Releases](https://github.com/candelahq/candela-desktop/releases).

See [candela-desktop docs](../desktop/index.md).

---

## Verify

```bash
# candela-local
candela-local --help

# candela-server
curl http://localhost:8181/healthz

# candela-sidecar
candela-sidecar --help
```

!!! success "You're ready!"
    Head to the [Quick Start](quickstart.md) to send your first traced LLM request.
