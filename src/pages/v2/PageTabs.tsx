import { NavLink } from "react-router-dom";

export function PageTabs() {
	return <nav className="kub-page-tabs" aria-label="사이트 페이지">
		<NavLink to="/v2" end>노래책</NavLink>
		<NavLink to="/v2/videos">유튜브 영상</NavLink>
		<NavLink to="/v2/recap">리캡</NavLink>
	</nav>;
}
