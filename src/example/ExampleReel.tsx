import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
	Aside,
	asideTypeFrames,
	EmphasisGroup,
	GroupCaptions,
	HookTitle,
	LogoPop,
	MemePop,
	Sfx,
	type Range,
} from '../kit/kit';
import {CAPTION_UNDER_CARD, ScreenInserts} from '../kit/ScreenInsert';
import {Footage} from '../kit/Footage';
import {HOOK_SFX, POP_SFX, SECTION_SFX, TYPING_SFX} from '../kit/sfx';
import {
	ASIDES,
	CTA,
	CUTS,
	DURATION,
	EMPHASIS,
	FOOTAGE,
	GROUPS,
	HOOK,
	INSERTS,
	INSERT_WINDOWS,
	LOGOS,
	MEMES,
} from './exampleData';

// The composition shape every reel uses. Layer order matters: footage, cards,
// captions, hook, emphasis, logos, memes, asides, sound.
const TEXT_OWNS: Range[] = [
	...EMPHASIS.map((g) => ({s: g.start, e: g.end})),
	{s: CTA.start, e: CTA.end},
];

export const EXAMPLE_DURATION = DURATION;

export const ExampleReel: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: '#000'}}>
		<Footage src={FOOTAGE} cuts={CUTS} />

		<ScreenInserts inserts={INSERTS} />

		<GroupCaptions
			groups={GROUPS}
			suppress={TEXT_OWNS}
			tops={INSERT_WINDOWS.map((w) => ({...w, top: CAPTION_UNDER_CARD}))}
		/>

		<HookTitle hook={HOOK} />

		{EMPHASIS.map((g) => (
			<EmphasisGroup key={g.start} group={g} />
		))}
		<EmphasisGroup group={CTA} />

		{LOGOS.map((c) => (
			<LogoPop key={c.start} chip={c} />
		))}

		{MEMES.map((m) => (
			<MemePop key={m.start} meme={m} />
		))}

		{ASIDES.map((a) => (
			<Aside key={a.at} note={a} />
		))}

		<Sfx from={HOOK.start} file={HOOK_SFX.file} volume={HOOK_SFX.volume} dur={HOOK_SFX.dur} />
		{INSERTS.map((i) => (
			<Sfx key={`clk-${i.start}`} from={i.start} file={SECTION_SFX.file} volume={SECTION_SFX.volume} dur={SECTION_SFX.dur} />
		))}
		{[...EMPHASIS, CTA]
			.flatMap((g) => g.lines)
			.filter((l) => l.role === 'payoff')
			.map((l) => (
				<Sfx key={`pop-${l.at}`} from={l.at} file={POP_SFX.file} volume={POP_SFX.volume} dur={POP_SFX.dur} />
			))}
		{LOGOS.map((c) => (
			<Sfx key={`lp-${c.start}`} from={c.start} file={POP_SFX.file} volume={POP_SFX.volume} dur={POP_SFX.dur} />
		))}
		{ASIDES.map((a) => (
			<Sfx key={`type-${a.at}`} from={a.at} file={TYPING_SFX.file} volume={TYPING_SFX.volume} dur={asideTypeFrames(a)} />
		))}
	</AbsoluteFill>
);
