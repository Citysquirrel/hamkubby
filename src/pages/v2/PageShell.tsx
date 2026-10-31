import { useEffect, useRef, useState, type ReactNode } from "react";
import { useColorMode } from "../../components/ui/color-mode";
import { isBoolean, readStoredValue } from "../../lib/storage";
import { BackgroundEffects, Horn } from "./Motifs";
import { PageTabs } from "./PageTabs";
import { PageHelp } from "./PageHelp";
import { Profile } from "./Profile";
import { Footer } from "./Footer";
import { GoToTop } from "./GoToTop";
import { NavigationLoading } from "./LoadingState";
import { QueuePlayer } from "../../components/QueuePlayer";
import { usePlayerLayout } from "../../hooks/usePlayerLayout";
import { usePlayerStore } from "../../store/usePlayerStore";
import { ListMusic, MousePointer2 } from "lucide-react";
import "./songbook.css";

const defaultPortrait = "/images/v2/portrait.webp";
const portraits = Object.keys(
	import.meta.glob(
		["./images/v2/portrait*.{webp,png,jpg,jpeg,avif}", "./images/v2/portraits/*.{webp,png,jpg,jpeg,avif}"],
		{ base: "../../../public" },
	),
).map((path) => path.slice(1));

export function PageShell({
	children,
	cursorAvailable,
	cursorEnabled,
	onToggleCursor,
}: {
	children: ReactNode;
	cursorAvailable: boolean;
	cursorEnabled: boolean;
	onToggleCursor: () => void;
}) {
	const { colorMode, toggleColorMode } = useColorMode();
	useEffect(() => {
		try {
			localStorage.removeItem("songbook-v2-intro");
		} catch {
			// 저장소 접근이 차단되어도 소개는 항상 표시한다.
		}
	}, []);
	const [portrait, setPortrait] = useState(
		() => portraits[Math.floor(Math.random() * portraits.length)] ?? defaultPortrait,
	);
	const handlePortraitError = () => setPortrait(defaultPortrait);
	const [effects] = useState(() =>
		readStoredValue("songbook-v2-effects", !window.matchMedia("(prefers-reduced-motion: reduce)").matches, isBoolean),
	);
	const [help, setHelp] = useState(false);
	const helpTriggerRef = useRef<HTMLButtonElement>(null);
	const playerOpen = usePlayerStore((state) => state.open);
	const showPlayer = usePlayerStore((state) => state.show);
	const playerLayout = usePlayerLayout(playerOpen);
	const closePlayer = () => {
		const current = usePlayerStore.getState();
		if (
			(current.playing || current.wantPlay) &&
			!window.confirm("영상이 재생 중이에요. 플레이어를 닫고 재생을 멈출까요?")
		)
			return;
		current.close();
	};

	return (
		<div id="kub-music-room" data-theme={colorMode} data-effects={effects}>
			<BackgroundEffects />
			<NavigationLoading />
			<GoToTop
				rightOffset={Number(playerLayout.contentStyle.paddingRight) || 0}
				bottomOffset={Number(playerLayout.contentStyle.paddingBottom) || 0}
				disabled={playerOpen && playerLayout.dock === "expanded" && !playerLayout.minimized}
			/>
			<div style={playerLayout.contentStyle}>
				<div
					className="kub-content"
					inert={playerOpen && playerLayout.mobile && playerLayout.dock === "expanded" && !playerLayout.minimized}
				>
					<header className="kub-top">
						<div className="kub-brand">
							<span className="kub-brand-avatar">
								<img className="kub-avatar" src="/images/v2/avatar.png" alt="" />
							</span>
							<div>
								🐹햄쿠비 노래책🎤 <small>HAMKUBBY SONGBOOK</small>
							</div>
						</div>
						<nav className="kub-nav" aria-label="메인 메뉴">
							<button
								className="kub-player-toggle"
								aria-label={playerOpen ? "영상 플레이어 닫기 (베타)" : "영상 플레이어 열기 (베타)"}
								title={playerOpen ? "플레이어 닫기" : "플레이어 열기"}
								aria-expanded={playerOpen}
								onClick={playerOpen ? closePlayer : showPlayer}
							>
								<ListMusic />
								<span>플레이어</span>
								<small className="kub-player-beta" aria-hidden="true">
									BETA
								</small>
							</button>
							<button
								className="kub-help-toggle"
								ref={helpTriggerRef}
								aria-expanded={help}
								aria-controls="kub-help"
								onClick={() => setHelp(!help)}
							>
								{help ? "안내 접기" : "이용 안내"}
							</button>
							{cursorAvailable && (
								<button
									className="kub-cursor-toggle"
									aria-label={cursorEnabled ? "쿠비 커서 끄기" : "쿠비 커서 켜기"}
									title={cursorEnabled ? "쿠비 커서 끄기" : "쿠비 커서 켜기"}
									aria-pressed={cursorEnabled}
									onClick={onToggleCursor}
								>
									<MousePointer2 size={18} />
								</button>
							)}
							<button
								className="kub-theme"
								aria-label={colorMode === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
								onClick={toggleColorMode}
							>
								<Horn tone={colorMode === "dark" ? "dark" : "light"} />
							</button>
						</nav>
					</header>
					<PageTabs />
					<PageHelp
						open={help}
						onClose={() => {
							setHelp(false);
							helpTriggerRef.current?.focus({ preventScroll: true });
						}}
					/>
					<main className="kub-main">
						<Profile portrait={portrait} onPortraitError={handlePortraitError} />
						{children}
					</main>
					<Footer />
				</div>
			</div>
			<QueuePlayer layout={playerLayout} onClose={closePlayer} />
		</div>
	);
}

