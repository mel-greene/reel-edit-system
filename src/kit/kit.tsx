// ─────────────────────────────────────────────────────────────────────────────
// Reel edit system v2 — the kit.  Source of truth: REEL-SYSTEM.md.
//
// Differences from the v1 melNewsKit that matter, all of them deliberate:
//   · captions are GROUPED (3–5 words) and hard-cut. No word-by-word, no
//     spring, no scale. §4, §7.
//   · emphasis groups are never centred. Lines land at staggered x. §4.
//   · nothing types on. Text lands on a 3-frame fade. §6.
//   · one face inside a spoken sentence. The aside face is for remarks that
//     are NOT in the spoken script, 1–2 per video. §4.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import {
	Audio,
	Easing,
	Img,
	Loop,
	OffthreadVideo,
	Sequence,
	staticFile,
	interpolate,
	useCurrentFrame,
} from 'remotion';
import {BAND, FACE, LEFT, REEL, SAFE_W, TYPE_SHADOW} from './reelTokens';
import {fitAside, fitSans, measure} from './fit';

/** Every text element in v2 lands the same way: a 3-frame fade, then dead
 *  still. §6. `at` is an absolute frame. */
const landed = (frame: number, at: number) =>
	interpolate(frame - at, [0, 3], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

/** One-shot SFX. Layout-neutral. */
export const Sfx: React.FC<{
	from: number;
	file: string;
	volume?: number;
	dur?: number;
}> = ({from, file, volume = 0.25, dur = 20}) => (
	<Sequence from={from} durationInFrames={dur} layout="none">
		<Audio src={staticFile(`sfx/${file}`)} volume={volume} />
	</Sequence>
);

export type Range = {s: number; e: number};
const inAny = (frame: number, rs: Range[]) =>
	rs.some((r) => frame >= r.s && frame < r.e);

// ── Hook (§4, v5) ──────────────────────────────────────────────────────────
// A persistent title at the top of the frame, not a takeover moment. It stays
// up while the speaker is already talking and the captions run underneath it
// — the reference creator holds hers ~10s into the video.
//
// v5: the hook IS the cover lockup. Pass `coverStyle` and it renders
// left-aligned at the safe margin with the cover's scrim and three-layer
// shadow, so the cover image and the first ten seconds of the reel are visibly
// the same design. The older centred form is kept for existing reels.
export type Hook = {
	headline: string[];
	/** Wrapped in parentheses by default, an aside register: "(it isn't
	 *  close)". Set `bareSubhead` when the subhead is a statement. */
	subhead?: string;
	bareSubhead?: boolean;
	/** Cover treatment: left-aligned at the safe margin, the cover's
	 *  three-layer shadow and scrim, subhead at cover scale (54px). Markedly
	 *  more readable over footage than the centred small-subhead form. */
	coverStyle?: boolean;
	start: number;
	end: number;
	/** 29 Aug study: the reference tints ONE headline line — the payoff line —
	 *  in the accent. Index into `headline`; rose carries it over footage. */
	accentLine?: number;
	/** Per-line max sizes. The reference steps them 84 / 66 / 76 so the three
	 *  lines read as one lockup, not three rows of the same thing. */
	sizes?: number[];
};

export const COVER_SHADOW =
	'0 0 34px rgba(0,0,0,0.7), 0 6px 26px rgba(0,0,0,0.55), 0 2px 5px rgba(0,0,0,0.7)';

export const HookTitle: React.FC<{hook: Hook; shadow?: string}> = ({
	hook,
	shadow,
}) => {
	const frame = useCurrentFrame();
	if (frame < hook.start || frame >= hook.end) return null;
	const cover = !!hook.coverStyle;
	const ink = shadow ?? (cover ? COVER_SHADOW : TYPE_SHADOW);
	const out = interpolate(frame, [hook.end - 4, hook.end], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const alpha = landed(frame, hook.start + 2) * out;
	const sub = hook.subhead
		? hook.bareSubhead
			? hook.subhead
			: `(${hook.subhead})`
		: null;

	return (
		<>
			{cover ? (
				<div
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						width: 1080,
						height: 900,
						opacity: alpha,
						background:
							'linear-gradient(180deg, rgba(0,0,0,0.56) 0%, rgba(0,0,0,0.42) 26%, rgba(0,0,0,0.26) 46%, rgba(0,0,0,0) 100%)',
					}}
				/>
			) : null}
			<div
				style={{
					position: 'absolute',
					left: LEFT,
					top: 190,
					width: SAFE_W,
					textAlign: cover ? 'left' : 'center',
					opacity: alpha,
				}}
			>
				<div
					style={{
						fontFamily: FACE.sans,
						fontWeight: 700,
						lineHeight: cover ? 0.95 : 1.04,
						letterSpacing: cover ? '-0.04em' : '-0.03em',
						color: REEL.parchment,
						textShadow: ink,
					}}
				>
					{hook.headline.map((line, i) => (
						<div
							key={line}
							style={{
								fontSize: fitSans(
									line,
									hook.sizes?.[i] ?? (cover ? 132 : 78),
									SAFE_W,
									700,
									cover ? -0.04 : -0.03,
								),
								whiteSpace: 'nowrap',
								color: i === hook.accentLine ? REEL.rose : undefined,
							}}
						>
							{line}
						</div>
					))}
				</div>
				{sub ? (
					<div
						style={{
							marginTop: cover ? 22 : 10,
							fontFamily: FACE.sans,
							fontWeight: cover ? 600 : 500,
							lineHeight: cover ? 1.2 : undefined,
							letterSpacing: cover ? '-0.01em' : undefined,
							fontSize: fitSans(sub, cover ? 54 : 44, SAFE_W, cover ? 600 : 500),
							// Blush disappears into a pale wall even under the scrim.
							// Rose is the brighter pink already carrying the caption
							// tints and the CTA. This applies to BOTH forms — leaving
							// the centred form on blush shipped an invisible subhead.
							color: REEL.rose,
							textShadow: ink,
						}}
					>
						{sub}
					</div>
				) : null}
			</div>
		</>
	);
};

