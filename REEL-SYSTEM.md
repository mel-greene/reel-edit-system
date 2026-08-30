# Reel edit system v4

The editing spec this repo implements — the system Mel Greene uses for her
own Reels, published as a working template. An AI agent (or a human) reads
this file before touching a reel composition; every rule here is enforced by
the kit in `src/kit/`.

This is the consolidated spec as approved on 27 Aug 2026 after two
build-review rounds against a reference creator's edit. The evolution is in
the changelog at the bottom; the body describes only the current style.
Reference implementation: `src/example/`.

Everything is expressed at 1080x1920, 30fps. Frame counts are frames.

**The one-line philosophy:** the speaker is never off screen, every cut lands together
with an overlay change and a visible reframe, captions whisper, emphasis
shouts, and nothing animates that isn't landing.

---

## 1. Tokens  (`src/kit/reelTokens.ts`)

```ts
navy:      '#1B2A4A'  // grounds only (covers, cards if ever revived); never over footage
parchment: '#F5EFE8'  // all primary type over footage
blush:     '#C4A0A0'  // big-type accent: payoff words, labels
rose:      '#E89090'  // caption-tint accent ONLY — see captions
white:     '#FFFFFF'  // asides only
```

Navy never carries type over footage. Blush is invisible at caption size, and
a dark rose dies over dark clothing — that is why `rose` exists: blush's hue
at near-parchment luminance, saturation doing the separating. Tested over both
grounds; a parchment glow-shadow was tested for the dark case and rejected as
mush. Do not re-litigate these.

### Faces  (`src/kit/fonts.ts`, self-hosted in public/fonts/)

| Role | Face | Weight |
|---|---|---|
| Display + captions | Instrument Sans | 500 / 600 / 700 |
| Labels, ordinals | DM Mono | 500 |
| Asides only | your own handwritten face | — |

Instrument Sans and DM Mono are bundled (SIL OFL). The aside face is not —
drop a licensed script font at `public/fonts/Aside.otf` (cursive fallback
otherwise). Line-fitting is live `measureText` against the loaded faces
(`src/kit/fit.ts`) — no static metrics tables.

---

## 2. Zones and platform safety

```
LEFT = 70   RIGHT = 150   SAFE_W = 860     // text lives in x 70–930
```

Instagram UI, measured from a real Reels-feed recording (1080x1920):
top header y 90–230 (translucent), right action rail x 950–1060 / y 990–1620,
bottom caption zone y 1620+. The recording card (§5) clears the rail and the
bottom zone; its top edge sits under the translucent header, same as the
reference creator's — accepted. TikTok's rail rides higher and may brush the
card's bottom-right corner; only narrow the card if a real TikTok post shows a
collision.

| Element | Position |
|---|---|
| Hook title | top 190, centred in safe zone |
| Recording card | x 28, y 150–770 |
| Logo pops | y ~430, centred |
| Memes | wall space, y ~380–520, never over the speaker's face |
| Captions | 71% (y 1363) — under a card: y 804 |
| Emphasis groups | display band y ~450–700, centred ± dx |

---

## 2b. Behind the speaker — the person matte  (`src/kit/Person.tsx`, `tools/personmatte`)

The single biggest "produced" signal in the reference edit: collage cards and
big emphasis words tuck BEHIND the speaker's head and hair, so overlays read
as a set the speaker is standing in front of, not stickers on a webcam frame.

Once per reel, cut the speaker out of the take (macOS; Apple's Vision
framework):

```
swiftc -O tools/personmatte/main.swift -o tools/personmatte/personmatte
./tools/personmatte/personmatte public/NNNN.mp4 public/NNNN-person.mov
```

(Person segmentation ∪ foreground-instance mask — keeps hand-held props like
a mic — smoothstepped so the interior is opaque and the hair edge stays
soft; ProRes 4444 alpha, BT.709-tagged, RGB copied verbatim from the
source.)

Layer order: `Footage` → behind overlays → `PersonLayer` (same cuts —
pixel-aligned) → front overlays. `PersonLayer` mounts only inside its
`windows`; ProRes decode is expensive, so keep the windows to the moments
that need the tuck. Matte files are derived, ~1 GB/min — delete them when
the reel ships. What goes behind the speaker: the hook collage, one emphasis
build at most, never captions, never the CTA.

