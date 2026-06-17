import { Image } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

const Cursor: React.FC = () => {
	const cursorRef = useRef<HTMLImageElement>(null);

	const [isMobile, setIsMobile] = useState(false);

	// 좌표 및 회전 값을 저장하기 위한 ref (리렌더링 방지)
	const coordsRef = useRef({
		targetX: 0, // 마우스의 목표 위치
		targetY: 0,
		currentX: 0, // 별의 현재 위치 (Lerp로 따라감)
		currentY: 0,
		rotation: 0, // 현재 회전 각도
		rotationSpeed: 0, // 현재 회전 속도 (움직임에 비례)
		lastMoveTime: 0, // 마지막 움직임 시간 (멈춤 감지용)
		isAnimating: true, // 애니메이션 루프 실행 상태 제어 플래그
	});

	// 애니메이션 프레임 ID 저장
	const animationFrameIdRef = useRef<number>(0);

	const stopTimeoutRef = useRef<number | null>(null);
	const startAnimationRef = useRef<() => void>(() => {});

	useEffect(() => {
		// 터치 디바이스(모바일) 감지 로직
		// 미디어 쿼리 방식과 터치 이벤트 존재 여부를 모두 확인하여 정확도 향상
		const isTouchDevice = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
		if (isTouchDevice) {
			setIsMobile(true);
			return; // 모바일이면 하위 이벤트 리스너나 애니메이션 루프를 실행하지 않음
		}

		// 최초 상호작용 여부 플래그
		let hasInteracted = false;

		// 마우스 움직임 이벤트 리스너
		const handleMouseMove = (e: MouseEvent) => {
			const { clientX, clientY } = e;
			if (!hasInteracted) {
				hasInteracted = true;

				// 좌측 상단(0, 0)에서 날아오는 현상을 방지하기 위해
				// 현재(current) 위치를 즉시 마우스 위치로 덮어씌움
				coordsRef.current.currentX = clientX;
				coordsRef.current.currentY = clientY;

				// 투명도를 올려 부드럽게 나타나게 함 (transition 효과 적용됨)
				if (cursorRef.current) {
					cursorRef.current.style.opacity = "0.8";
				}
			}
			coordsRef.current.targetX = clientX;
			coordsRef.current.targetY = clientY;
			coordsRef.current.lastMoveTime = Date.now(); // 움직임 시간 기록
		};

		window.addEventListener("mousemove", handleMouseMove);

		// 💡 핵심: requestAnimationFrame 애니메이션 루프
		const animateCursor = () => {
			if (!coordsRef.current.isAnimating) {
				animationFrameIdRef.current = 0;
				return;
			}

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

		startAnimationRef.current = () => {
			if (animationFrameIdRef.current === 0) {
				animateCursor();
			}
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

	// 커서가 화면 밖으로 나갈때와 들어왔을 때
	useEffect(() => {
		const handleMouseLeave = () => {
			if (cursorRef.current) {
				cursorRef.current.style.opacity = "0";
			}

			//? 새로 추가된 최적화 코드 시작
			// 기존에 걸려있던 타이머가 있다면 지우고, 400ms 뒤에 애니메이션 루프 정지
			if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
			stopTimeoutRef.current = setTimeout(() => {
				coordsRef.current.isAnimating = false;
			}, 400); // CSS transition 시간(0.4s)과 동일하게 맞춤
			//? 새로 추가된 최적화 코드 끝
		};

		const handleMouseEnter = () => {
			if (cursorRef.current) {
				cursorRef.current.style.opacity = "0.8";
			}

			//? 새로 추가된 최적화 코드 시작
			// 커서가 400ms가 지나기 전에 다시 들어왔다면 정지 타이머 취소
			if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);

			// 플래그를 다시 켜고 애니메이션 즉시 재시작
			coordsRef.current.isAnimating = true;
			startAnimationRef.current();
			//? 새로 추가된 최적화 코드 끝
		};

		// document 객체에 이벤트 리스너 등록
		document.addEventListener("mouseleave", handleMouseLeave);
		document.addEventListener("mouseenter", handleMouseEnter);

		// 메모리 누수 방지
		return () => {
			document.removeEventListener("mouseleave", handleMouseLeave);
			document.removeEventListener("mouseenter", handleMouseEnter);

			//? 새로 추가된 최적화 코드: 컴포넌트 언마운트 시 타이머 찌꺼기 제거
			if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
		};
	}, []);

	if (isMobile) return null;

	const cursorStyle: React.CSSProperties = {
		position: "fixed",
		top: 0,
		left: 0,
		width: "30px",
		height: "30px",
		pointerEvents: "none",
		zIndex: 9999,
		willChange: "transform",
		opacity: 0,
		transition: "opacity 0.4s ease-out", // transform이 꼬이지 않도록 opacity에만 적용
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
