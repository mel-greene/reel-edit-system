# Reel edit system v6

The editing spec this repo implements — the system Mel Greene uses for her
own Reels, published as a working template. An AI agent (or a human) reads
this file before touching a reel composition.

**This file is the ONLY rulebook for a reel.** If a note, a skill file, a
theme or an older data file disagrees with it, this file wins and the other
is stale.

**It is framework-neutral on purpose.** The rules here are about the edit, not
about any one renderer — nothing in the body names a component file. How THIS
repo implements them is in **[KIT-MAP.md](KIT-MAP.md)**, beside this file;
nothing in a kit map may contradict the rules here. Reference implementation:
`src/example/`.

v3 was the consolidated spec approved on 27 Aug 2026 after two build-review
rounds against a reference creator's edit. v4 added person-matte compositing,
the insert scale ladder, word-timed emphasis builds and the accent hook line.
v5 locked the branding. **v6 folds in the mid-September amendments and splits
the spec from the kit map.** The evolution is in the changelog at the bottom;
the body describes only the current style.

The current rules in one breath: the on-screen hook IS the cover lockup, with a
standalone numeral only for a count-led title, starting at y 300; every overlay — text, logo pops AND the
recording cards — sits inside the platform's visible area (§2); subheads and
accents over footage are ROSE; captions are 68px with tints chosen by MEANING;
pop-ups are plain statements about what the thing does, sentence-case payoff
with the tail tucked under it (§4); logo pops centred in the wall space; the
CTA is an end card whose copy the owner writes per video; no memes, no asides,
ONE face (Instrument Sans) and ONE pink over footage (rose).

Everything is expressed at 1080x1920, 30fps. Frame counts are frames.

**The one-line philosophy:** the speaker is never off screen, every cut lands together
with an overlay change and a visible reframe, captions whisper, emphasis
shouts, and nothing animates that isn't landing.

---

## 1. Tokens

```
navy:      '#1B2A4A'  // grounds only (covers, cards if ever revived); never over footage
parchment: '#F5EFE8'  // all primary type over footage
blush:     '#C4A0A0'  // light-ground accent only (covers on a parchment card, carousels, docs); NOT over footage
rose:      '#E89090'  // the ONE pink over footage: numeral, accent line, subhead, emphasis payoffs, caption tints, end-card tints
white:     '#FFFFFF'  // unused since the asides retired (v5)
```

Navy never carries type over footage. Blush is invisible at caption size, and
a dark rose dies over dark clothing — that is why `rose` exists: blush's hue
at near-parchment luminance, saturation doing the separating. Tested over both
grounds; a parchment glow-shadow was tested for the dark case and rejected as
mush. Do not re-litigate these.

**One pink over footage: rose.** The cover/hook numeral, the headline accent
line, the subhead, the emphasis payoff words, the caption tints and the
end-card tints are all rose. Blush is retired from footage overlays: it sat at
the speaker's hair luminance, so the loudest line read softest, and two
near-hue pinks in one frame read as a mismatch. Blush stays as the accent on
light grounds — a cover set on a parchment card, carousels, documents — where
there is no footage under it.

### Faces  (self-hosted — see the kit map)

| Role | Face | Weight |
|---|---|---|
| Everything on a reel | Instrument Sans | 500 / 600 / 700 |

**One face on a reel. That is the whole system.** It is bundled (SIL OFL). A
mono face had no job on a reel once ordinals were stripped and logo pops went
icon-only — tried on the numeral and on labels it read thinner and generic — so
it stays a companion face for other surfaces (carousels, decks), not for
reels. v5 retired the third "handwritten" aside face along with the asides
that used it — do not reintroduce one; if a remark is worth showing, it is
worth showing in Instrument Sans. Line-fitting is live text measurement
against the loaded faces — no static metrics tables.

---

## 2. Zones and platform safety

```
LEFT = 70   RIGHT = 150   SAFE_W = 860     // text lives in x 70–930
```

Instagram UI, measured from a live post in the feed. The video FILLS THE SCREEN
HEIGHT and Instagram crops roughly **49px off each side**, so canvas y maps ~1:1
to the screen and canvas x is inset by ~49.

| Instagram element | Canvas |
|---|---|
| Top icon row (back arrow, camera, search) | **y 187–231**, x ~120–160 and ~810–975 |
| Right action rail | x ~934–1000, y ~1088–1718 |
| Handle + caption | y 1700+ |

