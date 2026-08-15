import { Box, Heading } from "@chakra-ui/react";
import { useRoomId } from "@hooks/useRoomId";
// 앞서 작성한 소켓 연결 및 UI 로직 포함

export default function AdminPanel() {
	const roomId = useRoomId(); // URL 파라미터 확인 및 생성

	return (
		<Box p={8}>
			<Heading>방송 컨트롤 패널</Heading>
			<p>오버레이 주소 복사용: http://localhost:3000/overlay?room={roomId}</p>
			{/* 노래 추가 폼 및 리스트 UI */}
		</Box>
	);
}
