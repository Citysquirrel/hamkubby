import { Box, Heading } from "@chakra-ui/react";
import { useRoomId } from "@hooks/useRoomId";

export default function AdminPanel() {
	const roomId = useRoomId();

	return (
		<Box p={8}>
			<Heading>방송 컨트롤 패널</Heading>
			<p>오버레이 주소 복사용: http://localhost:5174/overlay?room={roomId}</p>
		</Box>
	);
}
