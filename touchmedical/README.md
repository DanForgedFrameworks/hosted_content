# touchmedical — TM9035 / VISION live assets

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
