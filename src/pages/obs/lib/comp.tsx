import { Box, ColorPicker, Flex, HStack, Input, Marquee, NativeSelect, Portal, Text, Textarea } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { FONT_OPTIONS } from "../AdminPanel";
import { getMask, getShadow, safeParseColor } from "./func";

export const OverlayContentView = ({
	settings,
	songList,
}: {
	settings: Broadcast.Settings;
	songList: Broadcast.Song[];
}) => {
	const g = settings.global;
	const h = settings.header;
	const f = settings.footer;
	const np = settings.nowPlaying;
	const wl = settings.waitingList;
	const wr = settings.listWrapper;

	const songsWithNum = songList.map((s, idx) => ({ ...s, num: idx + 1 }));
	const playingSong = songsWithNum.find((s) => s.status === "playing");
	const otherSongs = songsWithNum.filter((s) => s.status !== "playing");

	const listContainerRef = useRef<HTMLDivElement>(null);
	const originalSetRef = useRef<HTMLDivElement>(null);
	const [isListOverflowing, setIsListOverflowing] = useState(false);

	useEffect(() => {
		if (!listContainerRef.current || !originalSetRef.current) return;

		const observer = new ResizeObserver(() => {
			if (listContainerRef.current && originalSetRef.current) {
				setIsListOverflowing(originalSetRef.current.scrollHeight > listContainerRef.current.clientHeight);
			}
		});

		observer.observe(listContainerRef.current);
		observer.observe(originalSetRef.current);
		return () => observer.disconnect();
	}, [otherSongs.length, settings]);

	// 스크롤 속도
	const scrollDuration = Math.max(5, (otherSongs.length * 2) / Math.max(wr.scrollSpeed * 0.2, 0.1));

	// 대기열 아이템 렌더
	const renderSongItem = (song: any, i: number, prefix: string) => (
		<Flex
			key={`${prefix}-${song.id}-${i}`}
			align={wl.layout === "doubleLine" ? "flex-start" : "center"}
			px={`${wl.paddingX ?? wl.padding ?? 12}px`}
			py={`${wl.paddingY ?? wl.padding ?? 12}px`}
			mb={`${wl.gap}px`}
			bg={wl.bgColor || "transparent"}
			borderRadius={`${wl.borderRadius}px`}
			gap={3}
		>
			{wl.showNumber && (
				<Text
					color={wl.numTypo.color}
					fontSize={`${wl.numTypo.size}px`}
					fontFamily={wl.numTypo.font}
					fontWeight="bold"
					flexShrink={0}
				>
					{song.num}
				</Text>
			)}
			<Flex
				direction={wl.layout === "doubleLine" ? "column" : "row"}
				flex={1}
				overflow="hidden"
				gap={wl.layout === "doubleLine" ? 0 : 2}
				align={wl.layout === "singleLine" ? "center" : "flex-start"}
			>
				<MarqueeText
					text={song.title}
					color={wl.titleTypo.color}
					fontSize={`${wl.titleTypo.size}px`}
					fontFamily={wl.titleTypo.font}
					fontWeight="600"
					speed={wr.marqueeSpeed}
				/>
				{song.singer && (
					<>
						{wl.layout === "singleLine" && (
							<Text color={wl.singerTypo.color} opacity={0.3}>
								-
							</Text>
						)}
						<MarqueeText
							text={song.singer}
							color={wl.singerTypo.color}
							fontSize={`${wl.singerTypo.size}px`}
							fontFamily={wl.singerTypo.font}
							speed={wr.marqueeSpeed}
						/>
					</>
				)}
			</Flex>
		</Flex>
	);

	return (
		<Flex
			direction="column"
			style={{ width: g.width ? `${g.width}px` : "100%", height: g.height ? `${g.height}px` : "100%" }}
			px={`${g.paddingX ?? g.padding ?? 16}px`}
			py={`${g.paddingY ?? g.padding ?? 16}px`}
			bg={g.bgColor}
			border={`${g.borderWidth || 0}px solid ${g.borderColor || "transparent"}`}
			borderRadius={`${g.borderRadius || 0}px`}
			boxShadow={getShadow(g.boxShadow)}
			fontFamily={g.font || "inherit"}
			position="relative"
			overflow="hidden"
		>
			<style>{`
            @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
            @keyframes scrollVertical { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
				@keyframes songChangeEffect {
               0% { opacity: 0; transform: translateX(-15px) scale(0.98); filter: blur(4px) brightness(1.5); }
               100% { opacity: 1; transform: translateX(0) scale(1); filter: blur(0) brightness(1); }
            }
         `}</style>

			{h.text && (
				<Text
					color={h.typo.color}
					fontSize={`${h.typo.size}px`}
					fontFamily={h.typo.font}
					textAlign={h.align}
					mb={`${h.marginB}px`}
				>
					{h.text}
				</Text>
			)}

			{playingSong && (
				<Flex
					key={`playing-card-${playingSong.id}`}
					px={`${np.paddingX ?? np.padding ?? 16}px`}
					py={`${np.paddingY ?? np.padding ?? 16}px`}
					mb={`${np.marginB}px`}
					bg={np.bgColor}
					borderRadius={`${np.borderRadius}px`}
					boxShadow={getShadow(np.boxShadow)}
					align={np.layout === "doubleLine" ? "flex-start" : "center"}
					gap={3}
					w="full"
					position="relative"
					animation="songChangeEffect 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards"
					overflow="hidden"
				>
					<Box position="absolute" left={0} top={0} bottom={0} w="4px" bg={np.highlightColor} />

					{np.showNumber && (
						<Text
							color={np.numTypo.color}
							fontSize={`${np.numTypo.size}px`}
							fontFamily={np.numTypo.font}
							fontWeight="bold"
							flexShrink={0}
							pl={2}
						>
							{playingSong.num}
						</Text>
					)}

					<Flex
						direction={np.layout === "doubleLine" ? "column" : "row"}
						flex={1}
						overflow="hidden"
						gap={np.layout === "doubleLine" ? 0 : 2}
						align={np.layout === "singleLine" ? "center" : "flex-start"}
						pl={np.showNumber ? 0 : 2}
					>
						<MarqueeText
							text={playingSong.title}
							color={np.titleTypo.color}
							fontSize={`${np.titleTypo.size}px`}
							fontFamily={np.titleTypo.font}
							fontWeight="800"
							speed={wr.marqueeSpeed}
						/>
						{playingSong.singer && (
							<>
								{np.layout === "singleLine" && (
									<Text color={np.singerTypo.color} opacity={0.5}>
										|
									</Text>
								)}
								<MarqueeText
									text={playingSong.singer}
									color={np.singerTypo.color}
									fontSize={`${np.singerTypo.size}px`}
									fontFamily={np.singerTypo.font}
									speed={wr.marqueeSpeed}
								/>
							</>
						)}
					</Flex>

					{np.playingText.text && (
						<Text
							ml="auto"
							flexShrink={0}
							pr={2}
							color={np.playingText.typo.color}
							fontSize={`${np.playingText.typo.size}px`}
							fontFamily={np.playingText.typo.font}
							fontWeight="bold"
						>
							{np.playingText.text}
						</Text>
					)}
				</Flex>
			)}

			<Box
				flex={1}
				overflow="hidden"
				position="relative"
				ref={listContainerRef}
				style={{ maskImage: getMask(wr.maskFadeTop, wr.maskFadeBottom) }}
				borderRadius={`${wr.borderRadius}px`}
				border={`${wr.borderWidth}px solid ${wr.borderColor}`}
			>
				<Box
					animation={
						isListOverflowing && wr.scrollSpeed > 0 ? `scrollVertical ${scrollDuration}s linear infinite` : "none"
					}
				>
					{/* 첫 번째 원본 세트 (높이 측정) */}
					<Box ref={originalSetRef}>{otherSongs.map((song, i) => renderSongItem(song, i, "orig"))}</Box>

					{/* 공간이 넘칠 때만 발동하는 복제 세트 */}
					{isListOverflowing && <Box>{otherSongs.map((song, i) => renderSongItem(song, i, "dup"))}</Box>}
				</Box>
			</Box>

			{f.text && (
				<Text
					color={f.typo.color}
					fontSize={`${f.typo.size}px`}
					fontFamily={f.typo.font}
					textAlign={f.align}
					mt={`${f.marginT}px`}
				>
					{f.text}
				</Text>
			)}
		</Flex>
	);
};

