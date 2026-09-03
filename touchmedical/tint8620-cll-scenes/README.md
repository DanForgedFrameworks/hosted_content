# Handoff: CLL Clinical Decision Making — seven scene builds for Visme

Built by Forged Frameworks - Dan Boyland - dan.boyland@forgedframeworks.co.uk

## Overview

An interactive, self-directed learning asset for HCPs on first-line and
subsequent treatment decisions in elderly patients with active CLL. It was
built as one page with seven scenes. The client wants per-scene analytics in
Visme, so this bundle is the same asset cut into **seven independent HTML
builds**, one folder each. Each folder is dropped into its own Visme slide as
an iframe embed. Visme then reports views and time per slide, which is per
scene.

## About the design files

Unlike a normal handoff, these HTML files are **not** references to recreate.
They are the finished, production builds: hosted as-is and embedded in Visme
unchanged. No framework, no build step, no dependencies, no external requests.
The job is deployment and Visme assembly, not re-implementation.

## Fidelity

High. Every colour, size and piece of artwork traces to Lilly's approved CLL
infographic via the Touch - Lilly design kit (`lilly/`). Clinical copy is
verbatim from the approved source.

## What Claude Code needs to do

1. Host the `visme/` folder on a static origin, structure intact.
2. Build a Visme project of eight slides: one opening slide of Visme's own
   (optional), then seven slides each holding one iframe embed at the URLs
   below, in order.
3. Add Back and Next buttons on the Visme canvas, linked to the previous and
   next slide, styled per the spec under Navigation.
4. Confirm Print-tab export works from inside a Visme embed (see Behaviours).

## Folder structure

    visme/
      index.html            contents page listing the seven builds, for checking
      support.js            shared runtime, loaded by every build
      lilly/                shared design kit (tokens, artwork, component CSS)
      00-title/index.html
      01-considerations/index.html
      02-consider/index.html
      03-1l-options/index.html
      04-algorithm/index.html
      05-subsequent/index.html
      06-references/index.html

The scene folders reference `../support.js` and `../lilly/styles.css`, so the
parent folder must be uploaded whole. Do not rename folders: Back and Next
inside each build link to the sibling folder by name.

## Embed URLs and slide order

    Slide  Folder              Scene                                              Embed URL
    1      00-title            Title page and Get started                         <host>/00-title/index.html
    2      01-considerations   Considerations in elderly patients + two patients  <host>/01-considerations/index.html
    3      02-consider         Patient / Disease background, Patient preference   <host>/02-consider/index.html
    4      03-1l-options       Key features of 1L treatment options               <host>/03-1l-options/index.html
    5      04-algorithm        Treatment algorithm example                        <host>/04-algorithm/index.html
    6      05-subsequent       Consider: For subsequent treatment + key message   <host>/05-subsequent/index.html
    7      06-references       Contents list and the References overlay           <host>/06-references/index.html

Query-string options, appended to any embed URL:

    ?chrome=0    hide the in-embed Back and Next buttons (pips stay)

## Embed geometry

Design size is **1280 x 720**. Each build scales itself to fit whatever box the
iframe gives it, centred, preserving 16:9. Any 16:9 iframe works; a non-16:9
iframe letterboxes. Background of the build is transparent, so the embed sits
on the Visme slide's own background. Recommended: a white or `#EBF2FA` slide.

## Navigation

Code inside an iframe cannot move a Visme slide. So:

- **Visme canvas buttons drive the deck.** Add Back and Next on each Visme
  slide with Visme's link-to-slide action. These are the primary controls.
- **In-embed Back and Next** link to the sibling folder. They make the seven
  work as a chain when opened outside Visme and act as a fallback inside it.
  Hide them with `?chrome=0` once the canvas buttons are in, or keep both.
- **Pips** (the numbered dots) mark position: scenes before the current one
  show as reached and jump to that folder; later scenes are locked.

Canvas button spec, matching the in-embed chrome:

    Back   40 x 40 px, 12 px radius, white fill, 1.5 px #212121 outline,
           #212121 chevron pointing left
    Next   40 x 40 px, 12 px radius, #E1251B fill, no outline,
           white chevron pointing right
    Font   Arial (the deck's own fallback for Ringside)

Reveal gating: within a scene, Next appears only once everything on the scene
has been opened. This gate is per scene. It cannot hold a learner who moves with
Visme's own arrows or canvas buttons, and nothing is remembered between scenes.

## Behaviours

**Print-tab export** (References overlay on `06-references`, button
"Print / Save PDF"). Opens a new browser tab containing only the reference
list, styled for paper, which fires the browser's print dialog on load; the
learner saves as PDF from there. Used because hosted players block
`window.print()` inside the embed. If the tab is blocked by the host or a popup
blocker, the list is copied to the clipboard as plain text and a toast reads
"References copied to your clipboard." Nothing is downloaded and nothing leaves
the browser.

Two states to test inside Visme: *tab opened* (print dialog appears in the new
tab) and *tab blocked* (toast appears). If Visme's iframe sandbox blocks
`window.open`, the fallback is what learners will see; flag that back.

**Source overlay.** Selecting a red citation superscript opens a dialog naming
the source and, once a URL is set, offering to open or copy it. URLs are not
yet set; the dialog says so.

**How to use this.** Walkthrough overlay from the title bar pill.

**Background motion.** Toggle at the foot of each scene; all animation stops
under `prefers-reduced-motion`.

## What differs from the single-page build

- **Cross-scene gating is gone.** Each scene is a page load, so progress
  cannot be carried. Gating within a scene is unchanged.
- **Pips mark position, not progress.**
- **Print-tab export** replaced the plain-text download on the References
  overlay.
- **Transparent surround** in place of the dark stage.

Everything else, including the References overlay and the contents list on
scene 06, is as the single-page build.

## Design tokens

From `lilly/tokens/tokens.css`; all extracted from the approved deck.

    --lly-red      #E1251B   title band, headings, bullets, icons, Next
    --lly-ink      #212121   body copy, outlines, Back
    --lly-white    #FFFFFF
    --lly-navy     #0F3A85   continuous therapy branch
    --lly-forest   #144B2D   time-limited therapy branch
    --lly-sky      #99BFE5   1L feature-panel fill
    --lly-panel    #EBF2FA   pale framing panel
    --lly-font     Ringside, falling back to Arial (Ringside is not shipped)

## Editing and regeneration

Do not edit the seven `index.html` files. They are generated from
`CLL Decision Making Scenes v5.dc.html` in the project root: one master, seven
outputs. Each generated file differs from the master only by
`window.CLL_SCENE = N` (0-6) in its head and two relative paths
(`../support.js`, `../lilly/styles.css`). Change the master, regenerate,
re-upload.

`?scene=N` on the master previews a single scene without generating anything.

## Before publication

- Job code to be issued and inserted. The slot is present and empty.
- Interface copy authored for the interactive layer carries
  `title="Placeholder copy - not from the approved infographic"`. Everything
  unmarked is verbatim from the approved source.
- Reference titles, author strings and DOIs were sourced from the literature,
  not from the supplied slides. Verify before use.
- Source URLs for the citation overlay are not yet set.
