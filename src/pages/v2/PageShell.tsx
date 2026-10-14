import { useState, type ReactNode } from "react";
import { useColorMode } from "../../components/ui/color-mode";
import { isBoolean, readStoredValue, writeStoredValue } from "../../lib/storage";
import { BackgroundEffects, Horn } from "./Motifs";
import { PageTabs } from "./PageTabs";
import { PageHelp } from "./PageHelp";
import { Profile } from "./Profile";
import { Footer } from "./Footer";
import { GoToTop } from "./GoToTop";
import "./songbook.css";

export function PageShell({ children }: { children: ReactNode }) {
	const { colorMode, toggleColorMode } = useColorMode();
	const [intro, setIntro] = useState(() => readStoredValue("songbook-v2-intro", true, isBoolean));
	const [effects] = useState(() => readStoredValue("songbook-v2-effects", !window.matchMedia("(prefers-reduced-motion: reduce)").matches, isBoolean));
	const [help, setHelp] = useState(false);
	const toggleIntro = () => {
		const next = !intro;
		setIntro(next);
		writeStoredValue("songbook-v2-intro", next);
	};

	return <div id="kub-music-room" data-theme={colorMode} data-intro={intro} data-effects={effects}>
		<BackgroundEffects />
		<GoToTop />
		<div className="kub-content">
			<header className="kub-top">
				<div className="kub-brand">
					<button
						className="kub-avatar-button"
						aria-label={intro ? "쿠비 소개 접기" : "쿠비 소개 펼치기"}
						aria-expanded={intro}
						aria-controls="kub-hero"
						onClick={toggleIntro}
					>
						<img className="kub-avatar" src="/images/v2/avatar.png" alt="" />
					</button>
					<div>
						🐹햄쿠비 노래책🎤 <small>HAMKUBBY SONGBOOK</small>
					</div>
				</div>
				<nav className="kub-nav" aria-label="메인 메뉴">
					<button className="kub-intro-toggle" aria-expanded={intro} aria-controls="kub-hero" onClick={toggleIntro}>
						{intro ? "소개 접기" : "쿠비 소개"}
					</button>
					<button
						className="kub-help-toggle"
						aria-expanded={help}
						aria-controls="kub-help"
						onClick={() => setHelp(!help)}
					>
						이용 안내
					</button>
					<button
						className="kub-theme"
						aria-label={colorMode === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
						onClick={toggleColorMode}
					>
						<Horn side="right" tone={colorMode === "dark" ? "dark" : "light"} />
					</button>
				</nav>
			</header>
			<PageTabs />
			<PageHelp open={help} />
			<main className="kub-main">
				<Profile open={intro} />
				{children}
			</main>
			<Footer />
		</div>
	</div>;
}
