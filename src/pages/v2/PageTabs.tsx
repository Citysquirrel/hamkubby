import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { getRecentYoutubeUploadLabel, youtubeVideosQueryOptions } from "../../lib/youtube";

export function PageTabs() {
	const [now, setNow] = useState(Date.now);
	const videos = useQuery({ ...youtubeVideosQueryOptions, refetchInterval: 60000 });
	useEffect(() => {
		const refreshNow = () => setNow(Date.now());
		const onVisible = () => {
			if (document.visibilityState === "visible") refreshNow();
		};
		const timer = setInterval(refreshNow, 60000);
		document.addEventListener("visibilitychange", onVisible);
		return () => {
			clearInterval(timer);
			document.removeEventListener("visibilitychange", onVisible);
		};
	}, []);
	const newest = videos.data?.find((video) => video.channel === "main");
	const uploadLabel = newest ? getRecentYoutubeUploadLabel(newest, now) : null;
	return (
		<nav className="kub-page-tabs" aria-label="사이트 페이지">
			<NavLink to="/" end>
				노래책
			</NavLink>
			<NavLink
				to="/videos"
				className="kub-video-page-tab"
				aria-label={uploadLabel ? `유튜브 영상, 본채널 최신 영상 ${uploadLabel} 공개` : undefined}
			>
				영상
				{newest && uploadLabel && (
					<time className="kub-page-tab-badge" dateTime={newest.publishedAt}>
						{uploadLabel}
					</time>
				)}
			</NavLink>
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
		</nav>
	);
}

