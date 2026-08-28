// ─────────────────────────────────────────────────────────────────────────────
// Reel edit system v2 — tokens.  Source of truth: REEL-SYSTEM.md §1 and §2.
//
// Do not eyeball these and do not add a colour. Navy is a GROUND: it carries
// type only on a full-frame card or the top bar, never over footage.
// ─────────────────────────────────────────────────────────────────────────────
import {FONT} from './fonts';

export const REEL = {
	navy: '#1B2A4A', // grounds only: full-frame cards, top bar
	parchment: '#F5EFE8', // all primary type over footage
	blush: '#C4A0A0', // accent: payoff words, labels, rail fill
	/** Caption-tint accent. Two constraints found the hard way (27 Aug): blush
	 *  against parchment is invisible at 52px, and a DARK rose dies over her
	 *  black top. Same hue family as blush, luminance close to parchment,
	 *  saturation doing the separating. Tested over both grounds. */
	rose: '#E89090',
	white: '#FFFFFF', // asides only
} as const;

// §1 alternate palette. Swap by changing the three values above, not by
// reaching for these at a call site — the full-frame cards do not exist in the
// coral palette, because coral has no ground colour.
export const REEL_CORAL_ALT = {
	blush: '#DA5846',
	parchment: '#FFFFFF',
	navy: null,
} as const;

export const FACE = {
	/** Display + captions. Weights 600 / 700. */
	sans: FONT.sans,
	/** Labels, ordinals. Weight 500, wide tracking. */
	mono: FONT.mono,
	/** Asides only — a remark that is not in the spoken script. */
	aside: FONT.aside,
} as const;

// ── Zones (§2) — unchanged from the v1 kit. Do not re-derive. ───────────────
export const LEFT = 70;
export const RIGHT = 150; // Instagram action rail. Only the progress rail enters it.
export const SAFE_W = 1080 - LEFT - RIGHT; // 860

export const BAND = {
	/** Progress rail / navy bar / section label. */
	topRail: 180,
	/** Running captions — amended 27 Aug: one band, low, near her chest. The
	 *  recordings are strips across the top now, so the caption never has to
	 *  move out of their way and the two-instance suppress dance is gone. */
	caption: '71%',
} as const;

/** Display type sits over her own footage — the print behind her right
 *  shoulder is at the parchment's luminance, so type needs the three-layer
 *  stack, not a single soft shadow. Carried over from the v1 builds; it was
 *  measured, not guessed. */
export const TYPE_SHADOW =
	'0 0 30px rgba(0,0,0,0.62), 0 5px 22px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.62)';
