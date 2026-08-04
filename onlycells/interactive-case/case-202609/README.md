# Case 202609 — Haemolytic Uraemic Syndrome (HUS)
### Only Cells · Morphology Monthly · CPD interactive case

Self-contained single-file widget (vanilla JS + inline CSS, no build step, no dependencies
beyond one Google Fonts link). Built per `onlycells_interactive_case_spec.md`, cloned from the
`case-mm260615` flagship prototype.

**Case id is `202609`** — year + month, per Anas 2026-08-04. Supersedes the earlier `MM250818`
folder, which was removed from `hosted_content` when this replaced it.

**Status:** review build. Clinical content is authored from the published Only Cells pages and
**pending Anas/SME sign-off**. Do not publish to learners until "Before go-live" below is clear.

---

## Files

```
case-202609/
├── case-202609.html            # the deliverable — everything is in here
├── case-202609_build-log.md    # state, decisions, defects, what's outstanding by owner
├── case-202609_intake.md       # filled intake (input contract, gaps flagged)
├── README.md                   # this file
└── assets/
    ├── film-NN-1024x768.webp   # display copies (~430 KB total) — what the page shows
    ├── film-NN-hires.webp      # zoom layer (~10 MB total) — what the magnifier pulls from
    └── certificate-bg-*.webp   # Anas's certificate artwork: -pass and -part variants
```

Both image sets are needed. The engine keeps **display** and **zoom** sources separate
(spec §7): the page loads the small copy for fast first paint, the magnifier reads the hi-res
one. When Anas's full-resolution originals arrive, drop them in and point `hires` at them in
the config — no other change.

### Filenames carry no identifiers — keep it that way

Films are named `film-01`…`film-08`. They previously carried the **lab accession number** from
the source files, which then appeared in the page source, in every network request and in the
public repo tree. Sample/accession numbers are on the identifier list in
`onlycells_ways_of_working.md` §3. **Rename on the way in, before anything is committed** —
this repo is public, and git history is not retractable.

Local-only working folders (`assets/_source/`, `assets/hires/`, `assets/highlighted/`,
`tools/`) are **not deployed** and keep their original names.

## Deploy

Per `CLAUDE.md`: **scoped manual push**, never `push-build` (hosted_content is multi-project
with other live embeds). Clone hosted_content to temp → copy only the `onlycells/` subtree →
commit path-scoped → push.

```
hosted_content/onlycells/interactive-case/case-202609/
├── case-202609.html
├── README.md
└── assets/…
```

Live URL:
`https://danforgedframeworks.github.io/hosted_content/onlycells/interactive-case/case-202609/case-202609.html`

## Embed snippet (for the WordPress Custom HTML block)

The widget reports its own height, so the iframe never clips or scrolls internally. Paste the
whole block — iframe **plus** the listener — into one Custom HTML block.

```html
<iframe id="oc-202609"
        src="https://danforgedframeworks.github.io/hosted_content/onlycells/interactive-case/case-202609/case-202609.html"
        title="Only Cells — Morphology Monthly CPD case 202609"
        style="width:100%;border:0;display:block;height:1400px" scrolling="no"
        allowfullscreen></iframe>
<script>
(function(){
  var f = document.getElementById('oc-202609');
  window.addEventListener('message', function(e){
    if (!e.data || e.data.id !== '202609') return;
    if (e.data.type === 'oc-resize') {
      f.style.height = e.data.height + 'px';
    }
    if (e.data.type === 'oc-scroll') {
      var y = f.getBoundingClientRect().top + window.pageYOffset + (e.data.top || 0);
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  });
})();
</script>
```

The widget posts two messages, both tagged with the case id:

- `{type:'oc-resize', height:<px>}` on every content change, resize and orientation change.
- `{type:'oc-scroll', top:<px>}` when the learner moves to a new station. Because the iframe
  is full-height, the **parent** owns the scrollbar — without this the learner advances and is
  left looking at the middle of the next station. Focus moves to the station heading regardless,
  so keyboard and screen-reader users are handled either way.

Fallback if a script-free embed is ever required — drop the `<script>` and leave a fixed height
with `scrolling="yes"`; the widget degrades to scrolling internally.

## How the case works

Six stations across Anas's 2-stage design, with results released in two withheld tiers.

