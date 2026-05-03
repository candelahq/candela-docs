# Installation

## Candela Desktop

=== "macOS"

    Download the latest release from [GitHub Releases](https://github.com/ItsNotRocketScience/candela-desktop/releases):

    ```bash
    # Or install via Homebrew (coming soon)
    brew install --cask candela
    ```

=== "Linux"

    ```bash
    # Download the AppImage
    curl -LO https://github.com/ItsNotRocketScience/candela-desktop/releases/latest/download/candela-desktop.AppImage
    chmod +x candela-desktop.AppImage
    ./candela-desktop.AppImage
    ```

=== "Windows"

    Download the installer from [GitHub Releases](https://github.com/ItsNotRocketScience/candela-desktop/releases).

## Candela Sidecar

=== "Docker"

    ```bash
    docker pull ghcr.io/itsnotrocketscience/candela-sidecar:latest
    ```

=== "Binary"

    ```bash
    # Download the latest binary for your platform
    curl -LO https://github.com/ItsNotRocketScience/candela-sidecar/releases/latest/download/candela-sidecar-$(uname -s)-$(uname -m)
    chmod +x candela-sidecar-*
    sudo mv candela-sidecar-* /usr/local/bin/candela-sidecar
    ```

=== "From Source"

    ```bash
    git clone https://github.com/ItsNotRocketScience/candela-sidecar.git
    cd candela-sidecar
    go build -o candela-sidecar ./cmd/sidecar
    ```

## Verify Installation

```bash
candela-sidecar --version
```

!!! success "You're ready!"
    Head to the [Quick Start](quickstart.md) to send your first traced LLM request.
