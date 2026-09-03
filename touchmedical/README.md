# touchmedical — Touch Medical live assets (TM9035 / VISION · TINT 8620-5 / Lilly CLL)

**This folder is the live Pages mirror — not the edit source.** Asset code is edited in
`HTML Edits\Touch Medical\production\<slug>-<date>-vN\`. Three trees, all current, each with
one job:

| Tree | Role |
|---|---|
| `HTML Edits\Touch Medical\production\` | **Edit here.** The canonical working copy |
| `Codex\html\production\2026\TM9035\` | Dated frozen release snapshots, for records |
| `hosted_content\touchmedical\` (here) | What GitHub Pages serves. Deploy target |

**Compare them with line endings normalised** — `production` stores CRLF, this repo stores LF,
so a raw md5 reports false drift. Strip `\r` before hashing. Folder names understate the
version too: a `…-v1` folder can hold v2 content, so compare `index.html` by hash, never by name.

Project home (specs, review rounds, sign-offs): `touchMedical\TM 9035\03-html\`
Build skill: `touchmedical-html` · Deploy: `references/deploy-runbook.md` in that skill.

## TINT 8620-5 (Eli Lilly) — the second job in this tenant

Added 2026-09-03. Same three-tree model, different job folder and a different embed box:

| Tree | TINT 8620-5 path |
|---|---|
| Edit | `HTML Edits\Touch Medical\production\tint8620-*\` |
| Snapshot | `Codex\html\production\2026\TINT8620-5\` — **not** `TM9035` |
| Live | `hosted_content\touchmedical\tint8620-*\` (here) |

Project home: `touchMedical\TINT 8620-5 (Eli Lilly)\03-html\ASSET-INDEX.md`. Embed box is
**1368 × 768 full-canvas, no bottom banner** — not TM9035's 1370 × 700. Builds arrive as finished
packages and are stamped with `Touch Medical\tools\stamp-build.py` (title, version marker,
compositing-layer release), never edited by hand.

- **`tint8620-cll-scenes/` is nested — the only two-level asset here.** Seven scene folders
  (`00-title` … `06-references`) plus shared `support.js` and `lilly/` under one parent. The scene
  files reference `../`, and their Back/Next resolve siblings **by folder name**, so the parent ships
  whole and the children are never renamed. **Embed the children, never the parent**; the parent's
  `index.html` is a contents page. `?chrome=0` hides the in-embed Back/Next once Visme's own
  canvas buttons are in.
- **`tint8620-cll-decision-making/` is the superseded single-page original.** Status `retain`: kept
  live because a Visme embed may still point at it; not linked from anywhere; do not delete.
- **`tint8620-brand-guide/` and `tint8620-brand-spec/` are documents, not embeds** — scrolling
  pages sent to the team as links. The fit gate reads their height as bleed *by design*.
- **Register convention:** TINT `codex_build` values are written relative to the TM9035 Codex root
  (`..\TINT8620-5\…`) because `reconcile.ps1` and `snapshot-to-codex.ps1` default `-CodexRoot` to
  `2026\TM9035`. Pass `-CodexRoot` explicitly to snapshot a TINT asset with that script, or copy
  by hand as the 2026-09-03 deploys did.

## The register

[`REGISTER.csv`](REGISTER.csv) — one row per folder, no exceptions. Columns:

| Column | Meaning |
|---|---|
| `slug` | Folder name = the permanent public ID. **Never rename** (rule 2) |
| `class` | production · reference · visual-abstract · variant · redirect-stub · reference-impl · temporary · orphan |
| `function` | What the asset does |
| `slide_ref` | The tracker slide number the asset was minted against — **historical, may not equal the current scene** |
| `scene_deck` | Current scene number in the delivered deck. `TBC` until the scene map exists |
| `codex_build` | Current release snapshot folder in `Codex\html\production\2026\TM9035\` |
| `status` | live · retain · retain-legacy · delete-when-done · broken |
| `notes` | Anything a future reader needs |

## Rules

1. **A folder without a register row does not exist.** Add the row in the same commit that
   creates the folder. `reconcile.ps1` fails the moment the two disagree.
2. **Slugs are immutable.** Scene renumbering never renames a live folder — embeds in Visme
   point at the URL, and a rename breaks them silently. Record the new number in `scene_deck`
   and leave the slug alone. If a slug must change, the old one stays as a redirect stub
   forever (there are six).
3. **Edit in `Touch Medical\production\`, deploy here, snapshot to Codex at sign-off.** This
   repo receives finished builds; it is not where you work. Codex gets a dated frozen snapshot
   (`<slug>-YYYY-MM-DD-vN`) at sign-off via `snapshot-to-codex.ps1`. That script copies from
   *this* folder, which is correct only because the deployed copy is verified equal to
   production before it lands — if you ever deploy without that check, snapshot from
   `production\` instead.
4. **Reference assets skip Codex** by rule (`vision-references*`) — they are cross-slide
   library material, not per-slide builds.
5. **Bump `?v=N` on every redeploy**, typo fixes included.
6. **Stage only your own slug folder.** Never `git add -A` here — parallel agents commit to
   this repo and a broad add absorbs their work into your commit.

## Checks

```powershell
.\reconcile.ps1          # register vs disk vs Codex snapshots; exit 1 on drift
```

Run it before any deploy and after any rename. It is the thing that stops this folder drifting
out of sync again — the 2026-07-29 audit found 12 unregistered folders and 13 stale snapshots
because nothing was checking.

## History

- **2026-07-29** — Register rebuilt from disk (27 → 38 rows). All 19 production assets
  snapshotted to Codex and verified byte-identical. `tm9035-asian-efficacy-knowledge-check-slide-66`
  and `vision-abstract-references-hub` were live but unregistered. `tm9035-prototype-chapter-1`
  removed — an empty local husk, never tracked by git, so never served.
- **2026-08-13** — Corrected the source-of-truth claim above. The 29 July audit compared only
  Codex and this repo, found Codex stale, and wrongly concluded this folder was canonical. It
  never checked `Touch Medical\production\`, which is the real edit source and was current all
  along: all 19 assets verified byte-identical to live once line endings were normalised.
  Codex was stale *by design* — it holds releases, not the working copy.
- **2026-09-03** — TINT 8620-5 (Eli Lilly) lands in this tenant: `tint8620-brand-guide`, `tint8620-brand-spec`, `tint8620-cll-decision-making` (deployed earlier that day but **unregistered** — rule 1 broken for a few hours; rows added now) and the nested `tint8620-cll-scenes` (seven per-scene builds). Register 36 → 40 rows.