**Nothing may start above y 290.** An earlier version of this table put the hook
at y 190, which is inside the icon row — on a live post Instagram's camera icon
printed straight through a headline word, and the end card sat under the back
arrow. The hook and the end card both start at **300**. The recording card (§5) sits
at top 300 and 960 wide so real app recordings keep their title bar and
right-edge buttons inside the visible area.

Side note on the ~49px side crop: text at `LEFT` (70) shows about 21px from the
visible edge. Tight but not cut, so `LEFT` is unchanged — revisit if a post ever
shows a clipped character. TikTok's action rail rides higher than Instagram's
and may brush the card's bottom-right corner; only narrow the card if a real
TikTok post shows a collision.

| Element | Position |
|---|---|
| Hook title | top **300**, **left-aligned at `LEFT`** (cover lockup) |
| Recording card | x 60, y 300–881 (inside the visible area) |
| Logo pops | y ~430, centred (left only when part of the hook lockup) |
| Captions | 71% (y 1363) — under a card: y 915 |
| Emphasis groups | display band y ~450–700, centred ± dx |

**Instagram is the default profile.** The numbers above are Instagram's; a
different platform gets its own measured profile, and the spec names which one
it is built for.

### LinkedIn mobile profile

Measured from a 588×1280 LinkedIn mobile video capture: the 9:16 canvas is
cropped more tightly at the sides than Instagram, the action rail reaches into
the right edge of Instagram's text zone, and creator/post details occupy the
lower band. Use the `linkedin` profile on specs intended for LinkedIn:

| Element | Canvas position |
|---|---|
| Side crop | about 100px per side in this player |
| Text and captions | x **120–840** (left 120, width 720) |
| Right action rail | x ~860+, y **1120–1710** |
| Lower creator and post details | y ~1600+ — keep text overlays above this band |
| Recording card | x 180, y 300, **720×436** |
| Captions | y 1363; under a card: y 770 |

Fit framed photos and animated inserts to the 720px text-safe width on this
profile. A full-screen illustrative insert stays an intentional full-screen
treatment, and its source composition keeps the important content clear of the
platform's controls. Leave Instagram's geometry untouched for Instagram-only
exports.

---

## 2b. Behind the speaker — the person matte  (`tools/personmatte`)

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

## 3. Footage

One continuous take, cut hard. No crossfades, zoom ramps, or speed ramps.
A spec may trim the head of a take (`trimStart`) when the first seconds are
dead air — the reel starts on the first spoken word.

- **Real punch-ins**: tight 1.26–1.38, wide 1.0–1.1, alternating, cycled off a
  metronome. Subtle reframes (1.1x) read as nothing — don't use them.
  **Unless the take is a close-up**: wide is the frame as filmed, so when the
  speaker's face already fills it the standard ladder lands too close. Soften
  tight cuts to ~1.10–1.15 and the card/CTA push-down to dy 130 at 1.12.
  Decide from the proof sheet, per take.
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

## 4. Text components

### The cover lockup — the house treatment
ONE text treatment carries the cover image AND the on-screen hook. Using the
same lockup in both places is most of what makes a feed look art-directed
rather than assembled. Add a standalone numeral only when the headline is
explicitly count-led ("5 updates this week"). A percentage or statistic inside
the supplied headline does not earn a separate numeral.

- **Optional numeral**, count-led headlines only: top-left, `left 64 / top 96`,
  300px/700, `-0.06em`, **rose**.
- **Headline** at `LEFT / top 420` when a numeral is present; when it is
  omitted, the headline moves up to `LEFT / top 96`. Width `SAFE_W`, 700,
  `lh 0.95`, `-0.04em`,
  each line fitted by `fitSans(line, 118, SAFE_W, 700, -0.04)` so **no line
  ever wraps**. Parchment, except the payoff line, which is **rose**. Two or
  three lines; the payoff is the line that lands the promise, not a fixed index.
- **Tail line** below the headline, **the same size and weight as the on-screen
  subhead (54px/600, fitted to the safe width)**, **rose**, **two lines
  maximum**. At the old 44px/500 the tail read smaller on the cover than the
  same copy does in the video, which broke the one-treatment rule.
  A third line lands on the speaker's face — cut the copy or move it into the
  reel.
- Three-layer shadow on every layer, over a deep top-down scrim
  (`rgba(0,0,0,0.56)` → transparent by 66%).

