import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Avatar,
	Badge,
	Box,
	Button,
	ButtonGroup,
	Collapsible,
	Flex,
	Grid,
	Heading,
	HStack,
	Icon,
	IconButton,
	Image,
	Input,
	InputGroup,
	Link,
	Separator,
	Stack,
	Text,
	useMediaQuery,
	VStack,
} from "@chakra-ui/react";
import type { HamkubbySongHistoryModel, Song, SortType } from "../config/types";
import { MdClose, MdOutlineDownloading } from "react-icons/md";
import {
	LuCheck,
	LuCopy,
	LuExternalLink,
	LuYoutube,
	LuMusic,
	LuArrowRightFromLine,
	LuPlus,
	LuMinus,
	LuBold,
	LuStar,
	LuChevronUp,
	LuChevronDown,
} from "react-icons/lu";
import { normalizeKeyword } from "../lib/search";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { DrawerBackdrop, DrawerBody, DrawerCloseTrigger, DrawerContent, DrawerRoot } from "../components/ui/drawer";
import { toaster } from "../components/ui/toaster";
import { formatDateToYYYYMMDD } from "../lib/date";

const GENRE = {
	전체: "all",
	"K-POP": "K-POP",
	"J-POP": "J-POP",
	POP: "POP",
};

const COLOR_SCHEME: { [key: string]: string } = {
	"K-POP": "green",
	"J-POP": "blue",
	POP: "yellow",
	일반곡: "gray",
	잘몰라: "purple",
	우엑곡: "red",
	피토곡: "orange",
};

const MAIN_COLOR = "#7bb18f";
const HEADER_HEIGHT = 104;

