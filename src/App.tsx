import {
	Badge,
	Box,
	Button,
	Image as ChakraImage,
	Clipboard,
	CloseButton,
	Dialog,
	Heading,
	HStack,
	IconButton,
	Link,
	List,
	Portal,
	Stack,
	Text,
} from "@chakra-ui/react";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { FaGithub } from "react-icons/fa";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { MdContentCopy, MdKeyboardDoubleArrowUp, MdOutlineQuestionMark, MdSearch } from "react-icons/md";
import { PiCheese } from "react-icons/pi";
import { SiGooglesheets } from "react-icons/si";
import Cursor from "./components/Cursor";
import { DraggablePreview } from "./components/DraggablePreview";
import { ColorModeButton } from "./components/ui/color-mode";
import { toaster } from "./components/ui/toaster";
import type { RawSongData, Song } from "./config/types";
import "./index.css";
import { fetch_ } from "./lib/fetch";
import { normalizeKeyword } from "./lib/search";
import SongBook, { type PreviewVideo } from "./pages/SongBook";
import { confirmOnExit } from "./lib/confirm";

interface Maintenance {
	maintenance_mode_hamkubby: boolean;
	maintenance_message_hamkubby: string;
}

const SONGBOOK_URL = "https://docs.google.com/spreadsheets/d/1KcU5pDIiE6rsiTzbSj5-OEF2pzEKbBkPSgjNT2pq2KE";

const API_BASE_URL = import.meta.env.DEV
	? "https://localhost:3467"
	: import.meta.env.VITE_API_URL || "https://api.stelcount.fans";