---

## 3. Footage  (`src/kit/Footage.tsx`, `cuts.ts`)

One continuous take, cut hard. No crossfades, zoom ramps, or speed ramps.

- **Real punch-ins**: tight 1.26–1.38, wide 1.0–1.1, alternating, cycled off a
  metronome. Subtle reframes (1.1x) read as nothing — don't use them.
- **Every cut coincides with something**: a recording card arriving/leaving, a
  logo landing, an emphasis beat, a section turn. A cut into dead air is the
  thing that reads as unfinished.
- **While a recording card is up** the footage reframes DOWN so the face sits
  fully below the card, still visible, still reacting: `dy 240, fy 60,
  scale ≥ 1.22` (fy 60 makes the scale growth swallow the gap the translate
  opens above). **The speaker is never off screen** — except inside a §5
  DocTakeover, bounded there.
- Cut on the breath — pass marks in from the word timings, not a grid.

---

## 4. Text components  (`src/kit/kit.tsx`)

### Hook — persistent top title
Two- or three-line headline (parchment, 700, fitted) + optional parenthetical
subhead (blush, 500, 44px), centred at top 190. Three-line form (v4): sizes
step ~84/66/76 so the lines read as one lockup, and the payoff line — usually
the last — takes `accentLine` and lands in rose. Lands on a 3f fade, HOLDS
~14s while the speaker is already talking, captions running underneath. It
never sits on top of a recording — the first card waits for it to leave. No
numeral takeover.

**The hook collage** (v4): while the hook holds, 2–4 `FloatingCard`s of the
speaker's actual products/covers pop into the wall space BEHIND the speaker
(§2b), landing 2–3f apart with one `click`. It is the visual promise of the
hook — use it when the reel sells or references products, bring it back under
the CTA.

### Running captions — quiet
- **1–3 word cells** split on natural sub-boundaries from whisper.cpp word
  timings. Hard cut in/out. No motion, ever.
- 58px / 600 (raised from 52 after review), parchment, centred, band at 71%.
  **Under a card: y 804** (the gap between card bottom and the head). The
  band is decided once per cell from its temporal midpoint — a cell spanning
  an insert boundary never jumps bands mid-life.
- The stressed word is tinted **rose**. Never scaled, never moved. Most cells
  have none.
- Captions run under the hook and the cards; they yield only to emphasis
  groups and the CTA.
- Ordinals stay stripped — the logo pop says the section once.

### Emphasis groups — loud
- The block is **centred as a composition**, stagger applied around centre:
  setup −48, payoff 0, tail +84. Each group takes a `dx` nudge (±40–65,
  varied across the video) so placement reads as chosen, not templated.
- Payoff 150px/700 blush, setup/tail 66px/600 parchment; payoff 2.0–2.5x the
  setup. One line per beat on a 3f fade; accumulate, hold, clear together.
- 4–6 per video, on the sentences carrying the argument.
- One face throughout — never split a spoken sentence across faces.

### Emphasis builds — the word-timed variant (v4, `EmphasisBuild`)
For a spoken LIST (Research… Find… Organize… Create…), the block form above
is wrong — the reference lands each item AS IT IS SPOKEN. One visual line
mixes a big blush word (700, ~132px) with small parchment companions (600,
~58px) on a shared baseline — "**Find** any" — each line landing on its
spoken frame with a `pop` on the big word only. WORDS land one at a time
(segments auto-stagger 4f, or carry their spoken frame), and a big word
lands with a small back-eased scale pop — the one sanctioned text motion.
The group is ONE compact cluster: companions nested against the big word,
next line's top ≈ the previous line's size below it. Verb groups REPLACE
each other (Research clears before Find lands), companion lines can drop
into the caption band. Position each group's lines at varied x so nothing
stacks centred. One build sequence per reel may sit behind the speaker
(§2b).

### CTA line (v4, `CtaLine`)
"comment "SYSTEM"" — rose, 700, ~60px, centred at top 150–190, landing on a
3f fade with ONE light-sweep glint (frames 4–18, then never again). No
type-on — the sans faces do not type (§7). Pair it with a `FloatingCard` of
the actual deliverable (paper frame, cursor) in the wall space, and hold
both to the end. The card is the proof; the reference holds hers ~10s.

