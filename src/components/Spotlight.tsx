import React, { useState, useEffect, useCallback } from "react";

/**
 * @description 튜토리얼 가이드의 개별 단계를 정의하는 인터페이스
 *
 * @property {string} [targetId] - 하이라이트할 대상 DOM 요소의 HTML `id` (생략 시 특정 요소 대신 화면 중앙에 안내만 표시)
 * @property {string} text - 안내 말풍선(Tooltip)에 표시될 가이드 설명 문구
 * @property {() => void} [onNext] - '다음' 버튼을 눌러 다음 단계로 넘어가기 직전에 실행할 추가 커스텀 콜백 함수
 * @property {() => void} [onPrev] - '이전' 버튼을 눌러 이전 단계로 돌아가기 직전에 실행할 추가 커스텀 콜백 함수
 * @property {boolean} [hideNextButton] - '다음' 버튼을 숨길지 여부 (예: 유저가 검색창에 글자를 치는 등 직접 미션을 수행해야만 다음으로 넘어가는 단계일 때 사용)
 */
export interface GuideStep {
	targetId?: string;
	text: string;
	onNext?: () => void;
	onPrev?: () => void;
	hideNextButton?: boolean;
}

interface SpotlightProps {
	isActive: boolean;
	steps: GuideStep[];
	currentStep: number;
	onStepChange: (step: number) => void;
	onClose: () => void;
}

/**
 * @description 지정된 `targetId` 요소를 어두운 레이어 위로 밝게 하이라이트하고, 단계별 가이드 말풍선을 제공하는 튜토리얼 스포트라이트 컴포넌트입니다.
 * @property {boolean} isActive - 활성화 여부 (false일 경우 컴포넌트가 렌더링되지 않음)
 * @property {GuideStep[]} steps - 튜토리얼을 구성하는 모든 단계의 데이터 배열
 * @property {number} currentStep - 현재 진행 중인 가이드 단계의 인덱스 번호 (0부터 시작)
 * @property {(step: number) => void} onStepChange - **setCurrentStep을 넣어주세요!** '이전/다음' 이동이나 특정 이벤트를 통해 가이드 단계(Index)를 변경할 때 호출되는 상태 제어 함수
 * @property {() => void} onClose - 튜토리얼 도중 '건너뛰기'를 누르거나, 마지막 단계에서 가이드를 완전히 종료할 때 호출되는 함수
 */
