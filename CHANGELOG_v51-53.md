# String & Racket Finder — v51 · build 2026-09-03.51 · b134

## Heat ramp, second generation ("too bright")
- `cellColor()` (the ONE shared wrapper) now builds every ramp theme in OKLCH from the theme's own low/mid/hi stops:
  lightness 24 % → 74 % on dark themes (92 % → 42 % on bright twins), chroma rising to a peak at 8–9,
  gamut fit by dropping chroma (never hue), ink = whichever of the two inks wins WCAG on that exact cell,
  crossover nudge where neither ink reaches 4.5:1. The 10 keeps its token; tier/duo/blend/trio untouched.
- Measured, default 3.0aM: the 9 went from ~93 % lightness (near-white) to rgb(120,187,159); 798 cells × 40 themes:
  ramp-theme contrast fails 73 → 0 (9 remain, all pre-existing in tier/duo/trio + the 1.0a ten token).

## Pure physics now reaches the string bench
- New `srfSbPhysVec(b)` / `srfSbAxes(b)` (twin of `srfAxes`, shared area next to it): a bed is recomputed from its
  NEEERDY lab row only — stiffness lb/in, gauge (name first, else row), cross-section edges, tension-loss class,
  energy-return class, lifespan band, material class, and the strung tension (mt/ct). Hybrids merge with the
  same AXW shares; longevity follows the faster-dying string. Precision and sound stay honest blanks.
  Rank-scaled over the whole bed field, half steps, capped at 9. Beds without a lab row show blanks in this view
  (3 of 350; "Conf." is aliased to "Confidential").
- Routed through the accessor: string grid cells + idx + column sort + multi-select, mobile cards, `SRF.bedFull`
  (`s` filled for the calibrator, new `sAx` with blanks for ranking), `srfShortlist("string")` / midPaint.
- Recursion guard `SRF_SBPHYS_BUILD` (bedFull → accessor → field walk → bedFull hung the page on first attempt).
- Copy: `#sb_physnote`, gear explainer, srfAxes comment.

## Proof
- Chromium: string podium scored = RPM Blast×Touch VS / Mach 10×Sync / Mach 10×ALU Rough → physics = RPM Blast×Xcel /
  GAMMA Moto / VÖLKL Cyclone. 0 page errors in all four modes, both viewports; search dock 1×/1× in every mode.
- Frames were already switching in v50 (podium Speed Pro → C10 Pro) — the "no change" was the string section.

## Open
- 390 px: 24 px horizontal overflow is PRE-EXISTING in v50 (measured on the untouched file), not introduced here.
- Frame physics still hands out 10s (min-max scaler); the string physics caps at 9. Align later.

# v52 · build 2026-09-03.52 · b135 — mobile repair (Alexey's iPhone report)

- **Intermediate opened as three empty full-height columns.** `.mode-mid #deptnavM{top:52px}` was a BASE rule
  written after the phone block, so on a phone the fixed bottom bar also had top:52px → one fixed box over the
  whole viewport, tabs stretched by align-items:stretch, blurred backdrop eating every tap. Restated `top:auto`
  inside a media block placed after it (srf-finder rule 6).
- **"Customize" from the card menu did nothing.** The panels are in-flow cards near the top of the department;
  desktop relied on `field.focus()` to scroll there, iOS does not. New shared `srfPanelReveal(panel, field)`:
  scrollIntoView first, focus only off touch layouts (no surprise keyboard). Wired into customize, my-feel
  (racket + string), transfer specs (racket ×3 paths, string ×2). `scroll-margin-top` keeps the sticky header off the title.
- **24 px sideways scroll at 390 px (since v50):** three content-box `width:100%` + padding offenders — `#deptnav/#deptnavM`
  (424 px), `.srflegal` (414 px), `.srchbar` on phones (395–407 px). All `box-sizing:border-box`. Overflow now 0 in every
  mode/dept at 390 and 1400.
- Play-notes sheet sat under the fixed tab row (z60 vs z100) → z130/129 on phones.
- "full table →" on a phone now also switches the chapter to table view instead of landing on cards.
- Sweep (Chromium 390×844, touch): 30 checks green — easy chips/run/podium, mid tabs/chips/tune/sliders, pro five tabs,
  cards, limits, shelf menu, why-this, compare bar + popup, find, colour chips, own-rating pop, header sort, gear,
  language DE, theme change, transfer specs (both benches), calibrator, player, model switch, landing. 0 page errors.

# v53 · build 2026-09-03.53 · b136 — own line icons on the department tabs (variant A)

- Emoji glyphs (★ 🎾 🧶 👤 ⇆) replaced by five inline SVG line icons in both navs (#deptnav ×5, #deptnavM ×3):
  currentColor, 1.6 px stroke, 18 px desktop / 20 px phone. Reason: iOS paints the emoji in colour — the only
  foreign colour on the page.
- Phone: the hidden subtitle's count survives as a 7.5 px figure in the tab corner (`data-n` set by the same fill
  code that writes "155 frames" / "350 beds"; `::after{content:attr(data-n)}` in the ≤760 block only).
- Desktop unchanged in geometry (subtitles stay); bars 57 px tall on phones as before.
- Regression: 0 page errors, 0 overflow in every mode/dept at 1400 and 390, 30-point phone sweep green.
