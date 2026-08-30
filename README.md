# Reel Edit System

A complete, opinionated editing system for talking-head Reels, built in
[Remotion](https://remotion.dev) — published as a working template.

This is the real system [Mel Greene](https://melgreene.com) uses to edit her
marketing-and-AI Reels with an AI agent (Claude Code): a written spec the
agent reads before every build, and a component kit that enforces it. A new
edit is a ~15-line brief; everything else — cuts, caption grouping, type
sizes, placement, sound — is decided by the spec, not per video.

**The one-line philosophy:** the speaker anchors every frame (off screen
only inside a bounded product showcase), every cut lands together with an
overlay change and a visible reframe, captions whisper, emphasis shouts,
graphics live in the room with the speaker — not on top of them — and
nothing animates that isn't landing.

## What's in the box

- **[REEL-SYSTEM.md](REEL-SYSTEM.md)** — the spec. Palette, faces, zones
  (including measured Instagram UI safe zones), footage rules, every text
  component, sound placements, a banned list, and the per-video prompt
  format. Written to be read by an AI agent before it touches a composition.
- **`src/kit/`** — the components that enforce it: cut footage with reframe
  schedules, the floating recording card, grouped hard-cut captions that dodge
  overlays, centred-stagger emphasis groups, logo pops, meme pops, typed
  asides, and the four sound placements.
- **`src/example/`** — a fully wired example composition + the data schema an
  agent fills in per video.

## Quick start

```bash
npm install
npm start          # Remotion Studio
```

Then bring your own assets (none of these are bundled, for licensing reasons):

| Drop into | What |
|---|---|
| `public/footage.mp4` | your 1080x1920 talking-head take |
| `public/recordings/` | screen recordings / UI mockups (1080x1350 works best) |
| `public/sfx/` | `whoosh.mp3`, `pop.mp3`, `click.mp3`, `typing.mp3` |
| `public/memes/` | your approved reaction-clip library (short mp4s) |
| `public/logos/` | brand marks for logo pops |
| `public/fonts/Aside.otf` | a licensed handwritten face for asides (optional) |

Instrument Sans and DM Mono are bundled under the SIL OFL (licences in
`public/fonts/`).

## The workflow

1. Get word-level caption timings:
   `whisper-cli -m ggml-base.en.bin -f audio.wav -ml 1 -sow -oj`
2. Write the per-video brief (REEL-SYSTEM.md §8) — footage, sections,
   emphasis lines verbatim, asides.
3. The agent reports back before building: logo list, proposed meme beats,
   judgment calls. You sign off.
4. It writes one data file (see `src/example/exampleData.ts`), renders, and
   you review a small preview copy with untouched audio.

## Why a written spec?

Because taste doesn't survive being re-derived every video. The spec encodes
decisions that were made once, with the reasoning attached — why the caption
tint is `#E89090` and not the brand blush (invisible at 52px), why reframes
below 1.2x are banned (they read as nothing), why the recording card never
covers the speaker (the face is the retention mechanism). An agent that reads
it produces the same edit language every time, and review notes amend the spec
instead of vanishing into chat history.

## License

Code and spec: [MIT](LICENSE). Bundled fonts: SIL OFL. Everything you drop
into `public/` stays yours and is gitignored by default.