export default function SongBook({
	data,
	isLoading,
	isHomeOpen,
}: {
	data: Song[];
	isLoading: boolean;
	isHomeOpen: boolean;
}) {
	const LOCAL_STORAGE_KEY = "lyric-font-size-index";
	const LOCAL_STORAGE_BOLD_KEY = "lyric-font-bold";
	const LYRIC_SIZES = ["xs", "sm", "md", "xl", "2xl"];

	const searchRef = useRef<HTMLInputElement>(null);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState(search);
	const [genre, setGenre] = useState("all");
	const [sort, setSort] = useState<SortType>("title-asc");
	const [focused, setFocused] = useState(false);

	const [selectedSong, setSelectedSong] = useState<Song | null>(null);
	const [isOpenMobileView, setIsOpenMobileView] = useState(false);
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [lyricIndex, setLyricIndex] = useState<number>(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
			if (saved !== null) {
				const parsed = Number(saved);
				if (parsed >= 0 && parsed < LYRIC_SIZES.length) return parsed;
			}
		}
		return 2;
	});
	const [isLyricBold, setIsLyricBold] = useState<boolean>(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem(LOCAL_STORAGE_BOLD_KEY);
			return saved === "true";
		}
		return false;
	});

	// 디테일 뷰의 너비 조정 상태
	const [detailWidth, setDetailWidth] = useState(() => {
		const savedWidth = localStorage.getItem("detail-view-width");
		return savedWidth ? parseInt(savedWidth, 10) : 450;
	});
	const [isDragging, setIsDragging] = useState(false);

	const handleLyricSize = (isIncrease: boolean) => {
		const delta = isIncrease ? 1 : -1;
		const maxIndex = LYRIC_SIZES.length - 1; // 4

		const nextIndex = Math.max(0, Math.min(maxIndex, lyricIndex + delta));

		if (nextIndex !== lyricIndex) {
			setLyricIndex(nextIndex);
			localStorage.setItem(LOCAL_STORAGE_KEY, String(nextIndex));
		}
	};

	const handleLyricBold = () => {
		const nextBold = !isLyricBold;

		setIsLyricBold(nextBold);
		localStorage.setItem(LOCAL_STORAGE_BOLD_KEY, String(nextBold));
	};

	// 1080px 기준으로 데스크탑(스플릿 뷰)과 모바일(바텀 시트) 분기
	const [isDesktop] = useMediaQuery(["(min-width: 1080px)"], { fallback: [false] });

	// 복사 기능
	const handleCopy = (e: React.MouseEvent, song: Song) => {
		e.stopPropagation(); // 상세뷰 열림 방지 (포커스 유지)
		const textToCopy = `${song.title} - ${song.artist}`;
		navigator.clipboard.writeText(textToCopy).then(() => {
			toaster.create({ description: `${textToCopy} 복사 완료!`, type: "success" });
		});

		setCopiedId(song.id || song.title);
		setTimeout(() => setCopiedId(null), 1500);
	};

	const handleSelectSong = (song: Song) => {
		setSelectedSong(song);
		if (!isDesktop) {
			setIsOpenMobileView(true);
		}
	};

	const toggleSort = (field: "title" | "artist") => {
		setSort((prev) => {
			// 현재 같은 필드면 asc/desc 토글
			if (prev.startsWith(field)) {
				return prev.endsWith("asc") ? `${field}-desc` : `${field}-asc`;
			}

			// 다른 필드 누르면 asc 시작
			return `${field}-asc`;
		});
	};

	//------------------------------------//
	// 드래그 핸들러								//
	//------------------------------------//
	const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		e.preventDefault(); // 기본 텍스트 선택 방지
		setIsDragging(true);
	};

	// 마우스 이동 중 너비 계산
	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isDragging) return;

			// 우측 패널이므로 '전체 화면 너비 - 현재 마우스 X좌표'가 패널의 너비가 됨
			const newWidth = document.body.clientWidth - e.clientX;

			if (newWidth > 450 && newWidth < 600) {
				setDetailWidth(newWidth);
			}
		},
		[isDragging],
	);

	// 드래그 종료
	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
		localStorage.setItem("detail-view-width", detailWidth.toString());
	}, [detailWidth]);

	// 드래그 중일 때만 window에 이벤트 리스너 부착
	useEffect(() => {
		if (isDragging) {
			window.addEventListener("mousemove", handleMouseMove);
			window.addEventListener("mouseup", handleMouseUp);
		} else {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		}

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging, handleMouseMove, handleMouseUp]);

	const openLyricsSearch = useCallback((song: any) => {
		const query = `${song.artist} ${song.title} 가사`;
		window.open(
			`https://www.google.com/search?q=${encodeURIComponent(query)}&udm=14`,
			"lyrics",
			"noopener,width=540,height=600",
		);
	}, []);

	// --- 가상 스크롤 (Window 기준) 설정 ---
	const listRef = useRef<HTMLDivElement>(null);
	const [listOffset, setListOffset] = useState(0);

	// 컨테이너가 렌더링된 후 화면 상단으로부터의 offset 값을 계산
	useEffect(() => {
		if (listRef.current) {
			setListOffset(listRef.current.offsetTop);
		}
	}, [listRef.current]);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearch(search);
		}, 225);

		return () => clearTimeout(handler);
	}, [search]);

	const filteredSongs = useMemo(() => {
		const keyword = normalizeKeyword(debouncedSearch);

		const filtered = data.filter((song) => {
			const searchTitle = song.searchTitle || song.title;
			const searchArtist = song.searchArtist || song.artist;

			const matchSearch = searchTitle.includes(keyword) || searchArtist.includes(keyword);

			return matchSearch && (genre === "all" || song.genre === genre);
		});

		if (selectedSong) {
			const a = filtered.find((s) => s.syncId === selectedSong.syncId);
			if (a) setSelectedSong(a);
		}

		return [...filtered].sort((a, b) => {
			switch (sort) {
				case "title-asc":
					return a.title.localeCompare(b.title, "ko");

				case "title-desc":
					return b.title.localeCompare(a.title, "ko");

				case "artist-asc":
					return a.artist.localeCompare(b.artist, "ko");

				case "artist-desc":
					return b.artist.localeCompare(a.artist, "ko");

				default:
					return 0;
			}
		});
	}, [debouncedSearch, genre, sort, data]);

	const highlight = (text: string, keyword: string) => {
		if (!keyword) return text;

		const normalizedKeyword = keyword.replace(/\s+/g, "").toLowerCase();

		// 공백 제거 + 원본 index 매핑
		let normalizedText = "";
		const indexMap: number[] = [];

		for (let i = 0; i < text.length; i++) {
			const char = text[i];

			if (char !== " ") {
				normalizedText += char.toLowerCase();
				indexMap.push(i);
			}
		}

		const matchIndex = normalizedText.indexOf(normalizedKeyword);

		if (matchIndex === -1) {
			return text;
		}

		// 정규화 index → 원본 index 변환
		const start = indexMap[matchIndex];
		const end = indexMap[matchIndex + normalizedKeyword.length - 1] + 1;

		return (
			<>
				{text.slice(0, start)}
				<mark>{text.slice(start, end)}</mark>
				{text.slice(end)}
			</>
		);
	};

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const active = document.activeElement as HTMLElement | null;
			// 이미 입력 중이면 무시
			if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) {
				return;
			}

			// 스페이스바 무시
			if (e.key === " ") return;

			// 조합키 무시 (Ctrl, Cmd, Alt)
			if (e.ctrlKey || e.metaKey || e.altKey) return;

			// Esc 예외
			if (e.key === "Escape") {
				searchRef.current?.focus();
				setSearch("");
			}

			// 특수키 무시
			if (e.key.length !== 1) return;

			// 첫입력 방지
			e.preventDefault();

			searchRef.current?.focus();
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);
	//? 가중치 검색용. 버그 수정 후 배포
	// const filteredSongs = useMemo(() => {
	// 	return songData
	// 		.map((song) => ({
	// 			...song,
	// 			score: getScore(song, search),
	// 		}))
	// 		.filter((song) => song.score > 0)
	// 		.sort((a, b) => b.score - a.score);
	// }, [search, genre, songData]);
	const linkGroup = [
		{
			id: 1,
			name: "치지직 대문",
			image: "/images/chzzk.svg",
			href: "https://chzzk.naver.com/9351fb8417f73405c84e0846409e3263",
		},
		{
			id: 2,
			name: "네이버 카페",
			image: "/images/naver_cafe.svg",
			href: "https://cafe.naver.com/f-e/cafes/30907241/menus/104?viewType=L",
		},
		{ id: 3, name: "유튜브 본점", image: "/images/youtube.svg", href: "https://www.youtube.com/@hamkubby" },
		{ id: 4, name: "트위터 메인", image: "/images/x.svg", href: "https://x.com/hamkubby" },
	];
	const rowVirtualizer = useWindowVirtualizer({
		count: filteredSongs.length,
		estimateSize: () => 72, // 행 높이
		overscan: 5,
		scrollMargin: listOffset, // 상단 헤더 등의 높이를 고려한 마진
	});

	const detailViewContent = useMemo(() => {
		if (!selectedSong) return null;
		const song = selectedSong;
		return (
			<Flex direction="column" p={6} bg="bg">
				{/* 헤더 & 복사 버튼 */}
				<HStack justify="space-between" align="start" mb={4}>
					<VStack align="start" gap={1}>
						<HStack>
							<Heading size="lg" wordBreak="keep-all">
								{song.title}
							</Heading>
						</HStack>
						<Text fontSize="lg" color="gray.600">
							{song.artist}
						</Text>
					</VStack>
					<Button
						size="lg"
						bg={MAIN_COLOR}
						color="white"
						_hover={{ bg: "#659677" }}
						onClick={(e) => handleCopy(e, song)}
						mr={isDesktop ? undefined : 12}
					>
						{copiedId === (song.id || song.title) ? (
							<Icon as={LuCheck} boxSize={5} />
						) : (
							<Icon as={LuCopy} boxSize={5} />
						)}
						<Text ml={2} display={{ base: "none", sm: "block" }}>
							복사
						</Text>
					</Button>
				</HStack>

				{/* 태그 */}
				<HStack gap={2} mb={4} flexWrap="wrap">
					<Badge variant="outline" colorPalette={COLOR_SCHEME[song.genre]}>
						{song.genre}
					</Badge>

					{song.isOfficial ? (
						<Badge bg={MAIN_COLOR} color="white">
							공식
						</Badge>
					) : (
						<Badge colorPalette={"red"}>비공식</Badge>
					)}
					{song.isOfficial ? (
						<Badge variant="outline" colorPalette={COLOR_SCHEME[song.cheese]}>
							{song.cheese}
						</Badge>
					) : null}
				</HStack>

				{/* 메모 */}
				{song.notes && (
					<Box bg="cardBg" p={3} borderRadius="md" mb={5} maxH="80px" overflowY="auto" fontSize="sm">
						<strong>📝 Note:</strong> {song.notes}
					</Box>
				)}

				<SongHistorySection song={song} />

				{/* 가사 */}
				<Box position="relative" mt={2} mb={2} p={2} bg="cardBg" borderRadius="lg">
					{song.lyric ? (
						<Stack p={2}>
							<Stack position="absolute" top={2} right={2}>
								<IconButton
									size="2xs"
									variant={"outline"}
									colorPalette={"blue"}
									onClick={() => handleLyricSize(true)}
									disabled={lyricIndex === 4}
								>
									<LuPlus />
								</IconButton>
								<IconButton
									size="2xs"
									variant={"outline"}
									colorPalette={"blue"}
									onClick={() => handleLyricSize(false)}
									disabled={lyricIndex === 0}
								>
									<LuMinus />
								</IconButton>
								<IconButton
									size="2xs"
									variant={"outline"}
									colorPalette={"blue"}
									onClick={() => handleLyricBold()}
									bg={isLyricBold ? "blue.400" : undefined}
								>
									<LuBold />
								</IconButton>
							</Stack>
							<Text
								className="font-lyric"
								fontWeight={isLyricBold ? "bold" : undefined}
								whiteSpace="pre-wrap"
								lineHeight="1.8"
								fontSize={LYRIC_SIZES[lyricIndex]}
							>
								{song.lyric}
							</Text>
						</Stack>
					) : (
						<Flex direction="column" align="center" justify="center" h="200px" bg="cardBg" borderRadius="lg" gap={4}>
							<Text color="gray.500">등록된 가사가 없습니다.</Text>
							<Button
								variant="outline"
								borderColor={MAIN_COLOR}
								color={MAIN_COLOR}
								onClick={() => openLyricsSearch(song)}
							>
								<Icon as={LuExternalLink} mr={2} />
								구글에서 가사 검색하기
							</Button>
						</Flex>
					)}
				</Box>
			</Flex>
		);
	}, [isLyricBold, lyricIndex, selectedSong, copiedId]);

	return (
		<Stack id="songbook" padding="0" margin="0" alignItems={"center"} position="static">
			{isHomeOpen ? (
				<Stack alignItems={"center"}>
					<Box className="circle-wrap" marginTop="4" position="relative">
						<Image
							src="https://nng-phinf.pstatic.net/MjAyNTEyMjJfMjE3/MDAxNzY2Mzg2OTg3ODk1.1acZIMhW2shvmGDkv6taba35Ojr75XDqxpCKaUIzSFwg.s4E5tYOZv7eJSZwFELZ_ybV8rztf-z5Nd3Tqd5ucPfgg.PNG/image.png?type=f120_120_na"
							boxSize="120px"
							borderRadius="full"
							fit="cover"
							border="2px solid"
							borderColor="seagreen"
						/>
					</Box>
					<Text fontSize="2xl" fontWeight={"bold"}>
						<Box as="span" color="kbc">
							🐹햄쿠비
						</Box>
						&nbsp;노래책🎤
					</Text>
					<ButtonGroup>
						{linkGroup.map((avatar) => (
							<Link href={avatar.href} title={avatar.name} target="_blank">
								<Avatar.Root
									size={"xs"}
									border="2px solid"
									borderColor={{ _hover: "kbc", base: { _dark: "gray.400", _light: "gray.600" } }}
									shadow={{ _hover: "md" }}
									shadowColor={"purple"}
									transform="scale(1,0.95)"
								>
									<Avatar.Image src={avatar.image} />
								</Avatar.Root>
							</Link>
						))}
					</ButtonGroup>
				</Stack>
			) : null}

			<Stack id="list-container" width="100%" gap={0}>
				<HStack
					position="sticky"
					top="0"
					left="0"
					zIndex={3}
					width="100%"
					bg={"bg"}
					justifyContent={"center"}
					align={"center"}
				>
					<Stack width={"100%"} gap=".5" borderBottom={"1px solid"} borderColor="gray.border">
						<Stack width="100%" alignItems={"center"} marginBottom="1" padding="4px">
							<InputGroup
								width="400px"
								endElement={
									search.length > 0 ? (
										<Button
											variant={"outline"}
											size="2xs"
											rounded={"full"}
											onClick={() => {
												setSearch("");
											}}
										>
											<MdClose />
											ESC
										</Button>
									) : !focused ? (
										<label className="cursor_text" htmlFor="search">
											<Text fontSize="xs" userSelect={"none"}>
												아무 키나 누르면 검색창 선택
											</Text>
										</label>
									) : null
								}
							>
								<Input
									ref={searchRef}
									id={"search"}
									variant={"flushed"}
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Escape") {
											setSearch("");
										}
									}}
									onFocus={() => setFocused(true)}
									onBlur={() => setFocused(false)}
									placeholder="노래 / 가수 검색"
								/>
							</InputGroup>
						</Stack>
						<Box
							style={{
								paddingBottom: "8px",
								display: "flex",
								width: "100%",
								gap: "8px",
								padding: "4px 4px 8px 4px",
								justifyContent: "center",
								alignItems: "center",
							}}
							position="relative"
							bg={"bg"}
						>
							<ButtonGroup variant={"outline"} height="40px">
								{Object.entries(GENRE).map(([name, value]) => {
									return (
										<Button
											key={`${name}-${value}`}
											borderRadius={"xl"}
											bg={genre === value ? "kbg" : ""}
											onClick={() => {
												setGenre(value);
											}}
											size={"sm"}
											shadow={{ _hover: "md", base: "sm" }}
											transition="all .2s ease-in-out"
											_hover={{ transform: "translateY(-3px)" }}
										>
											{name}
										</Button>
									);
								})}
							</ButtonGroup>
							<Separator orientation={"vertical"} height="4" />
							<ButtonGroup variant={"outline"} height="40px">
								<Button
									borderRadius={"xl"}
									bg={sort === "title-asc" || sort === "title-desc" ? "kbg" : ""}
									onClick={() => toggleSort("title")}
									size={"sm"}
									shadow={{ _hover: "md", base: "sm" }}
									transition="all .2s ease-in-out"
									_hover={{ transform: "translateY(-3px)" }}
								>
									제목
									{sort === "title-asc" && " ↑"}
									{sort === "title-desc" && " ↓"}
								</Button>
								<Button
									borderRadius={"xl"}
									bg={sort === "artist-asc" || sort === "artist-desc" ? "kbg" : ""}
									onClick={() => toggleSort("artist")}
									size={"sm"}
									shadow={{ _hover: "md", base: "sm" }}
									transition="all .2s ease-in-out"
									_hover={{ transform: "translateY(-3px)" }}
								>
									가수
									{sort === "artist-asc" && " ↑"}
									{sort === "artist-desc" && " ↓"}
								</Button>
							</ButtonGroup>
						</Box>
					</Stack>
				</HStack>

				<Grid
					// 선택된 곡이 없으면 100%(1fr), 선택되면 리스트 + 디테일(450px)
					templateColumns={isDesktop && selectedSong ? `minmax(0, 1fr) 5px ${detailWidth}px` : "1fr"}
					alignItems="start"
					userSelect={isDragging ? "none" : "auto"}
				>
					{/* 리스트 영역 (Window Scroll) */}
					<Box
						ref={listRef}
						w="100%"
						pb={10}
						// 리스트 좌우 예쁜 패딩 추가
						px={isDesktop ? 12 : 8}
						pt={6}
					>
						{isLoading ? (
							<Flex h="300px" align="center" justify="center" direction="column" color="gray.400" userSelect={"none"}>
								<Icon as={MdOutlineDownloading} boxSize={16} mb={4} opacity={0.5} />
								<Text>불러오는 중...</Text>
							</Flex>
						) : filteredSongs.length === 0 ? (
							<Flex h="300px" align="center" justify="center" direction="column" color="gray.400" userSelect={"none"}>
								<Icon as={LuMusic} boxSize={16} mb={4} opacity={0.5} />
								<Text>검색된 곡이 없습니다.</Text>
							</Flex>
						) : (
							<Box height={`${rowVirtualizer.getTotalSize()}px`} width="100%" position="relative">
								{rowVirtualizer.getVirtualItems().map((virtualRow) => {
									const song = filteredSongs[virtualRow.index];
									const isSelected = selectedSong?.id === song.id;
									// const isChosung = isChoseongLike(search);
									// const title = isChosung ? highlightChosung(song.title, search) : highlightText(song.title, search);

									// const artist = isChosung ? highlightChosung(song.artist, search) : highlightText(song.artist, search);
									return (
										<Box
											key={virtualRow.index}
											position="absolute"
											top={0}
											left={0}
											width="100%"
											height={`${virtualRow.size}px`}
											transform={`translateY(${virtualRow.start - listOffset}px)`}
											paddingBottom="8px" // gap 역할
										>
											<Flex
												height="100%"
												align="center"
												justify="space-between"
												p={4}
												border="1px solid"
												borderColor={{
													_light: isSelected ? "blue.border" : "gray.300",
													_dark: isSelected ? "blue.border" : "gray.700",
												}}
												bg={isSelected && isDesktop ? `${MAIN_COLOR}30` : undefined}
												borderRadius="lg"
												_hover={{ boxShadow: { _light: "sm" }, borderColor: isSelected ? "blue.border" : "green.500" }}
												transition="all 0.2s"
												cursor="pointer"
												onClick={() => handleSelectSong(song)}
												shadow={{ _light: "md" }}
											>
												<Box flex="1" minW="0" pr={4}>
													<HStack mb={1}>
														<Text fontWeight="bold" truncate>
															{highlight(song.title, search)}
														</Text>
														<Text fontSize="sm" color="gray.500" truncate>
															- {highlight(song.artist, search)}
														</Text>
													</HStack>
													<HStack fontSize="xs" color="gray.500">
														<Badge variant="surface" colorPalette={COLOR_SCHEME[song.genre]}>
															{song.genre}
														</Badge>
														{song.isOfficial ? (
															<Badge variant="surface" colorPalette={"teal"}>
																공식
															</Badge>
														) : (
															<Badge variant="surface" colorPalette={"red"}>
																비공식
															</Badge>
														)}
														{song.isOfficial ? (
															<Badge variant="surface" colorPalette={COLOR_SCHEME[song.cheese]}>
																{song.cheese}
															</Badge>
														) : null}
														{!!song.lyric && (
															<Badge variant="surface" colorPalette={"cyan"}>
																가사
															</Badge>
														)}
														{song.notes && (
															<Text truncate maxW="150px">
																📝 {song.notes}
															</Text>
														)}
													</HStack>
												</Box>

												<Button
													size="md"
													minW="80px"
													bg={copiedId === (song.id || song.title) ? "teal.500" : "gray.100"}
													color={copiedId === (song.id || song.title) ? "white" : "gray.700"}
													_hover={{ bg: copiedId === (song.id || song.title) ? "teal.600" : "gray.200" }}
													onClick={(e) => handleCopy(e, song)}
												>
													{copiedId === (song.id || song.title) ? <Icon as={LuCheck} /> : <Icon as={LuCopy} />}
													<Text ml={2} fontSize="sm">
														복사
													</Text>
												</Button>
											</Flex>
										</Box>
									);
								})}
							</Box>
						)}
					</Box>

					{/* 리사이저 영역 */}
					<Box
						height="100%"
						onMouseDown={handleMouseDown}
						cursor="col-resize"
						backgroundColor={isDragging ? "blue.500" : { _light: "gray.300", _dark: "gray.600" }}
						transition="background-color 0.2s"
						zIndex={10}
					/>

					{/* 우측 디테일 뷰 (PC 스플릿 뷰) */}
					{isDesktop && selectedSong && (
						<Box
							position="sticky"
							// 우측 패널이 상단 헤더에 잡아먹히지 않도록 헤더 높이만큼 띄움
							top={`${HEADER_HEIGHT}px`}
							height={`calc(100vh - ${HEADER_HEIGHT}px)`}
							borderLeft="1px solid"
							borderColor="gray.border"
							boxShadow="-4px 0 12px rgba(0,0,0,0.03)"
							overflow="auto"
							pb={8}
						>
							<IconButton
								position="absolute"
								onClick={() => {
									setSelectedSong(null);
								}}
								variant="ghost"
								size="sm"
								_hover={{ bg: "transparent" }}
							>
								<LuArrowRightFromLine />
							</IconButton>
							{detailViewContent}
						</Box>
					)}
				</Grid>

				{/* 모바일 바텀 시트 */}
				{!isDesktop && (
					<DrawerRoot placement="bottom" open={isOpenMobileView} onOpenChange={(e) => setIsOpenMobileView(e.open)}>
						<DrawerBackdrop />
						<DrawerContent maxH="85vh" borderTopRadius="2xl">
							<Box w="40px" h="4px" bg="gray.300" borderRadius="full" mx="auto" mt={3} mb={1} />
							<DrawerCloseTrigger position="absolute" top={8} right={4} />
							<DrawerBody p={0}>{selectedSong && detailViewContent}</DrawerBody>
						</DrawerContent>
					</DrawerRoot>
				)}
			</Stack>
		</Stack>
	);
}

