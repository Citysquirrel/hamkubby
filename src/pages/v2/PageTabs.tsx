import { NavLink } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export function PageTabs() {
	return (
		<nav className="kub-page-tabs" aria-label="사이트 페이지">
			<NavLink to="/" end>
				노래책
			</NavLink>
			<NavLink to="/videos">유튜브 영상</NavLink>
			<NavLink to="/recap">리캡</NavLink>
			<a
				className="kub-original-link"
				href="https://docs.google.com/spreadsheets/d/1KcU5pDIiE6rsiTzbSj5-OEF2pzEKbBkPSgjNT2pq2KE"
				target="_blank"
				rel="noopener noreferrer"
			>
				<img src="/images/spreadsheet.svg" alt="" />
				원본 노래책 열기
				<ArrowUpRight size={16} aria-hidden="true" />
			</a>
			{/* <img className="kub-hair-knot" src="/images/v2/hair-knot.svg" alt="" aria-hidden="true" /> */}
		</nav>
	);
}

