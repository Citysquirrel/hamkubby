import { NavLink } from "react-router-dom";

export function PageTabs() {
	return <nav className="kub-page-tabs" aria-label="사이트 페이지">
		<NavLink to="/" end>노래책</NavLink>
		<NavLink to="/videos">유튜브 영상</NavLink>
		<NavLink to="/recap">리캡</NavLink>
	</nav>;
}