const SongHistorySection = ({ song }: { song: Song }) => {
	const [open, setOpen] = useState(false);

	const sortedHistories = useMemo(() => {
		if (!song.song_histories) return [];

		return [...song.song_histories].sort((a, b) => {
			// priority가 7인 경우 무조건 최상단으로 끌어올림 (둘 중 하나만 7일 경우)
			if (a.priority === 7 && b.priority !== 7) return -1;
			if (b.priority === 7 && a.priority !== 7) return 1;

			// 둘 다 7이거나, 둘 다 7이 아닐 경우 -> priority가 높은 순(내림차순) 정렬
			if (a.priority !== b.priority) {
				return b.priority - a.priority;
			}

			// priority마저 같다면 -> 날짜가 가까울수록(최신일수록) 위로 정렬
			const timeA = new Date(a.sungAt).getTime();
			const timeB = new Date(b.sungAt).getTime();

			return timeB - timeA;
		});
	}, [song.song_histories]);

	if (sortedHistories.length === 0) return null;

	const renderItem = (hist: HamkubbySongHistoryModel) => (
		<HStack
			key={hist.id}
			p="2"
			bg="cardBg"
			borderRadius="md"
			cursor={hist.youtubeVideoId ? "pointer" : "auto"}
			_hover={hist.youtubeVideoId ? { bg: { _light: "blue.100", _dark: "blue.800" } } : undefined}
			onClick={(e) => {
				e.stopPropagation();
				if (hist.youtubeVideoId) window.open(`https://youtu.be/${hist.youtubeVideoId}?t=${hist.start}`, "_blank");
				else toaster.create({ description: `등록된 유튜브 링크가 없습니다`, type: "info" });
			}}
		>
			<Icon as={LuYoutube} color="red.500" />
			<Text fontSize="sm" flex="1">
				{formatDateToYYYYMMDD(hist.sungAt)}
			</Text>
			<HStack gap="1">
				{hist.priority === 7 && <Icon as={LuStar} color="orange.400" fill="orange.400" />}
				{hist.memo && (
					<Text fontSize="xs" color={{ _light: "gray.700", _dark: "gray.300" }} lineClamp={1} maxW="220px">
						{hist.memo}
					</Text>
				)}
			</HStack>
		</HStack>
	);

	return (
		<Collapsible.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
			<Box borderTopWidth="1px" borderColor="gray.border" pt="2">
				{/* 헤더 영역: 클릭 시 확장됨 */}
				<Collapsible.Trigger asChild>
					<Flex
						justify="space-between"
						align="center"
						mb="2"
						cursor={sortedHistories.length > 1 ? "pointer" : "default"}
						userSelect="none"
					>
						<Text fontWeight="bold" fontSize="sm" color="gray.500">
							📺 방송 히스토리 {sortedHistories.length > 1 && `(${sortedHistories.length})`}
						</Text>

						{sortedHistories.length > 1 && (
							<HStack gap="1" color="gray.500" _hover={{ color: { _light: "blue.500", _dark: "blue.500" } }}>
								<Text fontSize="xs">{open ? "접기" : "더보기"}</Text>
								<Icon as={open ? LuChevronUp : LuChevronDown} />
							</HStack>
						)}
					</Flex>
				</Collapsible.Trigger>

				<VStack align="stretch" gap={0}>
					{/* 첫 번째 항목은 항상 노출 */}
					{renderItem(sortedHistories[0])}

					{/* 나머지 항목: Collapsible 내부에 위치 */}
					{sortedHistories.length > 1 && (
						<Collapsible.Content>
							<VStack align="stretch" gap="2" pt="2" maxH="180px" overflowY="auto">
								{sortedHistories.slice(1).map(renderItem)}
							</VStack>
						</Collapsible.Content>
					)}
				</VStack>
			</Box>
		</Collapsible.Root>
	);
};
