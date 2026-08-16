import { toaster } from "@/components/ui/toaster";
import { API_BASE_URL } from "@/config/base-url";
import { useMeta } from "@/hooks/useMeta";
import { generatePin, generateRoomId } from "@/lib/generate";
import {
	Badge,
	Box,
	Button,
	Center,
	Flex,
	Group,
	Heading,
	Input,
	NativeSelect,
	Portal,
	Switch,
	Tabs,
	Text,
} from "@chakra-ui/react";
import { useBroadcastStore } from "@store/useBroadcastStore";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { CustomColorPicker, FastTextarea, NumberField, OverlayContentView, TextField, TypoEditor } from "./lib/comp";

const SOCKET_URL = API_BASE_URL;

type SaveStatus = "idle" | "saving" | "saved";

export const FONT_OPTIONS = [
	{ label: "상속 (글로벌)", value: "inherit" },
	{ label: "Pretendard", value: "Pretendard" },
	{ label: "Gmarket Sans", value: "Gmarket Sans" },
	{ label: "Noto Sans KR", value: "Noto Sans KR" },
	{ label: "Arial", value: "Arial" },
	{ label: "Verdana", value: "Verdana" },
];

export default function AdminPanel() {
	useMeta({ title: "세트리스트 오버레이 관리자" });
	const { roomId } = useParams<{ roomId: string }>();
	const navigate = useNavigate();
	const location = useLocation();

	const [socket, setSocket] = useState<Socket | null>(null);
	const [pin, setPin] = useState("");
	const [serverText, setServerText] = useState("");
	const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
	const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
	const [historyRooms, setHistoryRooms] = useState<string[]>([]);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [isRoomInfoOpen, setIsRoomInfoOpen] = useState(false);
	const [previewSettings, setPreviewSettings] = useState<Broadcast.Settings | null>(null);
	const [previewSongList, setPreviewSongList] = useState<Broadcast.Song[]>([]);
	const [isEditorOpen, setIsEditorOpen] = useState<boolean>(() => {
		const saved = localStorage.getItem("style_editor_open");
		return saved !== null ? JSON.parse(saved) : true;
	});
	const [isManualOpen, setIsManualOpen] = useState(false);

	const emitTimerRef = useRef<number | null>(null);

	const pastSettings = useBroadcastStore((state) => state.pastSettings);
	const futureSettings = useBroadcastStore((state) => state.futureSettings);
	const undo = useBroadcastStore((state) => state.undo);
	const redo = useBroadcastStore((state) => state.redo);

	const songList = useBroadcastStore((state) => state.songList);
	const settings = useBroadcastStore((state) => state.settings);
	const setSongList = useBroadcastStore((state) => state.setSongList);
	const updateSettings = useBroadcastStore((state) => state.updateSettings);
	const syncFromServer = useBroadcastStore((state) => state.syncFromServer);

	// 설명서 Escape 이벤트
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsManualOpen(false);
		};
		if (isManualOpen) window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isManualOpen]);

	// 전체화면 Escape 이벤트
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsFullscreen(false);
		};
		if (isFullscreen) window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isFullscreen]);

	// 어드민 뷰 렉 방지
	useEffect(() => {
		const timer = setTimeout(() => {
			setPreviewSettings(settings);
			setPreviewSongList(songList);
		}, 300);
		return () => clearTimeout(timer);
	}, [settings, songList]);

	// 히스토리 로드
	useEffect(() => {
		const rooms: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.startsWith("obs_pin_")) {
				rooms.push(key.replace("obs_pin_", ""));
			}
		}
		setHistoryRooms(rooms);
	}, [roomId]);

	// PIN 로드 & 발급
	useEffect(() => {
		let savedPin = localStorage.getItem(`obs_pin_${roomId}`);

		if (!savedPin) {
			savedPin = generatePin();
			localStorage.setItem(`obs_pin_${roomId}`, savedPin);
		}

		setPin(savedPin);
	}, [roomId]);

	// MARK: - 소켓 연결
	useEffect(() => {
		if (!roomId || !pin) return;

		const newSocket = io(SOCKET_URL, { path: "/ws/", query: { roomId } });
		setSocket(newSocket);

		// 소켓이 연결되면 무조건 서버에 권한(PIN) 확인부터 요청
		newSocket.on("connect", () => {
			newSocket.emit("authRoom", { roomId, pin });
		});

		// 서버가 권한을 승인했을 때만 패널 오픈
		newSocket.on("authSuccess", () => {
			setIsAuthorized(true);
		});

		// 권한이 거부되었을 때 (남의 방 접근)
		newSocket.on("authFail", (msg) => {
			setIsAuthorized(false);
			toaster.create({ title: "접근 거부", description: msg, type: "error" });
		});

		newSocket.on("syncData", (data) => {
			syncFromServer(data);
			const text = data.songList.map((s: any) => `${s.title} ${s.singer ? "- " + s.singer : ""}`).join("\n");
			setServerText(text);
			if (!location.state?.isRegenerated) setSaveStatus("saved");
		});

		newSocket.on("saved", () => setSaveStatus("saved"));

		return () => {
			newSocket.disconnect();
		};
	}, [roomId, pin]);

	// 마이그레이션
	useEffect(() => {
		// 권한 승인이 완료되었고, 재발급(isRegenerated)으로 넘어왔을 때 딱 1번만 실행됨
		if (isAuthorized === true && location.state?.isRegenerated && socket) {
			setSaveStatus("saving");
			socket.emit("updateData", { roomId, pin, songList, settings });

			// 무한 렌더링/저장을 막기 위해 라우터의 state(isRegenerated)를 즉시 날려버림
			navigate(location.pathname, { replace: true, state: {} });
			toaster.create({
				title: "데이터 이관 완료",
				description: "기존 데이터가 성공적으로 이관되었습니다.",
				type: "success",
			});
		}
	}, [
		isAuthorized,
		location.state?.isRegenerated,
		socket,
		roomId,
		pin,
		songList,
		settings,
		navigate,
		location.pathname,
	]);

	// 도배방지
	const debouncedEmit = (newList: any, newSettings: any) => {
		if (emitTimerRef.current) clearTimeout(emitTimerRef.current);
		emitTimerRef.current = setTimeout(() => {
			if (socket && roomId) {
				socket.emit("updateData", { roomId, pin, songList: newList, settings: newSettings });
			}
		}, 400);
	};

	const applyPreset = (type: "chzzk" | "darkModern" | "obs") => {
		const newSettings = JSON.parse(JSON.stringify(settings)) as Broadcast.Settings;

		if (type === "chzzk") {
			newSettings.global.bgColor = "rgba(10, 11, 14, 0.4)";
			newSettings.global.borderWidth = 1;
			newSettings.global.borderColor = "rgba(0, 255, 163, 0.15)";
			newSettings.global.borderRadius = 16;
			newSettings.nowPlaying.bgColor = "rgba(24, 25, 28, 0.9)";
			newSettings.nowPlaying.highlightColor = "#00ffa3";
			newSettings.nowPlaying.borderRadius = 12;
			newSettings.nowPlaying.boxShadow = {
				enabled: true,
				x: 0,
				y: 0,
				blur: 15,
				spread: 0,
				color: "rgba(0, 255, 163, 0.4)",
			};
			newSettings.nowPlaying.numTypo.color = "#00ffa3";
			newSettings.nowPlaying.titleTypo.color = "#ffffff";
			newSettings.nowPlaying.playingText.typo.color = "#00ffa3";
			newSettings.waitingList.bgColor = "rgba(24, 25, 28, 0.6)";
			newSettings.waitingList.borderRadius = 8;
			newSettings.waitingList.titleTypo.color = "#dddddd";
		} else if (type === "darkModern") {
			newSettings.global.bgColor = "rgba(10, 12, 16, 0.6)";
			newSettings.global.borderWidth = 1;
			newSettings.global.borderColor = "rgba(255, 255, 255, 0.08)";
			newSettings.global.borderRadius = 12;
			newSettings.nowPlaying.bgColor = "rgba(25, 27, 33, 0.95)";
			newSettings.nowPlaying.highlightColor = "#339af0";
			newSettings.nowPlaying.borderRadius = 12;
			newSettings.nowPlaying.boxShadow = {
				enabled: true,
				x: 0,
				y: 6,
				blur: 20,
				spread: 0,
				color: "rgba(0, 0, 0, 0.6)",
			};
			newSettings.nowPlaying.numTypo.color = "#339af0";
			newSettings.nowPlaying.titleTypo.color = "#ffffff";
			newSettings.nowPlaying.playingText.typo.color = "#339af0";
			newSettings.waitingList.bgColor = "rgba(20, 22, 28, 0.7)";
			newSettings.waitingList.borderRadius = 10;
			newSettings.waitingList.titleTypo.color = "#f1f3f5";
		} else if (type === "obs") {
			newSettings.global.bgColor = "rgba(0, 0, 0, 0)";
			newSettings.global.borderWidth = 0;
			newSettings.global.borderRadius = 0;
			newSettings.nowPlaying.bgColor = "rgba(0, 0, 0, 0.7)";
			newSettings.nowPlaying.highlightColor = "#ffffff";
			newSettings.nowPlaying.borderRadius = 0;
			newSettings.nowPlaying.boxShadow.enabled = false;
			newSettings.nowPlaying.numTypo.color = "#ffffff";
			newSettings.nowPlaying.titleTypo.color = "#ffffff";
			newSettings.nowPlaying.playingText.typo.color = "#ffffff";
			newSettings.waitingList.bgColor = "rgba(0, 0, 0, 0.7)";
			newSettings.waitingList.borderRadius = 0;
			newSettings.waitingList.titleTypo.color = "#cccccc";
		}

		setSaveStatus("saving");
		updateSettings(newSettings);
		if (socket && roomId) socket.emit("updateData", { roomId, pin, songList, settings: newSettings });
	};

	// MARK: - 핸들러
	const handleToggleEditor = () => {
		const nextState = !isEditorOpen;
		setIsEditorOpen(nextState);
		localStorage.setItem("style_editor_open", JSON.stringify(nextState));
	};

	const handleUndo = () => {
		undo();
		setSaveStatus("saving");
		const latestSettings = useBroadcastStore.getState().settings;
		if (socket && roomId) socket.emit("updateData", { roomId, pin, songList, settings: latestSettings });
	};

	const handleRedo = () => {
		redo();
		setSaveStatus("saving");
		const latestSettings = useBroadcastStore.getState().settings;
		if (socket && roomId) socket.emit("updateData", { roomId, pin, songList, settings: latestSettings });
	};

	const handleTextChange = (val: string) => {
		setServerText(val);
		setSaveStatus("saving");

		const lines = val.split("\n").filter((line) => line.trim() !== "");

		const currentList = useBroadcastStore.getState().songList;

		const newList: Broadcast.Song[] = lines.map((line, idx) => {
			const parts = line.split("-");
			const existingSong = currentList[idx];
			return {
				id: existingSong ? existingSong.id : `song-${idx}-${Date.now()}`,
				title: parts[0].trim(),
				singer: parts.length > 1 ? parts.slice(1).join("-").trim() : "",
				status: existingSong ? existingSong.status : idx === 0 ? "playing" : "waiting",
			};
		});

		setSongList(newList);
		if (socket && roomId) socket.emit("updateData", { roomId, pin, songList: newList, settings });
	};

	const handleSetPlaying = (targetId: string | null) => {
		setSaveStatus("saving");
		const newList = songList.map((song) => ({
			...song,
			status: (song.id === targetId ? "playing" : "waiting") as "playing" | "waiting" | "done",
		}));
		setSongList(newList);
		debouncedEmit(newList, settings);
	};

	// 중첩 설정 업데이트 핸들러
	const handleNestedSetting = (section: keyof Broadcast.Settings, key: string, value: any) => {
		setSaveStatus("saving");
		const newSettings = {
			...settings,
			[section]: {
				...(settings[section] as any),
				[key]: value,
			},
		} as Broadcast.Settings;
		updateSettings(newSettings);
		debouncedEmit(songList, newSettings);
	};

	// 그림자 설정 핸들러
	const handleShadowSetting = (section: "global" | "nowPlaying", key: keyof Broadcast.ShadowSettings, value: any) => {
		setSaveStatus("saving");
		const newSettings = {
			...settings,
			[section]: {
				...settings[section],
				boxShadow: {
					...settings[section].boxShadow,
					[key]: value,
				},
			},
		} as Broadcast.Settings;
		updateSettings(newSettings);
		debouncedEmit(songList, newSettings);
	};

	// 재발급
	const handleRegenerate = () => {
		if (
			window.confirm(
				"정말 방을 새로 발급하시겠습니까?\n기존에 송출 중이던 오버레이는 즉시 차단되며, 주소를 새로 갱신해야 합니다.\n새 방 발급 후에는 반드시 임의 정보를 변경해 서버에 저장해주세요!",
			)
		) {
			setSaveStatus("saving");
			const newRoomId = generateRoomId();

			if (socket && isAuthorized) {
				socket.emit("destroyRoom", { roomId, pin });
			}
			localStorage.removeItem(`obs_pin_${roomId}`);
			navigate(`/obs/admin/${newRoomId}`, { state: { isRegenerated: true } });
		}
	};

	// 방 삭제
	const deleteHistoryRoom = (roomToRemove: string) => {
		if (window.confirm("이 방을 목록에서 삭제하시겠습니까?")) {
			localStorage.removeItem(`obs_pin_${roomToRemove}`);
			setHistoryRooms((prev) => prev.filter((r) => r !== roomToRemove));

			// 현재 보고 있는 방을 지웠다면 새 방으로 튕겨냄
			if (roomToRemove === roomId) {
				navigate(`/obs/admin/${generateRoomId()}`);
			}
		}
	};

	// 클립보드 복사 헬퍼
	const handleCopy = (text: string, title: string) => {
		navigator.clipboard.writeText(text);
		toaster.create({ title: `${title} 복사 완료`, type: "success" });
	};

	if (isAuthorized === false) {
		return (
			<Center h="100vh" flexDir="column" bg="gray.50" _dark={{ bg: "gray.900" }}>
				<Heading color="red.500" mb={4}>
					권한이 없습니다
				</Heading>
				<Text mb={6}>존재하는 방이지만, 로컬스토리지에 일치하는 PIN 번호가 없습니다.</Text>
				<Button colorPalette="blue" onClick={() => navigate(`/obs/admin/${generateRoomId()}`)}>
					새 방 생성하기
				</Button>
			</Center>
		);
	}

	// MARK: - 화면 렌더링
	return (
		<Flex p={4} direction="column" h="100vh" overflow="hidden">
			<Flex
				justify="space-between"
				align="center"
				mb={2}
				p={3}
				bg="gray.100"
				_dark={{ bg: "gray.800" }}
				borderRadius="md"
			>
				<Flex align="center" gap={4}>
					<Heading size="sm">방송 오버레이 관리자</Heading>
					<Button size="xs" variant="outline" onClick={() => setIsRoomInfoOpen(!isRoomInfoOpen)}>
						{isRoomInfoOpen ? "방 정보 닫기 ▴" : "방 정보 보기 ▾"}
					</Button>
					<Flex gap={2}>
						<Group attached flex={1}>
							<Input
								size="xs"
								readOnly
								type="text"
								value={`${window.location.origin}/obs/overlay/${roomId}`}
								bg="white"
								_dark={{ bg: "gray.700" }}
							/>
							<Button
								size="xs"
								colorPalette="green"
								onClick={() => handleCopy(`${window.location.origin}/obs/overlay/${roomId}`, "오버레이 주소")}
							>
								오버레이 URL 복사
							</Button>
						</Group>
						<Group attached flex={1}>
							<Input
								size="xs"
								readOnly
								type="text"
								value={`${window.location.origin}/obs/overlay/${roomId}`}
								bg="white"
								_dark={{ bg: "gray.700" }}
							/>
							<Button size="xs" colorPalette="red" onClick={() => handleCopy(window.location.href, "관리자 주소")}>
								관리자 URL 복사
							</Button>
						</Group>
						<Group attached flex={1}>
							<Input
								size="xs"
								readOnly
								type="password"
								value={`${window.location.origin}/obs/dock/${roomId}?pin=${pin}`}
								bg="white"
								_dark={{ bg: "gray.700" }}
							/>
							<Button
								size="xs"
								colorPalette="purple"
								onClick={() => handleCopy(`${window.location.origin}/obs/dock/${roomId}?pin=${pin}`, "OBS 독 주소")}
							>
								OBS 독 주소 복사
							</Button>
						</Group>
					</Flex>
				</Flex>

				<Box>
					<Button size="xs" colorPalette="blue" onClick={() => setIsManualOpen(true)} mr={2}>
						📖 사용설명서
					</Button>
					<Button size="xs" variant="outline" onClick={handleToggleEditor} mr={4}>
						{isEditorOpen ? "스타일 편집기 접기 ▴" : "스타일 편집기 열기 ▾"}
					</Button>
					{saveStatus === "saving" && <Badge colorPalette="yellow">저장 중...</Badge>}
					{saveStatus === "saved" && <Badge colorPalette="green">변경사항 저장됨</Badge>}
				</Box>
			</Flex>

			{isRoomInfoOpen && (
				<Flex
					direction="column"
					gap={2}
					mb={4}
					p={4}
					bg="gray.50"
					_dark={{ bg: "gray.700" }}
					borderRadius="md"
					borderWidth="1px"
				>
					{historyRooms.length > 0 && (
						<Flex gap={2} align="center" flexWrap="wrap" mb={2}>
							<Text fontSize="xs" fontWeight="bold" color="gray.500">
								히스토리:
							</Text>
							{historyRooms.map((r) => (
								<Group attached key={r}>
									<Button
										size="xs"
										variant={r === roomId ? "solid" : "outline"}
										colorPalette={r === roomId ? "blue" : "gray"}
										onClick={() => navigate(`/obs/admin/${r}`)}
									>
										{r.split("-")[0]}
									</Button>
									<Button size="xs" variant="outline" colorPalette="red" onClick={() => deleteHistoryRoom(r)}>
										X
									</Button>
								</Group>
							))}
						</Flex>
					)}
					<Flex gap={2} flexWrap="wrap">
						<Group attached>
							<Input
								size="sm"
								type="password"
								readOnly
								value={roomId || ""}
								w="100px"
								bg="white"
								_dark={{ bg: "gray.900" }}
							/>
							<Button size="sm" onClick={() => handleCopy(roomId || "", "ID")}>
								ID복사
							</Button>
						</Group>
						<Group attached>
							<Input size="sm" type="password" readOnly value={pin} w="80px" bg="white" _dark={{ bg: "gray.900" }} />
							<Button size="sm" onClick={() => handleCopy(pin, "PIN")}>
								PIN복사
							</Button>
						</Group>
						<Button size="sm" colorPalette="red" onClick={handleRegenerate} ml="auto">
							새 방 발급 (주소 초기화)
						</Button>
					</Flex>
				</Flex>
			)}

			<Flex gap={4} direction={{ base: "column", lg: "row" }} flex={1} overflow="hidden">
				<Flex direction="column" flex={1} gap={4} overflowY="auto" pr={2}>
					<Box
						display={isEditorOpen ? "block" : "none"}
						bg="gray.50"
						_dark={{ bg: "gray.800" }}
						borderRadius="md"
						h="350px"
						overflowY="auto"
						borderWidth="1px"
					>
						<Tabs.Root defaultValue="global" size="sm" variant="line" colorPalette="blue">
							<Tabs.List bg="white" _dark={{ bg: "gray.900" }} position="sticky" top={0} zIndex={10} px={2}>
								<Tabs.Trigger value="global">전체/배경</Tabs.Trigger>
								<Tabs.Trigger value="header">헤더/푸터</Tabs.Trigger>
								<Tabs.Trigger value="nowPlaying">재생 곡</Tabs.Trigger>
								<Tabs.Trigger value="waiting">대기 곡</Tabs.Trigger>
								<Tabs.Trigger value="wrapper">틀/애니메이션</Tabs.Trigger>
								<Flex gap={1} ml="auto" marginBlock="auto">
									<Button size="2xs" onClick={handleUndo} disabled={pastSettings.length === 0} variant="outline" px={2}>
										↩️ 취소
									</Button>
									<Button
										size="2xs"
										onClick={handleRedo}
										disabled={futureSettings.length === 0}
										variant="outline"
										px={2}
									>
										↪️ 복구
									</Button>
									<Button size="2xs" colorPalette="green" onClick={() => applyPreset("chzzk")}>
										치지직
									</Button>
									<Button size="2xs" colorPalette="blue" onClick={() => applyPreset("darkModern")}>
										다크 모던
									</Button>
									<Button size="2xs" colorPalette="gray" variant="outline" onClick={() => applyPreset("obs")}>
										OBS
									</Button>
								</Flex>
							</Tabs.List>

							<Tabs.Content value="global" p={4}>
								<Box mb={4} w="200px">
									<Text fontSize="xs" fontWeight="bold" mb={1}>
										기본 전체 폰트
									</Text>
									<NativeSelect.Root size="sm">
										<NativeSelect.Field
											bg="white"
											_dark={{ bg: "gray.700" }}
											value={settings.global.font}
											onChange={(e) => handleNestedSetting("global", "font", e.target.value as Broadcast.FontChoice)}
										>
											{FONT_OPTIONS.map((opt) => {
												if (opt.value === "inherit") return null;
												return (
													<option key={opt.value} value={opt.value}>
														{opt.label}
													</option>
												);
											})}
										</NativeSelect.Field>
									</NativeSelect.Root>
								</Box>
								<Flex flexWrap="wrap" gap={3} mb={3}>
									<NumberField
										label="전체 너비"
										value={settings.global.width}
										onChange={(v: any) => handleNestedSetting("global", "width", v)}
									/>
									<NumberField
										label="전체 높이 (0=Auto)"
										value={settings.global.height}
										onChange={(v: any) => handleNestedSetting("global", "height", v)}
									/>
									<NumberField
										label="안쪽 여백"
										value={settings.global.padding}
										onChange={(v: any) => handleNestedSetting("global", "padding", v)}
									/>
									<NumberField
										label="모서리 둥글기"
										value={settings.global.borderRadius}
										onChange={(v: any) => handleNestedSetting("global", "borderRadius", v)}
									/>
								</Flex>
								<Flex flexWrap="wrap" gap={3} mb={4}>
									<CustomColorPicker
										label="배경색"
										value={settings.global.bgColor}
										onChange={(v: any) => handleNestedSetting("global", "bgColor", v)}
									/>
									<CustomColorPicker
										label="테두리색"
										value={settings.global.borderColor}
										onChange={(v: any) => handleNestedSetting("global", "borderColor", v)}
									/>
									<NumberField
										label="테두리 굵기"
										value={settings.global.borderWidth}
										onChange={(v: any) => handleNestedSetting("global", "borderWidth", v)}
									/>
								</Flex>
								<Box p={3} bg="gray.100" _dark={{ bg: "gray.700" }} borderRadius="md">
									<Switch.Root
										checked={settings.global.boxShadow.enabled}
										onCheckedChange={(e) => handleShadowSetting("global", "enabled", e.checked)}
										mb={2}
									>
										<Switch.HiddenInput />
										<Switch.Control />
										<Switch.Label fontSize="sm" fontWeight="bold">
											전체 그림자 켜기
										</Switch.Label>
									</Switch.Root>
									{settings.global.boxShadow.enabled && (
										<Flex gap={2} align="center">
											<NumberField
												label="가로위치(X)"
												value={settings.global.boxShadow.x}
												onChange={(v: any) => handleShadowSetting("global", "x", v)}
											/>
											<NumberField
												label="세로위치(Y)"
												value={settings.global.boxShadow.y}
												onChange={(v: any) => handleShadowSetting("global", "y", v)}
											/>
											<NumberField
												label="흐림(Blur)"
												value={settings.global.boxShadow.blur}
												onChange={(v: any) => handleShadowSetting("global", "blur", v)}
											/>
											<NumberField
												label="크기(Spread)"
												value={settings.global.boxShadow.spread}
												onChange={(v: any) => handleShadowSetting("global", "spread", v)}
											/>
											<CustomColorPicker
												label="그림자색"
												value={settings.global.boxShadow.color}
												onChange={(v: any) => handleShadowSetting("global", "color", v)}
											/>
										</Flex>
									)}
								</Box>
							</Tabs.Content>

							<Tabs.Content value="header" p={4}>
								<Flex gap={6} direction="column">
									<Box>
										<Text fontSize="md" fontWeight="bold" mb={2}>
											헤더 (상단 텍스트)
										</Text>
										<TextField
											label="내용 입력 (비우면 숨김)"
											value={settings.header.text}
											onChange={(v: any) => handleNestedSetting("header", "text", v)}
										/>
										<Flex gap={3} mt={2} mb={3}>
											<Box w="full">
												<Text fontSize="xs" fontWeight="bold" mb={1}>
													정렬
												</Text>
												<NativeSelect.Root size="sm">
													<NativeSelect.Field
														bg="white"
														_dark={{ bg: "gray.700" }}
														value={settings.header.align}
														onChange={(e) => handleNestedSetting("header", "align", e.target.value)}
													>
														<option value="left">왼쪽</option>
														<option value="center">가운데</option>
														<option value="right">오른쪽</option>
													</NativeSelect.Field>
												</NativeSelect.Root>
											</Box>
											<NumberField
												label="아래 간격"
												value={settings.header.marginB}
												onChange={(v: any) => handleNestedSetting("header", "marginB", v)}
											/>
										</Flex>
										<TypoEditor
											label="헤더 폰트 스타일"
											typo={settings.header.typo}
											onChange={(t) => handleNestedSetting("header", "typo", t)}
										/>
									</Box>
									<Box borderTop="1px solid gray" pt={4}>
										<Text fontSize="md" fontWeight="bold" mb={2}>
											푸터 (하단 텍스트)
										</Text>
										<TextField
											label="내용 입력 (비우면 숨김)"
											value={settings.footer.text}
											onChange={(v: any) => handleNestedSetting("footer", "text", v)}
										/>
										<Flex gap={3} mt={2} mb={3}>
											<Box w="full">
												<Text fontSize="xs" fontWeight="bold" mb={1}>
													정렬
												</Text>
												<NativeSelect.Root size="sm">
													<NativeSelect.Field
														bg="white"
														_dark={{ bg: "gray.700" }}
														value={settings.footer.align}
														onChange={(e) => handleNestedSetting("footer", "align", e.target.value)}
													>
														<option value="left">왼쪽</option>
														<option value="center">가운데</option>
														<option value="right">오른쪽</option>
													</NativeSelect.Field>
												</NativeSelect.Root>
											</Box>
											<NumberField
												label="위쪽 간격"
												value={settings.footer.marginT}
												onChange={(v: any) => handleNestedSetting("footer", "marginT", v)}
											/>
										</Flex>
										<TypoEditor
											label="푸터 폰트 스타일"
											typo={settings.footer.typo}
											onChange={(t) => handleNestedSetting("footer", "typo", t)}
										/>
									</Box>
								</Flex>
							</Tabs.Content>

							<Tabs.Content value="nowPlaying" p={4}>
								<Flex gap={4} mb={4} align="center">
									<Box>
										<Text fontSize="xs" fontWeight="bold" mb={1}>
											배열 구조
										</Text>
										<Group attached>
											<Button
												size="sm"
												variant={settings.nowPlaying.layout === "singleLine" ? "solid" : "outline"}
												onClick={() => handleNestedSetting("nowPlaying", "layout", "singleLine")}
											>
												1줄 배열
											</Button>
											<Button
												size="sm"
												variant={settings.nowPlaying.layout === "doubleLine" ? "solid" : "outline"}
												onClick={() => handleNestedSetting("nowPlaying", "layout", "doubleLine")}
											>
												2줄 배열
											</Button>
										</Group>
									</Box>
									<Box pt={5}>
										<Switch.Root
											checked={settings.nowPlaying.showNumber}
											onCheckedChange={(e) => handleNestedSetting("nowPlaying", "showNumber", e.checked)}
										>
											<Switch.HiddenInput />
											<Switch.Control />
											<Switch.Label fontSize="sm" fontWeight="bold">
												번호 표시
											</Switch.Label>
										</Switch.Root>
									</Box>
								</Flex>

								<Flex flexWrap="wrap" gap={3} mb={4}>
									<NumberField
										label="카드 안쪽 여백"
										value={settings.nowPlaying.padding}
										onChange={(v: any) => handleNestedSetting("nowPlaying", "padding", v)}
									/>
									<NumberField
										label="카드 둥글기"
										value={settings.nowPlaying.borderRadius}
										onChange={(v: any) => handleNestedSetting("nowPlaying", "borderRadius", v)}
									/>
									<NumberField
										label="대기곡과의 간격"
										value={settings.nowPlaying.marginB}
										onChange={(v: any) => handleNestedSetting("nowPlaying", "marginB", v)}
									/>
								</Flex>

								<Flex flexWrap="wrap" gap={3} mb={4}>
									<CustomColorPicker
										label="카드 배경색"
										value={settings.nowPlaying.bgColor}
										onChange={(v: any) => handleNestedSetting("nowPlaying", "bgColor", v)}
									/>
									<CustomColorPicker
										label="강조 포인트색"
										value={settings.nowPlaying.highlightColor}
										onChange={(v: any) => handleNestedSetting("nowPlaying", "highlightColor", v)}
									/>
								</Flex>

								<Box p={3} bg="gray.100" _dark={{ bg: "gray.700" }} borderRadius="md" mb={4}>
									<Switch.Root
										checked={settings.nowPlaying.boxShadow.enabled}
										onCheckedChange={(e) => handleShadowSetting("nowPlaying", "enabled", e.checked)}
										mb={2}
									>
										<Switch.HiddenInput />
										<Switch.Control />
										<Switch.Label fontSize="sm" fontWeight="bold">
											빛번짐/네온효과 켜기
										</Switch.Label>
									</Switch.Root>
									{settings.nowPlaying.boxShadow.enabled && (
										<Flex gap={2} align="center">
											<NumberField
												label="가로위치(X)"
												value={settings.nowPlaying.boxShadow.x}
												onChange={(v: any) => handleShadowSetting("nowPlaying", "x", v)}
											/>
											<NumberField
												label="세로위치(Y)"
												value={settings.nowPlaying.boxShadow.y}
												onChange={(v: any) => handleShadowSetting("nowPlaying", "y", v)}
											/>
											<NumberField
												label="흐림(Blur)"
												value={settings.nowPlaying.boxShadow.blur}
												onChange={(v: any) => handleShadowSetting("nowPlaying", "blur", v)}
											/>
											<NumberField
												label="크기(Spread)"
												value={settings.nowPlaying.boxShadow.spread}
												onChange={(v: any) => handleShadowSetting("nowPlaying", "spread", v)}
											/>
											<CustomColorPicker
												label="그림자색"
												value={settings.nowPlaying.boxShadow.color}
												onChange={(v: any) => handleShadowSetting("nowPlaying", "color", v)}
											/>
										</Flex>
									)}
								</Box>

								<Flex direction="column" gap={3}>
									<TypoEditor
										label="[번호] 스타일"
										typo={settings.nowPlaying.numTypo}
										onChange={(t) => handleNestedSetting("nowPlaying", "numTypo", t)}
									/>
									<TypoEditor
										label="[곡명] 스타일"
										typo={settings.nowPlaying.titleTypo}
										onChange={(t) => handleNestedSetting("nowPlaying", "titleTypo", t)}
									/>
									<TypoEditor
										label="[가수] 스타일"
										typo={settings.nowPlaying.singerTypo}
										onChange={(t) => handleNestedSetting("nowPlaying", "singerTypo", t)}
									/>

									<Box p={3} borderWidth="1px" borderRadius="md" bg="blue.50" _dark={{ bg: "blue.900" }}>
										<TextField
											label="[재생 중 텍스트] (비우면 사라짐)"
											value={settings.nowPlaying.playingText.text}
											onChange={(v: any) =>
												handleNestedSetting("nowPlaying", "playingText", {
													...settings.nowPlaying.playingText,
													text: v,
												})
											}
										/>
										<Box mt={2}>
											<TypoEditor
												label="텍스트 스타일"
												typo={settings.nowPlaying.playingText.typo}
												onChange={(t) =>
													handleNestedSetting("nowPlaying", "playingText", {
														...settings.nowPlaying.playingText,
														typo: t,
													})
												}
											/>
										</Box>
									</Box>
								</Flex>
							</Tabs.Content>

							<Tabs.Content value="waiting" p={4}>
								<Flex gap={4} mb={4} align="center">
									<Box>
										<Text fontSize="xs" fontWeight="bold" mb={1}>
											배열 구조
										</Text>
										<Group attached>
											<Button
												size="sm"
												variant={settings.waitingList.layout === "singleLine" ? "solid" : "outline"}
												onClick={() => handleNestedSetting("waitingList", "layout", "singleLine")}
											>
												1줄 배열
											</Button>
											<Button
												size="sm"
												variant={settings.waitingList.layout === "doubleLine" ? "solid" : "outline"}
												onClick={() => handleNestedSetting("waitingList", "layout", "doubleLine")}
											>
												2줄 배열
											</Button>
										</Group>
									</Box>
									<Box pt={5}>
										<Switch.Root
											checked={settings.waitingList.showNumber}
											onCheckedChange={(e) => handleNestedSetting("waitingList", "showNumber", e.checked)}
										>
											<Switch.HiddenInput />
											<Switch.Control />
											<Switch.Label fontSize="sm" fontWeight="bold">
												번호 표시
											</Switch.Label>
										</Switch.Root>
									</Box>
								</Flex>

								<Flex flexWrap="wrap" gap={3} mb={4}>
									<NumberField
										label="안쪽 여백"
										value={settings.waitingList.padding}
										onChange={(v: any) => handleNestedSetting("waitingList", "padding", v)}
									/>
									<NumberField
										label="모서리 곡률"
										value={settings.waitingList.borderRadius}
										onChange={(v: any) => handleNestedSetting("waitingList", "borderRadius", v)}
									/>
									<NumberField
										label="곡 사이 간격"
										value={settings.waitingList.gap}
										onChange={(v: any) => handleNestedSetting("waitingList", "gap", v)}
									/>
								</Flex>

								<Flex flexWrap="wrap" gap={3} mb={4}>
									<CustomColorPicker
										label="대기곡 배경색"
										value={settings.waitingList.bgColor}
										onChange={(v: any) => handleNestedSetting("waitingList", "bgColor", v)}
									/>
								</Flex>

								<Flex direction="column" gap={3}>
									<TypoEditor
										label="[번호] 스타일"
										typo={settings.waitingList.numTypo}
										onChange={(t) => handleNestedSetting("waitingList", "numTypo", t)}
									/>
									<TypoEditor
										label="[곡명] 스타일"
										typo={settings.waitingList.titleTypo}
										onChange={(t) => handleNestedSetting("waitingList", "titleTypo", t)}
									/>
									<TypoEditor
										label="[가수] 스타일"
										typo={settings.waitingList.singerTypo}
										onChange={(t) => handleNestedSetting("waitingList", "singerTypo", t)}
									/>
								</Flex>
							</Tabs.Content>

							<Tabs.Content value="wrapper" p={4}>
								<Box mb={6} p={3} bg="blue.50" _dark={{ bg: "blue.900" }} borderRadius="md">
									<Text fontWeight="bold" fontSize="md" mb={2}>
										애니메이션 속도 (0 = 정지)
									</Text>
									<Flex gap={4}>
										<NumberField
											label="스크롤 속도 (숫자가 클수록 빠름)"
											value={settings.listWrapper.scrollSpeed}
											min={0}
											onChange={(v: any) => handleNestedSetting("listWrapper", "scrollSpeed", v)}
										/>
										<NumberField
											label="전광판 속도 (글자가 길 때)"
											value={settings.listWrapper.marqueeSpeed}
											min={0}
											onChange={(v: any) => handleNestedSetting("listWrapper", "marqueeSpeed", v)}
										/>
									</Flex>
								</Box>
								<Box mb={6}>
									<Text fontWeight="bold" fontSize="md" mb={2}>
										위아래 자연스러운 마스크 페이드 (%)
									</Text>
									<Flex gap={4}>
										<NumberField
											label="위쪽 흐려짐 (%)"
											min={0}
											max={50}
											value={settings.listWrapper.maskFadeTop}
											onChange={(v: any) => handleNestedSetting("listWrapper", "maskFadeTop", v)}
										/>
										<NumberField
											label="아래쪽 흐려짐 (%)"
											min={0}
											max={50}
											value={settings.listWrapper.maskFadeBottom}
											onChange={(v: any) => handleNestedSetting("listWrapper", "maskFadeBottom", v)}
										/>
									</Flex>
								</Box>
								<Box>
									<Text fontWeight="bold" fontSize="md" mb={2}>
										목록 바깥 테두리
									</Text>
									<Flex gap={4}>
										<CustomColorPicker
											label="테두리색"
											value={settings.listWrapper.borderColor}
											onChange={(v: any) => handleNestedSetting("listWrapper", "borderColor", v)}
										/>
										<NumberField
											label="테두리 굵기"
											value={settings.listWrapper.borderWidth}
											onChange={(v: any) => handleNestedSetting("listWrapper", "borderWidth", v)}
										/>
										<NumberField
											label="테두리 모서리 둥글기"
											value={settings.listWrapper.borderRadius}
											onChange={(v: any) => handleNestedSetting("listWrapper", "borderRadius", v)}
										/>
									</Flex>
								</Box>
							</Tabs.Content>
						</Tabs.Root>
					</Box>
					<Flex gap={4} flex={1} minH="250px">
						<Box display="flex" flexDirection="column" flex={2}>
							<Text mb={2} fontWeight="bold" fontSize="sm">
								곡 목록 일괄 입력
							</Text>
							<FastTextarea onChange={handleTextChange} serverText={serverText} />
						</Box>
						<Box display="flex" flexDirection="column" flex={1}>
							<Flex justify="space-between" align="center" mb={2}>
								<Text fontWeight="bold" fontSize="sm">
									현재 재생 곡
								</Text>
								<Button size="xs" colorPalette="red" variant="outline" onClick={() => handleSetPlaying(null)}>
									선택 해제
								</Button>
							</Flex>
							<Flex
								direction="column"
								gap={1}
								overflowY="auto"
								flex={1}
								p={2}
								bg="gray.50"
								_dark={{ bg: "gray.800" }}
								borderRadius="md"
								borderWidth="1px"
							>
								{songList.map((song) => (
									<Flex
										key={song.id}
										justify="space-between"
										align="center"
										p={2}
										bg={song.status === "playing" ? "blue.100" : "white"}
										_dark={{ bg: song.status === "playing" ? "blue.900" : "gray.700" }}
										borderRadius="md"
										cursor="pointer"
										onClick={() => handleSetPlaying(song.id)}
									>
										<Text
											fontSize="sm"
											fontWeight={song.status === "playing" ? "bold" : "normal"}
											truncate
											maxW="200px"
										>
											{song.title}
										</Text>
										{song.status === "playing" && (
											<Badge size="xs" colorPalette="blue" flexShrink={0}>
												재생 중
											</Badge>
										)}
									</Flex>
								))}
							</Flex>
						</Box>
					</Flex>
				</Flex>

				<Flex direction="column" flex={1} bg="gray.900" borderRadius="md" p={4} overflow="hidden">
					<Flex justify="space-between" align="center" mb={4}>
						<Text color="white" fontWeight="bold">
							오버레이 미리보기
						</Text>
						<Button size="sm" onClick={() => setIsFullscreen(true)}>
							전체화면
						</Button>
					</Flex>
					<Center
						flex={1}
						overflow="auto"
						bgImage="linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)"
						bgSize="20px 20px"
						bgPos="0 0, 0 10px, 10px -10px, -10px 0px"
						borderRadius="md"
					>
						{previewSettings && <OverlayContentView settings={previewSettings} songList={previewSongList} />}
					</Center>
				</Flex>
			</Flex>

			{isFullscreen && previewSettings && (
				<Portal>
					<Box position="fixed" top={0} left={0} w="100vw" h="100vh" zIndex={9999} bg="gray.900">
						<Button
							position="absolute"
							top={4}
							right={4}
							colorPalette="red"
							zIndex={10000}
							onClick={() => setIsFullscreen(false)}
						>
							닫기 (ESC)
						</Button>
						<Center w="full" h="full">
							<OverlayContentView settings={previewSettings} songList={previewSongList} />
						</Center>
					</Box>
				</Portal>
			)}

			{/* 사용설명서 */}
			{isManualOpen && (
				<Portal>
					<Flex
						position="fixed"
						top={0}
						left={0}
						w="100vw"
						h="100vh"
						zIndex={10000}
						bg="rgba(0, 0, 0, 0.7)"
						align="center"
						justify="center"
						p={4}
					>
						<Box
							bg="white"
							_dark={{ bg: "gray.800" }}
							p={6}
							borderRadius="xl"
							w="full"
							maxW="600px"
							maxH="85vh"
							overflowY="auto"
							position="relative"
							boxShadow="2xl"
						>
							<Button
								position="absolute"
								top={4}
								right={4}
								size="sm"
								variant="outline"
								colorPalette="red"
								onClick={() => setIsManualOpen(false)}
							>
								닫기 ✕
							</Button>

							<Heading size="md" mb={6} borderBottom="2px solid" borderColor="blue.500" pb={2} display="inline-block">
								📖 오버레이 관리자 & OBS 독(Dock) 사용설명서
							</Heading>

							<Flex direction="column" gap={5}>
								<Box>
									<Text fontWeight="800" color="blue.500" fontSize="lg" mb={1}>
										1. 방송 (OBS) 화면에 오버레이 띄우기
									</Text>
									<Text fontSize="sm" color="gray.700" _dark={{ color: "gray.300" }} lineHeight="tall">
										• 상단의 <b>[오버레이 복사]</b> 버튼을 누릅니다.
										<br />• OBS 등 방송 프로그램에서 <b>브라우저 소스</b>를 추가한 뒤 URL에 붙여넣습니다.
										<br />
										<Box
											mt={2}
											p={2}
											bg="blue.50"
											_dark={{ bg: "blue.900" }}
											borderRadius="md"
											borderLeft="3px solid"
											borderColor="blue.500"
										>
											💡 <b>OBS 브라우저 소스 권장 크기 설정</b>
											<br />
											현재 편집기 세팅에 맞춰 속성창에 아래 숫자를 그대로 입력하세요!
											<br />- 너비 (Width):{" "}
											<Text as="span" fontWeight="bold" color="blue.600" _dark={{ color: "blue.300" }}>
												{settings.global.width}
											</Text>
											<br />- 높이 (Height):{" "}
											<Text as="span" fontWeight="bold" color="blue.600" _dark={{ color: "blue.300" }}>
												{settings.global.height === 0
													? "800 (곡 목록에 맞춰 넉넉하게 적어주세요)"
													: settings.global.height}
											</Text>
										</Box>
									</Text>
								</Box>

								<Box>
									<Text fontWeight="800" color="purple.500" fontSize="lg" mb={1}>
										2. OBS 독(Dock)으로 방송 중 컨트롤하기 ⭐
									</Text>
									<Text fontSize="sm" color="gray.700" _dark={{ color: "gray.300" }} lineHeight="tall">
										• 상단의 <b>[OBS 독(Dock) 복사]</b> 버튼을 누릅니다. (이 주소엔 비밀번호가 포함되어 있습니다)
										<br />• OBS 프로그램 상단 메뉴에서 <b>[독(Docks)] ➔ [사용자 지정 브라우저 독]</b>을 클릭합니다.
										<br />• 독 이름(예: 플레이리스트)을 짓고, 방금 복사한 URL을 붙여넣은 뒤 <b>[적용]</b>을 누릅니다.
										<br />•{" "}
										<b>
											이제 방송 중에 브라우저 창을 띄울 필요 없이, OBS 화면 안에서 바로 클릭하여 곡을 넘길 수 있습니다!
										</b>
									</Text>
								</Box>

								<Box>
									<Text fontWeight="800" color="green.500" fontSize="lg" mb={1}>
										3. 곡 리스트 입력 및 조작
									</Text>
									<Text fontSize="sm" color="gray.700" _dark={{ color: "gray.300" }} lineHeight="tall">
										• <b>곡 목록 일괄 입력란</b>에 <code>곡명 - 가수</code> 형태로 엔터를 치며 입력하면 대기열이
										생성됩니다.
										<br />• 우측의 목록 중 원하는 곡을 <b>마우스로 클릭</b>하면 즉시 <b>현재 재생 곡</b>으로 전환됩니다.
										<br />
									</Text>
								</Box>

								<Box>
									<Text fontWeight="800" color="orange.500" fontSize="lg" mb={1}>
										4. 디자인 (스타일) 꾸미기
									</Text>
									<Text fontSize="sm" color="gray.700" _dark={{ color: "gray.300" }} lineHeight="tall">
										• <b>스타일 편집기</b>의 탭을 이동하며 폰트, 크기, 간격, 마스크 페이드아웃 효과 등을 세밀하게 조작할
										수 있습니다.
										<br />• 디자인을 망쳤을 경우 탭 우측의 <b>[↩️ 취소]</b> 버튼을 눌러 과거로 되돌리거나,{" "}
										<b>[치지직], [모던]</b> 등 프리셋 템플릿 버튼을 눌러 쉽게 초기화하세요.
									</Text>
								</Box>

								<Box bg="gray.100" _dark={{ bg: "gray.700" }} p={3} borderRadius="md">
									<Text fontWeight="bold" fontSize="sm" mb={1}>
										💡 꿀팁
									</Text>
									<Text fontSize="xs" color="gray.600" _dark={{ color: "gray.400" }}>
										• 곡 리스트 입력란을 넓게 쓰고 싶다면 '스타일 편집기' 우측의 <b>[▴] 아이콘</b>을 눌러 편집기를
										접어두세요.
										<br />• 오버레이 뷰 전체화면 모드에서는 <code>ESC</code> 키를 누르면 바로 빠져나올 수 있습니다.
									</Text>
								</Box>
							</Flex>
						</Box>
					</Flex>
				</Portal>
			)}
		</Flex>
	);
}
