# Kit map — Remotion

How [`REEL-SYSTEM.md`](REEL-SYSTEM.md) — the framework-neutral rulebook beside
this file — is implemented in this repo. **Nothing here may contradict the
rulebook**; if it does, the rulebook wins and this file is stale.

The spec is deliberately framework-neutral so the same rules can be
implemented by another renderer with its own kit map. This one is Remotion.

Everything is expressed at 1080x1920, 30fps, in frames — the spec's native
units, so spec values are used as written.

## Files

| File | Contents |
|---|---|
| `src/kit/reelTokens.ts` | palette, faces, zones, type shadow (§1, §2) |
| `src/kit/fonts.ts` | FontFace loading (bundled OFL faces) |
| `src/kit/kit.tsx` | Hook (with `numeral`), GroupCaptions, EmphasisBuild, CtaCard, LogoPop, Sfx — plus RETIRED `EmphasisGroup`, `CtaLine`-as-CTA, `MemePop`, `Aside`, kept so older reels still render |
| `src/kit/ScreenInsert.tsx` | the recording card (§5 medium) |
| `src/kit/Takeover.tsx` | FloatingCard, TopTakeover, DocTakeover (§5 small / large / full) |
| `src/kit/Person.tsx` | the matted person layer (§2b behind-the-speaker stack) |
| `tools/personmatte/` | Vision matte CLI → ProRes 4444 alpha, macOS (§2b) |
| `src/kit/Footage.tsx` + `cuts.ts` | the cut take, reframe schedule, dy (§3) |
| `src/kit/fit.ts` | live text measurement / fitting (§1, §4) |
| `src/kit/sfx.ts` | the four approved sound placements (§6) |
| `src/example/` | a complete worked example of the data schema + composition |

## Reference catalog

§5's selected-treatment exception points here: if you adopt a standing
full-screen overlay treatment, record the chosen reference and its
implementation path in this section so the choice lives beside the code rather
than in chat history. This repo ships none — the slot is deliberately empty.

## Notes

- **Matte files are derived and large** (~1 GB/min of take). Delete them when
  the reel ships; stale ones cost gigabytes for nothing.
- **A kit default is not a rule.** Where a component's default predates an
  amendment in the spec — a colour, a size — the spec value is the one that
  ships; set it on the spec object rather than editing the default out from
  under older compositions.
- **Retired components stay in the kit** so reels built before a retirement
  still render. The spec's §4 says which they are; do not reach for them in a
  new reel.
- Everything you drop into `public/` stays yours and is gitignored by default,
  so a kit map change never drags assets into the repo.
