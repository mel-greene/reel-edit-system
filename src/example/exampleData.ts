// ─────────────────────────────────────────────────────────────────────────────
// A complete worked example of the data schema — a fictional 30s, two-section
// reel. This is the file an agent writes per video; everything visual is
// decided by REEL-SYSTEM.md and the kit, not here.
//
// Word timings in a real build come from whisper.cpp:
//   whisper-cli -m ggml-base.en.bin -f audio.wav -ml 1 -sow -oj
// then get split by hand into 1–3 word cells on natural phrase boundaries.
// ─────────────────────────────────────────────────────────────────────────────
import type {
	AsideNote,
	CaptionGroup,
	Emphasis,
	Hook,
	LogoChip,
	Meme,
	Range,
} from '../kit/kit';
import type {Insert} from '../kit/ScreenInsert';
import {reframeSchedule, type Cut} from '../kit/cuts';

export const FPS = 30;
export const DURATION = 900; // 30s
export const FOOTAGE = 'footage.mp4'; // your talking-head take, 1080x1920

// Persistent top title; captions run underneath; it leaves before the first
// recording card arrives.
export const HOOK: Hook = {
	headline: ['2 AI Workflows', 'I Ship Weekly'],
	subhead: 'and what each one replaced',
	start: 8,
	end: 200,
};

// Recording cards: rounded, top third, cropY→cropY2 pans the crop window down
// the source so the cursor stays in view. Sources are 1080x1350 mockups here;
// verify every crop against a rendered still.
export const INSERTS: Insert[] = [
	{src: 'recordings/workflow-1.mp4', start: 240, end: 420, from: 20, rate: 1.1, cropY: 120, cropY2: 400},
	{src: 'recordings/workflow-2.mp4', start: 560, end: 760, from: 20, rate: 1.2, cropY: 140, cropY2: 430},
];

export const INSERT_WINDOWS: Range[] = INSERTS.map((i) => ({s: i.start, e: i.end}));

// One logo per section, centred, landing as the tool is named, gone before
// that section's card arrives. Real marks only — a wrong logo is worse than
// no logo; use a brand-colour wordmark when no mark is available.
export const LOGOS: LogoChip[] = [
	{label: 'Tool One', color: '#4A90D9', y: 430, start: 210, end: 300},
	{label: 'Tool Two', color: '#3BA55C', y: 430, start: 530, end: 620},
];

// 1–2 memes from your approved library in public/memes/. Wall space only.
export const MEMES: Meme[] = [
	// {src: 'reaction.mp4', aspect: 174 / 200, x: 430, y: 400, w: 390, start: 640, end: 730, rot: -2},
];

// Emphasis: the loud layer. Centred stagger, dx varies per group.
export const EMPHASIS: Emphasis[] = [
	{
		start: 440,
		end: 550,
		dx: -40,
		lines: [
			{text: 'four hours', role: 'setup', y: 450, at: 446},
			{text: '20 minutes', role: 'payoff', y: 540, at: 500},
		],
	},
];

export const CTA: Emphasis = {
	start: 780,
	end: 900,
	dx: 0,
	lines: [
		{text: 'one new workflow, every week', role: 'setup', y: 420, at: 788, size: 44},
		{text: 'Follow along', role: 'payoff', y: 510, at: 830},
	],
};

// A remark NOT in the spoken script. Types on, with typing SFX underneath.
export const ASIDES: AsideNote[] = [
	{text: 'yes, really', x: 60, y: 830, at: 560, end: 640, rot: -3, charDur: 1.4},
];

// Cuts: every mark is a section boundary, a card arriving/leaving, or an
// emphasis beat — never a grid. Cards force fy 60 / dy 240 / scale ≥ 1.22.
const MARKS = [0, 200, 240, 420, 440, 560, 760, 780];
const inCard = (f: number) => INSERT_WINDOWS.some((w) => f >= w.s && f < w.e);
export const CUTS: Cut[] = reframeSchedule(MARKS, {fx: 50, fy: 34}).map((c) =>
	inCard(c.at) ? {...c, dy: 240, fy: 60, scale: Math.max(c.scale, 1.22)} : c
);

// Captions: 1–3 word cells, hard cut, tint marks the stressed word.
export const GROUPS: CaptionGroup[] = [
	{words: ['every', 'week'], s: 10, e: 40},
	{words: ['I ship'], s: 40, e: 70},
	{words: ['two', 'AI', 'workflows'], s: 70, e: 130, tint: 2},
	{words: ['and today'], s: 130, e: 170},
	{words: ["I'm showing", 'you'], s: 170, e: 220},
	{words: ['both'], s: 220, e: 250, tint: 0},
	// ... continue from your whisper timings
];
