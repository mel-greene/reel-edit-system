// ─────────────────────────────────────────────────────────────────────────────
// Footage reframe schedule.  REEL-SYSTEM.md §5.
//
// The single biggest change from v1: the footage CUTS. A v1 reel was one
// unbroken locked-off take for 159 seconds with overlays landing on top of it,
// which is what makes it read as a webcam recording rather than an edit.
//
// A cut is a hard change of crop on the same take — 1.10–1.18x, alternating
// tighter and wider. No crossfade, no zoom ramp, no speed ramp. Cut on the speaker's
// breath: pass the marks in from the word timings, not from a grid.
// ─────────────────────────────────────────────────────────────────────────────

export type Cut = {
	/** Absolute frame the crop changes. */
	at: number;
	/** 1.0 = the take as shot. Everything else is a reframe. */
	scale: number;
	/** Crop origin, percentages of the frame. The face sits high in a typical
	 *  framing, so a zoom that keeps 50/50 pushes the chin off the bottom. */
	fx: number;
	fy: number;
	/** Push the footage down this many px — used while a recording strip owns
	 *  the top of the frame, so her face sits fully below it. The gap this
	 *  opens at the top hides behind the strip. §10, 27 Aug. */
	dy?: number;
};

/** Alternating tighter/wider, cycled so the rhythm never lands on a metronome.
 *  §5 said 1.10–1.18; amended 27 Aug — those reframes were too subtle to
 *  register as a new setup, which defeats the point. The reference creator's
 *  punch-ins are unmistakable. */
const TIGHT = [1.32, 1.26, 1.38, 1.30];
const WIDE = [1.0, 1.06, 1.0, 1.1];

/**
 * Build a schedule from cut marks. `marks` must be sorted, and should be
 * section boundaries plus at least one mid-section mark each — roughly 14
 * across a 159s video.
 *
 * `focus` lets a run of the take use a different crop origin, for the stretch
 * where the speaker leans out of the centre of frame.
 */
export const reframeSchedule = (
	marks: number[],
	focus: {fx?: number; fy?: number} = {}
): Cut[] => {
	const fx = focus.fx ?? 50;
	const fy = focus.fy ?? 34;
	let tight = 0;
	let wide = 0;

	return marks.map((at, i) => {
		const isTight = i % 2 === 1;
		const scale = isTight ? TIGHT[tight++ % TIGHT.length] : WIDE[wide++ % WIDE.length];
		// A tighter crop drifts the framing up a little, so the reframe reads as
		// a new setup rather than a zoom on the same one.
		return {at, scale, fx, fy: isTight ? fy - 2 : fy};
	});
};

/** The cut in force at `frame`. */
export const cutAt = (cuts: Cut[], frame: number): Cut | undefined => {
	let active: Cut | undefined;
	for (const c of cuts) {
		if (c.at <= frame) active = c;
		else break;
	}
	return active;
};
