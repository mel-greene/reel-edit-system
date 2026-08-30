// ─────────────────────────────────────────────────────────────────────────────
// Takeovers — the two big-scale insert treatments from the 29 Aug 2026
// reference study. They join (not replace) the §5 recording card:
//
//   FloatingCard   small   a file / cover / photo popping into wall space
//   ScreenInserts  medium  the §5 rounded card, top third        (unchanged)
//   TopTakeover    large   full-width strip, top ~45%, hard edge
//   DocTakeover    full    pages on a parchment ground, the speaker off screen
//
// DocTakeover is the one sanctioned break of "the speaker is never off screen": the
// reference creator leaves frame for 8–12s product showcases. Bounded — see
// REEL-SYSTEM.md §5.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import {
	AbsoluteFill,
	Easing,
	Img,
	OffthreadVideo,
	Sequence,
	interpolate,
	staticFile,
	useCurrentFrame,
} from 'remotion';
import {REEL} from './reelTokens';
import type {Range} from './kit';

// ── FloatingCard ───────────────────────────────────────────────────────────
// A small card popping into the wall space with a back-eased scale, the same
// register as a logo pop. `paper` wraps the image in a parchment mat with a
// stacked-sheets edge (the reference's zip-file moment); `photo` is a white
// print border; `plain` is just the rounded image. `cursor` drops a Mac
// arrow on the corner — the "I dragged this in" wink. Land it with a click.
export type Floating = {
	src: string;
	x: number;
	y: number;
	w: number;
	start: number;
	end: number;
	rot?: number;
	frame?: 'paper' | 'photo' | 'plain';
	/** Cursor tip position, relative to the card's top-left. */
	cursor?: {x: number; y: number};
};

const MacCursor: React.FC<{x: number; y: number}> = ({x, y}) => (
	<svg
		width={46}
		height={64}
		viewBox="0 0 23 32"
		style={{position: 'absolute', left: x, top: y, filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.35))'}}
	>
		<path
			d="M1 1 L1 24 L7 19 L11 29 L15 27 L11 17 L19 17 Z"
			fill="#000"
			stroke="#FFF"
			strokeWidth={1.6}
		/>
	</svg>
);

export const FloatingCard: React.FC<{card: Floating}> = ({card}) => {
	const frame = useCurrentFrame();
	if (frame < card.start || frame >= card.end) return null;
	const t = interpolate(frame - card.start, [0, 6], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.back(1.6)),
	});
	const out = interpolate(frame, [card.end - 4, card.end], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const f = card.frame ?? 'plain';
	const pad = f === 'paper' ? 26 : f === 'photo' ? 18 : 0;

	return (
		<div
			style={{
				position: 'absolute',
				left: card.x,
				top: card.y,
				width: card.w,
				padding: pad,
				borderRadius: f === 'plain' ? 18 : 22,
				background: f === 'paper' ? '#FFFFFF' : f === 'photo' ? '#FFFFFF' : undefined,
				boxShadow:
					f === 'paper'
						? '0 1px 0 1px rgba(0,0,0,0.06), 0 24px 60px rgba(0,0,0,0.35), 0 6px 0 -2px #F1EBE2, 0 7px 0 -1px rgba(0,0,0,0.08)'
						: '0 24px 60px rgba(0,0,0,0.38)',
				opacity: Math.min(t * 2, 1) * out,
				transform: `scale(${0.6 + t * 0.4}) rotate(${card.rot ?? 0}deg)`,
				transformOrigin: 'center',
			}}
		>
			<Img
				src={staticFile(card.src)}
				style={{width: '100%', display: 'block', borderRadius: f === 'plain' ? 18 : 8}}
			/>
			{card.cursor ? <MacCursor x={card.cursor.x} y={card.cursor.y} /> : null}
		</div>
	);
};

// ── TopTakeover ────────────────────────────────────────────────────────────
// A screen recording or image at FULL width across the top of the frame,
// hard straight bottom edge, no card chrome — the reference's Pinterest and
// marketplace moments. the speaker reframes down underneath (dy in cuts.ts) and the
// caption band drops to just below the takeover's edge.
export type Top = {
	src: string;
	start: number;
	end: number;
	/** Height of the strip in px. The reference holds ~45% (≈870). */
	h?: number;
	/** Video only: source frame to start at, and rate (≤1.5, §5 rules). */
	from?: number;
	rate?: number;
	image?: boolean;
	/** Crop pan in SOURCE px, top of window, like ScreenInsert. */
	cropY?: number;
	cropY2?: number;
	/** Source pixel size — explicit because `height: auto` is unreliable for
	 *  OffthreadVideo frames at render time. Defaults to the 1080x1350 mockup. */
	srcW?: number;
	srcH?: number;
};

