import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile} from 'remotion';
import {useCurrentFrame} from 'remotion';
import {Cut, cutAt} from './cuts';

/**
 * The talking head, cut. One video element for the whole reel — the crop
 * changes, the element never remounts, so a cut costs nothing and never seeks.
 *
 * `dy` pushes the footage down while a recording strip owns the top of the
 * frame; the gap it opens hides behind the strip, and the face sits fully
 * below it. Applied outside the scale so the number in the data is real px.
 */
export const Footage: React.FC<{src: string; cuts: Cut[]}> = ({src, cuts}) => {
	const frame = useCurrentFrame();
	const c = cutAt(cuts, frame);
	const dy = c?.dy ?? 0;

	return (
		<AbsoluteFill style={{backgroundColor: '#000', overflow: 'hidden'}}>
			<OffthreadVideo
				src={staticFile(src)}
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
