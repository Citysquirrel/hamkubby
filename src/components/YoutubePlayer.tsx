import { AspectRatio, Box, type BoxProps } from "@chakra-ui/react";
import React from "react";
import YouTube, { type YouTubeProps } from "react-youtube";

interface YoutubePlayerProps extends BoxProps {
	videoId: string;
	start?: number;
	end?: number;
	volume?: number;
	playerOptions?: YouTubeProps["opts"];
	onReady?: YouTubeProps["onReady"];
	onStateChange?: YouTubeProps["onStateChange"];
	onYoutubeError?: YouTubeProps["onError"];
}

export const YoutubePlayer = React.forwardRef<HTMLDivElement, YoutubePlayerProps>((props, ref) => {
	const { videoId, start, end, volume, playerOptions, onReady, onStateChange, onYoutubeError, ...rest } = props;

	const handlePlayerReady: YouTubeProps["onReady"] = (event) => {
		const player = event.target;
		if (volume != null) {
			player.unMute();
			player.setVolume(volume);
		}

		if (onReady) {
			onReady(event);
		}
	};

	const defaultOpts: YouTubeProps["opts"] = {
		width: "100%",
		height: "100%",
		...playerOptions,
		playerVars: {
			autoplay: 0,
			mute: 0,
			controls: 1, // 컨트롤러 표시
			rel: 0, // 관련 동영상 제한
			modestbranding: 1, // 유튜브 로고 최소화
			start,
			end,
			...playerOptions?.playerVars,
		},
	};

	return (
		<Box ref={ref} overflow="hidden" {...rest}>
			<AspectRatio ratio={16 / 9} w="full" h="full">
				<YouTube
					key={videoId}
					videoId={videoId}
					opts={defaultOpts}
					onReady={handlePlayerReady}
					onStateChange={onStateChange}
					onError={onYoutubeError}
					style={{ width: "100%", height: "100%" }}
				/>
			</AspectRatio>
		</Box>
	);
});

YoutubePlayer.displayName = "YoutubePlayer";