| Station | Screen | What the learner does |
|---|---|---|
| 1 · Presentation & bloods | Screen 1 | Reads the vignette; flags the abnormal FBC/biochemistry results |
| 2 · The blood film | Screen 1 | Examines 8 fields with the magnifier, drops markers, identifies features |
| 3 · Differential & rule-out | Screen 2 | Commits a differential + writes what they'd rule out and how |
| 4 · Haemolysis screen | Screen 2 | **Releases LDH/haptoglobin/retics/DAT**, then reconsiders |
| 5 · ADAMTS13 & the trigger | Screen 2 | **Releases ADAMTS13 + STEC**, then commits one final diagnosis |
| 6 · Result & CPD record | Reveal | Feedback, marked films, model answers, record + certificate |

### The withholding model

Two tiers, each with its own lock, because releasing everything at once collapses the reasoning:

- Releasing the **haemolysis screen** locks Stations 1–3. The learner has said what they think
  before the confirmatory panel appears.
- Releasing **ADAMTS13 + STEC** locks Station 4 as well. This is the discriminator between TTP
  and HUS, so it lands only after the haemolysis picture has been worked.
- Submitting the diagnosis locks the attempt permanently.

So "reset → peek → resubmit" is structurally impossible (spec §11.6). **Withheld content is not
in the DOM** — not hidden with CSS, not present in page source, not reachable by a screen
reader — until its tier is released.

Station 5 releases straight away with no confirmation modal: releasing the haemolysis screen
already committed them, so there is nothing left to warn about.

### Testing it repeatedly — `?reset`

A committed attempt is deliberately locked against reset, which makes reviewing it twice
impossible. Append **`?reset`** to the URL to wipe this case's saved state and start clean:

```
…/case-202609.html?reset
```

It clears `localStorage` for this case only, then redirects to the plain URL. Off the normal
learner path, so it doesn't weaken the integrity model.

### Marked films (Station 6)

The reveal shows only the **3 fields Anas marked**, with **20 ring markers** whose positions and
radii were derived from his highlighted copies (`tools/extract_highlights.py` diffs them against
the originals and matches by image similarity, not filename — his marked files were renamed).

Markers are **rings, not filled pins**: an opaque pin sits on top of the very cell it's pointing
at. Each ring carries its number outside the circle, and hovering a ring or its entry in the
left-hand list highlights the other.

The per-marker text is currently **per-field and authored by us** — Anas's own per-mark notes
are still outstanding.

### Station transition

Moving between stations is a true wipe: the outgoing station is cloned into an inert ghost and
clipped away in lockstep with the teal bar, so the bar rides the reveal edge and the incoming
station (already live underneath) is uncovered as it passes. Forward wipes down, Back wipes up.

Two constraints shaped it, both worth knowing before changing it:

- **The wipe band is bounded** (`WIPE_BAND`, 820px from the top of the station) rather than the
  full content height. Stations run 1333–3227px but a screen is ~800px, and when embedded the
  iframe is sized to the full content height — so `window.innerHeight` inside the widget is
  useless and the parent is cross-origin. The widget genuinely cannot tell what the learner is
  looking at. A full-height wipe would cross the visible area in a quarter of the duration and
  finish off-screen. Since we already scroll to the station top, a bounded band reads as a
  proper full-screen wipe on every station.
- **Height is pinned for the duration** to `max(outgoing, incoming)`. The parent resizes the
  iframe on every change, so an unpinned swap makes the whole embed lurch mid-wipe.

Teardown is on a `setTimeout`, not `animationend` — a stalled compositor would otherwise leave
the ghost covering the new station permanently. Any stranded ghost is also cleared on the next
render, guarded so it doesn't delete the ghost it is currently revealing through.
`prefers-reduced-motion` skips the whole thing for an instant swap.

The "Analysing" scan on a results release and on the diagnosis commit is deliberately left as a
plain scan — that reads as *the system processing*, a different thing from *moving station*.

### Animation must not depend on rAF alone

Count-ups, station entrances and score bars are `requestAnimationFrame`-driven, and rAF is
**suspended in a background tab or an offscreen iframe** — which is exactly how an embedded
widget first loads. Every animated value therefore has a `setTimeout` safety net that settles it
to its final state, and the net is authoritative (a `done` flag stops the rAF loop overwriting
it). Without this, lab values sit at 0 and stations render invisible.

`requestAnimationFrame` also passes the *frame-start* timestamp, which can predate the
`performance.now()` captured when scheduling — so progress is clamped at **both** ends. Unclamped,
the easing exponent explodes and haemoglobin renders as `-46556 g/L`.

### Exports

- **CPD record** — printed via `window.print()` on the user's own click. A4 **portrait**, 14 mm
  margins, injected at print time (`setPageStyle`), 3-up image grid. A plain-text copy downloads
  as a backup in case the PDF route fails.
