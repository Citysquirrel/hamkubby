import { useNavigation } from "react-router-dom";
import "./loading.css";

export function NavigationLoading() {
	const navigation = useNavigation();
	return (
		<div className="kub-navigation-loading" role="status" aria-atomic="true">
			{navigation.state !== "idle" && (
				<>
					<span className="kub-route-spinner" aria-hidden="true" />
					<span>페이지를 불러오고 있어요.</span>
				</>
			)}
		</div>
	);
}

export function SongListLoading({ label = "노래 목록을 불러오고 있어요." }: { label?: string }) {
	return (
		<div className="kub-loading">
			<p role="status">{label}</p>
			<div className="kub-loading-rows" aria-hidden="true">
				{Array.from({ length: 6 }, (_, index) => (
					<div className="kub-loading-row" key={index}>
						<div>
							<span />
							<span />
						</div>
						<span />
					</div>
				))}
			</div>
		</div>
	);
}

export function RouteLoading() {
	return (
		<div className="kub-route-loading" role="status" aria-label="페이지 로딩 중">
			<span className="kub-route-spinner" aria-hidden="true" />
		</div>
	);
}