export function Spotlight({ isActive, steps, currentStep, onStepChange, onClose }: SpotlightProps) {
	const [rect, setRect] = useState<DOMRect | null>(null);
	const [tooltipHeight, setTooltipHeight] = useState(150);

	const tooltipRef = useCallback((node: HTMLDivElement | null) => {
		if (node) setTooltipHeight(node.getBoundingClientRect().height);
	}, []);

	useEffect(() => {
		if (!isActive || steps.length === 0 || !steps[currentStep]) {
			return;
		}

		const targetId = steps[currentStep].targetId;
		if (!targetId) {
			return;
		}

		let frameId: number;
		let fallbackTimer: number;

		const updatePosition = () => {
			frameId = requestAnimationFrame(() => {
				const el = document.getElementById(targetId);
				if (el) setRect(el.getBoundingClientRect());
			});
		};

		let attempts = 0;
		const findTarget = () => {
			const el = document.getElementById(targetId);
			if (el) {
				el.scrollIntoView({ behavior: "smooth", block: "center" });
				updatePosition();
			} else if (attempts < 10) {
				attempts++;
				fallbackTimer = setTimeout(findTarget, 50);
			}
		};
		findTarget();

		window.addEventListener("resize", updatePosition);
		window.addEventListener("scroll", updatePosition, { passive: true, capture: true });

		return () => {
			window.removeEventListener("resize", updatePosition);
			window.removeEventListener("scroll", updatePosition, { capture: true });
			cancelAnimationFrame(frameId);
			clearTimeout(fallbackTimer);
		};
	}, [isActive, currentStep, steps]);

	if (!isActive || !steps[currentStep]) return null;

	const step = steps[currentStep];
	const hasTarget = Boolean(step.targetId);

	if (hasTarget && !rect) return null;

	const baseTooltipStyle: React.CSSProperties = {
		width: "260px",
		backgroundColor: "#1f2937",
		border: "1px solid #4b5563",
		borderRadius: "8px",
		padding: "16px",
		color: "#f3f4f6",
		boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
		display: "flex",
		flexDirection: "column",
		gap: "12px",
		zIndex: 10000,
		pointerEvents: "auto",
		transition: "all 0.25s ease-out",
	};

	let tooltipStyle: React.CSSProperties;
	if (hasTarget && rect) {
		const isBottomTight = window.innerHeight - rect.bottom < tooltipHeight + 20;
		tooltipStyle = {
			...baseTooltipStyle,
			position: "absolute",
			left: Math.max(16, Math.min(window.innerWidth - 280, rect.left + rect.width / 2 - 130)),
			...(isBottomTight ? { bottom: window.innerHeight - rect.top + 12 } : { top: rect.bottom + 12 }),
		};
	} else {
		tooltipStyle = {
			...baseTooltipStyle,
			position: "fixed",
			top: "50%",
			left: "50%",
			transform: "translate(-50%, -50%)",
		};
	}

	const btnStyle: React.CSSProperties = {
		background: "#374151",
		color: "white",
		border: "none",
		borderRadius: "4px",
		padding: "6px 12px",
		fontSize: "11px",
		cursor: "pointer",
		fontWeight: "bold",
	};

	const handleNext = () => {
		if (step.onNext) step.onNext();
		if (currentStep < steps.length - 1) onStepChange(currentStep + 1);
		else {
			onStepChange(0);
			onClose();
		}
	};

	const handlePrev = () => {
		if (step.onPrev) step.onPrev();
		if (currentStep > 0) onStepChange(currentStep - 1);
	};

	return (
		<div style={{ position: "fixed", inset: 0, zIndex: 9999, overflow: "hidden", pointerEvents: "none" }}>
			{hasTarget && rect ? (
				<>
					<div
						style={{
							position: "absolute",
							top: rect.top,
							left: rect.left,
							width: rect.width,
							height: rect.height,
							borderRadius: "8px",
							boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.75)",
							transition: "all 0.25s ease-out",
							pointerEvents: "none",
						}}
					/>
					<div
						style={{ position: "absolute", top: 0, left: 0, right: 0, height: rect.top, pointerEvents: "auto" }}
						onClick={(e) => e.stopPropagation()}
					/>
					<div
						style={{ position: "absolute", top: rect.bottom, left: 0, right: 0, bottom: 0, pointerEvents: "auto" }}
						onClick={(e) => e.stopPropagation()}
					/>
					<div
						style={{
							position: "absolute",
							top: rect.top,
							left: 0,
							width: rect.left,
							height: rect.height,
							pointerEvents: "auto",
						}}
						onClick={(e) => e.stopPropagation()}
					/>
					<div
						style={{
							position: "absolute",
							top: rect.top,
							left: rect.right,
							right: 0,
							height: rect.height,
							pointerEvents: "auto",
						}}
						onClick={(e) => e.stopPropagation()}
					/>
				</>
			) : (
				<div
					style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.75)", pointerEvents: "auto" }}
					onClick={(e) => e.stopPropagation()}
				/>
			)}

			<div ref={tooltipRef} style={tooltipStyle}>
				<button
					onClick={() => {
						onStepChange(0);
						onClose();
					}}
					style={{
						position: "absolute",
						top: "12px",
						right: "12px",
						background: "none",
						border: "none",
						color: "#9ca3af",
						cursor: "pointer",
						fontSize: "14px",
						padding: "4px",
					}}
					title="건너뛰기"
				>
					✖
				</button>
				<div
					style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "900", letterSpacing: "1px", paddingRight: "20px" }}
				>
					STEP {currentStep + 1} <span style={{ fontWeight: "normal" }}>/ {steps.length}</span>
				</div>
				<div style={{ fontSize: "13px", lineHeight: "1.5", wordBreak: "keep-all" }}>{step.text}</div>

				<div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
					{currentStep > 0 ? (
						<button onClick={handlePrev} style={btnStyle}>
							이전
						</button>
					) : (
						<div />
					)}
					{!step.hideNextButton && (
						<button onClick={handleNext} style={{ ...btnStyle, background: "#2563eb" }}>
							{currentStep === steps.length - 1 ? "완료" : "다음"}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

// #region 다중 스포트라이트

// 말풍선 위치 타입
export type Placement = "top" | "bottom" | "left" | "right";

// 외부에서 주입받을 개별 튜토리얼 데이터 타입
export interface TutorialStep {
	selector: string;
	message: string;
	placement?: Placement; // 기본값: 'bottom'
}

// 내부에서 위치 계산이 끝난 데이터 타입
interface CalculatedStep extends TutorialStep {
	rect: DOMRect;
}

interface TutorialOverlayProps {
	steps: TutorialStep[];
	padding?: number;
	borderRadius?: number;
	onClose?: () => void;
}

export function TutorialOverlay({ steps, padding = 8, borderRadius = 8, onClose }: TutorialOverlayProps) {
	const [calculatedSteps, setCalculatedSteps] = useState<CalculatedStep[]>([]);

	// 타겟의 위치를 계산하는 함수
	const calculatePositions = useCallback(() => {
		const newSteps: CalculatedStep[] = [];

		steps.forEach((step) => {
			const element = document.querySelector(step.selector);
			if (element) {
				newSteps.push({
					...step,
					rect: element.getBoundingClientRect(),
				});
			}
		});

		setCalculatedSteps(newSteps);
	}, [steps]);

	useEffect(() => {
		calculatePositions();
		window.addEventListener("resize", calculatePositions);
		window.addEventListener("scroll", calculatePositions, true);

		return () => {
			window.removeEventListener("resize", calculatePositions);
			window.removeEventListener("scroll", calculatePositions, true);
		};
	}, [calculatePositions]);

	// 말풍선의 위치와 꼬리(Arrow) 스타일을 계산하는 헬퍼 함수
	const getTooltipStyle = (rect: DOMRect, placement: Placement = "bottom") => {
		const gap = padding + 16; // 타겟과 말풍선 사이의 간격
		let style: React.CSSProperties = { position: "absolute" };
		let arrowStyle: React.CSSProperties = { position: "absolute", width: 0, height: 0, borderStyle: "solid" };

		// CSS transform을 이용해 타겟의 중앙에 말풍선을 정렬합니다.
		switch (placement) {
			case "top":
				style = { left: rect.left + rect.width / 2, top: rect.top - gap, transform: "translate(-50%, -100%)" };
				arrowStyle = {
					left: "50%",
					bottom: "-8px",
					transform: "translateX(-50%)",
					borderWidth: "8px 8px 0 8px",
					borderColor: "#333 transparent transparent transparent",
				};
				break;
			case "bottom":
				style = { left: rect.left + rect.width / 2, top: rect.bottom + gap, transform: "translate(-50%, 0)" };
				arrowStyle = {
					left: "50%",
					top: "-8px",
					transform: "translateX(-50%)",
					borderWidth: "0 8px 8px 8px",
					borderColor: "transparent transparent #333 transparent",
				};
				break;
			case "left":
				style = { left: rect.left - gap, top: rect.top + rect.height / 2, transform: "translate(-100%, -50%)" };
				arrowStyle = {
					right: "-8px",
					top: "50%",
					transform: "translateY(-50%)",
					borderWidth: "8px 0 8px 8px",
					borderColor: "transparent transparent transparent #333",
				};
				break;
			case "right":
				style = { left: rect.right + gap, top: rect.top + rect.height / 2, transform: "translate(0, -50%)" };
				arrowStyle = {
					left: "-8px",
					top: "50%",
					transform: "translateY(-50%)",
					borderWidth: "8px 8px 8px 0",
					borderColor: "transparent #333 transparent transparent",
				};
				break;
		}

		return { style, arrowStyle };
	};

	if (calculatedSteps.length === 0) return null;

	return (
		<div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 9999 }}>
			{/* 반투명 배경 및 하이라이트 마스크 영역 */}
			<svg width="100%" height="100%" onClick={onClose} style={{ cursor: "pointer" }}>
				<defs>
					<mask id="tutorial-mask">
						<rect width="100%" height="100%" fill="white" />
						{calculatedSteps.map(({ selector, rect }) => (
							<rect
								key={`hole-${selector}`}
								x={rect.left - padding}
								y={rect.top - padding}
								width={rect.width + padding * 2}
								height={rect.height + padding * 2}
								rx={borderRadius}
								fill="black"
								style={{ transition: "all 0.3s ease" }}
							/>
						))}
					</mask>
				</defs>
				<rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.6)" mask="url(#tutorial-mask)" />
			</svg>

			{/* 말풍선(Tooltip) 렌더링 영역 - SVG 위에 얹혀짐 */}
			{calculatedSteps.map(({ selector, message, placement = "bottom", rect }) => {
				const { style, arrowStyle } = getTooltipStyle(rect, placement);

				return (
					<div
						key={`tooltip-${selector}`}
						style={{
							...style,
							backgroundColor: "#333",
							color: "white",
							padding: "12px 16px",
							borderRadius: "8px",
							fontSize: "14px",
							fontWeight: 500,
							whiteSpace: "nowrap",
							boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
							transition: "all 0.3s ease",
							pointerEvents: "none", // 말풍선 클릭 무시
						}}
					>
						{message}
						{/* 말풍선 꼬리(화살표) */}
						<div style={arrowStyle} />
					</div>
				);
			})}
		</div>
	);
}

// #endregion
