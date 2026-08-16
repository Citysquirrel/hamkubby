import { Badge, Box, Button, Center, Flex, Spinner, Text } from "@chakra-ui/react";
import { useBroadcastStore } from "@store/useBroadcastStore";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { FastTextarea } from "./lib/comp";
import { useMeta } from "@/hooks/useMeta";

const SOCKET_URL = "https://localhost:3467";

export default function DockPanel() {
	useMeta({ title: "세트리스트 오버레이 독 패널" });
	const { roomId } = useParams<{ roomId: string }>();
	const [searchParams] = useSearchParams();

	const urlPin = searchParams.get("pin");
	const [pin] = useState(urlPin || localStorage.getItem(`obs_pin_${roomId}`) || "");

	const [socket, setSocket] = useState<Socket | null>(null);
	const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
	const [serverText, setServerText] = useState("");

	const songList = useBroadcastStore((state) => state.songList);
	const settings = useBroadcastStore((state) => state.settings);
	const setSongList = useBroadcastStore((state) => state.setSongList);
	const syncFromServer = useBroadcastStore((state) => state.syncFromServer);

	useEffect(() => {
		if (!roomId || !pin) {
			setIsAuthorized(false);
			return;
		}
		const newSocket = io(SOCKET_URL, { path: "/ws/", query: { roomId } });
		setSocket(newSocket);

		newSocket.on("connect", () => newSocket.emit("authRoom", { roomId, pin }));
		newSocket.on("authSuccess", () => setIsAuthorized(true));
		newSocket.on("authFail", () => setIsAuthorized(false));
		newSocket.on("syncData", (data: Broadcast.DataPayload) => {
			syncFromServer(data);
			const text = data.songList.map((s) => `${s.title} ${s.singer ? "- " + s.singer : ""}`).join("\n");
			setServerText(text);
		});

		return () => {
			newSocket.disconnect();
		};
	}, [roomId, pin]);

	const handleTextChange = (val: string) => {
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
		const newList = songList.map((song) => ({
			...song,
			status: (song.id === targetId ? "playing" : "waiting") as "playing" | "waiting" | "done",
		}));
		setSongList(newList);
		if (socket && roomId) socket.emit("updateData", { roomId, pin, songList: newList, settings });
	};

	if (isAuthorized === null)
		return (
			<Center h="100vh" bg="gray.900">
				<Spinner color="white" />
			</Center>
		);
	if (isAuthorized === false)
		return (
			<Center h="100vh" bg="gray.900">
				<Text color="red.400">인증 실패 (PIN 번호를 확인하세요)</Text>
			</Center>
		);

	const playingSong = songList.find((s) => s.status === "playing");

	return (
		<Flex direction="column" h="100vh" w="100vw" bg="gray.900" color="white" overflow="hidden" p={2} gap={2}>
			<Box bg="gray.800" p={3} borderRadius="md" borderWidth="1px" borderColor="gray.700" flexShrink={0}>
				<Flex justify="space-between" align="center" mb={2}>
					<Text fontSize="xs" fontWeight="bold" color="blue.400">
						현재 재생 곡
					</Text>
					<Button size="2xs" colorPalette="red" variant="outline" onClick={() => handleSetPlaying(null)}>
						해제
					</Button>
				</Flex>
				{playingSong ? (
					<Flex align="center" gap={1}>
						<Text fontWeight="bold" fontSize="md" truncate>
							{playingSong.title}
						</Text>
						{playingSong.singer && (
							<Text fontSize="sm" color="gray.400" truncate>
								{playingSong.singer}
							</Text>
						)}
					</Flex>
				) : (
					<Text fontSize="sm" color="gray.500">
						재생 중인 곡이 없습니다.
					</Text>
				)}
			</Box>

			<Box flex={1} overflowY="auto" bg="gray.800" borderRadius="md" borderWidth="1px" borderColor="gray.700" p={2}>
				<Flex direction="column" gap={1}>
					{songList.map((song, idx) => (
						<Flex
							key={song.id}
							justify="space-between"
							align="center"
							p={2}
							bg={song.status === "playing" ? "blue.900" : "transparent"}
							borderRadius="md"
							cursor="pointer"
							_hover={{ bg: "gray.700" }}
							onClick={() => handleSetPlaying(song.id)}
						>
							<Flex direction="column" overflow="hidden" pr={2}>
								<Text fontSize="sm" fontWeight={song.status === "playing" ? "bold" : "normal"} truncate>
									{idx + 1}. {song.title}
								</Text>
								{song.singer && (
									<Text fontSize="xs" color="gray.500" truncate>
										{song.singer}
									</Text>
								)}
							</Flex>
							{song.status === "playing" && (
								<Badge size="xs" colorPalette="blue" flexShrink={0}>
									재생
								</Badge>
							)}
						</Flex>
					))}
				</Flex>
			</Box>

			<Flex direction="column" h="30%" minH="120px" flexShrink={0}>
				<Text fontSize="xs" fontWeight="bold" color="gray.400" mb={1}>
					곡 목록 일괄 입력
				</Text>
				<Box flex={1} borderRadius="md" borderWidth="1px" borderColor="gray.700" overflow="hidden">
					<FastTextarea serverText={serverText} onChange={handleTextChange} />
				</Box>
			</Flex>
		</Flex>
	);
}