export const TOP_TAKEOVER_H = 870;
/** Caption band while a top takeover is up: just under its edge. */
export const captionUnderTop = (t: Top) => (t.h ?? TOP_TAKEOVER_H) + 40;

export const topTakeoverWindows = (tops: Top[]): Range[] =>
	tops.map((t) => ({s: t.start, e: t.end}));

const OneTop: React.FC<{t: Top}> = ({t}) => {
	const local = useCurrentFrame();
	const dur = t.end - t.start;
	const h = t.h ?? TOP_TAKEOVER_H;
	const cropY = t.cropY ?? 0;
	const k = 1080 / (t.srcW ?? 1080); // source px → display px
	const y = interpolate(local, [0, dur], [cropY, t.cropY2 ?? cropY], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const mediaStyle: React.CSSProperties = {
		position: 'absolute',
		left: 0,
		top: -y * k,
		width: 1080,
		height: (t.srcH ?? 1350) * k,
	};

	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				top: 0,
				width: 1080,
				height: h,
				overflow: 'hidden',
				background: '#FFFFFF',
				boxShadow: '0 18px 44px rgba(0,0,0,0.35)',
			}}
		>
			{t.image ? (
				<Img src={staticFile(t.src)} style={mediaStyle} />
			) : (
				<OffthreadVideo
					src={staticFile(t.src)}
					startFrom={t.from ?? 0}
					playbackRate={t.rate ?? 1}
					style={mediaStyle}
				/>
			)}
		</div>
	);
};

export const TopTakeovers: React.FC<{tops: Top[]}> = ({tops}) => (
	<>
		{tops.map((t) => (
			<Sequence key={`${t.src}-${t.start}`} from={t.start} durationInFrames={t.end - t.start} layout="none">
				<OneTop t={t} />
			</Sequence>
		))}
	</>
);

// ── DocTakeover ────────────────────────────────────────────────────────────
// Full-frame product showcase: pages of the deliverable on a parchment
// ground, hard cuts between pages, an optional slow drift inside a page.
// The speaker is off screen — keep one takeover ≤ 12s (§5). Captions over it switch
// to navy ink via GroupCaptions `inks`.
export type DocPage = {
	src: string;
	/** Absolute frame this page lands. */
	at: number;
	/** Width as a fraction of the frame (default 0.86). */
	w?: number;
	/** Vertical drift in px across the page's hold (positive = content up). */
	drift?: number;
	/** Vertical centre offset. */
	dy?: number;
};

export type Doc = {
	start: number;
	end: number;
	pages: DocPage[];
	ground?: string;
};

export const docTakeoverWindows = (docs: Doc[]): Range[] =>
	docs.map((d) => ({s: d.start, e: d.end}));

export const DocTakeover: React.FC<{doc: Doc}> = ({doc}) => {
	const frame = useCurrentFrame();
	if (frame < doc.start || frame >= doc.end) return null;

	let page: DocPage | undefined;
	let next = doc.end;
	for (let i = 0; i < doc.pages.length; i++) {
		if (doc.pages[i].at <= frame) {
			page = doc.pages[i];
			next = doc.pages[i + 1]?.at ?? doc.end;
		}
	}
	if (!page) return null;

	const drift = page.drift
		? interpolate(frame, [page.at, next], [0, -page.drift], {
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			})
		: 0;
	const w = 1080 * (page.w ?? 0.86);
	// The first page lands as a pop — the reference scales its cover card in.
	const isFirst = page === doc.pages[0];
	const t = isFirst
		? interpolate(frame - page.at, [0, 7], [0, 1], {
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
				easing: Easing.out(Easing.back(1.2)),
			})
		: 1;

	return (
		<AbsoluteFill style={{background: doc.ground ?? REEL.parchment}}>
			<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
				<div
					style={{
						width: w,
						borderRadius: 22,
						overflow: 'hidden',
						boxShadow: '0 30px 80px rgba(27,42,74,0.22), 0 4px 14px rgba(27,42,74,0.12)',
						transform: `translateY(${(page.dy ?? 0) + drift}px) scale(${0.7 + t * 0.3})`,
						opacity: Math.min(t * 2, 1),
					}}
				>
					<Img src={staticFile(page.src)} style={{width: '100%', display: 'block'}} />
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
