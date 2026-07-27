import { Box } from "@chakra-ui/react";

interface BackgroundProps {
	imageUrl: string;
}

export const Background = ({ imageUrl }: BackgroundProps) => {
	return (
		<Box
			position="fixed"
			inset="0" // 화면 전체 덮기
			zIndex="-1" // 가장 뒤로 보내기
			bgImage={{
				_dark: `radial-gradient(circle at center, rgba(20, 21, 23,0.95) 0%, rgba(20, 21, 23,0.975) 66%, rgba(20, 21, 23,1) 100%), url(${imageUrl})`,
				_light: `radial-gradient(circle at center, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.96) 66%, rgba(255,255,255,1) 100%), url(${imageUrl})`,
			}}
			bgSize="cover"
			backgroundPosition="center"
			bgRepeat="no-repeat"
			pointerEvents="none"
			// GPU 하드웨어 가속
			transform="translateZ(0)"
			willChange="transform"
		/>
	);
};