// ── Running captions (§4, amended §10 27 Aug) ──────────────────────────────
// A GROUP of 1–3 words hard-cuts in and out. Small, low, quiet — they read as
// subtitles, and the emphasis groups do the shouting. That contrast is most of
// what reads as "refined". The stressed word is
// tinted blush; it is never scaled and never moved.
export type CaptionGroup = {
	/** Words as spoken, already grouped on a phrase boundary. */
	words: string[];
	s: number;
	e: number;
	/** Index(es) into `words` of the stressed word or PHRASE — a stressed
	 *  phrase tints whole ("on your flight"), not just one word. Most groups
	 *  have none. */
	tint?: number | number[];
};

export const GroupCaptions: React.FC<{
	groups: CaptionGroup[];
	top?: string;
	/** Frames where a card, the hook, or an emphasis group owns the screen. */
	suppress?: Range[];
	shadow?: string;
	size?: number;
	/** Move the band for a stretch — under an overlay card the caption sits
	 *  between the card's bottom edge and the speaker's head, the reference creator's
	 *  placement, instead of on the face. First matching range wins. */
	tops?: {s: number; e: number; top: number | string}[];
	/** 29 Aug study: over a light takeover the parchment caption vanishes, so
	 *  the ink switches for that stretch — navy on parchment ground, shadow
	 *  off. (The reference uses outlined white; navy-on-parchment is the same
	 *  move in this system.) First matching range wins. */
	inks?: {s: number; e: number; color: string; tint?: string; shadow?: string}[];
}> = ({groups, top = BAND.caption, suppress = [], shadow, size = 58, tops = [], inks = []}) => {
	const frame = useCurrentFrame();
	if (inAny(frame, suppress)) return null;

	const g = groups.find((c) => frame >= c.s && frame < c.e);
	if (!g) return null;

	// The band is decided ONCE per cell, from the cell's temporal midpoint —
	// a cell that spans an insert boundary must not jump bands mid-life.
	const mid = (g.s + g.e) / 2;
	const band = tops.find((r) => mid >= r.s && mid < r.e)?.top ?? top;
	const ink = inks.find((r) => frame >= r.s && frame < r.e);

	return (
		<div
			style={{
				position: 'absolute',
				top: band,
				left: LEFT,
				width: SAFE_W,
				textAlign: 'center',
				fontFamily: FACE.sans,
				fontWeight: 600,
				fontSize: size,
				lineHeight: 1.08,
				letterSpacing: '-0.02em',
				color: ink?.color ?? REEL.parchment,
				textShadow:
					ink?.shadow ??
					shadow ??
					'0 4px 18px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.7)',
			}}
		>
			{g.words.map((w, i) => {
				const stressed = Array.isArray(g.tint) ? g.tint.includes(i) : i === g.tint;
				return (
					<React.Fragment key={`${w}-${i}`}>
						{i > 0 ? ' ' : ''}
						<span style={stressed ? {color: ink?.tint ?? REEL.rose} : undefined}>{w}</span>
					</React.Fragment>
				);
			})}
		</div>
	);
};