export const MarqueeText = ({ text, color, fontSize, fontFamily, fontWeight = "normal", speed = 10 }: any) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const textRef = useRef<HTMLDivElement>(null);
	const [isOverflowing, setIsOverflowing] = useState(false);

	// 진짜 글자 길이를 측정하여 스크롤 여부 결정
	useEffect(() => {
		const checkOverflow = () => {
			if (containerRef.current && textRef.current) {
				setIsOverflowing(textRef.current.clientWidth > containerRef.current.clientWidth);
			}
		};

		checkOverflow(); // 텍스트 변경 시 즉시 확인

		// 상자 크기가 변할 때(브라우저 리사이징 등)도 재측정
		const observer = new ResizeObserver(checkOverflow);
		if (containerRef.current) observer.observe(containerRef.current);
		return () => observer.disconnect();
	}, [text, fontSize, fontFamily]);

	// 설정값으로 부터 속도 변환
	const chakraSpeed = speed * 5;
	const shouldScroll = isOverflowing && speed > 0;

	return (
		<Box ref={containerRef} w="full" overflow="hidden" position="relative" display="flex" alignItems="center">
			{/* 길이 측정용 투명 텍스트 */}
			<Box
				ref={textRef}
				position="absolute"
				visibility="hidden"
				whiteSpace="nowrap"
				w="max-content"
				fontSize={fontSize}
				fontFamily={fontFamily}
				fontWeight={fontWeight}
			>
				{text}
			</Box>

			{shouldScroll ? (
				<Marquee.Root speed={chakraSpeed} w="full">
					<Marquee.Viewport>
						<Marquee.Content>
							<Text
								pr={10}
								color={color}
								fontSize={fontSize}
								fontFamily={fontFamily}
								fontWeight={fontWeight}
								whiteSpace="nowrap"
							>
								{text}
							</Text>
						</Marquee.Content>
					</Marquee.Viewport>
				</Marquee.Root>
			) : (
				<Text
					color={color}
					fontSize={fontSize}
					fontFamily={fontFamily}
					fontWeight={fontWeight}
					whiteSpace="nowrap"
					truncate
				>
					{text}
				</Text>
			)}
		</Box>
	);
};