### Logo pops — the section markers
Brand mark + name, **centred** in the wall space (y ~430), landing with a
6f back-eased scale pop and a `pop` SFX as the company is named; gone before
that section's card arrives. Real marks only — from the brand's own assets if
not already in `public/tool-logos/` — or a brand-colour wordmark when no mark
is available. A wrong logo is worse than no logo.

### Memes
1–3 per video, from your own approved library in `public/memes/` (short
looping mp4s; not bundled — source your own). Rounded 14, soft shadow, slight
rotation, wall space only, **never over the speaker's face**, never
simultaneous with an emphasis group. Keep a small approved library rather than
grabbing per video.

### Asides (Ugly Dave)
A remark NOT in the spoken script, 1–2 per video max; if there's no genuine
aside the face doesn't appear. **Types on** character-by-character
(charDur ~1.4) with `typing.mp3` underneath spanning `asideTypeFrames()` — the
hand-written mimic. Off-axis, rotated 2–4°, 54px, parchment. The typed-text
ban applies to the sans faces only.

---

## 5. Screen inserts — four scales  (`ScreenInsert.tsx`, `Takeover.tsx`)

The reference cycles insert SCALE with what the insert is doing. One
treatment repeated is what reads as a template; a reel should use 2–3 of
these, chosen by content:

| Scale | Component | Use for |
|---|---|---|
| small | `FloatingCard` | a file, a cover, a photo — an object being mentioned |
| medium | `ScreenInserts` | UI walkthroughs talked over (the card below) |
| large | `TopTakeovers` | a big scrollable surface (a board, a feed, a grid) |
| full | `DocTakeover` | the deliverable itself, page by page |

**FloatingCard** — wall space, back-eased pop with a `click`, slight
rotation. `paper` mat (white, stacked-sheet shadow) for files/covers, `photo`
for prints, `plain` for UI crops. The Mac `cursor` prop is the "I dragged
this in" wink — use it on files, not photos.

**The card** (`ScreenInserts`) — unchanged from v3: x 28, top 150, 1024x620,
radius 24, soft shadow, hard cut in with a `click`. No blur behind, no dim,
no drift. Source mockups are 1080x1350; the crop window pans
`cropY → cropY2` so the cursor stays in view — verify crops against stills.
Trim first, `rate` second, never above 1.5; running timers stay at 1.

**TopTakeover** — full-WIDTH strip from y 0 down to ~870 (45%), hard
straight bottom edge, no card chrome. The speaker reframes down underneath
(`dy` in cuts.ts) and the caption band drops to just under the edge
(`captionUnderTop`). For surfaces that want width: boards, feeds, template
grids.

**DocTakeover** — full-frame product showcase: pages of the actual
deliverable on a parchment ground, first page pops in, hard cuts between
pages, optional slow drift inside a page. Captions switch to navy ink
(`GroupCaptions inks`), shadow off. **This is the one sanctioned break of
"the speaker is never off screen":** the reference creator leaves frame to
show the product. Bounds — only for the speaker's own deliverable (not
third-party UI), one or two per reel, each ≤ 12s (360f), and the speaker is
back on screen the frame it ends.

---

## 6. Sound  (`src/kit/sfx.ts`)

Four sounds in the whole system. Files are not bundled — drop your own into
`public/sfx/` under these names. Treat the volumes as design decisions, tuned
by ear against speech; judge any change by listening, not by meters.

| Sound | Where | Volume |
|---|---|---|
| `whoosh` | the hook, once per reel | 0.37 |
| `pop` | each emphasis payoff line, each logo pop | 0.40 |
| `click` | each recording card landing | 0.43 |
| `typing` | under each aside as it types on | 0.34 |

Setup/tail lines land silently. No sound on plain footage cuts. Nothing
per-word, no sparkle/ding/riser, no music bed baked in.

---

## 7. Banned

