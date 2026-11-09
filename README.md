# OmiLAXR Docs

Source of [docs.omilaxr.dev](https://docs.omilaxr.dev), the documentation of the OmiLAXR packages. Built with [Astro Starlight](https://starlight.astro.build).

The package documentation is not written here. It lives in each package repo (`Documentation~/`, XML comments in the code, `CHANGELOG.md`) and is collected on every build. See [Writing package docs](https://docs.omilaxr.dev/start/writing-docs/).

## Develop

Needs Node 24 (`.nvmrc`) and the .NET 10 SDK.

```bash
make install
make local   # generate the package docs from the repos next to this one (../OmiLAXR, ../OmiLAXR.xAPI, …, ../OmiLAXR.MCP)
make dev
```

`make packages` clones the package repos into `.packages/` instead, as CI does. `make help` lists all targets.

## Deploy

`.github/workflows/deploy.yml` builds the site and deploys it to GitHub Pages. It runs on a push to `main`, when a package sends a `package-updated` dispatch, every night and by hand (`make publish`).

One-time setup:

- Settings → Pages: source "GitHub Actions", custom domain `docs.omilaxr.dev`, enforce HTTPS.
- DNS: `CNAME docs → omilaxr-ecosystem.github.io`.
- Secret `MCP_READ_TOKEN` (read access to `OmiLAXR-Ecosystem/OmiLAXR.MCP`) while that repo is private.
- Organization secret `DOCS_DISPATCH_TOKEN` (may start workflows in this repo) for the `docs.yml` workflow of the packages.
