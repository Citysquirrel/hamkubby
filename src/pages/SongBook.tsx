import { memo, useCallback, useEffect, useMemo, useRef, useState, type JSX } from "react";
import {
	Avatar,
	Box,
	Button,
	ButtonGroup,
	HStack,
	Image,
	Input,
	InputGroup,
	Link,
	Separator,
	Stack,
	Text,
} from "@chakra-ui/react";
import type { Song, SortType } from "../config/types";
import { MdClose, MdOutlineLyrics, MdSearch } from "react-icons/md";
import { normalizeKeyword } from "../lib/search";
import "./songbook.css";

const GENRE = {
	전체: "all",
	KPOP: "kpop",
	JPOP: "jpop",
	POP: "pop",
};

export default function SongBook({ data, isLoading }: { data: Song[]; isLoading: boolean }) {
	const searchRef = useRef<HTMLInputElement>(null);
	const [search, setSearch] = useState("");
	const [genre, setGenre] = useState("all");
	const [sort, setSort] = useState<SortType>("title-asc");
	const [focused, setFocused] = useState(false);

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

	const openLyricsSearch = useCallback((song: any) => {
		const query = `${song.artist} ${song.title} 가사`;
		window.open(
			`https://www.google.com/search?q=${encodeURIComponent(query)}&udm=14`,
			"lyrics",
			"noopener,width=540,height=600",
		);
	}, []);

	const filteredSongs = useMemo(() => {
		const keyword = normalizeKeyword(search);

		const filtered = data.filter((song) => {
			const searchTitle = song.searchTitle || song.title;
			const searchArtist = song.searchArtist || song.artist;

			const matchSearch = searchTitle.includes(keyword) || searchArtist.includes(keyword);

			return matchSearch && (genre === "all" || song.genre === genre);
		});

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
	}, [search, genre, sort, data]);

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

	return (
		<Stack id="songbook" padding="0" margin="0" alignItems={"center"} position="static">
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

			<Stack id="list-container" width="100%" alignItems={"center"}>
				<HStack position="sticky" top="0" left="0" zIndex={2} width="100%" bg={"bg"} justifyContent={"center"}>
					<Stack width={"100%"} gap=".5" marginBottom="4px" borderBottom={"1px solid"} borderColor="gray.border">
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
										<label htmlFor="search">
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
											size={{ _hover: "md", base: "sm" }}
											shadow={{ _hover: "md", base: "sm" }}
											transition="all .2s ease-in-out"
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
									size={{ _hover: "md", base: "sm" }}
									shadow={{ _hover: "md", base: "sm" }}
									transition="all .2s ease-in-out"
								>
									제목
									{sort === "title-asc" && " ↑"}
									{sort === "title-desc" && " ↓"}
								</Button>
								<Button
									borderRadius={"xl"}
									bg={sort === "artist-asc" || sort === "artist-desc" ? "kbg" : ""}
									onClick={() => toggleSort("artist")}
									size={{ _hover: "md", base: "sm" }}
									shadow={{ _hover: "md", base: "sm" }}
									transition="all .2s ease-in-out"
								>
									가수
									{sort === "artist-asc" && " ↑"}
									{sort === "artist-desc" && " ↓"}
								</Button>
							</ButtonGroup>
						</Box>
					</Stack>
				</HStack>
				<Stack id="list-table" gap={3} minWidth="480px" width="100%" maxWidth="920px" padding="0 8px">
					{isLoading ? (
						<Stack width="100%" alignItems={"center"} paddingTop="24px">
							불러오는중...
						</Stack>
					) : filteredSongs.length === 0 ? (
						<Stack width="100%" alignItems={"center"} paddingTop="24px">
							검색 결과 없음
						</Stack>
					) : (
						filteredSongs.map((song) => {
							// const isChosung = isChoseongLike(search);
							// const title = isChosung ? highlightChosung(song.title, search) : highlightText(song.title, search);

							// const artist = isChosung ? highlightChosung(song.artist, search) : highlightText(song.artist, search);

							return (
								<SongItem
									key={song.id}
									song={song}
									search={search}
									highlight={highlight}
									openLyricsSearch={openLyricsSearch}
								/>
							);
						})
					)}
				</Stack>
			</Stack>
		</Stack>
	);
}

const SongItem = memo(
	({
		song,
		search,
		highlight,
		openLyricsSearch,
	}: {
		song: Song;
		search: string;
		highlight: (text: string, keyword: string) => string | JSX.Element;
		openLyricsSearch: (song: any) => void;
	}) => {
		const [copyState, setCopyState] = useState<"pending" | "copied" | "dismiss">("pending");
		return (
			<div
				className="song-item"
				onClick={() => {
					if (copyState !== "pending") return;
					navigator.clipboard.writeText(`${song.title} ${song.artist}`).then(() => {
						setCopyState("copied");
						setTimeout(() => {
							setCopyState("dismiss");
							setTimeout(() => {
								setCopyState("pending");
							}, 500);
						}, 2000);
					});
				}}
			>
				{copyState !== "pending" ? (
					<Stack
						position="absolute"
						top="0"
						left="0"
						width="100%"
						height="100%"
						alignItems={"center"}
						justifyContent={"center"}
						bg="bg"
						opacity={copyState === "copied" ? "0.9" : "0"}
						transition="opacity .3s"
						userSelect={"none"}
					>
						<Text fontSize="sm">{song.cheese}곡 복사 완료!</Text>
					</Stack>
				) : null}
				<div className="song-item__content">
					<div className="song-item__content-wrapper">
						<div className="song-item__left">
							<div className="song-item__genre-wrapper">
								<span className={`song-tag song-tag--${song.genre}`}>{song.genre.toUpperCase()}</span>
							</div>

							<div className="song-item__title" title={song.title}>
								{highlight(song.title, search)}
							</div>

							<div className="song-item__artist" title={song.artist}>
								{highlight(song.artist, search)}
							</div>
						</div>
						<div className="song-item__bottom">
							<div className={`song-item__cheese song-item__cheese--${song.cheese}`}>🧀{song.cheese}</div>
							{song.notes && <div className="song-item__notes">💬{song.notes}</div>}
						</div>
					</div>

					{song.hasLyrics ? (
						<button className="song-button song-button--lyrics">
							<MdOutlineLyrics />
							가사
						</button>
					) : (
						<button
							className="song-button song-button--search"
							onClick={(e) => {
								e.stopPropagation();
								openLyricsSearch(song);
							}}
						>
							<MdSearch />
							가사
						</button>
					)}
				</div>
			</div>
		);
	},
);
