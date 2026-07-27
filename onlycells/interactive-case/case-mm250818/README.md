# Case MM250818 — Haemolytic Uraemic Syndrome (HUS)
### Only Cells · Morphology Monthly · assessed CPD interactive case

Self-contained single-file widget (vanilla JS + inline CSS, no build step, no dependencies
beyond one Google Fonts link). Built per `onlycells_interactive_case_spec.md`, cloned from the
`case-mm260615` flagship prototype.

**Status:** concept prototype — clinical content authored from the published Only Cells pages
and **pending Anas/SME sign-off**. Do not publish until §"Before go-live" below is cleared.

---

## Files

```
case-mm250818/
├── case-mm250818.html          # the deliverable — everything is in here
├── case-mm250818_intake.md     # filled intake (input contract, gaps flagged)
├── HANDOVER.md                 # build handover
├── README.md                   # this file
└── assets/
    ├── *-1024x768.webp         # display copies (419 KB total) — what the page shows
    └── *-1024x768.png          # hi-res layer (4.2 MB) — what the loupe pulls from
```

Both image sets are needed. The engine keeps **display** and **zoom** sources separate
(spec §7): the page loads webp for fast first paint, the magnifier reads the PNG.
When Anas's full-resolution originals arrive, drop them in and point `hires` at them in the
config — no other change.

## Deploy

Per `CLAUDE.md`: **scoped manual push**, never `push-build` (hosted_content is multi-project
with other live embeds).

```
hosted_content/onlycells/interactive-case/case-mm250818/
├── case-mm250818.html
├── README.md
└── assets/…
```

Live URL once pushed:
`https://danforgedframeworks.github.io/hosted_content/onlycells/interactive-case/case-mm250818/case-mm250818.html`

## Embed snippet (for the WordPress Custom HTML block)

The widget reports its own height, so the iframe never clips or scrolls internally. Paste the
whole block — iframe **plus** the listener — into one Custom HTML block.

```html
<iframe id="oc-mm250818"
        src="https://danforgedframeworks.github.io/hosted_content/onlycells/interactive-case/case-mm250818/case-mm250818.html"
        title="Only Cells — Morphology Monthly CPD case MM250818"
        style="width:100%;border:0;display:block;height:1400px" scrolling="no"
        allowfullscreen></iframe>
<script>
(function(){
  var f = document.getElementById('oc-mm250818');
  window.addEventListener('message', function(e){
    if (!e.data || e.data.id !== 'MM250818') return;
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

## How the case works (Anas's 2-stage CPD design)

| Station | Screen | What the learner does |
|---|---|---|
| 1 · Presentation & bloods | Screen 1 | Reads the vignette; flags the abnormal FBC/biochemistry results |
| 2 · The blood film | Screen 1 | Examines 8 fields with the magnifier, drops markers, identifies features |
| 3 · Differential & rule-out | Screen 2 | Commits a differential + writes what they'd rule out and how |
| 4 · ADAMTS13 & diagnosis | Screen 2 | **Releases ADAMTS13**, then commits one final diagnosis |
| 5 · Result & CPD record | Reveal | Feedback, model answers, report, record + certificate |

**ADAMTS13 is withheld** until the learner has committed a differential — that is the whole
point of the design. Releasing it **locks Stations 1–3**, and submitting the diagnosis locks
the attempt permanently. So "reset → peek → resubmit" is structurally impossible (spec §11.6).

### Testing it repeatedly — `?reset`

A committed attempt is deliberately locked against reset (spec §11.6), which makes reviewing
it twice impossible. Append **`?reset`** to the URL to wipe this case's saved state and start
clean:

```
…/case-mm250818.html?reset
```

It clears `localStorage` for this case only, then redirects to the plain URL. Off the normal
learner path, so it doesn't weaken the integrity model.

### Print output

Both exports are generated in-page and printed via `window.print()` on the user's own click —
no popups. Page setup is injected at print time (`setPageStyle`), because one static `@page`
rule can't serve both:

- **CPD record** — A4 **portrait**, 14 mm margins, ~4 pages.
- **Certificate** — A4 **landscape**, full-bleed, single page.

The Only Cells logo is a *white* wordmark, so on the white certificate it sits on a navy band —
without it, it prints invisible.

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
ADAMTS13, media, tick items, differentials, options, model answers, report, scoring,
certificate). The engine below it is untouched. Every authored/provisional value carries a
`[GAP]` comment naming what still needs Anas.

## Before go-live — open items

Carried from the intake; all authored against sensible defaults so the build wasn't blocked:

- [ ] **Clinical sign-off** from Anas/SME on everything authored (see below)
- [ ] **Case id + month/slot** — using `MM250818` per folder convention
- [ ] **Reference ranges** — authored standard adult ranges, not supplied by the lab
- [ ] **Detractor features** (the plausible over-calls) and **distractor diagnoses** — authored
- [ ] **Graded or not** — currently formative (no score, no pass mark); confirm, and if graded,
      the weights, pass mark and attempt policy all need setting
- [ ] **Rule-out model answer** — authored; the DIC line needs the coagulation screen, which
      wasn't supplied with the case
- [ ] **Polychromasia** — included as an unscored neutral option pending confirmation
- [ ] **SME-marked films** — Anas offered highlighted copies; `hotspots` is deliberately empty
      and the reveal shows an honest "pending" note rather than guessed marker positions
- [ ] **Certificate background template** — Anas to supply; set `certificate.backgroundUrl`
- [ ] **CPD time, learning outcomes, audience/level, accreditation** — placeholders
- [ ] **Hi-res originals** — Drive not shareable to us; display copies in use
- [ ] **Stain / magnification** — not stated

## Accessibility & privacy

- Keyboard operable throughout; visible teal focus rings; `prefers-reduced-motion` honoured.
- Feature marking never relies on colour alone (ring + number + label + text tag).
- All learner data — reflections, markers, name, submission — stays in `localStorage`
  (`oc-case-MM250818`). **Nothing is transmitted anywhere.** The name field exists only to
  print onto the downloaded record and certificate.
- Exports use a Blob + `<a download>` / `window.print()` fired by the user's own click —
  never `window.open`, so popup blockers don't trip.
- Framed as an educational CPD resource, not a diagnostic device.