// ── Emphasis groups (§4) ───────────────────────────────────────────────────
// Nothing is centred. Reference x offsets inside the safe zone: setup +16,
// payoff 0, tail +190. One line lands per beat on a 3-frame fade; they
// accumulate, hold, and clear together.
export type EmphasisRole = 'setup' | 'payoff' | 'tail';

export type EmphasisLine = {
	text: string;
	role: EmphasisRole;
	y: number;
	/** Absolute frame this line lands. */
	at: number;
	/** Override the role's x offset. Rarely needed. */
	x?: number;
	/** Override the role's size, e.g. to keep a long payoff on one line. */
	size?: number;
};

const ROLE: Record<
	EmphasisRole,
	{x: number; size: number; weight: number; color: string; lh: number; ls: number}
> = {
	// x here is the stagger AROUND the centred position, not a left offset.
	setup: {x: -48, size: 66, weight: 600, color: REEL.parchment, lh: 1.1, ls: -0.01},
	payoff: {x: 0, size: 150, weight: 700, color: REEL.blush, lh: 0.92, ls: -0.05},
	tail: {x: 84, size: 66, weight: 600, color: REEL.parchment, lh: 1.1, ls: -0.01},
};

export type Emphasis = {
	start: number;
	end: number;
	lines: EmphasisLine[];
	/** Nudge the whole block off centre for variety. */
	dx?: number;
};

export const EmphasisGroup: React.FC<{group: Emphasis; shadow?: string}> = ({
	group,
	shadow = TYPE_SHADOW,
}) => {
	const frame = useCurrentFrame();
	if (frame < group.start || frame >= group.end) return null;

	return (
		<>
			{group.lines.map((l) => {
				if (frame < l.at) return null;
				const r = ROLE[l.role];
				const stagger = (l.x ?? r.x) + (group.dx ?? 0);
				const size = fitSans(
					l.text,
					l.size ?? r.size,
					SAFE_W - Math.abs(stagger) * 2,
					r.weight,
					r.ls
				);
				const w = measure(l.text, size, FACE.sans, r.weight, r.ls);
				return (
					<div
						key={`${l.text}-${l.at}`}
						style={{
							position: 'absolute',
							left: LEFT + (SAFE_W - w) / 2 + stagger,
							top: l.y,
							fontFamily: FACE.sans,
							fontWeight: r.weight,
							fontSize: size,
							lineHeight: r.lh,
							letterSpacing: `${r.ls}em`,
							whiteSpace: 'nowrap',
							color: r.color,
							textShadow: shadow,
							opacity: landed(frame, l.at),
						}}
					>
						{l.text}
					</div>
				);
			})}
		</>
	);
};

// ── Emphasis build (§4, 29 Aug study) ──────────────────────────────────────
// The reference's loud register, refined: ONE visual line mixes a big accent
// word with small companion words on the same baseline — "Find any", with
// Find at display size and any at caption size — and each line lands on its
// SPOKEN frame, accumulating around the speaker (top band + mid band), then clearing
// together. Blush carries the big word, parchment the small ones, exactly
// the §1 roles. Lines can sit in the behind-the-speaker stack (Person.tsx) so a big
// word tucks behind the hair — use sparingly, one group per reel at most.
export type BuildSegment = {
	text: string;
	/** Display-size blush. One per line reads best; two is the ceiling. */
	big?: boolean;
	/** Absolute landing frame for THIS segment — pass the spoken frame. When
	 *  omitted, segments auto-stagger 4f apart within their line, so words pop
	 *  one at a time, matching the reference. */
	at?: number;
};

export type BuildLine = {
	segments: BuildSegment[];
	/** Absolute frame this line lands — the word's spoken frame. */
	at: number;
	/** Left offset inside the safe zone. Vary per line; never centre-stack. */
	x: number;
	y: number;
	bigSize?: number;
	smallSize?: number;
};

