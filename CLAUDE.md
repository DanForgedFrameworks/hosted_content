# hosted_content — repo guidance

<!-- Orientation for Claude Code sessions in this repo. This is a SHARED GitHub Pages host:
     one repo, many independent tenant folders. Renaming a tenant path breaks its live embeds. -->

## Wiring  <!-- read before moving or renaming anything -->
- **Repo / branch:** github.com/DanForgedFrameworks/hosted_content · main
- **Role:** Shared **GitHub Pages host** — one repo serving many independent asset folders ("tenants") as live embeds.
- **Tenants & the skills that publish them** (each folder is its own live site):
  - `html_animations/` — /animation-builder (Tiro programme/pathway animations)
  - `touchmedical/` — /touchmedical-html, /abstract-deck (TM) (Touch Medical / TM9035 assets)
  - `onlycells/` — OnlyCells (working copy in `…\OnlyCells\`)
  - `tiro/` — Tiro-hosted assets · published manually by DanForgedFrameworks (no skill)
  - `forged-frameworks/` — Forged Frameworks' own behind-the-scenes / production pieces, chat-built (no skill).
    Content *about* a client build lives here, not in that client's tenant — the client tenants serve live embeds.
  - `Power of Focus/`, `Review360/` — published manually by DanForgedFrameworks (no skill)
- **Load-bearing — ALL tenant paths are LOCKED:** live iframes point at
  `https://danforgedframeworks.github.io/hosted_content/<tenant>/…`. **Never rename or move a tenant folder**
  without updating every embed that references it. Publish the **Pages URL only** (never a
  `github.com/.../blob` or `raw.githubusercontent.com` link).
- **Concurrency:** several skills push here. `git pull --ff-only`, stage **only your own tenant folder**,
  then push — never stage another tenant's changes.
- **Free** (safe to tidy within a tenant, per that tenant's own rules): `README.md`, per-asset scratch.

<!-- Add repo-wide rules / skill config blocks below this header as needed. -->
