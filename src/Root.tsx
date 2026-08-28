import React from 'react';
import {Composition} from 'remotion';
import {ExampleReel, EXAMPLE_DURATION} from './example/ExampleReel';

export const RemotionRoot: React.FC = () => (
	<>
		<Composition
			id="ExampleReel"
			component={ExampleReel}
			durationInFrames={EXAMPLE_DURATION}
			fps={30}
			width={1080}
			height={1920}
		/>
	</>
);
