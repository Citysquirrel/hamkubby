import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Box, Flex, Text, IconButton, HStack, Slider, Icon } from "@chakra-ui/react";
import { YoutubePlayer } from "./YoutubePlayer"; // 위에서 만든 컴포넌트
import { CloseButton } from "./ui/close-button";
import { MdDragIndicator } from "react-icons/md";

interface DraggablePreviewProps {
	videoId: string;
	start?: number;
	end?: number;
	onClose?: () => void;
}

const LS_PLAYER_POSITION = "csq-hamlist_player-position";
const LS_PLAYER_VOLUME = "csq-hamlist_player-volume";
const LS_PLAYER_IS_MUTED = "csq-hamlist_player-is-muted";

export const DraggablePreview = ({ videoId, onClose, start, end }: DraggablePreviewProps) => {
	// 팝업의 초기 위치 설정 (우측 하단 예시)
	const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
		const saved = localStorage.getItem(LS_PLAYER_POSITION);
		return saved ? JSON.parse(saved) : null;
	});
	const [isDragging, setIsDragging] = useState(false);

	// 유튜브 상태값
	const [player, setPlayer] = useState<any>(null); // 인스턴스
	const [isPlaying, setIsPlaying] = useState(false);
	const [volume, setVolume] = useState<number[]>(() => {
		const saved = localStorage.getItem(LS_PLAYER_VOLUME);
		return saved ? JSON.parse(saved) : [10];
	});
	const [isMuted, setIsMuted] = useState<boolean>(() => {
		const saved = localStorage.getItem(LS_PLAYER_IS_MUTED);
		return saved ? JSON.parse(saved) : false;
	});
	const [isVolumeChanging, setIsVolumeChanging] = useState(false);
	const [playerStateText, setPlayerStateText] = useState("준비 중..");

	// 로컬스토리지 자동갱신
	useEffect(() => {
		localStorage.setItem(LS_PLAYER_POSITION, JSON.stringify(position));
	}, [position]);
	useEffect(() => {
		localStorage.setItem(LS_PLAYER_VOLUME, JSON.stringify(volume));
	}, [volume]);
	useEffect(() => {
		localStorage.setItem(LS_PLAYER_IS_MUTED, JSON.stringify(isMuted));
	}, [isMuted]);

	// 드래그 시작 시 마우스와 팝업 좌상단 간의 거리(오프셋) 기록
	const dragStartOffset = useRef({ x: 0, y: 0 });
	const popupRef = useRef<HTMLDivElement>(null);

	// 최초 렌더링 시의 위치조정
	useLayoutEffect(() => {
		if (!popupRef.current) return;

		const saved = localStorage.getItem(LS_PLAYER_POSITION);
		if (saved) setPosition(saved ? JSON.parse(saved) : null);
		else {
			const { offsetWidth, offsetHeight } = popupRef.current;
			const MARGIN = 24;

			setPosition({
				x: window.innerWidth - offsetWidth - MARGIN,
				y: window.innerHeight - offsetHeight - MARGIN,
			});
		}
	}, []);

	const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
		// 닫기 버튼 드래그방지
		if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest(".chakra-slider")) return;
		if (!position) return;

		setIsDragging(true);

		dragStartOffset.current = {
			x: e.clientX - position.x,
			y: e.clientY - position.y,
		};
	};

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!isDragging || !popupRef.current) return;

			const { offsetWidth, offsetHeight } = popupRef.current;

			let newX = e.clientX - dragStartOffset.current.x;
			let newY = e.clientY - dragStartOffset.current.y;

			// 화면 이탈 제한
			const minX = -(offsetWidth / 2);
			const maxX = window.innerWidth - offsetWidth / 2;
			const minY = 0;
			const maxY = window.innerHeight - offsetHeight / 2;

			// Math.max와 Math.min을 겹쳐서 최소~최대 구간 안에 좌표를 가둠
			newX = Math.max(minX, Math.min(newX, maxX));
			newY = Math.max(minY, Math.min(newY, maxY));

			setPosition({ x: newX, y: newY });
		};

		const handleMouseUp = () => {
			setIsDragging(false);
		};

		if (isDragging) {
			window.addEventListener("mousemove", handleMouseMove);
			window.addEventListener("mouseup", handleMouseUp);
		}

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging]);

	// #region 컨트롤러
	// 재생 / 일시정지
	const togglePlay = () => {
		if (!player) return;
		if (isPlaying) {
			player.pauseVideo();
		} else {
			player.playVideo();
		}
	};
	// 볼륨 조절 슬라이더
	const handleVolumeChange = (details: { value: number[] }) => {
		const newVolume = details.value;
		setIsVolumeChanging(true);
		setVolume(newVolume);
		if (!player) return;

		player.setVolume(newVolume);
		if (newVolume[0] > 0 && isMuted) {
			player.unMute();
			setIsMuted(false);
		}
	};
	// 음소거
	const toggleMute = () => {
		if (!player) return;
		if (isMuted) {
			player.unMute();
			setIsMuted(false);
			player.setVolume(volume[0] === 0 ? 20 : volume); // 만약 볼륨이 0이었다면 20으로 복구
		} else {
			player.mute();
			setIsMuted(true);
		}
	};
	// 유튜브 API가 준비되었을 때 플레이어 인스턴스 확보
	const onPlayerReady = (event: any) => {
		setPlayer(event.target);
		event.target.setVolume(volume);
		setPlayerStateText("준비됨");
	};

	// 영상 상태 변화 감지 (유튜브 자체 플레이어를 조작했을때 동기화)
	const onPlayerStateChange = (event: any) => {
		const state = event.data;
		// YT.PlayerState 참조 대신 숫자로 매핑 (react-youtube 규격)
		// -1:시작되지않음, 0:종료됨, 1:재생중, 2:일시중지, 3:버퍼링, 5:동영상신호
		if (state === 1) {
			setIsPlaying(true);
			setPlayerStateText("재생 중...");
		} else {
			setIsPlaying(false);
			if (state === 2) setPlayerStateText("일시정지됨");
			if (state === 0) setPlayerStateText("재생 종료");
			if (state === 3) setPlayerStateText("버퍼링...");
		}
	};
	const onPlayerError = (event: any) => {
		const errorCode = event.data;
		/* [참고용]
      2: 요청에 잘못된 매개변수 값(잘못된 ID 형식)이 포함됨
      100: 요청한 동영상을 찾을 수 없음 (삭제되었거나 비공개)
      101, 150: 동영상 소유자가 임베딩(외부 사이트 재생)을 허용하지 않음
    */

		setPlayerStateText("재생 불가");
		setIsPlaying(false);
	};

	useEffect(() => {
		if (!player) return;

		const syncInterval = setInterval(() => {
			// 단축키(m) 입력에 따른 음소거 동기화
			setIsMuted((prevMuted) => {
				const actualMuted = player.isMuted();
				return prevMuted !== actualMuted ? actualMuted : prevMuted;
			});
		}, 500);

		return () => clearInterval(syncInterval);
	}, [player]);

	// #endregion

	return (
		<Box
			ref={popupRef}
			position="fixed"
			opacity={position ? 1 : 0}
			visibility={position ? "visible" : "hidden"}
			left={position ? `${position.x}px` : "0px"}
			top={position ? `${position.y}px` : "0px"}
			zIndex="9999"
			w="360px"
			bg="bg"
			borderRadius="lg"
			boxShadow="lg"
			border="1px solid"
			borderColor="primary"
			overflow="hidden"
			userSelect={isDragging ? "none" : "auto"}
			transition={isDragging ? "none" : "opacity 0.2s ease-in-out"}
		>
			<Flex
				onMouseDown={handleMouseDown}
				cursor={isDragging ? "grabbing" : "grab"}
				bg="bg"
				p={"2px 2px 2px 12px"}
				align="center"
				justify="space-between"
			>
				<HStack spaceX="2">
					<Icon>
						<MdDragIndicator />
					</Icon>
					<Text fontSize="xs" fontWeight="bold">
						동영상 미리보기(beta)
					</Text>
					<Text fontSize="10px" color="gray">
						({playerStateText})
					</Text>
				</HStack>
				{onClose && <CloseButton aria-label="Close preview" variant="ghost" size="xs" onClick={onClose} />}
			</Flex>

			<YoutubePlayer
				videoId={videoId}
				start={start}
				end={end}
				volume={volume[0]}
				onReady={onPlayerReady}
				onStateChange={onPlayerStateChange}
				onYoutubeError={onPlayerError}
				w="full"
				// 미리보기이므로 추천 영상 안뜨게 조절
				playerOptions={{
					playerVars: {
						autoplay: 1,
						mute: 0,
						controls: 0,
						rel: 0,
						modestbranding: 1,
					},
				}}
			/>

			<Flex
				bg="bg"
				p={0.5}
				px="3"
				align="center"
				justify="space-between"
				borderTop="1px solid"
				borderColor="border.muted"
			>
				{/* 왼쪽: 재생 / 일시정지 버튼 */}
				<IconButton size="sm" variant="ghost" onClick={togglePlay} disabled={!player}>
					{isPlaying ? "⏸" : "▶"}
				</IconButton>

				{/* 오른쪽: 음소거 + 볼륨 슬라이더 */}
				<HStack spaceX="2" w="60%" justify="flex-end">
					<IconButton size="sm" variant="ghost" onClick={toggleMute} disabled={!player}>
						{isMuted || volume[0] === 0 ? "🔇" : volume[0] < 50 ? "🔉" : "🔊"}
					</IconButton>
					<Slider.Root
						className="chakra-slider"
						value={[isMuted ? 0 : volume[0]]}
						onValueChange={handleVolumeChange}
						onValueChangeEnd={() => {
							setIsVolumeChanging(false);
						}}
						min={0}
						max={100}
						step={1}
						w="100px"
						disabled={!player}
					>
						<Slider.Control>
							<Slider.Track bg="bg" h="1.5" borderRadius="full">
								<Slider.Range bg="primary.hover" />
							</Slider.Track>
							<Slider.Thumb index={0} boxSize="3" bg="primary.hover" borderRadius="full">
								{isVolumeChanging && <Slider.ValueText fontSize="xs" transform={"translateY(-12px)"} />}
							</Slider.Thumb>
						</Slider.Control>
					</Slider.Root>
				</HStack>
			</Flex>
		</Box>
	);
};
