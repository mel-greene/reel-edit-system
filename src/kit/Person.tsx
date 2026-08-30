// ─────────────────────────────────────────────────────────────────────────────
// The person layer — the speaker, cut out of the footage.  §10 amendment,
// 29 Aug 2026, from the second reference-creator study.
//
// The reference's collage, graphics and big emphasis words tuck BEHIND the speaker
// head and shoulders. That one trick is most of what reads as "produced":
// the overlay stops being a sticker on top of a webcam frame and becomes a
// set she is standing in front of.
//
// How: `tools/personmatte` (Vision person segmentation ∪ foreground-instance
// mask → ProRes 4444 alpha) cuts her out of the take once per reel:
//
//   ./tools/personmatte/personmatte public/NNNN.mp4 public/NNNN-person.mov
//
// Layer order in the composition:
//
//   <Footage/>                 the take, cut and reframed
//   …behind-her overlays…      collage, emphasis words that tuck
//   <PersonLayer/>             the speaker, matted, SAME cuts — pixel-aligned
//   …front overlays…           captions, cards, logos, memes
//
// PersonLayer mounts only inside `windows` — ProRes decode is expensive and
// outside a behind-moment the footage already shows the speaker.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Cut, cutAt} from './cuts';
import type {Range} from './kit';

export const PersonLayer: React.FC<{
	/** The matte, e.g. `0824-person.mov`. Same timeline as the footage unless
	 *  it was matted with --start; then set `offset` to that start in frames. */
	src: string;
	cuts: Cut[];
	windows: Range[];
	offset?: number;
}> = ({src, cuts, windows, offset = 0}) => (
	<>
		{windows.map((w) => (
			<Sequence key={`${w.s}-${w.e}`} from={w.s} durationInFrames={w.e - w.s} layout="none">
				<Matted src={src} cuts={cuts} reelStart={w.s} offset={offset} />
			</Sequence>
		))}
	</>
);

const Matted: React.FC<{src: string; cuts: Cut[]; reelStart: number; offset: number}> = ({
	src,
	cuts,
	reelStart,
	offset,
}) => {
	const local = useCurrentFrame();
	const c = cutAt(cuts, reelStart + local);
	const dy = c?.dy ?? 0;

	// Identical crop math to Footage.tsx — the speaker must not shift by a pixel when
	// the matte is present.
	return (
		<AbsoluteFill style={{overflow: 'hidden', pointerEvents: 'none'}}>
			<OffthreadVideo
				src={staticFile(src)}
				transparent
				startFrom={reelStart - offset}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transform:
						c && (c.scale !== 1 || dy !== 0)
							? `translateY(${dy}px) scale(${c.scale})`
							: undefined,
					transformOrigin: c ? `${c.fx}% ${c.fy}%` : undefined,
				}}
			/>
		</AbsoluteFill>
	);
};
