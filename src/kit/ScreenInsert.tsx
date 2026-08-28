// ─────────────────────────────────────────────────────────────────────────────
// Screen recordings, v3 of this file.  §10 amendment, 27 Aug 2026.
//
// The full-height treatment is out. After studying the reference edit:
// "Her screen recordings take up less of the screen" — and the deeper point,
// THE SPEAKER IS NEVER OFF SCREEN. A recording is now a STRIP across the top ~34% of
// the frame, cropped to the UI rows that matter, and the footage reframes DOWN so the
// speaker stays fully visible underneath it, still reacting (the Footage layer handles
// that shift — see `dy` in cuts.ts).
//
// Still no card, no radius, no shadow, no blur, and it lands on a hard cut.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import {OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';

/** Card geometry. The reference's recordings sit in the top third: inset from
 *  the edges, rounded, below the platform chrome. */
export const CARD_X = 28;
export const CARD_TOP = 150;
export const CARD_W = 1080 - CARD_X * 2; // 1024
export const CARD_H = 620;
export const CARD_R = 24;
/** Where the caption band sits while a card is up: between the card's bottom
 *  edge and her head. */
export const CAPTION_UNDER_CARD = CARD_TOP + CARD_H + 34; // 804

export type Insert = {
	src: string;
	/** Reel frames. */
	start: number;
	end: number;
	/** Frame inside the source clip to start from. */
	from: number;
	/** Trim first, rate second, never above 1.5. Anything with a running timer
	 *  on screen stays at 1. (Unchanged since v1. This rule was right.) */
	rate?: number;
	/** Top of the crop window in SOURCE pixels — which rows of the 1080x1350
	 *  mockup the strip shows. 0 is the top of the clip. */
	cropY?: number;
	/** Pan the crop to here by the end of the insert. The mockups drive their
	 *  action down the screen, so a slow pan keeps the cursor in the strip. */
	cropY2?: number;
};

/** True while any strip is up — used by the Footage layer to reframe down. */
export const insertWindows = (inserts: Insert[]) =>
	inserts.map((i) => ({s: i.start, e: i.end}));

const One: React.FC<{insert: Insert}> = ({insert}) => {
	const local = useCurrentFrame(); // sequence-relative
	const dur = insert.end - insert.start;
	const cropY = insert.cropY ?? 0;
	const y = interpolate(local, [0, dur], [cropY, insert.cropY2 ?? cropY], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// The crop window pans in SOURCE pixels; the source is 1080 wide shown at
	// CARD_W, so positions scale by CARD_W / 1080.
	const k = CARD_W / 1080;

	return (
		<div
			style={{
				position: 'absolute',
				left: CARD_X,
				top: CARD_TOP,
				width: CARD_W,
				height: CARD_H,
				borderRadius: CARD_R,
				overflow: 'hidden',
				background: '#FFFFFF',
				boxShadow: '0 22px 60px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,255,255,0.08)',
			}}
		>
			<OffthreadVideo
				src={staticFile(insert.src)}
				startFrom={insert.from}
				playbackRate={insert.rate ?? 1}
				style={{
					position: 'absolute',
					left: 0,
					top: -y * k,
					width: '100%',
					height: 'auto',
				}}
			/>
		</div>
	);
};

export const ScreenInserts: React.FC<{inserts: Insert[]}> = ({inserts}) => (
	<>
		{inserts.map((i) => (
			<Sequence
				key={`${i.src}-${i.start}`}
				from={i.start}
				durationInFrames={i.end - i.start}
				layout="none"
			>
				<One insert={i} />
			</Sequence>
		))}
	</>
);
