import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Film, Play, RotateCcw, Search, X } from "lucide-react";
import {
	formatYoutubeDuration,
	getYoutubeCategories,
	getYoutubeVideos,
	isRecentYoutubeVideo,
	youtubeDateRange,
	youtubeSorts,
	type YoutubeFilters,
	type YoutubeSort,
	type YoutubeVideo,
} from "../../lib/youtube";
import { Pagination } from "./Pagination";
import { VideoSongs } from "./VideoSongs";
import { toQueueTrack, type QueueTrack } from "../../lib/player";
import useSongDataStore from "../../store/useSongDataStore";
import "./videos.css";

const emptyFilters: YoutubeFilters = { q: "", channel: "", category: "", from: "", to: "" };
const publishedDate = new Intl.DateTimeFormat("ko-KR", {
	timeZone: "Asia/Seoul",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});
const channels = [
	{ value: "", label: "전체 영상" },
	{ value: "main", label: "햄쿠비" },
	{ value: "replay", label: "다시보기" },
] as const;

const noTracks: QueueTrack[] = [];

function VideoCard({ video, tracks, historiesLoading, featured = false }: {
	video: YoutubeVideo; tracks: QueueTrack[]; historiesLoading: boolean; featured?: boolean;
}) {
	const [imageFailed, setImageFailed] = useState(false);
	const url = `https://www.youtube.com/watch?v=${video.id}`;
	const duration = formatYoutubeDuration(video.duration);
	return (
		<article className={`kub-video-card${featured ? " kub-video-featured" : ""}`}>
			<a
				className="kub-video-thumbnail"
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={`${video.title} YouTube에서 열기`}
			>
				{!imageFailed && video.thumbnailUrl ? (
					<img
						src={video.thumbnailUrl}
						alt=""
						loading={featured ? "eager" : "lazy"}
						decoding="async"
						onError={() => setImageFailed(true)}
					/>
				) : (
					<Film className="kub-video-fallback" aria-hidden="true" />
				)}
				<span className="kub-video-play">
					<Play size={21} fill="currentColor" aria-hidden="true" />
				</span>
				{duration && <span className="kub-video-duration">{duration}</span>}
			</a>
			<div className="kub-video-card-body">
				{featured && (
					<div className="kub-video-featured-label">
						<span>NEW</span>이번 주, 새로 올라왔어요
					</div>
				)}
				<div className="kub-video-meta">
					<span>{video.channel === "main" ? "햄쿠비" : "다시보기"}</span>
					<time dateTime={video.publishedAt}>{publishedDate.format(new Date(video.publishedAt))}</time>
				</div>
				<h2>
					<a href={url} target="_blank" rel="noopener noreferrer" title={video.title}>
						{video.title}
					</a>
				</h2>
				{video.viewCount != null && (
					<p className="kub-video-views">조회수 {BigInt(video.viewCount).toLocaleString("ko-KR")}회</p>
				)}
				<div className="kub-video-tags">
					{video.categories.map((category) => (
						<span className="kub-tag kub-tag-green" key={category}>
							{category}
						</span>
					))}
				</div>
				<VideoSongs tracks={tracks} loading={historiesLoading} />
				{/* <div className="kub-video-actions">
				<a href={url} target="_blank" rel="noopener noreferrer" aria-label={`${video.title} YouTube에서 열기`}>YouTube에서 보기 <ArrowUpRight size={15} /></a>
			</div> */}
			</div>
		</article>
	);
}