- **Certificate** — **downloads as a PDF**, not printed and not a PNG.

The certificate is composed on a canvas at 2400×1350 and wrapped in a hand-written single-image
PDF (`jpegPdf`: catalog / pages / page / image XObject with `/DCTDecode` / content stream / xref).
That looks like reinvention, but the alternative was a PDF library, and the no-dependencies rule
is the point of this build. The page is the artwork's own aspect at A4-landscape width, so
nothing crops or letterboxes.

Three earlier approaches all failed and are worth not repeating:

- **CSS `background-image`** — Chrome's print dialog drops background graphics unless the user
  ticks a box that is off by default. Most learners would have printed a blank certificate.
- **Fixed millimetre layout** — assumes `@page` matches the paper, and the user's own paper
  choice overrides it. Produced a portrait, rotated, off-page certificate.
- **PNG download** — worked, but hands the learner an image to print themselves.

Composing to a flat image and shipping it inside a PDF means no CSS layout, no print dialog and
no paper setting can break it.

**Two variants**, selected on the learner's outcome: `certificate-bg-pass.webp` ("successfully
participating") when the diagnosis matched, `certificate-bg-part.webp` ("participating") when it
did not. Both are Anas's own artwork.

### Feedback model — formative, not graded

`CASE.scoring.mode` is **`"formative"`**. The learner is told what they identified, missed and
over-called ("2 of 3 identified · 1 over-call") and whether their diagnosis matched the
published answer — but there is **no percentage, no pass mark and no pass/fail verdict**, and
the certificate records **completion, not attainment**.

That's deliberate: self-certified CPD evidences participation and reflection. A percentage on a
certificate is an attainment claim Only Cells isn't currently accredited to make, and a
"Not yet achieved" stamp on a learning activity discourages the engagement it's meant to build.

The scoring machinery (weights, pass mark, percentage, Achieved/Not-achieved) is **still in the
file and still works** — flipping `mode` to `"scored"` restores it in full. That's the one-word
change if Anas decides he does want it graded. Over-calls count against the tallies either way,
so plausible-but-wrong features still register as over-calls.

## Adding the next case

Swap the `CASE` object at the top of the `<script>` — it holds all content (history, results,
haemolysis screen, ADAMTS13, media, hotspots, tick items, differentials, options, model answers,
report, scoring, certificate). The engine below it is untouched. Every authored/provisional
value carries a `[GAP]` comment naming what still needs Anas.

## Before go-live — open items

Carried from the intake and the review rounds; all authored against sensible defaults so the
build wasn't blocked. Owner in **bold**.

- [ ] **Anas** — clinical sign-off on everything authored
- [ ] **Anas** — **biochemistry discrepancy**: the source lab values differ from the published
      page on 4 of 5 results (bilirubin, ALT, calcium, phosphate). The page values are in the
      build and flagged in-code; **not** changed on the strength of a file we shouldn't be using.
      Build log §4.
- [ ] **Anas** — per-marker notes for the 20 ring markers (currently per-field, authored by us)
- [ ] **Anas** — reference ranges (authored standard adult ranges, not supplied by the lab)
- [ ] **Anas** — polychromasia: included as an unscored neutral option pending confirmation
- [ ] **Anas** — attempt policy, CPD time, audience/level, accreditation route
- [ ] **Anas** — magnifier preference (hexagon lens vs frame-and-panel)
- [ ] **Anas** — detractor features and distractor diagnoses (authored)
- [ ] **Anas** — hi-res originals; display copies upscaled in the interim
- [ ] **Anas** — stain / magnification, not stated
- [ ] **Daniel** — remove the prototype badge
- [ ] **Both** — consent and right to publish re-affirmed for a **certificated** activity, which
      is a different bar from a social post

## Accessibility & privacy

- Keyboard operable throughout; visible teal focus rings; `prefers-reduced-motion` honoured.
- Feature marking never relies on colour alone (ring + number + label + text tag).
- All learner data — reflections, markers, name, submission — stays in `localStorage`
  (`oc-case-202609`). **Nothing is transmitted anywhere.** The name field exists only to print
  onto the downloaded record and certificate.
- Exports use a Blob + `<a download>` / `window.print()` fired by the user's own click —
  never `window.open`, so popup blockers don't trip.
- No patient-identifiable data in the build, the filenames, or the repo.
- Framed as an educational CPD resource, not a diagnostic device.