### Hook — persistent top title
**The hook IS the cover lockup** (`coverStyle`), with a separate numeral only
for a count-led headline (`numeral`) — left-aligned at the safe
margin, same three-layer shadow, same rose accent line. The cover treatment is
the hook treatment, always; when it has to move to fit the visible area, the
whole lockup shifts DOWN as a block — when used, the numeral sits at top 300
(220px, rose; 180px when the take needs it to clear the speaker's hairline),
headline under it, subhead under that. With no numeral the headline itself
starts at top 300 and the subhead follows it. In a count-led title the count
goes in the numeral — never inlined into the headline. The centred
small-subhead form it replaced was markedly less readable over footage.
Subhead is `rose` at 50px, and `bareSubhead` unless the copy is written with
its own parentheses. Lands on a 3f fade, HOLDS ~14s while the speaker is
already talking, captions running underneath. It never sits on top of a
recording — the first card waits for it to leave. No numeral takeover in the
reel; the logo pops mark the sections.

**The hook collage** (v4): while the hook holds, 2–4 `FloatingCard`s of the
speaker's actual products/covers pop into the wall space BEHIND the speaker
(§2b), landing 2–3f apart with one `click`. It is the visual promise of the
hook — use it when the reel sells or references products, bring it back under
the CTA.

### Running captions — quiet
**Caption proofing is required before export.** Read every final caption cell
in sequence — not just the overlay copy, not just the stills on the proof
sheet. Check brand and tool names in every form (including possessives),
misheard words, punctuation and word boundaries. Compare any uncertain wording
against the audio; do not guess. Keep a per-reel correction glossary and
re-check the known errors on every pass, and when one error is found, search
the whole reel for the same error and its variants. Automated checks supplement
this read; they never establish that a transcript matches the audio.

- **1–3 word cells** split on natural sub-boundaries from word timings. If the
  take was already captioned in an editor, use that draft's word timings rather
  than re-transcribing it; otherwise run whisper.cpp over the exact audio.
  Hard cut in/out. No motion, ever.
- **68px** / 600 (the kit default), parchment, centred, band at 71%.
  **Under a card: y 915** (the gap between card bottom and the head). The
  band is decided once per cell from its temporal midpoint — a cell spanning
  an insert boundary never jumps bands mid-life.
- **Tint PHRASES, not single words** (v5). The tint spans the whole meaningful
  phrase — "WHAT'S CHANGED SINCE FRIDAY", "WHO'S WAITING ON YOU" — and runs
  across cell boundaries where the phrase does, so a cell is usually tinted
  whole. A lone tinted word reads as a typo. Rose, never scaled, never moved.
- **Chosen by MEANING, never by timing.** A phrase earns a tint only if it is
  one of: the feature's win in the speaker's own words; the exact control or
  label the viewer has to find ("Video Recap", "Summarize a file"); or a hard
  requirement ("10 and 90 minutes"). A section with nothing that qualifies
  gets no tint. Do not space tints on a cadence and do not tint filler that
  happens to land on the interval. Most cells have none; more than about one
  tint per 6–8s means the selection is too loose — that number is a ceiling,
  not a target. Lines owned by an emphasis group or the CTA card get no tint.
- Captions run under the hook and the cards; they yield only to emphasis
  groups and the CTA.
- Ordinals stay stripped — the logo pop says the section once.

### Emphasis groups — loud
**Choose the treatment by context.** Read what the spoken passage is actually
doing before picking a pop-up style. A checklist, or a set of related criteria,
takes a heading and an accumulating bulleted list, each item landing on the
line that says it. Number only genuinely ordered steps. Setup / payoff / tail
is for a single statement — it is not the default shape for every passage.

**The pop-up form — read in a glance as one unit.** Word-timed lines set with
`EmphasisBuild`:
- **Sentence case on the big word.** Lowercase ascenders and descenders knit
  the lines together; all caps leaves dead air above and below the word and
  reads as shouting. (Caps payoffs are retired.)
- **Companions 56px/600, parchment; payoff 104–118px/700, rose** — sized so it
  fits the safe width without shrinking (the kit scales an overflowing line
  down; if it has to, the payoff is too long, ~14 characters).
- **Setup at y 452, payoff at y 514** (about 20px between the setup's baseline
  and the big word's cap height); **tail tucked under the payoff's baseline:
  y = 514 + 0.86·payoff + 6** (about 8px of air). Gaps stay smaller than the
  small type's x-height so the eye takes the block as one sentence.
- **A companion sits inline with the big word when they fit the safe width**
  — a couple of times per reel, so it stays a texture, not a template.
- **Left offsets varied per line (x ~90–300)**, block in the wall space from
  y 452, never on the speaker's face.
The earlier "tightened cluster" (`516 + 0.92·payoff + 18`, caps payoffs) is
retired, as is the older 66 / 150 / 66 `EmphasisGroup` block.
- Each line lands on its spoken frame (the big word with the one sanctioned
  back-eased scale pop and a `pop` SFX; small lines fade in silently);
  accumulate, hold, clear together on a 4f fade.
- 4–6 per video, on the sentences carrying the argument — each one states the
  WIN of that update (see the meaning rule under captions).
- One face throughout — never split a spoken sentence across faces.

**Plain statements, never slogans.** The three lines are one sentence about
what the feature actually DOES, broken across setup / payoff / tail. **The
test: with the sound off, would a viewer learn what the thing does?** A slogan
fails that test even when it sounds good.

| Rejected (slogan) | Shipped (plain statement) |
|---|---|
| IN ONE PLACE | drop in an email thread / **AND A MEETING** / one notebook reads both |
| you stop re-reading / THE WHOLE THING | it flagged the whole paragraph / **NOW: EACH WORD** / exactly what it changed |

Two failure modes this kills: copy that sounds punchy but names no mechanic,
and copy that goes technically wrong for the sake of a line. Where the update
is a CHANGE, state the before and the after — usually the clearest form. Setup
and tail carry the mechanic, the payoff carries the one thing worth reading
big; keep the payoff to roughly 14 characters or `fitSans` shrinks it out of
the display band.

### Emphasis builds — the word-timed variant (v4, `EmphasisBuild`)
For a spoken LIST (Research… Find… Organize… Create…), the block form above
is wrong — the reference lands each item AS IT IS SPOKEN. One visual line
mixes a big rose word (700, ~104–118px) with small parchment companions (600,
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

### CTA — the end card (per video)
**The CTA / end card changes with every video.** The owner writes the copy;
the build sets it and does not paraphrase. When a take has two platform
endings (comment keyword / link in bio), each version carries ONLY its own
closing line and stops at its own ending.
The CTA is an END CARD, not a single line, and the speaker writes the copy —
the build sets it, it does not paraphrase. **It lands the moment the offer is
named and builds line by line on the frames each thing is said, in the order
it is said**, ending on the comment keyword (`CtaCard`, per-line `at`). A block
that appears all at once reads as a bunch of text; the stagger is what makes it
a lockup. Hierarchy: offer name big in two lines (second in rose), one kickoff
line with the date in rose, details small, `Comment KEYWORD` big. Shape:

```
Your offer name                      title, parchment, 700
Live kickoff: <date>                 rose on the date
What they get, one line              parchment, 500
Comment KEYWORD or use the bio link  rose on the keyword
The deadline, one line               parchment, 500
```

The offer NAME leads — a keyword alone tells the viewer nothing about what they
are asking for — and **both mechanics ship on every promo**: the comment
keyword AND the link in bio. **Alignment is a per-card call, not a rule** — the best alignment shifts
depending on the card. Left, matching the cover lockup, suits a long card; a
short blocky card can centre. Set `align` on `CtaCardSpec`. When centring, the
block centres on the **SAFE-ZONE centre (x ≈ 500), never the frame centre
(540)** — the safe zone is offset left to clear the action rail, and mixing the
two skews the block 40px. The card starts at **y 300**, clear of Instagram's top
icons (§2). One light-sweep glint
on the first line (frames 4–18, then never again); no type-on. Pair it with a
`FloatingCard` of the actual deliverable in the wall space and hold both to the
end. The card is the proof; the reference holds hers ~10s.

**Not every reel ends on an end card.** When the take has no offer in it, a
reel may end on its last pop-up, held to the final frame, rather than cutting
to a card with nothing to say.

### Logo pops — the section markers
**Icon only, never the word.** The brand mark alone in the wall space
(y ~420, `iconH` 150), landing with a 6f back-eased scale pop and a `pop` SFX
as the speaker names the tool; gone before that section's card arrives. When
several tools are named in one breath the marks land ONE AT A TIME in a row
(`dx` ±240), each on its spoken frame; a lone mark lands on `sparkle`, a row
keeps a `pop` per icon. A wordmark is not a fallback for a known tool — source
the mark. Marks carry the deep three-layer drop shadow (kit default): flat
icons sit at a warm wall's lightness and float without it. No glow.
**Section pops are CENTRED in the wall space** — a lone mark at
the left margin with nothing above it reads as randomly placed. `align: 'left'`
exists for ONE case: a mark that is part of the hook lockup and sits directly
under it, where a centred mark under left-aligned type read as a mistake. Real marks only — from the brand's own assets if
not already in `public/tool-logos/` — or a brand-colour wordmark when no mark
is available. A wrong logo is worse than no logo.

### Memes — RETIRED
Meme pops are no longer part of the system. `MemePop` stays in the kit only
so older reels still render. Do not propose meme beats in the pre-build
report; the wall space belongs to logo pops, cards and emphasis groups.

### Asides — RETIRED (v5)
The typed-on handwritten aside is gone, and with it the typed register
entirely. `Aside` and `asideTypeFrames` remain in the kit only so older reels
still render; do not use them in a new reel. An off-script remark goes in an
emphasis group or a caption phrase, in Instrument Sans, like everything else.

---

## 5. Screen inserts — four scales

### Selected treatment exception

The owner may select a full-screen video overlay treatment as a standing
reference — which exports and implementation paths those are is recorded in
the project's own reference catalog, not here. Where one is selected, the
full-screen treatment is permitted for the spoken passages it fits, and the
restriction below limiting full-frame inserts to the owner's own deliverable
does not prohibit it. The speaker returns the frame the insert ends.

This permits an INTENTIONAL full-screen presentation, not an accidental card
covering the speaker's face. Prepare the source for portrait viewing and keep
the meaningful content clear of platform controls. Caption wording, timing,
size, visibility and safe placement still follow §§2 and 4 — selecting a
treatment as a visual reference does not approve the captions in the export it
came from.

The reference cycles insert SCALE with what the insert is doing. One
treatment repeated is what reads as a template; a reel should use 2–3 of
these, chosen by content:

| Scale | Archetype | Use for |
|---|---|---|
| small | `FloatingCard` | a file, a cover, a photo — an object being mentioned |
| medium | `ScreenInserts` | UI walkthroughs talked over (the card below) |
| large | `TopTakeovers` | a big scrollable surface (a board, a feed, a grid) |
| full | `DocTakeover` | the deliverable itself, page by page |

**FloatingCard** — wall space, back-eased pop with a `click`, slight
rotation. `paper` mat (white, stacked-sheet shadow) for files/covers, `photo`
for prints, `plain` for UI crops. The Mac `cursor` prop is the "I dragged
this in" wink — use it on files, not photos.

**The card** (`ScreenInserts`) — unchanged from v3: x 60, top 300, 960x581,
radius 24, soft shadow, hard cut in with a `click`. No blur behind, no dim,
no drift. Source mockups are 1080x1350; the crop window pans
`cropY → cropY2` so the cursor stays in view — verify crops against stills.
Trim first, `rate` second, never above 1.5; running timers stay at 1.

**TopTakeover** — full-WIDTH strip from y 0 down to ~870 (45%), hard
straight bottom edge, no card chrome. The speaker reframes down underneath
(`dy`) and the caption band drops to just under the edge
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

## 6. Sound

Four sounds in the whole system. Files are not bundled — drop your own into
`public/sfx/` under these names. Treat the volumes as design decisions, tuned
by ear against speech; judge any change by listening, not by meters.

| Sound | Where | Volume |
|---|---|---|
| `whoosh` | the hook, once per reel | 0.37 |
| `pop` | each emphasis payoff line, each end-card payoff line, each icon in a ROW of logo pops | 0.40 |
| `sparkle` | a lone logo icon landing (softer than the pop; icons in a row keep the pop each) | 0.30 |
| `click` | each recording card landing | 0.43 |

Setup/tail lines land silently. No sound on plain footage cuts. Nothing
per-word, no ding/riser, no music bed baked in.

**Every sound plays for its file's full length.** A sound mounted for fewer
frames than the file runs gets cut off mid-tail — it reads as a glitch, not as
restraint. Give each placement the file's own duration.

---

## 7. Banned

- The speaker off screen outside a §5 DocTakeover (own product, ≤ 12s, 1–2 per
  reel) or a selected full-screen video treatment
- Edge-to-edge third-party UI outside a selected full-screen treatment; a
  framed recording accidentally covering the speaker's face
- Blur/dim behind a card; card drift; focus pulls
- Full-frame chapter/opener/result cards; progress rails; wipe transitions
- Crossfades, zoom ramps, speed ramps; reframes too subtle to read (< 1.2)
- Word-by-word captions; caption motion of any kind; scaling a caption word
- Caption groups over 3–4 words, or captions sitting on the face
- Blush as a caption tint (invisible); dark tints (die on dark clothing)
- Left-hugging emphasis blocks or logos; identical placement every time
- Typed-on text of any kind, in any face (the aside register is retired)
- A third display face for a "handwritten" register
- Blush anywhere over footage (rose is the one pink)
- A single-word caption tint (tint the phrase)
- A logo pop at the left margin that is not part of the hook lockup
- Any face but Instrument Sans on a reel (the mono face is for other surfaces)
- An SFX cut off before its file ends
- Hooks that take over the frame, or sit on top of a recording
- Unapproved SFX, per-word sounds, processed audio

---

## 8. Per-video prompt

### Fast lane: one consolidated review

For a fast-lane job, the agent may assemble the proposed overlay copy, source
or capture the supporting visuals, generate the complete proof sheets AND
render a draft MP4 before the owner reviews anything — one consolidated review
in place of the two separate gates described below. The owner still supplies
the hook and the end-card copy. In exchange the agent reviews the captions,
the sources, every proof beat, the motion and the audio itself before
presenting the draft, the cover and the sheets together. The delivery render
follows the owner's approval of that revision, and any later change means
re-reviewing the evidence that changed — an explicit authorization for a
specific correction still stands.

Gathering screenshots, official marks and product imagery, and recording the
real app demonstrations, are production tasks inside the fast-lane budget.
Reuse suitable current assets, and keep the source masters so a new crop or
trim never means recording again. An explicitly approved product showcase may
cover the speaker temporarily; accidental obstruction is still a bug. The
separate-approval workflow below stays available for jobs that want it.

### Original workflow with separate approvals

```
Build the reel for [DATE] following REEL-SYSTEM.md.

Footage:      public/[FILE].mp4, [N] frames, [N]s
Matte:        ./tools/personmatte/personmatte public/[FILE].mp4 public/[FILE]-person.mov
Captions:     the editor draft's caption track, or whisper.cpp ggml-base.en -ml 1 -sow
Screen recs:  [list, with the section each belongs to + its §5 scale]
Hook:         [the owner's headline + subhead — never drafted by the build]
CTA:          [the owner's end-card copy, one line per platform ending | none]
Collage:      [product covers for the hook collage + the CTA deliverable card | none]

sections: [N, with the company/tool each is about]   // drives logo pops
premise:  [subject | null]

Emphasis lines, verbatim from her script:
  1. [setup] / [payoff]  around f[N]
  2. ...

```

**Before building**, the agent reports back: the logo list (marks found vs
wordmark fallbacks) and any crop or timing judgment calls. The owner signs off, then the build runs. Everything
else — cuts, caption cells, tints, sizes, placement — is decided by this
file, not the prompt.

**Before rendering — the proof sheet.** Once the data file is written, the
agent renders one still per text beat — the hook, every emphasis group at its
full build, every word build, each logo pop, the end card at its last frame —
tiles them into contact sheets (360px wide per still, `hstack`), and sends
them to the owner with one line naming each beat. The owner reads the copy
and the placement off the sheets and corrects them there; only then does the
MP4 render. Before sending the sheets, check EVERY overlay type — hook, pops,
emphasis, captions, end card AND the recording cards — against the §2 zones
(icon row, right rail, side crops). If the footage has not arrived yet, proof over the previous
reel's take (`--props='{"footage":"<prev>.mp4"}'`) — the same setup is close
enough to catch a line on the speaker's face or in the action rail. Re-proof
any frame that changes. A render the owner has not seen the overlays for is
a render that comes back. The caption read (§4) is part of this gate: the
proof sheet shows the overlays, not every caption cell.

---

## 9. Kit map

How this spec is implemented is per-project and lives in that project's kit
map. For this repo that is **[KIT-MAP.md](KIT-MAP.md)**, beside this file.
Nothing in a kit map may contradict the rules above; if it does, this file
wins and the kit map is stale.

---

## 10. Changelog

- **LinkedIn mobile safe-zone profile (§2).** Measured from a 588×1280 capture:
  tighter side crop, an action rail that reaches into Instagram's text zone,
  and a lower creator/post-details band. Instagram stays the default profile.
- **Selected full-screen treatment (§5).** A selected full-screen video overlay
  treatment is permitted for the passages it fits, as an exception to the
  deliverable-only restriction on full-frame inserts — an intentional
  presentation, not an accidental card over the face. Caption rules are
  unchanged: selecting a visual reference does not approve its captions.
- **Fast lane: one consolidated review (§8).** Copy, visuals, proof sheets and
  a draft MP4 can all be assembled before a single owner review, replacing the
  two separate gates — in exchange the agent reviews captions, sources, every
  proof beat, motion and audio before presenting anything.
- **Standalone hook numerals are for count-led titles only.** A percentage or
  statistic inside a supplied hook does not get its own numeral; with no
  numeral the headline itself starts at y 300.
- **v6 — the spec split from the kit map.** The body went framework-neutral:
  no component path in a rule, implementation details moved to `KIT-MAP.md`,
  and this file declared the only rulebook so a stale note can't out-argue it.
- **Cover tail matches the on-screen subhead** (54px/600 fitted, rose) instead
  of 44px/500 — at the smaller size the same copy read smaller on the cover
  than in the video, which is exactly what the one-treatment rule exists to
  prevent. A spec may also trim the head of a take (`trimStart`), and a reel
  with no offer in it may end on a held pop-up rather than an end card.
- **Caption proofing before export (§4).** Every final caption cell is read in
  sequence against the audio, with a per-reel correction glossary and a
  whole-reel search for each error's variants. Reading overlay copy and proof
  stills had been passing transcription errors through to shipped reels.
- **Treatment chosen by context (§4).** A checklist takes a heading and an
  accumulating bulleted list; only ordered steps get numbers; setup / payoff /
  tail is for a single statement, not the default shape for every passage.
- **One pink over footage: rose.** The numeral, accent line, subhead, payoffs
  and tints are all rose; blush is retired from footage overlays (it sat at
  the speaker's hair luminance, so the loudest line read softest, and two
  near-hue pinks in one frame read as a mismatch). Blush stays on light
  grounds. **One face on a reel: Instrument Sans** — the mono face had no job
  left on a reel once ordinals were stripped and logo pops went icon-only.
- **Sounds play for their file's full length** — a placement shorter than the
  file clips the tail and reads as a glitch.
- **Close-up takes soften the punch-in ladder (§3)** — on a take where the
  face already fills the wide frame, tight goes to ~1.10–1.15 and the card
  push-down to dy 130 at 1.12.
- **Pop-up form.** Emphasis payoffs went sentence case (caps read as shouting
  and left dead air around the word): companions 56 / payoff 104–118 in rose,
  setup 452 / payoff 514, tail tucked at `514 + 0.86·size + 6`, a companion
  inline when it fits. The earlier caps cluster (`0.92·size + 18`) is retired.
- **Logo pops are icon only.** Grouped mentions land as a row, one mark at a
  time (`LogoChip.dx`); lone marks land on a softer `sparkle`; marks carry a
  deeper drop shadow so they don't float on a warm wall.
- **Proof-sheet gate (§8).** Every text beat is rendered as a still and sent
  to the owner as contact sheets for sign-off BEFORE the MP4 renders — over
  the previous take if the footage is not in yet. On its first use the sheets
  caught a five-line word build on the speaker's forehead, a line in the
  action rail, and an emphasis group whose copy did not say what was meant,
  all before a single render.
- **Instagram safe area re-measured from a live post (§2).** The feed crops
  ~49px off each side and maps canvas y ~1:1, and the top icon row occupies
  y 187–231 — so a hook at 190 and an end card at 210–250 were printing under
  Instagram's own chrome on every video. Both now start at **y 300**. End-card
  alignment became a per-card `align` option rather than a fixed rule.

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
- **v5.** The branding settled across a full build's review rounds, written
  down so it stops drifting. In: one cover lockup carrying both the cover image
  and the on-screen hook (`coverStyle`, left-aligned, rose accent line, bare
  subhead); blush restricted to big type, rose carrying every small accent;
  caption tints as phrases rather than single words; logo pops aligned left
  with the lockup; the CTA as a three-line offer lockup on the safe-zone axis.
  Retired: the handwritten aside face and the typed-on register that used it,
  leaving two faces in the whole system.
