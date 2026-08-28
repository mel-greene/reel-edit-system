// ─────────────────────────────────────────────────────────────────────────────
// Line fitter for the v2 faces.
//
// The v1 kit fitted against a hand-extracted advance-width table because MADE
// Awelier's per-character widths range 0.33–0.66 em and a single constant put
// long lines under Instagram's action rail. That problem is unchanged; the
// solution is simpler here. Instrument Sans is variable, so its widths differ
// by weight, and a static table would need one row per weight we use. Remotion
// renders in Chromium and `loadFonts` holds the render open via
// `delayRender` until the faces are in `document.fonts`, so by the time any
// frame is measured the real face is available to canvas `measureText`.
//
// That makes this exact rather than approximate — including for the variable
// weights — at the cost of a canvas per process, which is cached below.
// ─────────────────────────────────────────────────────────────────────────────
import {FACE} from './reelTokens';

let ctx: CanvasRenderingContext2D | null | undefined;

const context = () => {
	if (ctx !== undefined) return ctx;
	ctx =
		typeof document === 'undefined'
			? null
			: document.createElement('canvas').getContext('2d');
	return ctx;
};

/** Rough em-per-char, used only if there is no canvas (SSR, tests). Wide on
 *  purpose: a too-small line is a cosmetic miss, a too-wide one runs under the
 *  action rail. */
const FALLBACK_EM = 0.56;

const cache = new Map<string, number>();

/** Width of `text` in px at `size`, in `face` at `weight`. */
export const measure = (
	text: string,
	size: number,
	face: string = FACE.sans,
	weight = 600,
	tracking = 0
): number => {
	const key = `${face}|${weight}|${size}|${tracking}|${text}`;
	const hit = cache.get(key);
	if (hit !== undefined) return hit;

	const c = context();
	const base = c
		? ((c.font = `${weight} ${size}px "${face}"`), c.measureText(text).width)
		: text.length * FALLBACK_EM * size;
	// letter-spacing is applied per character, including after the last one in
	// Chromium's box model, which is why this is length and not length - 1.
	const w = base + tracking * size * text.length;

	cache.set(key, w);
	return w;
};

/**
 * Largest size ≤ `size` at which `text` fits `maxWidth`. Never scales up, so a
 * short line keeps the size the spec gives it.
 */
export const fitSans = (
	text: string,
	size: number,
	maxWidth: number,
	weight = 600,
	tracking = 0
): number => {
	const w = measure(text, size, FACE.sans, weight, tracking);
	if (w <= maxWidth) return size;
	return Math.floor(size * (maxWidth / w));
};

/** Same, for the aside face. Ugly Dave is not variable; weight is ignored. */
export const fitAside = (text: string, size: number, maxWidth: number): number => {
	const w = measure(text, size, FACE.aside, 400);
	if (w <= maxWidth) return size;
	return Math.floor(size * (maxWidth / w));
};
