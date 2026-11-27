# Wealthfolio fork (`extended` branch)

This branch is upstream Wealthfolio at a release tag plus a few patches. It is a
drop-in replacement for the official Docker image. It adds no database
migrations, so you can switch from upstream to this image and back on the same
data.

## Install

Follow the upstream self-host guide ([README Docker section](README.md#docker),
[docs/self-host](docs/self-host/README.md), [compose.yml](compose.yml)) and
change only the image:

```yaml
services:
  wealthfolio:
    image: ghcr.io/aleksandrzhukov/wealthfolio:latest # or a fixed tag, e.g. 3.13.1-ws43
    init: true # the server is PID 1 and ignores SIGTERM; without this every restart waits 10 s
```

Images are built for `linux/amd64` and `linux/arm64`. Tags are
`<upstream version>-ws<build>`; `latest` points at the newest build. Back up
your data volume before switching or updating.

To update: `docker compose pull && docker compose up -d`.

## Differences from upstream

Add-on host API:

- Add-ons can read and change spending settings (`ctx.api.spending.getSettings`
  / `updateSettings`), behind a `spending-settings` permission shown in the
  consent prompt. The Wealthsimple add-on uses this to include new accounts in
  spending.
- Add-on sidebar icons can be SVG data URLs (upstream PR
  [#2698](https://github.com/wealthfolio/wealthfolio/pull/2698)).

Server:

- Static assets are gzipped, so remote clients load the app about 4x less data
  (upstream PR [#2794](https://github.com/wealthfolio/wealthfolio/pull/2794)).

UI:

- Settings → Appearance → Menu items: hide pages from the sidebar, the floating
  bar and the mobile menu.
- Logout moved from the sidebar into the profile menu.
- Asset Values tab, Investments and Spending dashboards use the same spacing as
  the other pages; long notes in transfer search are truncated (upstream PR
  [#2795](https://github.com/wealthfolio/wealthfolio/pull/2795)).
- The desktop "Add Value" button on the asset Values tab is removed; the grid's
  add row does the same.

Patches that upstream merges are dropped from this branch on the next rebase.

## Building

Pushing a tag like `3.13.1-ws43` runs
[.github/workflows/fork-docker.yml](.github/workflows/fork-docker.yml), which
builds both architectures, runs the encryption smoke test and publishes to GHCR.
To build locally: `docker build -t wealthfolio .`.
