// Sound placements. Four sounds in the whole system — nothing per-word, no
// music bed baked in.
//
// Files are NOT bundled (bring your own): drop them into public/sfx/ under
// these names. Volumes below are the levels this system was tuned at; treat a
// change as a design decision, not a mix tweak, and judge by listening.
export const SFX = {
	/** The hook, once per reel. */
	whoosh: {file: 'whoosh.mp3', volume: 0.37, dur: 50},
	/** Each emphasis payoff line landing, and each icon in a ROW of logo pops. */
	pop: {file: 'pop.mp3', volume: 0.4, dur: 40},
	/** A LONE logo icon landing — softer than the pop so a reel full of
	 *  section marks doesn't nag. Rows of icons keep the pop each. */
	sparkle: {file: 'sparkle.mp3', volume: 0.3, dur: 50},
	/** Each recording card landing — reads as UI interaction. */
	click: {file: 'click.mp3', volume: 0.43, dur: 20},
	/** Under each aside as it types on — the hand-written mimic. Span it with
	 *  asideTypeFrames() from the kit. */
	typing: {file: 'typing.mp3', volume: 0.34},
} as const;

export const HOOK_SFX = SFX.whoosh;
export const POP_SFX = SFX.pop;
/** A lone logo icon landing. Icons in a ROW keep POP_SFX each. */
export const SPARKLE_SFX = SFX.sparkle;
export const SECTION_SFX = SFX.click;
export const TYPING_SFX = SFX.typing;
