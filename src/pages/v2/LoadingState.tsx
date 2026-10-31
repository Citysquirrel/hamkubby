import "./loading.css";

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