- The speaker off screen outside a §5 DocTakeover (own product, ≤ 12s, 1–2 per reel)
- Edge-to-edge third-party UI; any recording covering the speaker's face
- Blur/dim behind a card; card drift; focus pulls
- Full-frame chapter/opener/result cards; progress rails; wipe transitions
- Crossfades, zoom ramps, speed ramps; reframes too subtle to read (< 1.2)
- Word-by-word captions; caption motion of any kind; scaling a caption word
- Caption groups over 3–4 words, or captions sitting on the face
- Blush as a caption tint (invisible); dark tints (die on dark clothing)
- Left-hugging emphasis blocks or logos; identical placement every time
- Typed-on sans text (the script face types; that is its register)
- Two faces inside one spoken sentence
- Hooks that take over the frame, or sit on top of a recording
- Unapproved SFX, per-word sounds, processed audio

---

## 8. Per-video prompt

```
Build the reel for [DATE] following REEL-SYSTEM.md.

Footage:      public/[FILE].mp4, [N] frames, [N]s
Matte:        ./tools/personmatte/personmatte public/[FILE].mp4 public/[FILE]-person.mov
Captions:     whisper.cpp ggml-base.en -ml 1 -sow on this exact audio
Screen recs:  [list, with the section each belongs to + its §5 scale]
Collage/CTA:  [product covers for the hook collage + the CTA deliverable card | none]

sections: [N, with the company/tool each is about]   // drives logo pops
premise:  [subject | null]

Emphasis lines, verbatim from her script:
  1. [setup] / [payoff]  around f[N]
  2. ...

Asides (not spoken):
  1. [text] after f[N]     // or: none
```

**Before building**, the agent reports back: the logo list (marks found vs
wordmark fallbacks), 1–3 proposed meme beats — the line, the emotion, a named
meme from `public/memes/` or a named suggestion to source — and any crop or
timing judgment calls. The owner signs off, then the build runs. Everything
else — cuts, caption cells, tints, sizes, placement — is decided by this
file, not the prompt.

---

## 9. Kit map

| File | Contents |
|---|---|
| `src/kit/reelTokens.ts` | palette, faces, zones, type shadow |
| `src/kit/fonts.ts` | FontFace loading (bundled OFL faces + your aside face) |
| `src/kit/kit.tsx` | Hook, GroupCaptions, EmphasisGroup, EmphasisBuild, CtaLine, LogoPop, MemePop, Aside, Sfx |
| `src/kit/ScreenInsert.tsx` | the recording card |
| `src/kit/Takeover.tsx` | FloatingCard, TopTakeover, DocTakeover |
| `src/kit/Person.tsx` | the matted person layer (behind-the-speaker stack) |
| `tools/personmatte/` | Vision matte CLI → ProRes 4444 alpha (macOS) |
| `src/kit/Footage.tsx` + `cuts.ts` | the cut take, reframe schedule, dy |
| `src/kit/fit.ts` | live text measurement / fitting |
| `src/kit/sfx.ts` | the four sound placements |
| `src/example/` | a complete worked example of the data schema + composition |

---

## 10. Changelog

- **26 Aug 2026** — v2 spec authored (chapter cards, full-bleed recordings,
  one-SFX rule). First build and review: transitions added, cards lengthened,
  sound restored to text. (All later superseded.)
- **27 Aug 2026** — Reference-creator study. Cards, rail and wipes dropped;
  recordings became framed cards in the top third with the speaker reframed
  down; quiet 1–3 word captions + loud centred emphasis; persistent hook;
  logo pops; memes; typed asides restored; `rose` tint added and brightened
  to `#E89090`. Approved 27 Aug — v3.
- **29 Aug 2026** — Second reference-creator study. Added: person-matte
  compositing (§2b, `tools/personmatte`, graphics behind the speaker); the
  insert scale ladder (§5 — FloatingCard / card / TopTakeover / DocTakeover)
  with the bounded off-screen exception for product showcases; word-timed
  `EmphasisBuild` (big blush word + small companions, landing on spoken
  frames); 3-line hook with rose accent line + behind-the-speaker product
  collage; navy caption ink over light takeovers; `CtaLine` with the
  one-sweep glint (no type-on — the sans type ban stands). The reference's
  butter-yellow accent maps to rose/blush; the cream ground IS parchment —
  v4.
