import { useEffect, useState } from "react";
import { Box } from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";

export default function OverlayScreen() {
	// React Router의 훅을 사용해 파라미터 추출
	const [searchParams] = useSearchParams();
	const roomId = searchParams.get("room");
	const [songList, setSongList] = useState([]);

	useEffect(() => {
		// roomId가 없으면 동작하지 않음
		if (!roomId) return;

		const socket = io("http://localhost:3467/ws", {
			query: { roomId },
		});

		socket.on("syncList", (newList) => {
			setSongList(newList);
		});

		return () => {
			socket.disconnect();
		};
	}, [roomId]);

	return (
		<Box w="100vw" h="100vh" bg="transparent" color="white" p={4}>
			{songList.map((song, i) => (
				<div key={i}>{song}</div>
			))}
		</Box>
	);
}
