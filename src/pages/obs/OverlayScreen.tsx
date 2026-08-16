import { useEffect, useState, useRef } from "react";
import { Box, Center, Flex, Spinner, Text, VStack, Badge } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { OverlayContentView } from "./lib/comp";
import { useMeta } from "@/hooks/useMeta";
import { API_BASE_URL } from "@/config/base-url";

const SOCKET_URL = API_BASE_URL;
type ConnectionStatus = "loading" | "connected" | "error";

export default function OverlayScreen() {
	useMeta({ title: "세트리스트 오버레이" });
	const { roomId } = useParams<{ roomId: string }>();
	const [status, setStatus] = useState<ConnectionStatus>("loading");
	const [errorMessage, setErrorMessage] = useState<string>("");
	const [songList, setSongList] = useState<Broadcast.Song[]>([]);
	const [settings, setSettings] = useState<Broadcast.Settings | null>(null);

	useEffect(() => {
		if (!roomId) {
			setStatus("error");
			setErrorMessage("방 번호가 없습니다.");
			return;
		}

		const socket = io(SOCKET_URL, { path: "/ws/", query: { roomId } });
		socket.on("connect", () => setStatus("connected"));
		socket.on("connect_error", (err) => {
			setStatus("error");
			setErrorMessage(`서버 연결 실패: ${err.message}`);
		});
		socket.on("syncData", (data: Broadcast.DataPayload) => {
			setSongList(data.songList);
			setSettings(data.settings);
		});
		return () => {
			socket.disconnect();
		};
	}, [roomId]);

	if (status === "loading")
		return (
			<Center w="100vw" h="100vh" bg="transparent">
				<VStack>
					<Spinner color="white" />
					<Text color="white">연결 중...</Text>
				</VStack>
			</Center>
		);
	if (status === "error")
		return (
			<Box p={6}>
				<Box bg="red.600" p={4} borderRadius="md">
					<Text color="white">⚠️ {errorMessage}</Text>
				</Box>
			</Box>
		);
	if (status === "connected" && !settings)
		return (
			<Box p={6}>
				<Text color="white">대기 중...</Text>
			</Box>
		);

	return (
		<Box w="100vw" h="100vh" bg="transparent" p={6} overflow="hidden">
			<style>{`
            html, body, #root {
               background-color: transparent !important;
            }
         `}</style>
			<OverlayContentView settings={settings!} songList={songList} />
		</Box>
	);
}
