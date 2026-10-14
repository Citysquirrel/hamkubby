import { Mail } from "lucide-react";
import { FaGithub } from "react-icons/fa";

export function Footer() {
	return (
		<footer className="kub-footer">
			<span>
				<strong>햄님들과 함께 모으는 노래책.</strong>
				<br />
				비공식 팬 사이트 · 원작물의 저작권은 소속사 및 라이버에게 있습니다.
			</span>
			<nav className="kub-footer-contacts" aria-label="개발자 연락처">
				<a href="https://github.com/Citysquirrel/hamkubby" target="_blank" rel="noopener noreferrer">
					<FaGithub aria-hidden="true" /> GitHub
				</a>
				<a href="mailto:tok1324@naver.com">
					<Mail aria-hidden="true" /> tok1324@naver.com
				</a>
			</nav>
		</footer>
	);
}