function App() {
	const [isLoading, setIsLoading] = useState(true);
	const [isSongDataLoading, setIsSongDataLoading] = useState(true);
	const [isProfileOpen, setIsProfileOpen] = useState(true);
	const [maintenance, setMaintenance] = useState<Maintenance>({
		maintenance_mode_hamkubby: false,
		maintenance_message_hamkubby: "",
	});
	const [data, setData] = useState<Song[]>([]);
	const [scrollY, setScrollY] = useState(0);

	// 비디오 프리뷰 상태
	const [showPreview, setShowPreview] = useState(false);
	const [previewVideo, setPreviewVideo] = useState<PreviewVideo>(["", undefined, undefined]);

	const { enableBeforeUnload, disableBeforeUnload } = confirmOnExit();

	const isOnTop = scrollY > 80;

	const handleGotoTop = () => {
		window.scrollTo({ top: 0 });
	};

	const parseRawData = (rawData: RawSongData[]): Song[] => {
		return rawData
			.filter((song) => song.isActive) // isActive true 필터
			.map((song) => {
				const { synonyms, isActive, ...restSong } = song;

				return {
					...restSong,
					synonyms: synonyms ? JSON.parse(synonyms) : [],
					actionStatus: isActive ? "ACTIVE" : "DISABLED",
				};
			});
	};

	useEffect(() => {
		if (showPreview) enableBeforeUnload();
		else disableBeforeUnload();
		return () => {
			disableBeforeUnload();
		};
	}, [showPreview]);

	// 로컬스토리지 불러오기
	useEffect(() => {
		const saved = localStorage.getItem("isHomeOpen");
		if (saved !== null) {
			setIsProfileOpen(JSON.parse(saved));
		}
	}, []);

	// load data api & modify
	useEffect(() => {
		const fetchSongbookData = (isInitialLoad = false) => {
			if (isInitialLoad) {
				setIsSongDataLoading(true);
			}

			fetch_(`${API_BASE_URL}/api/v2/songbook`)
				.then((res) => {
					if (res.status >= 200 && res.status < 300) {
						if (res.data) {
							const data: RawSongData[] = res.data.data;
							const parsed = parseRawData(data).map((song) => ({
								...song,
								searchTitle: normalizeKeyword(song.title),
								searchArtist: normalizeKeyword(song.artist),
							}));
							setData(parsed);
						}
					} else {
						toaster.create({
							description: "노래책 데이터 로드 실패: 서버에 문제가 발생했습니다!",
							type: "error",
							closable: true,
						});
					}
				})
				.catch(() => {
					toaster.create({
						description: "노래책 데이터 로드 실패: 서버에 문제가 발생했습니다!",
						type: "error",
						closable: true,
					});
				})
				.finally(() => {
					if (isInitialLoad) {
						setIsSongDataLoading(false);
					}
				});
		};

		fetchSongbookData(true);

		const POLLING_INTERVAL = 30 * 1000;
		const intervalId = setInterval(() => {
			fetchSongbookData(false);
		}, POLLING_INTERVAL);

		return () => clearInterval(intervalId);
	}, []);

	// Maintenance API Call
	useEffect(() => {
		let isCancelled = false;
		let timerId: ReturnType<typeof setTimeout>;

		const fetchMaintenance = () => {
			fetch_(`${API_BASE_URL}/api/v2/maintenance`)
				.then((res) => {
					if (isCancelled) return;

					if (res.status !== 200) {
						return;
					}

					const data: { msg: string; data: Maintenance } = res.data;
					if (data) {
						const { maintenance_mode_hamkubby, maintenance_message_hamkubby } = data.data;
						setMaintenance({ maintenance_mode_hamkubby, maintenance_message_hamkubby });

						if (maintenance_mode_hamkubby) {
							timerId = setTimeout(fetchMaintenance, 5000);
						}
					}
				})
				.finally(() => {
					if (!isCancelled) {
						setIsLoading(false);
					}
				});
		};

		fetchMaintenance();

		return () => {
			isCancelled = true;
			clearTimeout(timerId);
		};
	}, []);

	// scroll behavior
	useEffect(() => {
		const handleScroll = () => {
			setScrollY(window.scrollY ?? 0);
		};

		window.addEventListener("scroll", handleScroll);

		handleScroll();

		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	// preload
	useEffect(() => {
		const img = new Image();

		img.src = "/images/info.png";
	}, []);

	if (maintenance.maintenance_mode_hamkubby)
		return (
			<>
				<Cursor />
				<LoadingCanvas isLoading={isLoading} />
				<Stack minH="100vh" bg="bg" color="fg" alignItems={"center"} justifyContent={"center"}>
					<Heading size="4xl">사이트 점검중</Heading>
					<Text textStyle="xl">{maintenance.maintenance_message_hamkubby}</Text>
					<SheetButton />
				</Stack>
			</>
		);
	return (
		<>
			{showPreview && (
				<DraggablePreview
					videoId={previewVideo[0]}
					start={previewVideo[1]}
					end={previewVideo[2]}
					onClose={() => {
						setShowPreview(false);
					}}
				/>
			)}
			<Cursor />
			<LoadingCanvas isLoading={isLoading} />
			<Stack minH="100vh" bg="bg" color="fg" justifyContent={"space-between"}>
				<HStack flexDirection={"row-reverse"} position="fixed" right="8px" top="8px" zIndex={999}>
					<ColorModeButtonFixed />
					<SheetButton />
					<ProfileButton isProfileOpen={isProfileOpen} setIsProfileOpen={setIsProfileOpen} />
				</HStack>

				<HStack flexDirection={"row-reverse"} position="fixed" right="8px" bottom="8px" zIndex={999}>
					<Notice />
					<IconButton
						variant="outline"
						aria-label="go to top button"
						size="xs"
						borderRadius={"full"}
						css={{
							_icon: {
								width: "3.5",
								height: "3.5",
							},
						}}
						transform={isOnTop ? "" : "translateY(40px)"}
						onClick={handleGotoTop}
					>
						<MdKeyboardDoubleArrowUp />
					</IconButton>
				</HStack>

				<SongBook
					data={data}
					isLoading={isSongDataLoading}
					isProfileOpen={isProfileOpen}
					setShowPreview={setShowPreview}
					setPreviewVideo={setPreviewVideo}
				/>

				{/* <Footer /> */}
			</Stack>
		</>
	);
}

function LoadingCanvas({ isLoading }: { isLoading: boolean }) {
	const [shouldRender, setShouldRender] = useState(isLoading);

	useEffect(() => {
		let timeoutId: ReturnType<typeof setTimeout>;

		if (isLoading) {
			setShouldRender(true);
		} else {
			timeoutId = setTimeout(() => {
				setShouldRender(false);
			}, 500);
		}
		return () => {
			clearTimeout(timeoutId);
		};
	}, [isLoading]);

	if (!shouldRender) {
		return null;
	}
	return (
		<Stack
			display="flex"
			position="fixed"
			width="100vw"
			height="100vh"
			bg="bg"
			zIndex={65536}
			opacity={isLoading ? 1 : 0}
			transition="opacity 0.3s"
			pointerEvents={"none"}
		></Stack>
	);
}

function ProfileButton({
	isProfileOpen,
	setIsProfileOpen,
}: {
	isProfileOpen: boolean;
	setIsProfileOpen: Dispatch<SetStateAction<boolean>>;
}) {
	return (
		<IconButton
			variant="outline"
			aria-label="toggle-home"
			size="xs"
			borderRadius={"full"}
			css={{
				_icon: {
					width: "3.5",
					height: "3.5",
				},
			}}
			onClick={() => {
				setIsProfileOpen((prev) => {
					const nextState = !prev;
					localStorage.setItem("isHomeOpen", JSON.stringify(nextState));
					return nextState;
				});
			}}
		>
			{isProfileOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
		</IconButton>
	);
}

function SheetButton() {
	return (
		<IconButton
			variant="outline"
			aria-label="go to spreadsheet"
			size="xs"
			borderRadius={"full"}
			css={{
				_icon: {
					width: "3.5",
					height: "3.5",
				},
			}}
			onClick={() => {
				window.open(SONGBOOK_URL, "_blank");
			}}
		>
			<SiGooglesheets />
		</IconButton>
	);
}

function ColorModeButtonFixed() {
	return <ColorModeButton />;
}

function Notice() {
	return (
		<Dialog.Root size="xl" placement="center" motionPreset="slide-in-bottom" scrollBehavior="inside">
			<Dialog.Trigger asChild>
				<Box>
					<Button
						variant="outline"
						aria-label="Notice button"
						size="xs"
						borderRadius={"full"}
						css={{
							_icon: {
								width: "3.5",
								height: "3.5",
							},
						}}
					>
						<MdOutlineQuestionMark />
						도움말
					</Button>
				</Box>
			</Dialog.Trigger>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content bg="bg">
						<Dialog.Header justifyContent={"center"} padding="4">
							<Dialog.Title>노래책 설명서</Dialog.Title>
							<Dialog.CloseTrigger asChild>
								<CloseButton size="sm" />
							</Dialog.CloseTrigger>
						</Dialog.Header>
						<Dialog.Body>
							<Stack alignItems={"center"} marginTop={3} gap="1">
								<Box bg="cardBg" p={4} borderRadius="md" mb={5} overflowY="auto" fontSize="sm">
									<List.Root gap="2" variant="plain" align="center">
										<List.Item>
											<List.Indicator asChild color="blue.500">
												<MdSearch />
											</List.Indicator>
											검색 창에 원하는 곡/가수 입력
										</List.Item>
										<List.Item>
											<List.Indicator asChild color="green.500">
												<MdContentCopy />
											</List.Indicator>
											검색된 곡을 클릭하여 노래 제목 및 가수를 클립보드로 복사
										</List.Item>
										<List.Item>
											<List.Indicator asChild color="orange.500">
												<PiCheese />
											</List.Indicator>
											알맞은 가격의 미션으로 노래 신청!
										</List.Item>
									</List.Root>
								</Box>
								<Box mb={4}>
									<Badge colorPalette={"teal"}>공식</Badge> 태그는 햄쿠비가 직접 시트에 입력한 곡입니다.
								</Box>
								<Box mb={1}>
									<Badge colorPalette={"red"}>비공식</Badge> 태그는 시트에 없는, 과거에 불렀던 기록 토대로 등록한
									곡입니다. 신청에 유의해 주세요
								</Box>
								<ChakraImage mb={12} src="/images/info.png" />
								{/* <Text marginTop="2">본 사이트는 원본 스프레드 시트 정보를 가져와 사용합니다</Text>
								<Link variant="underline" href={SONGBOOK_URL} colorPalette="green" target="_blank" mb={12}>
									원본 열기
									<LuExternalLink />
								</Link> */}
							</Stack>
							<Footer />
						</Dialog.Body>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
}

function Footer() {
	return (
		<Stack alignItems={"center"} gap="-0.5" padding={1}>
			<Text fontSize="xs">
				본 사이트는 공식 사이트가 아닌 햄님메이드 프로젝트입니다. 라이버 및 소속사의 정책에 따라 일부 내용이 변경되거나
				제공이 중단될 수 있습니다.
			</Text>
			<HStack alignItems={"center"} marginTop="8px">
				<Clipboard.Root value="tok1324@naver.com">
					<Clipboard.Trigger>
						<Link fontSize="xs">
							<Clipboard.Indicator />
							<Clipboard.ValueText />
						</Link>
					</Clipboard.Trigger>
				</Clipboard.Root>
				<Link href="https://github.com/Citysquirrel/hamkubby" target="_blank" fontSize="sm">
					<FaGithub />
				</Link>
			</HStack>
		</Stack>
	);
}

export default App;