export type EmphasisBuildGroup = {
	start: number;
	end: number;
	lines: BuildLine[];
};

export const EmphasisBuild: React.FC<{group: EmphasisBuildGroup; shadow?: string}> = ({
	group,
	shadow = TYPE_SHADOW,
}) => {
	const frame = useCurrentFrame();
	if (frame < group.start || frame >= group.end) return null;
	const out = interpolate(frame, [group.end - 4, group.end], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<>
			{group.lines.map((l) => {
				if (frame < l.at) return null;
				const big = l.bigSize ?? 132;
				const small = l.smallSize ?? 58;
				return (
					<div
						key={`${l.at}-${l.y}`}
						style={{
							position: 'absolute',
							left: LEFT + l.x,
							top: l.y,
							display: 'flex',
							alignItems: 'baseline',
							gap: 14,
							whiteSpace: 'nowrap',
							opacity: out,
						}}
					>
						{l.segments.map((s, i) => {
							// Word-by-word: each segment lands on its own frame; big
							// words get a small back-eased scale pop, small words fade.
							const segAt = s.at ?? l.at + i * 4;
							const t = interpolate(frame - segAt, [0, 6], [0, 1], {
								extrapolateLeft: 'clamp',
								extrapolateRight: 'clamp',
								easing: s.big ? Easing.out(Easing.back(1.6)) : Easing.out(Easing.cubic),
							});
							return (
								<span
									key={`${s.text}-${i}`}
									style={{
										fontFamily: FACE.sans,
										fontWeight: s.big ? 700 : 600,
										fontSize: s.big ? big : small,
										letterSpacing: s.big ? '-0.04em' : '-0.01em',
										lineHeight: 1,
										color: s.big ? REEL.blush : REEL.parchment,
										textShadow: shadow,
										display: 'inline-block',
										opacity: Math.min(t * 2, 1),
										transform: s.big ? `scale(${0.8 + t * 0.2})` : undefined,
										transformOrigin: 'left bottom',
									}}
								>
									{s.text}
								</span>
							);
						})}
					</div>
				);
			})}
		</>
	);
};

// ── CTA line (§4, 29 Aug study) ────────────────────────────────────────────
// "comment BLUEPRINT" — a rose line at the top of the frame that lands on a
// 3f fade and then a single light sweep crosses it once, the reference's
// glint. No type-on (§7: the script face types, sans does not). Pair it with
// a FloatingCard of the actual deliverable underneath, and hold both.
export type Cta = {
	text: string;
	start: number;
	end: number;
	y?: number;
	size?: number;
};