export const CustomColorPicker = ({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
}) => {
	const [localVal, setLocalVal] = useState(value);
	const timer = useRef<number | null>(null);

	useEffect(() => {
		setLocalVal(value);
	}, [value]);

	const handleChange = (v: string) => {
		setLocalVal(v);
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => onChange(v), 300);
	};

	return (
		<Box w="full" maxW="200px">
			<Text fontSize="xs" fontWeight="bold" mb={1}>
				{label}
			</Text>
			<ColorPicker.Root
				value={safeParseColor(localVal)}
				onValueChange={(e) => handleChange(e.valueAsString)}
				format="rgba"
			>
				<ColorPicker.HiddenInput />
				<ColorPicker.Trigger asChild>
					<Flex gap={2} cursor="pointer" align="center" w="full">
						<Box
							w="28px"
							h="28px"
							borderRadius="sm"
							flexShrink={0}
							position="relative"
							border="1px solid"
							borderColor="gray.300"
							_dark={{ borderColor: "gray.600" }}
							bgImage="linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
							bgSize="8px 8px"
							bgPos="0 0, 0 4px, 4px -4px, -4px 0px"
						>
							<Box position="absolute" top={0} left={0} right={0} bottom={0} bg={localVal} borderRadius="sm" />
						</Box>
						<Input
							size="sm"
							readOnly
							value={localVal}
							bg="white"
							_dark={{ bg: "gray.700" }}
							px={2}
							cursor="pointer"
							flex={1}
						/>
					</Flex>
				</ColorPicker.Trigger>
				<Portal>
					<ColorPicker.Positioner zIndex={9999}>
						<ColorPicker.Content>
							<ColorPicker.Area />
							<HStack>
								<ColorPicker.EyeDropper size="xs" variant="outline" />
								<ColorPicker.Sliders />
							</HStack>
						</ColorPicker.Content>
					</ColorPicker.Positioner>
				</Portal>
			</ColorPicker.Root>
		</Box>
	);
};

