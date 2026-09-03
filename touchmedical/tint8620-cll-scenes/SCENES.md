# Scene inventory — CLL Clinical Decision Making: Patient Focused

Canvas 1280 x 720. Every scene: red masthead (title + italic subtitle, "How to
use this" pill right), scene body, then a footer row of Back (left), pips
(centre), Next (right) with the Background motion toggle. Padding inside the
stage 26 px; body column gap 14 px. Values not listed here are in the spec
(tokens §2, components §3, motion §5).

Legend: **gated** = must be opened before Next appears; **staged** = animates in
on a timer, not gated.

## 00 — Title

Layout: centred column. Masthead full width. Body: red Lilly logo, title
28 px bold red, subtitle 20 px italic; below, an intro line (section size) and
the red pill button "Get started" with a nudging chevron (3.2 s loop).
No footer row. No pips. "How to use this" sits top right as a 40 px pill.
Gating: none. Get started goes to 01.

## 01 — Considerations in elderly patients

Layout: framing panel (`--lly-panel`, radius, 2 px ink outline) holding the
"Identifying frailty" definitional text with superscripts 1, 2, 3; below,
section title "Patient examples" left with the prompt line right; then a
two-column grid (gap 16, min-height 186) of two patient cards.
Gated: both patient cards open (roll down to a 420 px cap).
Reveal order: panel staged in at 0 s, patients row at .5 s; cards open on click.
Abbreviations used: CLL, ECOG PS, T2DM, TP53, COPD.

## 02 — Consider: Patient background / Disease background / Patient preference

Layout: prompt line right; three-column trigger row (gap 14) of icon + heading
triggers; each trigger's question panel opens in its own column beneath and
stays open (panels accumulate, they do not swap). Questions use
`.lly-questions` red-dot markers.
Gated: all three triggers opened.
Abbreviations: IGHV, TP53, QOL, IV.

## 03 — Consider: Key features of 1L treatment options

Layout: heading row with the 1L gloss; prompt line right; two-column grid
(gap 20, min-height 296) of feature panels, BCL-2i left, BTKi right, each with
a white-on-red icon head (`.lly-feature__head`) and a bulleted list body.
Gated: both panels opened.
Abbreviations: 1L, BCL-2i, BTKi, CV, TLS. References 4, 5.

## 04 — Treatment algorithm example

Layout: heading; prompt line right; two-column grid (gap 24, align start).
Left column time-limited (forest), right continuous (navy). Each column: a
branch pill, a trunk line that draws down (cllTrunk), then nodes that pop in
left to right (cllPop, staggered). Nodes carry trigger + options.
Gated: both branch pills opened and every node opened.
Abbreviations: BCL-2i, BTKi, cBTKi, CD20, mAb, ncBTKi. References 4, 6.

## 05 — Consider: For subsequent treatment

Layout: prompt line right; one full-width interactive card (radius, hover
shadow) with the consider head and a question list that rolls down; beneath,
the key message (`.lly-keymsg`, red bold) staged in after the card opens.
Gated: card opened.
Abbreviations: CLL, TP53. References 4, 7.

## 06 — End of resource (contents + references)

Layout: centred column, padding 0 26. Top: congratulations card (2 px red
outline, faint red gradient, 30 x 38 padding) with a 28 px red bold line and a
thank-you line. Below: centred section title "Is there anything you would like
to revisit?", then a 2-column grid (gap 16 x 24) of five contents buttons
(scenes 01–05) plus a sixth "References" button, each an outlined 12 px-radius
row with icon, hover inverts to red. Buttons stage in at 1.45 s + 0.3 s each.
References opens the References overlay (700 px card, 3 px red outline,
Print / Save PDF and Close).
Gating: none. Next is absent (last scene).

## Cross-scene furniture

Bridging prompt (scenes 01–04): appears with Next once the scene is explored;
red bold inside a 2 px outlined panel. Copy is in the master's `bridgeFor()`.

Gloss: dotted-underline abbreviation, hover shows the expansion in a small ink
tooltip. First appearance per scene only.

Citation chip: red filled superscript box, click shows the reference inline;
clears on next interaction. Numbering unified across the asset (1–7).