export const CtaLine: React.FC<{cta: Cta; shadow?: string}> = ({cta, shadow = TYPE_SHADOW}) => {
	const frame = useCurrentFrame();
	if (frame < cta.start || frame >= cta.end) return null;
	const size = fitSans(cta.text, cta.size ?? 60, SAFE_W, 700, -0.02);
	const w = measure(cta.text, size, FACE.sans, 700, -0.02);
	// One glint sweep, frames 4–18 after landing, then never again.
	const sweep = interpolate(frame - cta.start, [4, 18], [-0.2, 1.2], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const glintOn = frame - cta.start >= 4 && frame - cta.start <= 18;

	return (
		<div
			style={{
				position: 'absolute',
				left: LEFT + (SAFE_W - w) / 2,
				top: cta.y ?? 190,
				fontFamily: FACE.sans,
				fontWeight: 700,
				fontSize: size,
				letterSpacing: '-0.02em',
				whiteSpace: 'nowrap',
				color: REEL.rose,
				textShadow: shadow,
				opacity: landed(frame, cta.start),
			}}
		>
			{cta.text}
			{glintOn ? (
				<div
					style={{
						position: 'absolute',
						left: sweep * w - 40,
						top: -14,
						width: 80,
						height: size + 28,
						background:
							'radial-gradient(closest-side, rgba(255,255,255,0.85), rgba(255,255,255,0))',
						mixBlendMode: 'screen',
						pointerEvents: 'none',
					}}
				/>
			) : null}
		</div>
	);
};

// ── Aside (§4) ─────────────────────────────────────────────────────────────
// One job: a remark that is NOT in the spoken script. 1–2 per video, and if
// the video has no genuine aside the script face does not appear at all.
export type AsideNote = {
	text: string;
	x: number;
	y: number;
	at: number;
	end: number;
	/** 2–4 degrees. */
	rot?: number;
	/** Frames per character. The aside TYPES ON: it mimics being
	 *  hand-written. Pair with a typing SFX spanning asideTypeFrames(). */
	charDur?: number;
};

/** Duration of an aside's type-on, for the typing SFX underneath it. */
export const asideTypeFrames = (note: AsideNote) =>
	Math.ceil(note.text.length * (note.charDur ?? 1.4));

export const Aside: React.FC<{note: AsideNote; shadow?: string}> = ({
	note,
	shadow = TYPE_SHADOW,
}) => {
	const frame = useCurrentFrame();
	if (frame < note.at || frame >= note.end) return null;
	const size = fitAside(note.text, 54, SAFE_W - note.x);
	const shown = Math.min(
		note.text.length,
		Math.floor((frame - note.at) / (note.charDur ?? 1.4))
	);

	return (
		<div
			style={{
				position: 'absolute',
				left: LEFT + note.x,
				top: note.y,
				fontFamily: FACE.aside,
				fontSize: size,
				lineHeight: 1.1,
				whiteSpace: 'pre',
				color: REEL.parchment,
				textShadow: shadow,
				transform: `rotate(${note.rot ?? -3}deg)`,
				transformOrigin: 'left center',
			}}
		>
			{note.text.slice(0, shown)}
		</div>
	);
};

// ── Logo pop (§10, 27 Aug) ─────────────────────────────────────────────────
// A brand mark + name landing in the wall space as the speaker names the company —
// the section marker, taking over the role the v1 coral numerals and the v2
// chapter cards used to play. One per section, holds ~3s, lands with a small
// scale pop: the section marker is the one place a hard pop is motivated.
export type LogoChip = {
	/** staticFile path of the mark. Omit for a wordmark-only chip. */
	icon?: string;
	/** A React-rendered mark (e.g. a component icon) when no image asset
	 *  exists. Takes precedence over `icon`. */
	iconNode?: React.ReactNode;
	/** Omit when the icon file is already a full lockup (Canva, BetterHelp). */
	label?: string;
	/** Wordmark colour when there is no icon; label is parchment otherwise. */
	color?: string;
	/** Icon height px; wide lockups set this and let width follow. */
	iconH?: number;
	/** v5: align the chip with the lockup. A centred mark under a
	 *  left-aligned hook reads as a mistake. */
	align?: 'center' | 'left';
	y: number;
	start: number;
	end: number;
};

export const LogoPop: React.FC<{chip: LogoChip; shadow?: string}> = ({
	chip,
	shadow = TYPE_SHADOW,
}) => {
	const frame = useCurrentFrame();
	if (frame < chip.start || frame >= chip.end) return null;
	const t = interpolate(frame - chip.start, [0, 6], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.back(1.6)),
	});
	const out = interpolate(frame, [chip.end - 4, chip.end], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// The chip follows the lockup: `align: 'left'` under a left-aligned
	// (cover-style) hook, centred otherwise. Mixing the two reads as a mistake.
	return (
		<div
			style={{
				position: 'absolute',
				left: LEFT,
				top: chip.y,
				width: SAFE_W,
				display: 'flex',
				alignItems: 'center',
				justifyContent: chip.align === 'left' ? 'flex-start' : 'center',
				gap: 22,
				opacity: Math.min(t * 2, 1) * out,
				transform: `scale(${0.7 + t * 0.3})`,
				transformOrigin: 'center',
			}}
		>
			{chip.iconNode ? (
				<div style={{filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.45))'}}>{chip.iconNode}</div>
			) : chip.icon ? (
				<Img
					src={staticFile(chip.icon)}
					style={{
						height: chip.iconH ?? 84,
						filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.45))',
					}}
				/>
			) : null}
			{chip.label ? (
				<div
					style={{
						fontFamily: FACE.sans,
						fontWeight: 700,
						fontSize: 62,
						letterSpacing: '-0.02em',
						color: chip.icon || chip.iconNode ? REEL.parchment : (chip.color ?? REEL.parchment),
						textShadow: shadow,
						whiteSpace: 'nowrap',
					}}
				>
					{chip.label}
				</div>
			) : null}
		</div>
	);
};

