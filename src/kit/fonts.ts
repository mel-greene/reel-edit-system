// Self-hosted faces, loaded via FontFace so headless renders match Studio.
//
//   Instrument Sans — SIL OFL, bundled (public/fonts/, licence alongside).
//     The display + caption face. Variable; we use 500/600/700.
//   DM Mono — SIL OFL, bundled. Labels and ordinals, weight 500.
//   Aside face — NOT bundled. The system reserves a handwritten face for
//     asides (remarks not in the spoken script). Drop your own licensed
//     script font at public/fonts/Aside.otf and it loads automatically;
//     otherwise asides fall back to cursive.
import {staticFile, delayRender, continueRender} from 'remotion';

export const FONT = {
	sans: 'Instrument Sans',
	mono: 'DM Mono',
	aside: 'Reel Aside',
};

let started = false;

export const loadFonts = () => {
	if (started || typeof document === 'undefined') return;
	started = true;

	const handle = delayRender('Loading reel faces');

	const faces: [string, string, string, FontFaceDescriptors?][] = [
		// Variable — declare the full weight range or the browser synthesises
		// bold instead of using the real 600/700 instances.
		[FONT.sans, 'fonts/InstrumentSans.ttf', 'truetype', {weight: '400 700'}],
		[FONT.mono, 'fonts/DMMono-Medium.ttf', 'truetype', {weight: '500'}],
		[FONT.aside, 'fonts/Aside.otf', 'opentype'],
	];

	Promise.all(
		faces.map(([family, file, format, descriptors]) => {
			const face = new FontFace(
				family,
				`url(${staticFile(file)}) format('${format}')`,
				descriptors
			);
			return face
				.load()
				.then((loaded) => {
					document.fonts.add(loaded);
				})
				.catch(() => {
					// Missing aside font is fine — cursive fallback.
				});
		})
	)
		.then(() => continueRender(handle))
		.catch(() => continueRender(handle));
};

loadFonts();
