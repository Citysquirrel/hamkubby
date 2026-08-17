import {
	Box,
	Button,
	ColorPicker,
	Flex,
	HStack,
	Input,
	Marquee,
	Portal,
	Spinner,
	Text,
	Textarea,
} from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getMask, getShadow, safeParseColor } from "./func";
import { toaster } from "@/components/ui/toaster";

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

		let timer: any;
		const observer = new ResizeObserver(() => {
			clearTimeout(timer);
			timer = setTimeout(() => {
				if (listContainerRef.current && originalSetRef.current) {
					const parentH = listContainerRef.current.clientHeight;
					const contentH = originalSetRef.current.scrollHeight;

					// 2px 높이 버퍼를 주어 리스트 추가/삭제 시 발생하는 무한루프 차단
					setIsListOverflowing((prev) => {
						const isOver = contentH > parentH + 2;
						return prev !== isOver ? isOver : prev;
					});
				}
			}, 100);
		});

		observer.observe(listContainerRef.current);
		observer.observe(originalSetRef.current);
		return () => {
			clearTimeout(timer);
			observer.disconnect();
		};
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
					alignSelf="center"
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

	const renderNowPlaying = () =>
		playingSong && (
			<Flex
				key={`playing-card-${playingSong.id}`}
				px={`${np.paddingX ?? np.padding ?? 16}px`}
				py={`${np.paddingY ?? np.padding ?? 16}px`}
				mb={!np.placeBelow ? `${np.marginB}px` : undefined}
				mt={np.placeBelow ? `${np.marginB}px` : undefined}
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
						alignSelf={"center"}
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

			{!np.placeBelow && renderNowPlaying()}

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

			{np.placeBelow && renderNowPlaying()}

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
				const parentW = containerRef.current.clientWidth;
				const textW = textRef.current.clientWidth;
				// [최적화] 2px의 여유 버퍼를 주어 Sub-pixel 계산 오차로 인한 무한 렌더링 방지
				setIsOverflowing((prev) => {
					const isOver = textW > parentW + 2;
					return prev !== isOver ? isOver : prev;
				});
			}
		};

		checkOverflow(); // 텍스트 변경 시 즉시 확인

		// 상자 크기가 변할 때(브라우저 리사이징 등)도 재측정
		let timer: any;
		const observer = new ResizeObserver(() => {
			clearTimeout(timer);
			timer = setTimeout(checkOverflow, 100);
		});
		if (containerRef.current) observer.observe(containerRef.current);
		return () => {
			clearTimeout(timer);
			observer.disconnect();
		};
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
	allowInherit = true,
}: {
	label: string;
	typo: Broadcast.Typo;
	onChange: (t: Broadcast.Typo) => void;
	allowInherit?: boolean;
}) => (
	<Box p={3} borderWidth="1px" borderRadius="md" bg="gray.100" _dark={{ bg: "gray.700" }}>
		<Text fontSize="sm" fontWeight="800" color="blue.500" mb={2}>
			{label}
		</Text>
		<Flex gap={2} align="flex-end">
			<Box flex={1} minW="160px">
				<Text fontSize="2xs" color="gray.500" mb={1}>
					폰트
				</Text>
				<FontAutocomplete
					value={typo.font}
					onChange={(fontName) => onChange({ ...typo, font: fontName })}
					allowInherit={allowInherit}
					size="sm"
				/>
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

export const DEFAULT_WEB_FONTS = [
	"Pretendard",
	"Gmarket Sans",
	"Noto Sans KR",
	"Arial",
	"Verdana",
	"Impact",
	"Comic Sans MS",
	"Trebuchet MS",
	"Courier New",
	"Georgia",
	"Times New Roman",
];

interface FontAutocompleteProps {
	value: string;
	onChange: (fontName: string) => void;
	allowInherit?: boolean;
	size?: "xs" | "sm" | "md";
}

export const FontAutocomplete: React.FC<FontAutocompleteProps> = ({
	value,
	onChange,
	allowInherit = true,
	size = "sm",
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [inputValue, setInputValue] = useState("");
	const [focusedIndex, setFocusedIndex] = useState<number>(-1);
	const [localFonts, setLocalFonts] = useState<string[]>(() => {
		const saved = localStorage.getItem("obs_cached_local_fonts");
		return saved ? JSON.parse(saved) : [];
	});
	const [isLoadingFonts, setIsLoadingFonts] = useState(false);

	const containerRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const inputValueRef = useRef(inputValue);

	useEffect(() => {
		inputValueRef.current = inputValue;
	}, [inputValue]);

	useEffect(() => {
		if (!isOpen) {
			setInputValue(value === "inherit" ? "상속 (글로벌)" : value || "");
		}
	}, [value, isOpen]);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
				const currentInput = inputValueRef.current.trim();
				if (currentInput !== "" && currentInput !== value && currentInput !== "상속 (글로벌)") {
					onChange(currentInput);
				}
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [value, onChange]);

	const handleLoadLocalFonts = async () => {
		if (!("queryLocalFonts" in window)) {
			toaster.create({ title: "미지원 브라우저", description: "Chrome, Edge 등에서만 지원됩니다.", type: "error" });
			return;
		}
		setIsLoadingFonts(true);
		try {
			const fonts = await (window as any).queryLocalFonts();
			const fontFamilies = Array.from(new Set(fonts.map((f: any) => f.family))).sort() as string[];
			setLocalFonts(fontFamilies);
			localStorage.setItem("obs_cached_local_fonts", JSON.stringify(fontFamilies));
			toaster.create({
				title: "폰트 로드 완료",
				description: `${fontFamilies.length}개의 폰트 발견!`,
				type: "success",
			});
		} catch (err) {
			toaster.create({ title: "권한 거부됨", description: "글꼴 접근 권한을 허용해주세요.", type: "error" });
		} finally {
			setIsLoadingFonts(false);
		}
	};

	const allFonts = useMemo(() => Array.from(new Set([...DEFAULT_WEB_FONTS, ...localFonts])), [localFonts]);
	const selectableItems = useMemo(
		() => (allowInherit ? ["상속 (글로벌)", ...allFonts] : allFonts),
		[allowInherit, allFonts],
	);

	useEffect(() => {
		if (isOpen) {
			if (inputValue.trim() !== "") {
				const lowerQuery = inputValue.toLowerCase().trim();
				const matchIdx = selectableItems.findIndex(
					(f) => f !== "상속 (글로벌)" && f.toLowerCase().includes(lowerQuery),
				);
				setFocusedIndex(matchIdx);
			} else {
				const currentFontLabel = value === "inherit" ? "상속 (글로벌)" : value;
				const idx = selectableItems.indexOf(currentFontLabel);
				setFocusedIndex(idx !== -1 ? idx : 0);
			}
		}
	}, [inputValue, isOpen, selectableItems, value]);

	useEffect(() => {
		if (isOpen && focusedIndex >= 0 && listRef.current) {
			const el = document.getElementById(`font-item-${focusedIndex}`);
			if (el) {
				el.scrollIntoView({ block: "nearest" });
			}
		}
	}, [focusedIndex, isOpen]);

	const handleSelectFont = (fontName: string) => {
		const finalVal = fontName === "상속 (글로벌)" ? "inherit" : fontName;
		onChange(finalVal);
		setInputValue(fontName);
		setIsOpen(false);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
		if (!isOpen) setIsOpen(true);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			if (!isOpen) {
				setIsOpen(true);
				return;
			}
			setFocusedIndex((prev) => Math.min(prev + 1, selectableItems.length - 1));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			if (!isOpen) return;
			setFocusedIndex((prev) => Math.max(prev - 1, 0));
		} else if (e.key === "Enter") {
			e.preventDefault();
			if (isOpen && focusedIndex >= 0 && focusedIndex < selectableItems.length) {
				handleSelectFont(selectableItems[focusedIndex]);
			} else {
				const currentInput = inputValue.trim();
				if (currentInput !== "") {
					handleSelectFont(currentInput);
				}
			}
		} else if (e.key === "Escape") {
			setIsOpen(false);
		}
	};

	return (
		<Box w="240px">
			<Box position="relative" ref={containerRef}>
				<Flex align="center" position="relative">
					<Input
						size={size}
						value={inputValue}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						onFocus={() => setIsOpen(true)}
						placeholder="글꼴 검색 또는 직접 입력..."
						bg="white"
						_dark={{ bg: "gray.700" }}
						pr="28px"
						style={{ fontFamily: value !== "inherit" ? value : "inherit" }}
					/>
					<Button
						size="xs"
						variant="ghost"
						position="absolute"
						right={1}
						onClick={() => setIsOpen(!isOpen)}
						p={1}
						h="auto"
						minW="20px"
						color="gray.400"
					>
						{isOpen ? "▴" : "▾"}
					</Button>
				</Flex>

				{/* 드롭다운 박스 */}
				{isOpen && (
					<Box
						ref={listRef}
						position="absolute"
						top="calc(100% + 4px)"
						left={0}
						w="full"
						maxH="200px"
						overflowY="auto"
						bg="white"
						_dark={{ bg: "gray.800", borderColor: "gray.700" }}
						borderWidth="1px"
						borderRadius="md"
						boxShadow="xl"
						zIndex={1000}
						p={1}
					>
						{selectableItems.map((fontLabel, idx) => {
							const isInherit = fontLabel === "상속 (글로벌)";
							const fontValue = isInherit ? "inherit" : fontLabel;
							const isSelected = value === fontValue;
							const isFocused = focusedIndex === idx;
							const isMatch =
								!isInherit &&
								inputValue.trim() !== "" &&
								fontLabel.toLowerCase().includes(inputValue.toLowerCase().trim());

							let bg = "transparent";
							let darkBg = "transparent";

							if (isSelected) {
								bg = "blue.500";
								darkBg = "blue.600";
							} else if (isFocused) {
								bg = "gray.200";
								darkBg = "gray.600";
							} else if (isMatch) {
								bg = "blue.50";
								darkBg = "blue.900";
							}

							return (
								<Flex
									key={fontValue}
									id={`font-item-${idx}`}
									justify="space-between"
									align="center"
									p={2}
									borderRadius="sm"
									cursor="pointer"
									bg={bg}
									_dark={{ bg: darkBg }}
									color={isSelected ? "white" : "inherit"}
									_hover={{
										bg: isSelected ? "blue.600" : "gray.300",
										_dark: { bg: isSelected ? "blue.600" : "gray.500" },
									}}
									onClick={() => handleSelectFont(fontLabel)}
								>
									<Text
										fontSize={isInherit ? "xs" : "sm"}
										fontWeight={isInherit ? "bold" : "normal"}
										style={{ fontFamily: isInherit ? "inherit" : fontLabel }}
										truncate
									>
										{fontLabel}
									</Text>
									{!isInherit && localFonts.includes(fontLabel) && (
										<Text fontSize="2xs" opacity={0.5} ml={2} flexShrink={0}>
											로컬
										</Text>
									)}
								</Flex>
							);
						})}

						{/* 목록에 없는 폰트를 입력했을 때 제공하는 엔터 유도 박스 */}
						{focusedIndex === -1 && inputValue.trim() !== "" && (
							<Box
								p={2}
								borderRadius="sm"
								cursor="pointer"
								mt={1}
								bg="blue.50"
								_dark={{ bg: "blue.900" }}
								_hover={{ bg: "blue.100", _dark: { bg: "blue.800" } }}
								onClick={() => handleSelectFont(inputValue.trim())}
							>
								<Text fontSize="xs" color="blue.500" _dark={{ color: "blue.300" }} fontWeight="bold">
									"{inputValue.trim()}" 폰트 직접 사용 (Enter)
								</Text>
							</Box>
						)}
					</Box>
				)}
			</Box>

			<Flex justify="space-between" align="center" mt={1} px={1}>
				<Text fontSize="2xs" color="gray.500">
					{localFonts.length > 0 ? `PC 폰트 ${localFonts.length}개 로드됨` : "기본 폰트 사용 중"}
				</Text>
				<Button
					size="xs"
					variant="ghost"
					colorPalette="blue"
					h="16px"
					px={1}
					onClick={handleLoadLocalFonts}
					disabled={isLoadingFonts}
				>
					{isLoadingFonts ? <Spinner size="xs" /> : "🖥️ 내 PC 폰트 불러오기"}
				</Button>
			</Flex>
		</Box>
	);
};