// ── Meme pop (§10, 27 Aug) ─────────────────────────────────────────────────
// A looping reaction clip in the empty wall space, expressing what the speaker is not
// saying out loud — the reference creator's Angela Lansbury move. 1–2 per
// video, from your own approved library in public/memes/, never over the speaker's face.
// ── CTA end card (§4, v5) ───────────────────────────────────────────
// The CTA is an END CARD, not a single line. The speaker writes the copy; this sets it
// and does not paraphrase. Left-aligned at the safe margin so it matches the
// cover lockup, over the same scrim, with rose carrying the date and the
// comment keyword.
export type CtaCardLine = {
	text: string;
	/** Substring rendered in rose — the date, the keyword. */
	tint?: string;
	size?: number;
	weight?: number;
	/** Extra space above this line. */
	gap?: number;
	/** Absolute frame this line lands (as it is spoken). Defaults to the card's start. */
	at?: number;
	/** Substring colour override for the tint (default rose). */
	tintColor?: string;
};

export type CtaCardSpec = {
	lines: CtaCardLine[];
	start: number;
	end: number;
	top?: number;
};

export const CtaCard: React.FC<{cta: CtaCardSpec}> = ({cta}) => {
	const frame = useCurrentFrame();
	if (frame < cta.start || frame >= cta.end) return null;
	const alpha = landed(frame, cta.start + 2);

	return (
		<>
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					width: 1080,
					height: 980,
					opacity: alpha,
					background:
						'linear-gradient(180deg, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.46) 30%, rgba(0,0,0,0.24) 55%, rgba(0,0,0,0) 100%)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: LEFT,
					top: cta.top ?? 250,
					width: SAFE_W,
					opacity: alpha,
					fontFamily: FACE.sans,
					textShadow: COVER_SHADOW,
				}}
			>
				{cta.lines.map((l) => {
					const weight = l.weight ?? 500;
					const size = fitSans(l.text, l.size ?? 44, SAFE_W, weight, -0.02);
					const i = l.tint ? l.text.indexOf(l.tint) : -1;
					const at = l.at ?? cta.start;
					// Each line lands on its own frame with a short rise, so the card
					// BUILDS while the speaker talks instead of dumping a block of text.
					const p = interpolate(frame, [at, at + 8], [0, 1], {
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
						easing: Easing.out(Easing.cubic),
					});
					return (
						<div
							key={l.text}
							style={{
								marginTop: l.gap ?? 0,
								fontSize: size,
								fontWeight: weight,
								lineHeight: 1.08,
								letterSpacing: '-0.025em',
								color: REEL.parchment,
								opacity: p,
								transform: `translateY(${(1 - p) * 14}px)`,
							}}
						>
							{i < 0 ? (
								l.text
							) : (
								<>
									{l.text.slice(0, i)}
									<span style={{color: l.tintColor ?? REEL.rose}}>{l.tint}</span>
									{l.text.slice(i + (l.tint as string).length)}
								</>
							)}
						</div>
					);
				})}
			</div>
		</>
	);
};

export type Meme = {
	/** File in public/memes/. */
	src: string;
	/** Source aspect, height / width — the container needs a real height. */
	aspect: number;
	x: number;
	y: number;
	w: number;
	start: number;
	end: number;
	rot?: number;
};

export const MemePop: React.FC<{meme: Meme}> = ({meme}) => {
	const frame = useCurrentFrame();
	if (frame < meme.start || frame >= meme.end) return null;
	const t = interpolate(frame - meme.start, [0, 6], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.back(1.4)),
	});
	const out = interpolate(frame, [meme.end - 4, meme.end], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<Sequence from={meme.start} durationInFrames={meme.end - meme.start} layout="none">
			<div
				style={{
					position: 'absolute',
					left: LEFT + meme.x,
					top: meme.y,
					width: meme.w,
					height: Math.round(meme.w * meme.aspect),
					borderRadius: 14,
					overflow: 'hidden',
					boxShadow: '0 16px 44px rgba(0,0,0,0.4)',
					opacity: Math.min(t * 2, 1) * out,
					transform: `scale(${0.7 + t * 0.3}) rotate(${meme.rot ?? 0}deg)`,
					transformOrigin: 'center',
				}}
			>
				<Loop durationInFrames={9999}>
					<OffthreadVideo
						src={staticFile(`memes/${meme.src}`)}
						muted
						style={{width: '100%', height: '100%', objectFit: 'cover'}}
					/>
				</Loop>
			</div>
		</Sequence>
	);
};