export const NumberField = ({ label, value, onChange, min, max, step = 1, placeholder }: any) => {
	const [localVal, setLocalVal] = useState<string | number>(value);
	const timer = useRef<number | null>(null);

	useEffect(() => {
		if (localVal === "" && value === 0) return;
		if (Number(localVal) !== value) {
			setLocalVal(value);
		}
	}, [value]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		setLocalVal(val);

		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => {
			onChange(val === "" ? 0 : Number(val));
		}, 300);
	};

	return (
		<Box w="full">
			<Text fontSize="xs" fontWeight="bold" mb={1}>
				{label}
			</Text>
			<Input
				type="number"
				size="sm"
				bg="white"
				_dark={{ bg: "gray.700" }}
				value={localVal ?? ""}
				onChange={handleChange}
				min={min}
				max={max}
				step={step}
				placeholder={placeholder}
				w="full"
			/>
		</Box>
	);
};

export const TextField = ({ label, value, onChange, placeholder = "" }: any) => {
	const [localVal, setLocalVal] = useState(value);
	const timer = useRef<number | null>(null);

	useEffect(() => {
		setLocalVal(value);
	}, [value]);

	const handleChange = (e: any) => {
		const v = e.target.value;
		setLocalVal(v);
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => onChange(v), 300);
	};

	return (
		<Box w="full">
			<Text fontSize="xs" fontWeight="bold" mb={1}>
				{label}
			</Text>
			<Input
				type="text"
				size="sm"
				bg="white"
				_dark={{ bg: "gray.700" }}
				value={localVal}
				onChange={handleChange}
				placeholder={placeholder}
				w="full"
			/>
		</Box>
	);
};

export const FastTextarea = ({ serverText, onChange }: { serverText: string; onChange: (val: string) => void }) => {
	const [localText, setLocalText] = useState(serverText);
	const timerRef = useRef<number | null>(null);

	useEffect(() => {
		setLocalText(serverText);
	}, [serverText]);

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const val = e.target.value;
		setLocalText(val);
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => onChange(val), 400);
	};
	return (
		<Textarea
			flex={1}
			height="100%"
			value={localText}
			onChange={handleChange}
			placeholder={`곡명 - 가수\n곡명 - 가수\n곡명 - 가수`}
			resize="none"
			bg="white"
			_dark={{ bg: "gray.800" }}
		/>
	);
};

export const TypoEditor = ({
	label,
	typo,
	onChange,
}: {
	label: string;
	typo: Broadcast.Typo;
	onChange: (t: Broadcast.Typo) => void;
}) => (
	<Box p={3} borderWidth="1px" borderRadius="md" bg="gray.100" _dark={{ bg: "gray.700" }}>
		<Text fontSize="sm" fontWeight="800" color="blue.500" mb={2}>
			{label}
		</Text>
		<Flex gap={2} align="flex-end">
			<Box flex={1}>
				<Text fontSize="xs" fontWeight="bold" mb={1}>
					폰트
				</Text>
				<NativeSelect.Root size="sm">
					{/* 안전한 타입 단언을 통해 onChange 오류 해결 */}
					<NativeSelect.Field
						bg="white"
						_dark={{ bg: "gray.800" }}
						value={typo.font}
						onChange={(e) => onChange({ ...typo, font: e.target.value as Broadcast.FontChoice })}
					>
						{FONT_OPTIONS.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</NativeSelect.Field>
				</NativeSelect.Root>
			</Box>
			<Box w="70px">
				<NumberField label="크기" value={typo.size} onChange={(v: number) => onChange({ ...typo, size: v })} />
			</Box>
			<Box w="120px">
				<CustomColorPicker label="색상" value={typo.color} onChange={(v: string) => onChange({ ...typo, color: v })} />
			</Box>
		</Flex>
	</Box>
);