export default function Videos() {
	const songs = useSongDataStore((state) => state.data);
	const historiesLoading = useSongDataStore((state) => state.isSongDataLoading);
	const tracksByVideo = useMemo(() => {
		const grouped = new Map<string, QueueTrack[]>();
		const seen = new Set<string>();
		for (const song of songs) {
			for (const history of song.song_histories ?? []) {
				const track = toQueueTrack(song, history);
				if (!track || seen.has(track.id)) continue;
				seen.add(track.id);
				const tracks = grouped.get(track.videoId) ?? [];
				tracks.push(track);
				grouped.set(track.videoId, tracks);
			}
		}
		for (const tracks of grouped.values()) tracks.sort((a, b) => a.start - b.start || a.title.localeCompare(b.title, "ko"));
		return grouped;
	}, [songs]);
	const [query, setQuery] = useState("");
	const [composing, setComposing] = useState(false);
	const [selection, setSelection] = useState({
		filters: emptyFilters,
		page: 1,
		pageSize: 20,
		sort: "newest" as YoutubeSort,
	});
	const { filters, page, pageSize, sort } = selection;
	const [now, setNow] = useState(Date.now);
	const validation =
		filters.from && filters.to && filters.from > filters.to ? "시작 날짜는 종료 날짜보다 늦을 수 없어요." : "";
	const typing = composing || query.trim() !== filters.q;
	const searchRef = useRef<HTMLInputElement>(null);
	const resultsRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (composing) return;
		const timer = setTimeout(
			() =>
				setSelection((previous) =>
					previous.filters.q === query.trim()
						? previous
						: { ...previous, filters: { ...previous.filters, q: query.trim() }, page: 1 },
				),
			225,
		);
		return () => clearTimeout(timer);
	}, [query, composing]);
	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), 60000);
		return () => clearInterval(timer);
	}, []);
	const videos = useQuery({
		queryKey: ["youtube-videos", filters, page, pageSize, sort],
		queryFn: ({ signal }) => getYoutubeVideos(filters, page, signal, { pageSize, sort }),
		enabled: !validation && !typing,
		retry: 1,
	});
	const latest = useQuery({
		queryKey: ["youtube-latest-main"],
		queryFn: ({ signal }) => getYoutubeVideos({ ...emptyFilters, channel: "main" }, 1, signal, { pageSize: 1 }),
		staleTime: 60000,
		refetchInterval: 60000,
		retry: 1,
	});
	const categories = useQuery({
		queryKey: ["youtube-categories"],
		queryFn: ({ signal }) => getYoutubeCategories(signal),
		retry: 1,
	});
	const data = videos.data;
	const newest = latest.data?.items[0];
	const hero = newest && !latest.isError && isRecentYoutubeVideo(newest, now) ? newest : null;
	const pageCount = Math.max(1, data?.totalPages ?? 1);
	useEffect(() => {
		if (data && page > Math.max(1, data.totalPages)) {
			setSelection((previous) => ({ ...previous, page: Math.max(1, data.totalPages) }));
		}
	}, [data, page]);

	const updateFilters = (changes: Partial<YoutubeFilters>) => {
		setSelection((previous) => ({ ...previous, filters: { ...previous.filters, ...changes }, page: 1 }));
	};
	const clearQuery = () => {
		setQuery("");
		updateFilters({ q: "" });
		searchRef.current?.focus();
	};
	const reset = () => {
		setQuery("");
		setSelection((previous) => ({ ...previous, filters: emptyFilters, page: 1 }));
	};
	const changePage = (next: number) => {
		setSelection((previous) => ({ ...previous, page: next }));
		resultsRef.current?.scrollIntoView({ block: "start" });
		resultsRef.current?.focus({ preventScroll: true });
	};
	const isFiltered = Object.values(filters).some(Boolean);
	const pagination = {
		page,
		pageCount,
		pageSize,
		total: data?.total ?? 0,
		onPageChange: changePage,
		listLabel: "영상",
		unit: "개",
	};
	const activeFilters = [
		...(filters.q ? [{ label: `제목: ${filters.q}`, clear: clearQuery }] : []),
		...(filters.channel
			? [{ label: filters.channel === "main" ? "햄쿠비 채널" : "다시보기 채널", clear: () => updateFilters({ channel: "" }) }]
			: []),
		...(filters.category ? [{ label: filters.category, clear: () => updateFilters({ category: "" }) }] : []),
		...(filters.from || filters.to
			? [
					{
						label: `${filters.from || "처음"} ~ ${filters.to || "제한 없음"}`,
						clear: () => updateFilters({ from: "", to: "" }),
					},
				]
			: []),
	];

	return (
		<section className="kub-secondary-page kub-videos" aria-label="유튜브 영상">
			<title>유튜브 영상 | 햄쿠비 노래책</title>
			<div className="kub-videos-heading">
				<div>
					<span className="kub-eyebrow">KUBBY ON AIR</span>
					<h1>쿠비의 영상 모아보기</h1>
					<p className="kub-page-description">노래부터 게임까지, 다시 보고 싶은 순간을 찾아보세요.</p>
				</div>
				{/* <a className="kub-button" href="https://www.youtube.com/@hamkubby" target="_blank" rel="noopener noreferrer">
					유튜브 채널 <ArrowUpRight size={16} />
				</a> */}
			</div>
			{hero && (
				<section className="kub-video-hero" aria-label="최근 7일 내 본채널 최신 영상">
					<VideoCard video={hero} tracks={tracksByVideo.get(hero.id) ?? noTracks} historiesLoading={historiesLoading} featured key={hero.id} />
				</section>
			)}
			<div className="kub-video-channels" role="group" aria-label="영상 채널">
				{channels.map((channel) => (
					<button
						key={channel.value}
						aria-pressed={filters.channel === channel.value}
						onClick={() => updateFilters({ channel: channel.value })}
					>
						{channel.label}
					</button>
				))}
			</div>
			<div className="kub-video-filters" role="search" aria-label="영상 검색과 필터">
				<div className="kub-video-search-row">
					<label className="kub-search">
						<Search size={19} aria-hidden="true" />
						<input
							ref={searchRef}
							type="search"
							aria-label="영상 제목 검색"
							placeholder="제목을 입력하면 바로 찾아드려요"
							maxLength={200}
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							onCompositionStart={() => setComposing(true)}
							onCompositionEnd={() => setComposing(false)}
							onKeyDown={(event) => {
								if (event.key === "Escape" && !event.nativeEvent.isComposing) clearQuery();
							}}
						/>
						{query && (
							<button className="kub-search-clear" aria-label="검색어 지우기" onClick={clearQuery}>
								<X aria-hidden="true" />
							</button>
						)}
					</label>
				</div>
				<div className="kub-video-filter-fields">
					<label>
						카테고리
						<select
							value={filters.category}
							disabled={categories.isPending}
							onChange={(event) => updateFilters({ category: event.target.value })}
						>
							<option value="">전체 카테고리</option>
							{filters.category && !categories.data?.some((category) => category.name === filters.category) && (
								<option value={filters.category}>{filters.category}</option>
							)}
							{categories.data?.map((category) => (
								<option key={category.name} value={category.name}>
									{category.name}
								</option>
							))}
						</select>
					</label>
					<label>
						공개일 시작
						<input
							type="date"
							value={filters.from}
							aria-invalid={!!validation}
							aria-describedby={validation ? "kub-video-date-error" : "kub-video-date-help"}
							onChange={(event) => updateFilters({ from: event.target.value })}
						/>
					</label>
					<label>
						공개일 종료
						<input
							type="date"
							value={filters.to}
							aria-invalid={!!validation}
							aria-describedby={validation ? "kub-video-date-error" : "kub-video-date-help"}
							onChange={(event) => updateFilters({ to: event.target.value })}
						/>
					</label>
					<button className="kub-button" type="button" onClick={reset}>
						<RotateCcw size={15} />
						초기화
					</button>
				</div>
				<div className="kub-video-periods" role="group" aria-label="공개일 빠른 선택">
					<button aria-pressed={!filters.from && !filters.to} onClick={() => updateFilters({ from: "", to: "" })}>
						전체 기간
					</button>
					{[7, 30, 90].map((days) => {
						const range = youtubeDateRange(days, now);
						return (
							<button
								key={days}
								aria-pressed={filters.from === range.from && filters.to === range.to}
								onClick={() => updateFilters(range)}
							>
								최근 {days}일
							</button>
						);
					})}
				</div>
				<p id="kub-video-date-help" className="kub-video-hint">
					한국 시간 기준 유튜브 공개일이에요. 검색과 필터는 자동으로 적용돼요.
				</p>
				{validation && (
					<p id="kub-video-date-error" className="kub-video-feedback" role="alert">
						{validation}
					</p>
				)}
				{categories.isError && (
					<p className="kub-video-feedback" role="status">
						카테고리를 불러오지 못했어요.{" "}
						<button type="button" onClick={() => void categories.refetch()} disabled={categories.isFetching}>
							다시 불러오기
						</button>
					</p>
				)}
			</div>
			{activeFilters.length > 0 && (
				<div className="kub-video-active-filters" aria-label="적용된 검색 조건">
					{activeFilters.map((filter) => (
						<button key={filter.label} onClick={filter.clear} aria-label={`${filter.label} 조건 해제`}>
							{filter.label}
							<X size={13} aria-hidden="true" />
						</button>
					))}
				</div>
			)}
			<div
				ref={resultsRef}
				className="kub-video-results"
				tabIndex={-1}
				aria-label="영상 검색 결과"
				aria-busy={videos.isFetching || typing}
			>
				<div className="kub-video-results-heading">
					<h2 aria-live="polite">
						{isFiltered ? "검색 결과" : "전체 영상"}
						{data && !videos.isError && !typing && !validation && <span>{data.total.toLocaleString()}개</span>}
					</h2>
					<select
						aria-label="영상 정렬"
						value={sort}
						onChange={(event) =>
							setSelection((previous) => ({ ...previous, sort: event.target.value as YoutubeSort, page: 1 }))
						}
					>
						{youtubeSorts.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>
				{sort === "popular" && (
					<p className="kub-video-hint">
						마지막으로 확인한 조회수가 높은 순이에요. 조회수 확인 전인 영상은 뒤에 표시돼요.
					</p>
				)}
				{validation ? (
					<div className="kub-video-empty">
						<h3>공개일 범위를 확인해 주세요.</h3>
						<p>{validation}</p>
					</div>
				) : typing || videos.isPending ? (
					<>
						<p className="kub-video-hint" role="status">
							영상을 찾고 있어요.
						</p>
						<div className="kub-video-grid" aria-hidden="true">
							{Array.from({ length: 6 }, (_, index) => (
								<div className="kub-video-skeleton" key={index}>
									<div />
									<span />
									<span />
								</div>
							))}
						</div>
					</>
				) : videos.isError ? (
					<div className="kub-video-empty" role="alert">
						<Film size={32} />
						<h3>영상 목록을 불러오지 못했어요.</h3>
						<p>{videos.error.message}</p>
						<button className="kub-button" onClick={() => void videos.refetch()} disabled={videos.isFetching}>
							다시 불러오기
						</button>
						{sort !== "newest" && (
							<button
								className="kub-button"
								onClick={() => setSelection((previous) => ({ ...previous, sort: "newest", page: 1 }))}
							>
								최신순으로 보기
							</button>
						)}
					</div>
				) : data && data.items.length > 0 ? (
					<>
						<Pagination
							{...pagination}
							position="상단"
							onPageSizeChange={(size) => setSelection((previous) => ({ ...previous, pageSize: size, page: 1 }))}
						/>
						<div className="kub-video-grid">
							{data.items.map((video) => (
								<VideoCard key={video.id} video={video} tracks={tracksByVideo.get(video.id) ?? noTracks} historiesLoading={historiesLoading} />
							))}
						</div>
						<Pagination {...pagination} position="하단" />
					</>
				) : (
					<div className="kub-video-empty" role="status">
						<Search size={32} />
						<h3>{isFiltered ? "조건에 맞는 영상이 없어요." : "아직 등록된 영상이 없어요."}</h3>
						<p>
							{isFiltered ? "검색어나 공개일 범위를 바꿔서 찾아보세요." : "새 영상이 준비되면 이곳에서 볼 수 있어요."}
						</p>
						{isFiltered && (
							<button className="kub-button" onClick={reset}>
								전체 영상 보기
							</button>
						)}
					</div>
				)}
			</div>
		</section>
	);
}
