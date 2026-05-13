import {
	Box,
	Button,
	Clipboard,
	CloseButton,
	Dialog,
	HStack,
	IconButton,
	Image,
	Link,
	List,
	Portal,
	Stack,
	Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { ColorModeButton } from "./components/ui/color-mode";
import SongBook from "./pages/SongBook";
import "./index.css";
import { fetch_ } from "./lib/fetch";
import type { Song } from "./config/types";
import { MdContentCopy, MdKeyboardDoubleArrowUp, MdOutlineQuestionMark, MdSearch } from "react-icons/md";
import { parseList } from "./lib/parse";
import { normalizeKeyword } from "./lib/search";
import { LuExternalLink } from "react-icons/lu";
import { PiCheese } from "react-icons/pi";

const SONGBOOK_URL = "https://docs.google.com/spreadsheets/d/1KcU5pDIiE6rsiTzbSj5-OEF2pzEKbBkPSgjNT2pq2KE";

function App() {
	const [isLoading, setIsLoading] = useState(true);
	const [data, setData] = useState<Song[]>([]);
	const [scrollY, setScrollY] = useState(0);

	const isOnTop = scrollY > 80;

	const handleGotoTop = () => {
		window.scrollTo({ top: 0 });
	};

	useEffect(() => {
		setIsLoading(true);
		fetch_("/api/data").then((res) => {
			const parsed = parseList(res.data, 4);
			const normalized = parsed.map((song) => ({
				...song,
				searchTitle: normalizeKeyword(song.title),
				searchArtist: normalizeKeyword(song.artist),
			}));
			setData(normalized);
			setIsLoading(false);
		});
	}, []);

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

	return (
		<Stack minH="100vh" bg="bg" color="fg" justifyContent={"space-between"}>
			<ColorModeButtonFixed />
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

			<SongBook data={data} isLoading={isLoading} />

			<Footer />
		</Stack>
	);
}

function ColorModeButtonFixed() {
	return (
		<Box position="fixed" right="8px" top="8px" zIndex={999}>
			<ColorModeButton />
		</Box>
	);
}

// const NoticeButton = forwardRef<HTMLButtonElement, ButtonProps>(function NoticeButton(props, ref) {
// 	return (
// 		<Box position="fixed" right="8px" bottom="8px" zIndex={999}>
// 			<Button
// 				variant="outline"
// 				aria-label="Notice button"
// 				size="xs"
// 				borderRadius={"full"}
// 				ref={ref}
// 				{...props}
// 				css={{
// 					_icon: {
// 						width: "3.5",
// 						height: "3.5",
// 					},
// 				}}
// 			>
// 				<MdOutlineQuestionMark />
// 				도움말
// 			</Button>
// 		</Box>
// 	);
// });

function Notice() {
	return (
		<Dialog.Root size="xl" placement="center" motionPreset="slide-in-bottom">
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
							<Image src="/images/info.png" />
							<Stack alignItems={"center"} marginTop={3} gap="1">
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
								<Text marginTop="2">본 사이트는 원본 스프레드 시트 정보를 가져와 사용합니다</Text>
								<Link variant="underline" href={SONGBOOK_URL} colorPalette="green" target="_blank">
									원본 열기
									<LuExternalLink />
								</Link>
							</Stack>
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
			<Text fontSize="xs">본 사이트는 공식 사이트가 아닌 햄님메이드 프로젝트입니다.</Text>
			<Text fontSize="xs">라이버 및 소속사의 정책에 따라 일부 내용이 변경되거나 제공이 중단될 수 있습니다.</Text>
			<Clipboard.Root value="tok1324@naver.com">
				<Clipboard.Trigger asChild>
					<Link as="span" color="blue.fg" textStyle="sm">
						<Clipboard.Indicator fontSize="2xs" />
						<Clipboard.ValueText fontSize="2xs" />
					</Link>
				</Clipboard.Trigger>
			</Clipboard.Root>
		</Stack>
	);
}

export default App;

