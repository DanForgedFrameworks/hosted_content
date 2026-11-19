(function(){
  /* ==========================================================
     MODERN REFLECTION NOTEPAD
     v7.6 | 2026 (One note name + Microinteractions + Restyle + Launcher)
     Host: paste into an "Execute JavaScript" trigger on the launch
       button; the notepad opens when the trigger runs.
     Standalone: index.html loads this file; an "Open notepad" button
       appears, and Close returns to it. Course settings come from
       window.NotepadConfig (same names as the Host variables).
     Storage keys are unchanged from v7.4, so existing notes carry over.
     ========================================================== */

  if (document.getElementById('SL_Notepad_Wrap')) return;

  var player = null;
  try { player = GetPlayer(); if (player) player.SetVar('CloseNotepad', false); } catch(e){}
  var IN_HOST = !!player;
  var CONFIG = (!IN_HOST && window.NotepadConfig) || {};

  // Exports. Host keeps its Word (.doc) download. Standalone (LMS embeds) cannot:
  // the host's sandboxed frame silently blocks file downloads AND in-frame printing, so it
  // uses the VLE-safe new-tab PDF export plus Copy note (three routes, as in other blocks).
  var PRINT_EXPORT = !IN_HOST;
  var WORDS = PRINT_EXPORT ? {
    one: 'Save note as PDF', all: 'Save all notes as PDF',
    keepNow: 'Save it as a PDF or copy it now so you keep it.',
    keepBeforeLeaving: 'Save your note as a PDF or copy it before you leave.'
  } : {
    one: 'Download note (.doc)', all: 'Download all notes (.doc)',
    keepNow: 'Download this note now so you keep it.',
    keepBeforeLeaving: 'Download your note before you leave.'
  };

  function setVar(n, v){ try{ if(player) player.SetVar(n, v); }catch(e){} }
  function getVar(n, d){ try{ return player ? player.GetVar(n) : (CONFIG[n] !== undefined ? CONFIG[n] : d); }catch(e){ return d; } }

  // 1. COLOURS - the course accent comes from Host; darken it if it is too faint to read
  var DEFAULT_ACCENT = '#2563eb';
  var SURFACE_ALT = [249, 250, 251]; // --np-bg-alt

  function hexToRgb(h){
    h = String(h || '').trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(h)) h = h.replace(/./g, '$&$&');
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    return [0, 2, 4].map(function(i){ return parseInt(h.substr(i, 2), 16); });
  }
  function toHex(c){ return '#' + c.map(function(v){ return ('0' + Math.round(v).toString(16)).slice(-2); }).join(''); }
  function lum(c){
    var w = [0.2126, 0.7152, 0.0722];
    return c.reduce(function(sum, v, i){ v /= 255; return sum + w[i] * (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); }, 0);
  }
  function contrast(a, b){ var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function tintOf(c){ return c.map(function(v){ return 255 - (255 - v) * 0.1; }); } // 10% accent on white
  // Accent text sits on the grey surface and on its own tint, so it must pass on both
  function readableAccent(hex){
    var c = hexToRgb(hex) || hexToRgb(DEFAULT_ACCENT), guard = 0;
    while ((contrast(c, SURFACE_ALT) < 4.5 || contrast(c, tintOf(c)) < 4.5) && guard++ < 60) c = c.map(function(v){ return v * 0.95; });
    return c;
  }
  function readableOn(bg, wantHex){
    var want = hexToRgb(wantHex);
    if (want && contrast(want, bg) >= 4.5) return toHex(want);
    return contrast([255, 255, 255], bg) >= contrast([0, 0, 0], bg) ? '#ffffff' : '#000000';
  }

  // Accent as TEXT (links, active tab, focus ring) is darkened until it reads on white.
  // Accent as a button FILL keeps the brand colour whenever the chosen button text reads on it.
  var RAW_RGB     = hexToRgb(getVar('AccentHex', '')) || hexToRgb(DEFAULT_ACCENT);
  var ACCENT_RGB  = readableAccent(toHex(RAW_RGB));
  var ACCENT      = toHex(ACCENT_RGB);
  var ACCENT_TINT = toHex(tintOf(ACCENT_RGB));
  var WANT_TEXT   = hexToRgb(getVar('AccentTextHex', '') || '#ffffff');
  var FILL_RGB    = (WANT_TEXT && contrast(WANT_TEXT, RAW_RGB) >= 4.5) ? RAW_RGB : ACCENT_RGB;
  var ACCENT_FILL = toHex(FILL_RGB);
  var ACCENT_TEXT = readableOn(FILL_RGB, getVar('AccentTextHex', '') || '#ffffff');

  // 2. CSS (added once; replaced if the notepad is reopened with a different accent)
  var css = document.getElementById('SL_Notepad_Style') || document.createElement('style');
  css.id = 'SL_Notepad_Style';
  css.textContent = `
    #SL_Notepad_Wrap {
      --np-accent: ${ACCENT};
      --np-accent-tint: ${ACCENT_TINT};
      --np-accent-fill: ${ACCENT_FILL};
      --np-accent-txt: ${ACCENT_TEXT};
      --np-bg: #ffffff;
      --np-bg-alt: #f9fafb;
      --np-bg-track: #f3f4f6;
      --np-bg-hover: #e5e7eb;
      --np-border: #e5e7eb;
      --np-border-strong: #d1d5db;
      --np-text: #111827;
      --np-text-secondary: #374151;
      --np-text-muted: #6b7280;
      --np-text-muted-strong: #4b5563;
      --np-danger: #dc2626;
      --np-danger-hover: #b91c1c;
      --np-danger-bg: #fef2f2;
      --np-success: #15803d;
      --np-warn-bg: #fffbeb;
      --np-warn-border: #fcd34d;
      --np-warn-text: #92400e;
      --np-ring: 0 0 0 1px rgba(17, 24, 39, 0.06);
      --np-shadow-sm: 0 0 0 1px rgba(17, 24, 39, 0.06), 0 1px 2px rgba(17, 24, 39, 0.06), 0 4px 12px -4px rgba(17, 24, 39, 0.08);
      --np-shadow: 0 0 0 1px rgba(17, 24, 39, 0.06), 0 12px 32px -8px rgba(17, 24, 39, 0.18), 0 4px 10px -4px rgba(17, 24, 39, 0.08);
      --np-radius: 20px;
      --np-radius-ctrl: 8px;
      --np-ease: cubic-bezier(0.2, 0, 0, 1);
      --np-font: 15px/1.6 'Atkinson Hyperlegible', 'Segoe UI', system-ui, sans-serif;

      position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
      width: 96%; max-width: 700px;
      height: 96%; max-height: 520px;
      background: var(--np-bg); z-index: 9999;
      display: flex; flex-direction: column;
      border-radius: var(--np-radius); box-shadow: var(--np-shadow);
      font: var(--np-font); color: var(--np-text);
      overflow: hidden;
    }
    #SL_Notepad_Wrap *, #SL_Notepad_Wrap *::before, #SL_Notepad_Wrap *::after { box-sizing: border-box; }
    #SL_Notepad_Wrap [hidden] { display: none !important; }
    #SL_Notepad_Wrap button, #SL_Notepad_Wrap select, #SL_Notepad_Wrap input { font-family: inherit; }
    #SL_Notepad_Wrap :focus-visible { outline: 2px solid var(--np-accent); outline-offset: 2px; }
    #SL_Notepad_Wrap #np_editor:focus-visible { outline-offset: -2px; }
    .np-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
    #SL_Notepad_Wrap svg { width: 16px; height: 16px; flex: none; }

    /* Header: which note you are in, big and first */
    .np-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 16px 20px 8px; }
    .np-heading-area { flex: 1; min-width: 0; }
    .np-eyebrow { display: flex; align-items: center; flex-wrap: wrap; gap: 2px 8px; font-size: 12px; line-height: 1.4; color: var(--np-text-muted); }
    .np-eyebrow-title { margin: 0; font-size: 12px; font-weight: 600; color: var(--np-text-muted-strong); }
    .np-dot { color: var(--np-border-strong); }
    .np-count { font-variant-numeric: tabular-nums; }
    .np-status { display: inline-flex; align-items: center; gap: 4px; font-variant-numeric: tabular-nums; }
    .np-status-icon { display: inline-flex; }
    .np-status-icon svg { width: 14px; height: 14px; }
    .np-status.is-saved .np-status-icon { color: var(--np-success); }
    .np-status.is-warn { color: var(--np-warn-text); font-weight: 600; }
    .np-name-row { display: flex; align-items: center; gap: 2px; margin-top: 2px; }
    .np-name {
      flex: 0 1 auto; field-sizing: content; min-width: 6ch; max-width: 100%; margin-inline-start: -8px; padding: 2px 8px;
      border: 1px solid transparent; border-radius: var(--np-radius-ctrl); background: transparent;
      font-size: 20px; font-weight: 600; line-height: 1.3; color: var(--np-text);
      text-overflow: ellipsis;
      transition-property: background-color, border-color; transition-duration: 0.15s;
    }
    .np-name::placeholder { color: var(--np-text-muted); }
    .np-switch {
      flex: none; width: 32px; height: 32px; padding: 0;
      appearance: none; -webkit-appearance: none;
      border: 1px solid transparent; border-radius: var(--np-radius-ctrl); cursor: pointer;
      font-size: 16px; color: transparent;
      background: transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234b5563' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") center / 18px no-repeat;
      transition-property: background-color; transition-duration: 0.15s;
    }
    .np-switch option { color: var(--np-text); background: var(--np-bg); }
    .np-header-actions { display: flex; align-items: center; gap: 8px; }

    /* Text / Sketch segmented switch */
    .np-seg { display: inline-flex; padding: 2px; gap: 2px; border-radius: 10px; background: var(--np-bg-track); }
    .np-seg .np-icon-btn { border-radius: var(--np-radius-ctrl); color: var(--np-text-muted-strong); }
    .np-seg .np-icon-btn[aria-pressed="true"] { background: var(--np-bg); color: var(--np-accent); box-shadow: 0 1px 2px rgba(17, 24, 39, 0.1), var(--np-ring); }

    .np-icon-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      background: transparent; border: 1px solid transparent; border-radius: var(--np-radius-ctrl);
      padding: 6px 10px; color: var(--np-text-muted); cursor: pointer;
      font-size: 13px; font-weight: 500; line-height: 1.2; white-space: nowrap;
      transition-property: background-color, color, border-color, box-shadow, transform; transition-duration: 0.15s; transition-timing-function: var(--np-ease);
    }
    .np-close-btn { padding: 6px; }
    .np-accent-btn { color: var(--np-accent); font-weight: 600; }
    .np-outline-btn { background: var(--np-bg); border-color: var(--np-border-strong); color: var(--np-text-secondary); }
    .np-danger { color: var(--np-danger); }

    /* Floating toolbar */
    .np-toolbar {
      display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px;
      margin: 8px 16px 0; padding: 6px 8px;
      background: var(--np-bg); border-radius: 12px; box-shadow: var(--np-shadow-sm);
    }
    .np-tool-group { display: flex; align-items: center; gap: 2px; }
    .np-more { display: contents; }
    .np-more-btn, .np-opts-btn { display: none; }

    .np-fmt-btn {
      width: 30px; height: 30px; border-radius: var(--np-radius-ctrl); border: 1px solid transparent; background: transparent;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: var(--np-text-muted); font-weight: 600; font-size: 14px;
      transition-property: background-color, color, transform; transition-duration: 0.15s; transition-timing-function: var(--np-ease);
    }
    .np-fmt-btn[aria-pressed="true"] { background: var(--np-accent-tint); color: var(--np-accent); }

    .np-select {
      border: 1px solid var(--np-border-strong); border-radius: var(--np-radius-ctrl); padding: 4px 8px; font-size: 13px;
      background: var(--np-bg); color: var(--np-text); cursor: pointer;
    }
    .np-color-wrap { display: flex; align-items: center; gap: 4px; padding: 0 4px; font-size: 13px; color: var(--np-text-muted); cursor: pointer; }
    .np-color-input { width: 22px; height: 22px; padding: 0; border: none; cursor: pointer; border-radius: 6px; overflow: hidden; background: none; }

    .np-alert {
      display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px;
      margin: 8px 16px 0; padding: 10px 12px; border-radius: 12px;
      background: var(--np-warn-bg); box-shadow: inset 0 0 0 1px var(--np-warn-border);
      color: var(--np-warn-text); font-size: 13px; font-weight: 500; line-height: 1.4;
    }
    .np-alert > svg { width: 18px; height: 18px; }
    .np-alert-msg { flex: 1 1 220px; }

    .np-body { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; position: relative; background: var(--np-bg); }
    #np_editor { flex: 1; min-height: 0; padding: 16px 24px; overflow-y: auto; color: var(--np-text); }
    #np_editor p { margin: 0 0 8px; }

    .np-sketch-wrap { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; margin: 8px 16px; padding: 8px; border-radius: 12px; background: var(--np-bg-alt); }
    #np_sketch {
      display: block; width: auto; height: auto; max-width: 100%; max-height: 100%; min-width: 0; min-height: 0;
      background: #ffffff; border-radius: 6px; box-shadow: var(--np-ring);
      cursor: crosshair; touch-action: none;
    }

    .np-footer { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 12px 16px; background: var(--np-bg-alt); }
    .np-footer-more { display: contents; }
    .np-spacer { flex: 1; }
    .np-opts-spacer { display: none; }

    .np-btn-primary, .np-btn-secondary, .np-btn-danger {
      padding: 8px 14px; border-radius: var(--np-radius-ctrl); font-weight: 600; font-size: 13px; line-height: 1.2; white-space: nowrap;
      cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      transition-property: background-color, border-color, box-shadow, opacity, transform; transition-duration: 0.15s; transition-timing-function: var(--np-ease);
    }
    .np-btn-primary { background: var(--np-accent-fill); color: var(--np-accent-txt); border: 1px solid var(--np-accent-fill); box-shadow: 0 1px 2px rgba(17, 24, 39, 0.12); }
    .np-btn-secondary { background: var(--np-bg); color: var(--np-text-secondary); border: 1px solid var(--np-border-strong); }
    .np-btn-danger { background: var(--np-danger); color: #ffffff; border: 1px solid var(--np-danger); }

    @media (hover: hover) {
      .np-icon-btn:hover { background: var(--np-bg-track); color: var(--np-text); }
      .np-seg .np-icon-btn:hover { background: var(--np-bg-hover); }
      .np-seg .np-icon-btn[aria-pressed="true"]:hover { background: var(--np-bg); color: var(--np-accent); }
      .np-outline-btn:hover { background: var(--np-bg-alt); }
      .np-danger:hover { background: var(--np-danger-bg); color: var(--np-danger-hover); }
      .np-fmt-btn:hover { background: var(--np-bg-track); color: var(--np-text); }
      .np-fmt-btn[aria-pressed="true"]:hover { background: var(--np-accent-tint); color: var(--np-accent); }
      .np-name:hover { background: var(--np-bg-alt); }
      .np-switch:hover { background-color: var(--np-bg-track); }
      .np-btn-primary:hover { opacity: 0.92; }
      .np-btn-secondary:hover { background: var(--np-bg-alt); }
      .np-btn-danger:hover { background: var(--np-danger-hover); border-color: var(--np-danger-hover); }
    }
    .np-name:focus { background: var(--np-bg); border-color: var(--np-border-strong); }

    .np-dialog {
      border: none; border-radius: 16px; padding: 24px; margin: auto;
      width: min(360px, calc(100vw - 32px)); max-width: none;
      background: var(--np-bg); color: var(--np-text); font: var(--np-font);
      box-shadow: var(--np-shadow);
    }
    .np-dialog::backdrop { background: rgba(17, 24, 39, 0.5); }
    .np-dialog-title { margin: 0 0 8px; font-size: 16px; font-weight: 600; line-height: 1.4; }
    .np-dialog-msg { margin: 0 0 20px; font-size: 14px; color: var(--np-text-secondary); line-height: 1.5; }
    .np-dialog-btns { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 10px; }

    /* Copy note, route 3: the note shown selected when copying is blocked */
    .np-copy-dialog { width: min(480px, calc(100vw - 32px)); }
    .np-copy-box {
      max-height: 240px; overflow: auto; margin: 0 0 20px; padding: 12px;
      border: 1px solid var(--np-border-strong); border-radius: var(--np-radius-ctrl);
      background: var(--np-bg-alt); font-size: 14px; line-height: 1.5; user-select: text;
    }
    .np-copy-box h1 { margin: 0 0 8px; font-size: 16px; }
    .np-copy-box p { margin: 0 0 8px; }

    /* Standalone: the notepad opens inside the page's frame and fills it */
    #SL_Notepad_Wrap.np-embedded {
      left: 0; top: 0; transform: none; width: 100%; height: 100%;
      max-width: none; max-height: none; border-radius: inherit; box-shadow: none;
    }

    /* Standalone launch button (Host supplies its own) */
    .np-launch {
      display: inline-flex; align-items: center; justify-content: center; gap: 12px;
      padding: 16px 28px; border: 0; border-radius: 14px; cursor: pointer;
      background: ${ACCENT_FILL}; color: ${ACCENT_TEXT};
      font: 600 18px/1.2 'Atkinson Hyperlegible', 'Segoe UI', system-ui, sans-serif;
      box-shadow: 0 1px 2px rgba(17, 24, 39, 0.12), 0 8px 20px -6px rgba(17, 24, 39, 0.25);
      transition-property: opacity, box-shadow, transform; transition-duration: 0.15s; transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
    }
    .np-launch svg { width: 22px; height: 22px; flex: none; }
    .np-launch:focus-visible { outline: 2px solid ${ACCENT}; outline-offset: 3px; }
    @media (hover: hover) { .np-launch:hover { opacity: 0.92; box-shadow: 0 1px 2px rgba(17, 24, 39, 0.12), 0 12px 24px -6px rgba(17, 24, 39, 0.3); } }
    @media (pointer: coarse) { .np-launch { min-height: 44px; } }
    @media (prefers-reduced-motion: no-preference) { .np-launch:active { transform: scale(0.96); } }

    /* Microinteractions - only for learners who have not asked their device to reduce motion */
    @keyframes np-pop { from { opacity: 0; transform: scale(0.25); filter: blur(4px); } to { opacity: 1; transform: scale(1); filter: blur(0); } }
    @keyframes np-fade { from { opacity: 0; } to { opacity: 1; } }
    @media (prefers-reduced-motion: no-preference) {
      #SL_Notepad_Wrap button:active:not(:disabled) { transform: scale(0.96); }
      .np-status.is-pop .np-status-icon svg { animation: np-pop 0.2s var(--np-ease); }
      .np-fade-in { animation: np-fade 0.15s ease-out; }
      .np-dialog { transition-property: opacity, translate, overlay, display; transition-duration: 0.12s; transition-timing-function: ease-out; transition-behavior: allow-discrete; opacity: 0; translate: 0 4px; }
      .np-dialog[open] { opacity: 1; translate: 0 0; transition-duration: 0.18s; }
      .np-dialog::backdrop { transition-property: opacity, overlay, display; transition-duration: 0.18s; transition-behavior: allow-discrete; opacity: 0; }
      .np-dialog[open]::backdrop { opacity: 1; }
      @starting-style {
        .np-dialog[open] { opacity: 0; translate: 0 8px; }
        .np-dialog[open]::backdrop { opacity: 0; }
      }
    }

    /* Phones: full screen, extras tucked behind "More" and "Note options" */
    @media (max-width: 599px), (max-height: 459px) {
      #SL_Notepad_Wrap {
        left: 0; top: 0; transform: none; width: 100%; height: 100%;
        max-width: none; max-height: none; border-radius: 0; box-shadow: none;
      }
      /* Name gets its own full-width line; mode switch and Close sit beside the small label */
      .np-header { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 4px 8px; padding: 10px 12px 4px; }
      .np-heading-area { display: contents; }
      .np-eyebrow { grid-column: 1; grid-row: 1; }
      .np-header-actions { grid-column: 2; grid-row: 1; }
      .np-name-row { grid-column: 1 / -1; grid-row: 2; margin-top: 0; }
      .np-name { font-size: 17px; }
      .np-toolbar { margin: 6px 12px 0; }
      .np-more-btn, .np-opts-btn { display: inline-flex; }
      .np-more { display: none; }
      .np-more.is-open { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; flex-basis: 100%; }
      .np-alert { margin: 6px 12px 0; }
      .np-sketch-wrap { margin: 6px 12px; }
      #np_editor { padding: 10px 14px; }
      .np-footer { padding: 8px 12px; }
      .np-footer-more { display: none; }
      .np-footer-more.is-open { display: flex; flex-wrap: wrap; gap: 8px; flex-basis: 100%; order: 3; }
      .np-footer-more .np-spacer { display: none; }
      .np-opts-spacer { display: block; }
      .np-select { font-size: 16px; }
      @media (prefers-reduced-motion: no-preference) {
        .np-more.is-open, .np-footer-more.is-open { transition-property: opacity, translate; transition-duration: 0.15s; transition-timing-function: ease-out; }
        @starting-style { .np-more.is-open, .np-footer-more.is-open { opacity: 0; translate: 0 -4px; } }
      }
    }
    @media (max-width: 419px) {
      .np-btn-label { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
    }
    /* Touch screens: finger-sized targets, and 16px text so iPhones do not zoom */
    @media (pointer: coarse) {
      .np-icon-btn, .np-btn-primary, .np-btn-secondary, .np-btn-danger, .np-select { min-height: 44px; }
      .np-fmt-btn, .np-close-btn, .np-switch { min-width: 44px; min-height: 44px; }
      .np-color-wrap { min-height: 44px; }
      .np-color-input { width: 32px; height: 32px; }
      .np-select { font-size: 16px; }
    }
  `;
  if (!css.parentNode) document.head.appendChild(css);

  var svgA = ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';
  function svg(inner){ return '<svg' + svgA + '>' + inner + '</svg>'; }
  var icnPen      = svg('<path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>');
  var icnText     = svg('<polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line>');
  var icnClose    = svg('<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>');
  var icnMore     = svg('<circle cx="5" cy="12" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle>');
  var icnWarn     = svg('<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>');
  var icnTick     = svg('<polyline points="20 6 9 17 4 12"></polyline>');
  var icnUndo     = svg('<path d="M9 14 4 9l5-5"></path><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"></path>');
  var icnRedo     = svg('<path d="m15 14 5-5-5-5"></path><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"></path>');
  var icnClear    = svg('<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path>');
  var icnTemplate = svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="13" y2="17"></line>');
  var icnPlus     = svg('<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>');
  var icnDownload = svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>');
  var icnFilePdf  = svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M12 12v6"></path><path d="m9 15 3 3 3-3"></path>');
  var icnCopy     = svg('<rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>');
  var icnExport   = PRINT_EXPORT ? icnFilePdf : icnDownload;

  // 3. STORAGE - localStorage when the browser allows it; memory for this visit when it does not
  var STORE = (function(){
    var mem = {}, persistent = false;
    try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); persistent = true; } catch(e){}
    return {
      persistent: persistent,
      get: function(k){ if (!persistent) return mem.hasOwnProperty(k) ? mem[k] : null; try { return localStorage.getItem(k); } catch(e){ return null; } },
      set: function(k, v){ if (!persistent) { mem[k] = v; return true; } try { localStorage.setItem(k, v); return true; } catch(e){ return false; } },
      remove: function(k){ if (!persistent) { delete mem[k]; return; } try { localStorage.removeItem(k); } catch(e){} }
    };
  })();

  var COURSE_SCOPE = getVar('CourseKey', '');
  function K(k){ return COURSE_SCOPE ? (COURSE_SCOPE + '::' + k) : k; }
  var INDEX_KEY = K('SLN:index');
  var NOTE_K = function(id){ return K('SLN:note:' + id); };
  var DEFAULT_NAME = 'Untitled note';

  function readIndex(){ var raw = STORE.get(INDEX_KEY); if (!raw) return null; try { return JSON.parse(raw); } catch(e){ return null; } }
  function writeIndex(i){ return STORE.set(INDEX_KEY, JSON.stringify(i)); }

  function ensureIndex(){
    var idx = readIndex();
    if (!idx || !idx.notes || !idx.currentId){
      idx = { currentId:'main', notes:{ main:{ name:'Starting note', createdAt:new Date().toISOString() } } };
      writeIndex(idx);
      if (!STORE.get(NOTE_K('main'))) STORE.set(NOTE_K('main'), JSON.stringify({ title:'', html:'', sketch:'', ts:new Date().toISOString() }));
    }
    return idx;
  }

  function getNotesMap(){ return ensureIndex().notes; }
  function getCurrentId(){ return ensureIndex().currentId; }
  function setCurrentId(id){ var i = ensureIndex(); i.currentId = id; writeIndex(i); }
  function loadNote(id){
    var raw = STORE.get(NOTE_K(id));
    if (!raw) return { title:'', html:'', sketch:'', ts:'' };
    try { return JSON.parse(raw); } catch(e){ return { title:'', html: raw || '', sketch:'', ts:'' }; }
  }
  function saveNote(id, title, html, sketch){
    return STORE.set(NOTE_K(id), JSON.stringify({ title:title || '', html:html || '', sketch:sketch || '', ts:new Date().toISOString() }));
  }
  function createNote(){
    var id = (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)).toLowerCase();
    var idx = ensureIndex();
    idx.notes[id] = { name:DEFAULT_NAME, createdAt:new Date().toISOString() };
    idx.currentId = id; writeIndex(idx);
    saveNote(id, DEFAULT_NAME, '', '');
    return id;
  }
  function renameNote(id, newName){
    var n = (newName || '').trim(); if (!n) return;
    var idx = ensureIndex(); if (idx.notes[id] && idx.notes[id].name !== n) { idx.notes[id].name = n; writeIndex(idx); }
  }
  function deleteNote(id){
    var idx = ensureIndex(); if (!idx.notes[id]) return;
    delete idx.notes[id]; STORE.remove(NOTE_K(id));
    if (idx.currentId === id){
      if (Object.keys(idx.notes).length === 0){ idx.notes.main = { name:'Starting note', createdAt:new Date().toISOString() }; saveNote('main', '', '', ''); idx.currentId = 'main'; }
      else { idx.currentId = Object.keys(idx.notes)[0]; }
    }
    writeIndex(idx);
  }

  // 4. HTML DOM - built each time the notepad opens
  function openNotepad(){
  if (document.getElementById('SL_Notepad_Wrap')) return;
  var wrap = document.createElement('div');
  wrap.id = 'SL_Notepad_Wrap';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-labelledby', 'np_heading');
  wrap.innerHTML = `
    <div class="np-header">
      <div class="np-heading-area">
        <div class="np-eyebrow">
          <h2 class="np-eyebrow-title" id="np_heading">Reflection notepad</h2>
          <span class="np-dot" aria-hidden="true">·</span>
          <span class="np-count" id="np_count"></span>
          <span class="np-dot" aria-hidden="true">·</span>
          <span class="np-status" id="np_status"><span class="np-status-icon" id="np_status_icon"></span><span id="np_status_text">Notes save to this device</span></span>
        </div>
        <div class="np-name-row">
          <input id="np_name" class="np-name" type="text" aria-label="Note name" placeholder="Name this note" autocomplete="off" />
          <select id="np_switch" class="np-switch" aria-label="Switch note" title="Switch note"></select>
        </div>
      </div>
      <div class="np-header-actions">
        <div class="np-seg" role="group" aria-label="Mode">
          <button type="button" class="np-icon-btn" id="np_mode_text" aria-pressed="true">${icnText}<span class="np-btn-label">Text</span></button>
          <button type="button" class="np-icon-btn" id="np_mode_sketch" aria-pressed="false">${icnPen}<span class="np-btn-label">Sketch</span></button>
        </div>
        <button type="button" class="np-icon-btn np-close-btn" id="np_close" aria-label="Close notepad">${icnClose}</button>
      </div>
    </div>

    <div id="np_toolbar" class="np-toolbar" role="group" aria-label="Formatting">
      <div class="np-tool-group">
        <button type="button" data-cmd="bold" class="np-fmt-btn" aria-label="Bold" aria-pressed="false">B</button>
        <button type="button" data-cmd="italic" class="np-fmt-btn" aria-label="Italic" aria-pressed="false" style="font-style:italic">I</button>
        <button type="button" data-cmd="underline" class="np-fmt-btn" aria-label="Underline" aria-pressed="false" style="text-decoration:underline">U</button>
      </div>
      <div class="np-tool-group">
        <button type="button" id="np_undo" class="np-icon-btn">${icnUndo}<span class="np-btn-label">Undo</span></button>
        <button type="button" id="np_redo" class="np-icon-btn">${icnRedo}<span class="np-btn-label">Redo</span></button>
      </div>
      <button type="button" id="np_more_btn" class="np-icon-btn np-outline-btn np-more-btn" aria-expanded="false" aria-controls="np_more">${icnMore}More<span class="np-sr"> formatting</span></button>
      <div class="np-more" id="np_more">
        <div class="np-tool-group">
          <select id="np_font" class="np-select" aria-label="Font">
            <option value="">Font</option><option value="Lato">Lato</option><option value="Arial">Arial</option><option value="Times New Roman">Times New Roman</option>
          </select>
          <select id="np_size" class="np-select" aria-label="Text size">
            <option value="">Size</option><option value="2">Small</option><option value="3">Normal</option><option value="4">Large</option>
          </select>
        </div>
        <div class="np-tool-group">
          <label class="np-color-wrap">Text <input id="np_color" type="color" value="#000000" class="np-color-input" aria-label="Text colour"></label>
          <label class="np-color-wrap">Highlight <input id="np_hi" type="color" value="#ffff00" class="np-color-input" aria-label="Highlight colour"></label>
        </div>
        <div class="np-tool-group">
          <button type="button" id="np_clear" class="np-icon-btn">${icnClear}Clear note</button>
          <button type="button" id="np_session_template" class="np-icon-btn np-accent-btn">${icnTemplate}Insert session template</button>
        </div>
      </div>
    </div>

    <div id="np_sketch_toolbar" class="np-toolbar" role="group" aria-label="Sketch tools" hidden>
      <div class="np-tool-group">
        <select id="np_sketch_tool" class="np-select" aria-label="Drawing tool">
          <option value="free">Freehand</option><option value="square">Square</option><option value="circle">Circle</option><option value="triangle">Triangle</option><option value="pill">Pill</option>
        </select>
        <label class="np-color-wrap">Colour <input id="np_sketch_color" type="color" value="#2E2E2E" class="np-color-input" aria-label="Pen colour"></label>
      </div>
      <div class="np-tool-group">
        <button type="button" id="np_sketch_undo" class="np-icon-btn">${icnUndo}<span class="np-btn-label">Undo</span></button>
        <button type="button" id="np_sketch_redo" class="np-icon-btn">${icnRedo}<span class="np-btn-label">Redo</span></button>
        <button type="button" id="np_sketch_clear" class="np-icon-btn">${icnClear}Clear sketch</button>
      </div>
    </div>

    <div class="np-alert" id="np_alert" hidden>
      ${icnWarn}<span class="np-alert-msg" id="np_alert_msg"></span>
      <button type="button" class="np-btn-secondary" id="np_alert_dl">${icnExport}${WORDS.one}</button>
    </div>

    <div class="np-body">
      <div id="np_editor" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Note text"></div>
      <div class="np-sketch-wrap" id="np_sketch_wrap" hidden>
        <canvas id="np_sketch" width="700" height="420" role="img" aria-label="Sketch area. Draw with a mouse, finger or stylus."></canvas>
      </div>
    </div>

    <div class="np-footer">
      <button type="button" id="np_opts_btn" class="np-icon-btn np-outline-btn np-opts-btn" aria-expanded="false" aria-controls="np_footer_more">Note options</button>
      <div class="np-footer-more" id="np_footer_more">
        <button type="button" class="np-icon-btn np-outline-btn" id="np_new">${icnPlus}New note</button>
        <button type="button" class="np-icon-btn np-outline-btn np-danger" id="np_delete">${icnClear}Delete</button>
        <div class="np-spacer"></div>
        <button type="button" class="np-btn-secondary" id="np_copy"${PRINT_EXPORT ? '' : ' hidden'}>${icnCopy}Copy note</button>
        <button type="button" class="np-btn-secondary" id="np_export_all">${icnExport}${WORDS.all}</button>
      </div>
      <div class="np-spacer np-opts-spacer"></div>
      <button type="button" class="np-btn-primary" id="np_export_current">${icnExport}${WORDS.one}</button>
    </div>

    <div class="np-sr" role="status" id="np_live"></div>
    <div class="np-sr" role="alert" id="np_live_alert"></div>

    <dialog class="np-dialog" id="np_dialog" aria-labelledby="np_dialog_title" aria-describedby="np_dialog_msg">
      <form method="dialog">
        <h3 class="np-dialog-title" id="np_dialog_title"></h3>
        <p class="np-dialog-msg" id="np_dialog_msg"></p>
        <div class="np-dialog-btns">
          <button type="button" class="np-btn-secondary" id="np_dialog_cancel">Cancel</button>
          <button type="submit" value="ok" class="np-btn-primary" id="np_dialog_ok"></button>
        </div>
      </form>
    </dialog>

    <dialog class="np-dialog np-copy-dialog" id="np_copy_dialog" aria-labelledby="np_copy_title" aria-describedby="np_copy_msg">
      <h3 class="np-dialog-title" id="np_copy_title">Copy your note</h3>
      <p class="np-dialog-msg" id="np_copy_msg">Copying is blocked here, so your note is shown below and selected. Copy it with Ctrl+C (Cmd+C on a Mac) or press and hold on a phone, then paste it into Word or your journal.</p>
      <div class="np-copy-box" id="np_copy_box" tabindex="-1" role="region" aria-label="Your note, selected"></div>
      <div class="np-dialog-btns"><button type="button" class="np-btn-secondary" id="np_copy_close">Close</button></div>
    </dialog>
  `;
  // Host: float over the slide. Standalone: fill the page's frame, if it has one
  var frame = IN_HOST ? null : document.getElementById('np_frame');
  if (frame) wrap.classList.add('np-embedded');
  (frame || document.body).appendChild(wrap);
  var launchBtn = document.getElementById('np_launch');
  if (launchBtn) launchBtn.style.visibility = 'hidden';

  function $(id){ return document.getElementById(id); }
  var nameEl = $('np_name'), editor = $('np_editor'), switchEl = $('np_switch'), countEl = $('np_count');
  var statusEl = $('np_status'), statusIcon = $('np_status_icon'), statusText = $('np_status_text');
  var canvas = $('np_sketch'), ctx = canvas.getContext('2d');
  var liveEl = $('np_live'), liveAlertEl = $('np_live_alert');
  var alertBox = $('np_alert'), alertMsg = $('np_alert_msg');
  var COARSE = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;


  function announce(msg){ liveEl.textContent = ''; setTimeout(function(){ liveEl.textContent = msg; }, 50); }
  // kind: 'saved' pops a tick in, 'warn' shows the warning icon, anything else is plain text
  function setStatus(msg, kind){
    statusText.textContent = msg;
    statusEl.classList.toggle('is-warn', kind === 'warn');
    statusEl.classList.toggle('is-saved', kind === 'saved');
    statusIcon.innerHTML = kind === 'saved' ? icnTick : (kind === 'warn' ? icnWarn : '');
    statusEl.classList.remove('is-pop');
    if (kind === 'saved') { void statusEl.offsetWidth; statusEl.classList.add('is-pop'); }
  }
  function showAlert(msg){
    alertMsg.textContent = msg; alertBox.hidden = false;
    liveAlertEl.textContent = ''; setTimeout(function(){ liveAlertEl.textContent = msg; }, 50);
  }
  function hideAlert(){ alertBox.hidden = true; alertMsg.textContent = ''; }
  function fadeIn(el){ el.classList.remove('np-fade-in'); void el.offsetWidth; el.classList.add('np-fade-in'); }

  // Dialog boxes: native <dialog> gives focus handling, Escape to cancel and Enter to confirm
  var dlg = $('np_dialog'), dlgTitle = $('np_dialog_title'), dlgMsg = $('np_dialog_msg'), dlgOk = $('np_dialog_ok'), dlgCancel = $('np_dialog_cancel');
  dlgCancel.addEventListener('click', function(){ dlg.close('cancel'); });

  function confirmBox(o, callback){
    var returnTo = document.activeElement;
    dlgTitle.textContent = o.title;
    dlgMsg.textContent = o.message || ''; dlgMsg.hidden = !o.message;
    dlgOk.textContent = o.okLabel;
    dlgOk.className = o.danger ? 'np-btn-danger' : 'np-btn-primary';
    dlg.returnValue = '';
    dlg.onclose = function(){
      dlg.onclose = null;
      if (returnTo && returnTo.focus && document.contains(returnTo)) returnTo.focus();
      callback(dlg.returnValue === 'ok');
    };
    dlg.showModal();
    dlgCancel.focus();
  }

  // Undo history: one step per pause in typing, not per keystroke
  var undoStack = [], redoStack = [], MAX_UNDO = 50, commitTimer = null;
  function saveSelection(){
    var sel = window.getSelection(); if (!sel || sel.rangeCount === 0) return null;
    var r = sel.getRangeAt(0); if (!editor.contains(r.startContainer)) return null;
    var pre = document.createRange(); pre.selectNodeContents(editor); pre.setEnd(r.startContainer, r.startOffset);
    return { start:pre.toString().length, end:pre.toString().length + r.toString().length };
  }
  function restoreSelection(saved){
    if (!saved) return;
    function at(root, idx){
      var stack = [root], chars = 0, n, last = null;
      while ((n = stack.pop())){
        if (n.nodeType === 3){ var next = chars + n.length; if (idx >= chars && idx <= next) return { node:n, off: idx - chars }; chars = next; last = n; }
        else for (var i = n.childNodes.length - 1; i >= 0; i--) stack.push(n.childNodes[i]);
      } return last ? { node:last, off:last.length } : null;
    }
    var s = at(editor, saved.start), e = at(editor, saved.end); if (!s || !e) return;
    var rr = document.createRange(); rr.setStart(s.node, s.off); rr.setEnd(e.node, e.off);
    var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(rr);
  }
  function snap(){ return { html: editor.innerHTML, sel: saveSelection() }; }
  function commit(){
    clearTimeout(commitTimer); commitTimer = null;
    var s = snap(), top = undoStack[undoStack.length - 1];
    if (top && top.html === s.html) return;
    undoStack.push(s); if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack.length = 0;
  }
  function commitSoon(){ clearTimeout(commitTimer); commitTimer = setTimeout(commit, 700); }
  function resetUndo(){ clearTimeout(commitTimer); commitTimer = null; undoStack.length = 0; redoStack.length = 0; undoStack.push(snap()); }
  function restoreSnap(s){ editor.innerHTML = s.html || ''; editor.focus(); restoreSelection(s.sel); saveAllDebounced(); }

  $('np_undo').addEventListener('click', function(){
    if (commitTimer) commit();
    if (undoStack.length <= 1) return;
    redoStack.push(undoStack.pop()); restoreSnap(undoStack[undoStack.length - 1]);
  });
  $('np_redo').addEventListener('click', function(){
    if (!redoStack.length) return;
    var nxt = redoStack.pop(); undoStack.push(nxt); restoreSnap(nxt);
  });

  // Formatting: remember where the learner's selection was, because menus and colour pickers take focus
  var lastRange = null;
  function updateFmtState(){
    ['bold', 'italic', 'underline'].forEach(function(c){
      var on = false; try { on = document.queryCommandState(c); } catch(e){}
      wrap.querySelector('[data-cmd="' + c + '"]').setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function onSelChange(){
    var sel = window.getSelection(); if (!sel || !sel.rangeCount) return;
    var r = sel.getRangeAt(0);
    if (editor.contains(r.commonAncestorContainer)) { lastRange = r.cloneRange(); updateFmtState(); }
  }
  document.addEventListener('selectionchange', onSelChange);
  function restoreRange(){
    editor.focus();
    if (lastRange && editor.contains(lastRange.commonAncestorContainer)){
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(lastRange);
    }
  }
  function cmd(c, v){
    restoreRange();
    try { document.execCommand('styleWithCSS', false, c === 'hiliteColor' || c === 'foreColor'); } catch(e){}
    document.execCommand(c, false, v || null);
    commit(); saveAllDebounced(); updateFmtState();
  }
  $('np_toolbar').addEventListener('mousedown', function(e){ if (e.target.closest('[data-cmd]')) e.preventDefault(); });
  $('np_toolbar').addEventListener('click', function(e){
    var t = e.target.closest('[data-cmd]'); if (!t) return; e.preventDefault(); cmd(t.getAttribute('data-cmd'));
  });
  $('np_font').addEventListener('change', function(){ if (this.value) cmd('fontName', this.value); this.value = ''; });
  $('np_size').addEventListener('change', function(){ if (this.value) cmd('fontSize', this.value); this.value = ''; });
  $('np_color').addEventListener('change', function(){ cmd('foreColor', this.value); });
  $('np_hi').addEventListener('change', function(){ cmd('hiliteColor', this.value); });

  $('np_clear').addEventListener('click', function(){
    confirmBox({ title:'Clear this note?', message:'This removes all of its text. You can undo this.', okLabel:'Clear note', danger:true }, function(yes){
      if (yes) { editor.innerHTML = ''; commit(); saveAll(); announce('Note cleared.'); }
    });
  });

  var sketchDrawn = false;

  function fmt(d){ return new Intl.DateTimeFormat(undefined, { hour:'2-digit', minute:'2-digit' }).format(d); }
  function fmtLong(d){ return new Intl.DateTimeFormat(undefined, { year:'numeric', month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit' }).format(d); }
  function currentName(){ return nameEl.value.trim() || DEFAULT_NAME; }
  function pushToHost(){ setVar('NoteTitle', currentName()); setVar('NoteBody', editor.innerText || ''); }

  // Saving: never report "Saved" unless the browser actually kept it
  var saveTimer = null, saveFailed = false;
  function saveAll(){
    clearTimeout(saveTimer); saveTimer = null;
    var sData = sketchDrawn ? canvas.toDataURL('image/png') : '';
    var ok = saveNote(getCurrentId(), currentName(), editor.innerHTML || '', sData);
    if (ok) {
      if (saveFailed) { saveFailed = false; hideAlert(); }
      if (STORE.persistent) setStatus('Saved ' + fmt(new Date()), 'saved');
      else setStatus('Not kept after this page closes', 'warn');
    } else if (!saveFailed) {
      saveFailed = true;
      setStatus('Not saved', 'warn');
      showAlert('Unable to save. This device has run out of space for course notes. ' + WORDS.keepNow);
    }
    pushToHost();
  }
  function saveAllDebounced(){
    if (!saveTimer && !saveFailed && STORE.persistent) setStatus('Saving…');
    clearTimeout(saveTimer); saveTimer = setTimeout(saveAll, 400);
  }
  editor.addEventListener('input', function(){ commitSoon(); saveAllDebounced(); });
  editor.addEventListener('blur', function(){ if (saveTimer) saveAll(); });
  window.addEventListener('pagehide', saveAll);

  // The note's one name: typed at the top, used in the switcher, the download and Host
  var nameTimer = null;
  nameEl.addEventListener('input', function(){
    clearTimeout(nameTimer);
    nameTimer = setTimeout(function(){ renameNote(getCurrentId(), nameEl.value); populateSwitcher(); }, 300);
    saveAllDebounced();
  });
  nameEl.addEventListener('keydown', function(e){ if (e.key === 'Enter') { e.preventDefault(); editor.focus(); } });
  nameEl.addEventListener('blur', function(){
    if (!nameEl.value.trim()) nameEl.value = (getNotesMap()[getCurrentId()] || {}).name || DEFAULT_NAME;
    clearTimeout(nameTimer); renameNote(getCurrentId(), nameEl.value); populateSwitcher();
    if (saveTimer) saveAll();
  });

  function populateSwitcher(){
    var notes = getNotesMap(), curr = getCurrentId(), ids = Object.keys(notes); switchEl.innerHTML = '';
    ids.forEach(function(id){
      var op = document.createElement('option'); op.value = id;
      var meta = notes[id], created = meta.createdAt ? (' – ' + new Date(meta.createdAt).toLocaleDateString()) : '';
      op.textContent = (meta.name || DEFAULT_NAME) + created; if (id === curr) op.selected = true; switchEl.appendChild(op);
    });
    countEl.textContent = 'Note ' + (ids.indexOf(curr) + 1) + ' of ' + ids.length;
    switchEl.setAttribute('aria-label', 'Switch note (' + ids.length + (ids.length === 1 ? ' note' : ' notes') + ')');
  }

  var SCAFFOLD_TEXT = ['Session: ', 'Section: ', 'Activity: (e.g., reflection, optional task, exercise)', ''].join('\n');
  function insertScaffoldIfEmpty(){
    if (editor.textContent.trim()) return;
    var block = SCAFFOLD_TEXT.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    editor.innerHTML = '<div>' + block + '</div><br>';
  }

  /* Sketch Undo/Redo */
  var sketchUndoStack = [], sketchRedoStack = [];
  function saveSketchState(){ sketchUndoStack.push(canvas.toDataURL('image/png')); if (sketchUndoStack.length > 15) sketchUndoStack.shift(); sketchRedoStack = []; }
  // Draw a saved sketch into the canvas, shrinking it to fit if the canvas is now smaller
  function restoreSketch(src, noSave){
    var img = new Image();
    img.onload = function(){
      var s = Math.min(1, canvas.width / img.width, canvas.height / img.height);
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, img.width * s, img.height * s);
      if (!noSave) saveAllDebounced();
    };
    img.src = src;
  }
  // Size the drawing surface to the space it has, so it fills the panel at every screen size
  function fitCanvas(){
    var box = $('np_sketch_wrap').getBoundingClientRect();
    var w = Math.max(100, Math.floor(box.width - 16)), h = Math.max(100, Math.floor(box.height - 16));
    if (w === canvas.width && h === canvas.height) return;
    var src = sketchDrawn ? canvas.toDataURL('image/png') : null;
    canvas.width = w; canvas.height = h;
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h);
    if (src) restoreSketch(src, true);
  }

  function loadCurrent(){
    var id = getCurrentId(), meta = getNotesMap()[id] || {}, data = loadNote(id);
    // One name per note: an older note's title wins over its list name
    var name = (data.title && data.title.trim()) || meta.name || DEFAULT_NAME;
    nameEl.value = name; renameNote(id, name);
    editor.innerHTML = data.html || '';
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    sketchUndoStack = []; sketchRedoStack = [];
    if (data.sketch) { sketchDrawn = true; restoreSketch(data.sketch, true); sketchUndoStack.push(data.sketch); } else { sketchDrawn = false; saveSketchState(); }
    insertScaffoldIfEmpty();
    lastRange = null; resetUndo(); updateFmtState(); populateSwitcher();
    if (STORE.persistent) setStatus(data.ts ? 'Saved ' + fmt(new Date(data.ts)) : 'Notes save to this device');
    else setStatus('Not kept after this page closes', 'warn');
    pushToHost();
    if (!COARSE && !editor.hidden) editor.focus();
  }

  switchEl.addEventListener('change', function(){
    saveAll(); setCurrentId(this.value); loadCurrent();
    fadeIn(editor.hidden ? $('np_sketch_wrap') : editor);
    announce('Opened ' + currentName() + '.');
  });

  $('np_new').addEventListener('click', function(){
    saveAll(); createNote(); loadCurrent();
    nameEl.focus(); nameEl.select();
    announce('New note created. Type a name for it.');
  });
  $('np_delete').addEventListener('click', function(){
    var id = getCurrentId();
    confirmBox({ title:'Delete “' + currentName() + '”?', message:'This note and its sketch will be removed from this device. This cannot be undone.', okLabel:'Delete note', danger:true }, function(yes){
      if (yes) { clearTimeout(saveTimer); saveTimer = null; deleteNote(id); loadCurrent(); announce('Note deleted.'); }
    });
  });

  // Session template: headings the learner writes under, no filler to delete
  var SESSION_TEMPLATE_HTML =
    '<p><b>Key reflections</b></p>' +
    '<p>Take a moment to capture your key reflections. Write down any thoughts, insights, or challenges that have stood out to you.</p>' +
    '<p><br></p>' +
    '<p><b>Questions to explore</b></p>' +
    '<p>Identify any questions you need to explore further. Note them down and decide whom you can reach out to - colleagues, peers, or a mentor - to gain more clarity.</p>' +
    '<p><br></p>';

  $('np_session_template').addEventListener('click', function(){
    confirmBox({ title:'Insert the session template?', message:'This replaces everything in this note. You can undo this.', okLabel:'Replace note' }, function(yes){
      if (!yes) return;
      editor.innerHTML = SESSION_TEMPLATE_HTML;
      commit(); saveAll();
      var firstGap = editor.querySelector('p:nth-child(3)');
      if (firstGap) { editor.focus(); var r = document.createRange(); r.setStart(firstGap, 0); r.collapse(true); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); }
    });
  });

  /* Disclosure menus for phone widths ("More" formatting, "Note options") */
  var disclosures = [[$('np_more_btn'), $('np_more')], [$('np_opts_btn'), $('np_footer_more')]];
  function setOpen(pair, open){ pair[0].setAttribute('aria-expanded', open ? 'true' : 'false'); pair[1].classList.toggle('is-open', open); }
  disclosures.forEach(function(pair){
    pair[0].addEventListener('click', function(){ setOpen(pair, pair[0].getAttribute('aria-expanded') !== 'true'); });
  });
  wrap.addEventListener('keydown', function(e){
    if (e.key !== 'Escape' || dlg.open) return;
    disclosures.forEach(function(pair){
      if (pair[0].getAttribute('aria-expanded') === 'true' && (pair[1].contains(document.activeElement) || pair[0] === document.activeElement)){
        setOpen(pair, false); pair[0].focus();
      }
    });
  });

  /* Mode Switching */
  var btnText = $('np_mode_text'), btnSketch = $('np_mode_sketch');
  function setMode(isSketch){
    btnSketch.setAttribute('aria-pressed', isSketch ? 'true' : 'false');
    btnText.setAttribute('aria-pressed', isSketch ? 'false' : 'true');
    $('np_sketch_wrap').hidden = !isSketch;
    editor.hidden = isSketch;
    $('np_sketch_toolbar').hidden = !isSketch;
    $('np_toolbar').hidden = isSketch;
    if (isSketch) fitCanvas();
    fadeIn(isSketch ? $('np_sketch_wrap') : editor);
    fadeIn(isSketch ? $('np_sketch_toolbar') : $('np_toolbar'));
    announce(isSketch ? 'Sketch mode.' : 'Text mode.');
  }
  btnText.addEventListener('click', function(){ if (btnText.getAttribute('aria-pressed') !== 'true') setMode(false); });
  btnSketch.addEventListener('click', function(){ if (btnSketch.getAttribute('aria-pressed') !== 'true') setMode(true); });
  var resizeTimer = null;
  function onResize(){ clearTimeout(resizeTimer); resizeTimer = setTimeout(function(){ if (!$('np_sketch_wrap').hidden) fitCanvas(); }, 150); }
  window.addEventListener('resize', onResize);

  /* Sketch Logic - pointer events cover mouse, finger and stylus */
  var toolSel = $('np_sketch_tool'), colorSel = $('np_sketch_color');
  var isDrawing = false, startX = 0, startY = 0, snapshot = null;

  // The canvas may be scaled to fit its box, so map screen position back to canvas pixels
  function pt(e){
    var r = canvas.getBoundingClientRect();
    return { x:(e.clientX - r.left) * canvas.width / r.width, y:(e.clientY - r.top) * canvas.height / r.height };
  }

  $('np_sketch_clear').addEventListener('click', function(){
    confirmBox({ title:'Clear this sketch?', message:'You can undo this.', okLabel:'Clear sketch', danger:true }, function(yes){
      if (yes) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height); sketchDrawn = false; saveSketchState(); saveAll(); }
    });
  });
  $('np_sketch_undo').addEventListener('click', function(){
    if (sketchUndoStack.length > 1) { sketchRedoStack.push(sketchUndoStack.pop()); restoreSketch(sketchUndoStack[sketchUndoStack.length - 1]); }
  });
  $('np_sketch_redo').addEventListener('click', function(){
    if (sketchRedoStack.length > 0) { var nxt = sketchRedoStack.pop(); sketchUndoStack.push(nxt); restoreSketch(nxt); }
  });

  canvas.addEventListener('pointerdown', function(e){
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch(err){}
    var p = pt(e);
    isDrawing = true; sketchDrawn = true; startX = p.x; startY = p.y;
    ctx.strokeStyle = colorSel.value; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (toolSel.value === 'free') { ctx.beginPath(); ctx.moveTo(startX, startY); }
  });
  canvas.addEventListener('pointermove', function(e){
    if (!isDrawing) return;
    var p = pt(e), tool = toolSel.value;
    if (tool === 'free'){ ctx.lineTo(p.x, p.y); ctx.stroke(); }
    else {
      ctx.putImageData(snapshot, 0, 0); ctx.beginPath(); var w = p.x - startX, h = p.y - startY;
      if (tool === 'square') { ctx.rect(startX, startY, w, h); }
      else if (tool === 'circle') { ctx.arc(startX + w/2, startY + h/2, Math.max(Math.abs(w), Math.abs(h))/2, 0, 2*Math.PI); }
      else if (tool === 'triangle') { ctx.moveTo(startX + w/2, startY); ctx.lineTo(startX + w, startY + h); ctx.lineTo(startX, startY + h); ctx.closePath(); }
      else if (tool === 'pill') { var r = Math.abs(h/2); ctx.moveTo(startX + r, startY); ctx.lineTo(startX + w - r, startY); ctx.arc(startX + w - r, startY + r, r, 1.5*Math.PI, 0.5*Math.PI); ctx.lineTo(startX + r, startY + h); ctx.arc(startX + r, startY + r, r, 0.5*Math.PI, 1.5*Math.PI); ctx.closePath(); }
      ctx.stroke();
    }
  });
  function endDraw(){ if (isDrawing) { isDrawing = false; saveSketchState(); saveAllDebounced(); } }
  canvas.addEventListener('pointerup', endDraw); canvas.addEventListener('pointercancel', endDraw);

  /* Export Logic - Word-readable HTML saved as .doc */
  function esc(s){ return String(s || '').replace(/[&<>]/g, function(m){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]; }); }
  function safeFileName(s){ return String(s || DEFAULT_NAME).replace(/[\\\/:*?"<>|]+/g, '_').trim() || DEFAULT_NAME; }
  var PAGE_BREAK = "<br clear='all' style='page-break-before:always'>";
  function wordDocHTML(title, bodyHtml){
    var t = esc(title || 'Learner reflection notes'), body = String(bodyHtml || '').replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    return "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>" + t + "</title><style>@page{margin:25mm}body{font-family:\"Lato\",\"Segoe UI\",Arial,sans-serif;color:#000}h1{font-size:20pt;margin:0 0 10pt 0;page-break-after:avoid}.meta{font-size:10pt;color:#555;margin:0 0 12pt 0}p,div{font-size:12pt;line-height:1.4;margin:0 0 8pt 0}img{max-width:100%; height:auto; border:1px solid #ccc; margin-top:15pt;}</style></head><body>" + body + "</body></html>";
  }
  function noteHeading(nameMeta, data){ return (data.title && data.title.trim()) ? data.title.trim() : (nameMeta ? nameMeta.name : DEFAULT_NAME); }
  function buildSection(nameMeta, data){
    var meta = 'Saved: ' + esc(fmtLong(new Date(data.ts || Date.now())));
    var safe = String(data.html || '').replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    var sketchImg = data.sketch ? "<h2>Attached Sketch</h2><img src='" + data.sketch + "' />" : '';
    // .meta styles the Word file; .pmeta styles the new-tab PDF page
    return '<h1>' + esc(noteHeading(nameMeta, data)) + "</h1><p class='meta pmeta'>" + meta + '</p>' + safe + sketchImg;
  }

  function triggerDownload(content, filename){
    try {
      var blob = new Blob([content], { type:'application/msword' });
      var url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = filename; document.body.appendChild(a); a.click();
      setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); }, 0);
    } catch(e){
      var a2 = document.createElement('a'); a2.href = 'data:application/msword;charset=utf-8,' + encodeURIComponent(content);
      a2.download = filename; document.body.appendChild(a2); a2.click(); a2.remove();
    }
  }

  function onScreenNote(){ return { title:currentName(), html:editor.innerHTML, sketch: sketchDrawn ? canvas.toDataURL('image/png') : '', ts:new Date().toISOString() }; }
  // If saving failed, export what is on screen rather than the stale stored copy
  function noteForExport(id){ return (id === getCurrentId() && saveFailed) ? onScreenNote() : loadNote(id); }

  // VLE-safe new-tab PDF export (house pattern, carousel/branch families): the learner's click
  // opens a new tab, a print-ready page is written into it, and it prints itself after 250ms.
  // Printing from inside the host frame is blocked; a new tab is outside the frame.
  function printTabHTML(docTitle, intro, bodyHtml){
    var fill = ACCENT_FILL, fillText = ACCENT_TEXT;
    return '<!doctype html><html lang="en-GB"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>' + esc(docTitle) + '</title><style>' +
      'body{margin:0;background:#f3f4f6;color:#111827;font:15px/1.55 Arial,Helvetica,sans-serif;}' +
      '.bar{position:sticky;top:0;display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;padding:14px 24px;background:#fff;box-shadow:0 1px 3px rgba(17,24,39,.12);}' +
      '.bar p{margin:0;flex:1 1 280px;color:#374151;font-size:14px;}' +
      '.bar button{padding:10px 18px;border-radius:8px;border:1px solid ' + fill + ';background:' + fill + ';color:' + fillText + ';font:600 14px Arial,Helvetica,sans-serif;cursor:pointer;min-height:44px;}' +
      '.bar button:focus-visible{outline:2px solid #111827;outline-offset:2px;}' +
      '.doc{max-width:760px;margin:24px auto;padding:48px 56px;background:#fff;box-shadow:0 1px 3px rgba(17,24,39,.12);}' +
      'h1{margin:0 0 6px;padding-bottom:12px;border-bottom:3px solid ' + fill + ';font-size:26px;line-height:1.25;}' +
      'h2{margin:18px 0 8px;font-size:16px;}p,div{margin:0 0 8px;}.pmeta{color:#4b5563;margin:0 0 16px;font-size:13px;}' +
      'img{max-width:100%;height:auto;border:1px solid #cbd5e1;}' +
      '.np-pb{break-before:page;page-break-before:always;}' +
      '@media print{body{background:#fff;}.bar{display:none;}.doc{margin:0;padding:0;max-width:none;box-shadow:none;}@page{margin:18mm;}}' +
      '</style></head><body>' +
      '<div class="bar" role="region" aria-label="Save as PDF"><p>' + intro + ' In the print window, choose <strong>Save as PDF</strong> as the destination.</p>' +
      '<button type="button" onclick="window.print()">Print or save as PDF</button></div>' +
      '<main class="doc">' + bodyHtml + '</main>' +
      '<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},250);});<\/script>' +
      '</body></html>';
  }
  function openPrintTab(docTitle, intro, bodyHtml){
    var w = null;
    try { w = window.open('', '_blank'); } catch(e){ w = null; }
    if (!w) {
      showAlert('Your browser blocked the new tab your PDF opens in. Allow pop-ups for this site and try again, or use Copy note instead.');
      setStatus('PDF tab blocked', 'warn');
      return;
    }
    w.document.open(); w.document.write(printTabHTML(docTitle, intro, bodyHtml)); w.document.close();
    announce('Your PDF opened in a new tab.');
  }

  function exportCurrent(){
    saveAll();
    var id = getCurrentId(), idx = getNotesMap(), note = noteForExport(id);
    var heading = noteHeading(idx[id], note);
    if (PRINT_EXPORT) {
      openPrintTab(heading, 'Your note is ready.', buildSection(idx[id], note));
    } else {
      triggerDownload(wordDocHTML(heading, buildSection(idx[id], note)), safeFileName(heading) + '.doc');
      announce('Note downloaded.');
    }
  }
  $('np_export_current').addEventListener('click', exportCurrent);
  $('np_alert_dl').addEventListener('click', exportCurrent);

  // Every note in one document, each starting on a new page
  $('np_export_all').addEventListener('click', function(){
    saveAll();
    var notes = getNotesMap(), ids = Object.keys(notes);
    var sections = ids.map(function(id, i){
      return (i ? (PRINT_EXPORT ? '<div class="np-pb"></div>' : PAGE_BREAK) : '') + buildSection(notes[id], noteForExport(id));
    });
    if (PRINT_EXPORT) {
      openPrintTab('All reflection notes', 'All ' + ids.length + (ids.length === 1 ? ' note is' : ' notes are') + ' ready, each on its own page.', sections.join(''));
    } else {
      triggerDownload(wordDocHTML('Learner reflection notes', sections.join('')), 'All reflection notes.doc');
      announce('All notes downloaded.');
    }
  });

  // Copy note - three routes, because an LMS frame may withhold clipboard permission:
  // 1 Clipboard API (keeps formatting), 2 execCommand from an off-screen copy,
  // 3 both blocked: show the note selected, with instructions to copy it by hand
  var copyDlg = $('np_copy_dialog'), copyBox = $('np_copy_box');
  $('np_copy_close').addEventListener('click', function(){ copyDlg.close(); });
  function copyNote(){
    saveAll();
    var name = currentName(), text = (editor.innerText || '').trim();
    if (!text) { setStatus('Nothing to copy yet'); announce('There is nothing to copy yet. Write your note first.'); return; }
    var rich = '<h1>' + esc(name) + '</h1>' + editor.innerHTML;
    var plain = name + '\n\n' + text;
    var returnTo = document.activeElement;
    function copied(){ setStatus('Copied. Paste it into Word or your journal', 'saved'); announce('Copied. Paste it into Word or your reflection journal.'); }
    function viaExecCommand(){
      var box = document.createElement('div');
      box.style.cssText = 'position:fixed;left:-9999px;top:0;white-space:pre-wrap;';
      box.innerHTML = rich; document.body.appendChild(box);
      var sel = window.getSelection(), r = document.createRange();
      r.selectNodeContents(box); sel.removeAllRanges(); sel.addRange(r);
      var ok = false; try { ok = document.execCommand('copy'); } catch(e){}
      sel.removeAllRanges(); box.remove();
      if (returnTo && returnTo.focus) returnTo.focus();
      if (ok) copied(); else byHand();
    }
    function byHand(){
      copyBox.innerHTML = rich;
      copyDlg.showModal();
      copyBox.focus();
      var sel = window.getSelection(), r = document.createRange();
      r.selectNodeContents(copyBox); sel.removeAllRanges(); sel.addRange(r);
    }
    try {
      if (navigator.clipboard && window.ClipboardItem && navigator.clipboard.write) {
        navigator.clipboard.write([new ClipboardItem({
          'text/html': new Blob([rich], { type:'text/html' }),
          'text/plain': new Blob([plain], { type:'text/plain' })
        })]).then(copied, viaExecCommand);
        return;
      }
    } catch(e){}
    viaExecCommand();
  }
  $('np_copy').addEventListener('click', copyNote);

  $('np_close').addEventListener('click', function(){
    saveAll();
    setVar('CloseNotepad', true);
    // Click the Host player's own Close control (e.g. a lightbox), never this notepad's
    var btns = document.querySelectorAll('button[aria-label="Close"], [title="Close"]');
    for (var i = 0; i < btns.length; i++) { if (!wrap.contains(btns[i])) { btns[i].click(); break; } }
    document.removeEventListener('selectionchange', onSelChange);
    window.removeEventListener('pagehide', saveAll);
    window.removeEventListener('resize', onResize);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    // Standalone: hand focus back to the launch button
    var launch = document.getElementById('np_launch');
    if (launch) { launch.style.visibility = ''; launch.focus(); }
  });

  ensureIndex(); loadCurrent();
  if (!STORE.persistent) showAlert('This browser is blocking saved notes, so anything you write here will be lost when this page closes. ' + WORDS.keepBeforeLeaving);
  }

  // 5. START - Host opens straight away (its own button ran this trigger);
  //    standalone shows an "Open notepad" button first
  if (IN_HOST) {
    openNotepad();
  } else {
    var launch = document.getElementById('np_launch');
    if (!launch) {
      launch = document.createElement('button');
      launch.type = 'button'; launch.id = 'np_launch'; launch.className = 'np-launch';
      launch.innerHTML = icnPen + '<span>Open notepad</span>';
      (document.getElementById('np_launch_host') || document.getElementById('np_frame') || document.body).appendChild(launch);
    }
    launch.addEventListener('click', openNotepad);
  }

})();
