# Candela Docs

Documentation for the [Candela](https://github.com/ItsNotRocketScience) observability platform.

Built with [MkDocs Material](https://squidfunk.github.io/mkdocs-material/) and deployed to GitHub Pages.

## Local Development

```bash
# Enter Nix dev shell
nix develop

# Install dependencies
uv sync

# Start dev server
uv run mkdocs serve
```

Then open [http://localhost:8000](http://localhost:8000).

## Deployment

Docs are automatically deployed to GitHub Pages on push to `main` via GitHub Actions.

## Structure

```
docs/
├── index.md                    # Homepage
├── getting-started/            # Installation & quickstart
├── desktop/                    # Candela Desktop docs
├── sidecar/                    # Candela Sidecar docs
├── guides/                     # Integration guides
└── api/                        # API reference
```
