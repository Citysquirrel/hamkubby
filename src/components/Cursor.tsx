import { Image } from "@chakra-ui/react";
import { useEffect, useRef } from "react";

const Cursor: React.FC = () => {
	// DOM 요소에 직접 접근하기 위한 ref
	const cursorRef = useRef<HTMLImageElement>(null);

	// 좌표 및 회전 값을 저장하기 위한 ref (리렌더링 방지)
	const coordsRef = useRef({
		targetX: 0, // 마우스의 목표 위치
		targetY: 0,
		currentX: 0, // 별의 현재 위치 (Lerp로 따라감)
		currentY: 0,
		rotation: 0, // 현재 회전 각도
		rotationSpeed: 0, // 현재 회전 속도 (움직임에 비례)
		lastMoveTime: 0, // 마지막 움직임 시간 (멈춤 감지용)
	});

	// 애니메이션 프레임 ID 저장
	const animationFrameIdRef = useRef<number>(0);

	useEffect(() => {
		// 마우스 움직임 이벤트 리스너
		const handleMouseMove = (e: MouseEvent) => {
			const { clientX, clientY } = e;
			coordsRef.current.targetX = clientX;
			coordsRef.current.targetY = clientY;
			coordsRef.current.lastMoveTime = Date.now(); // 움직임 시간 기록
		};

		window.addEventListener("mousemove", handleMouseMove);

		// 💡 핵심: requestAnimationFrame 애니메이션 루프
		const animateCursor = () => {
			const { targetX, targetY, currentX, currentY, rotation, rotationSpeed, lastMoveTime } = coordsRef.current;

			// 1. Lerp (Linear Interpolation)를 이용한 부드러운 위치 추적
			const easeFactorPos = 0.05; // 위치 부드러움 조절
			const nextX = currentX + (targetX - currentX) * easeFactorPos;
			const nextY = currentY + (targetY - currentY) * easeFactorPos;

			// 2. 뱅글뱅글 회전 로직 (관성 감속 추가)
			const timeSinceLastMove = Date.now() - lastMoveTime;
			const isMoving = timeSinceLastMove < 50; // 마지막 움직임 후 50ms 이내면 움직이는 중으로 판단

			// 마우스 속도 계산
			const mouseSpeed = Math.sqrt(Math.pow(targetX - currentX, 2) + Math.pow(targetY - currentY, 2));

			// 목표 회전 속도 결정
			let targetRotationSpeed = 0.5;
			if (isMoving) {
				targetRotationSpeed = mouseSpeed * 0.15; // 움직일 때 속도
			}

			// 회전 속도 lerp (가속 및 감속 모두 부드럽게)
			// 💡 핵심: 감속 계수를 0.1에서 0.02로 낮춰 관성을 대폭 늘림
			// 마우스가 멈추면 targetRotationSpeed는 0이 되지만, 0.02 비율로 감소하므로 더 서서히 멈춥니다.
			let nextRotationSpeed = rotationSpeed + (targetRotationSpeed - rotationSpeed) * 0.02; // 이전 값: 0.1

			// 회전 속도 제한 (너무 빠르면 안되니까)
			nextRotationSpeed = Math.max(-15, Math.min(15, nextRotationSpeed));

			// 현재 회전 각도 업데이트 (부드럽게 누적)
			const nextRotation = rotation + nextRotationSpeed;

			// 3. ref 값 업데이트 (렌더링 없이 값만 변경)
			coordsRef.current.currentX = nextX;
			coordsRef.current.currentY = nextY;
			coordsRef.current.rotation = nextRotation;
			coordsRef.current.rotationSpeed = nextRotationSpeed;

			// 4. 🔥 DOM 직접 업데이트
			if (cursorRef.current) {
				// translate3d를 사용하여 하드웨어 가속 유도
				cursorRef.current.style.transform = `translate3d(-50%, -50%, 0) translate3d(${nextX}px, ${nextY}px, 0) rotate(${nextRotation}deg)`;
			}

			// 다음 프레임 요청
			animationFrameIdRef.current = requestAnimationFrame(animateCursor);
		};

		// 애니메이션 루프 시작
		animateCursor();

		// 클린업 함수
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			if (animationFrameIdRef.current) {
				cancelAnimationFrame(animationFrameIdRef.current);
			}
		};
	}, []);

	const cursorStyle: React.CSSProperties = {
		position: "fixed",
		top: 0,
		left: 0,
		width: "30px",
		height: "30px",
		pointerEvents: "none",
		zIndex: 9999,
		willChange: "transform",
		opacity: 0.8,
		filter: "drop-shadow(0px 0px 4px rgba(0, 0, 0, 0.4))",
	};

	return (
		<Image
			ref={cursorRef}
			style={cursorStyle}
			src="https://nng-phinf.pstatic.net/MjAyNTEyMjJfMjE3/MDAxNzY2Mzg2OTg3ODk1.1acZIMhW2shvmGDkv6taba35Ojr75XDqxpCKaUIzSFwg.s4E5tYOZv7eJSZwFELZ_ybV8rztf-z5Nd3Tqd5ucPfgg.PNG/image.png?type=f60_60_na"
			boxSize="120px"
			borderRadius="full"
			fit="cover"
			border="2px solid"
			borderColor="seagreen"
		/>
	);
};
export default Cursor;
