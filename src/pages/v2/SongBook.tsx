import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Popover, Portal } from "@chakra-ui/react";
import { ArrowUpRight, Check, Copy, Search, SlidersHorizontal, X } from "lucide-react";
import type { Song, SortType } from "../../config/types";
import { createSongSearch, normalizeKeyword } from "../../lib/search";
import { filterAndSortSongs, findSelectedSong } from "../../lib/songbook";
import useSongDataStore from "../../store/useSongDataStore";
import { toaster } from "../../components/ui/toaster";
import { RiceCake } from "./Motifs";
import { Lyrics } from "./Lyrics";
import { Pagination } from "./Pagination";
import { SongHistory } from "./SongHistory";
import { SongListLoading } from "./LoadingState";

const genres = ["K-POP", "J-POP", "POP"];
const cheeses = ["일반곡", "잘몰라", "피토곡", "우엑곡"];
const tones: Record<string, string> = {
	"K-POP": "blue",
	"J-POP": "purple",
	POP: "pink",
	일반곡: "slate",
	잘몰라: "amber",
	피토곡: "red",
	우엑곡: "olive",
};
const songKey = (song: Song) => song.syncId ?? song.id ?? JSON.stringify([song.title, song.artist, song.genre]);
const toggleValue = (values: string[], value: string) =>
	values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

function SongTags({ song }: { song: Song }) {
	return (
		<>
			<span className={`kub-tag kub-tag-${tones[song.genre] ?? "brown"}`}>{song.genre}</span>
			{song.isOfficial && song.cheese && (
				<span className={`kub-tag kub-tag-${tones[song.cheese] ?? "brown"}`}>{song.cheese}</span>
			)}
			<span className={`kub-tag kub-tag-${song.isOfficial ? "green" : "brown"}`}>
				{song.isOfficial ? "쿠비 등록곡" : "추가 수록곡"}
			</span>
			{!!song.lyric?.trim() && <span className="kub-tag kub-tag-cyan">가사 있음</span>}
			{!!song.song_histories?.length && <span className="kub-tag kub-tag-orange">영상 있음</span>}
		</>
	);
}
function Highlight({ text, query }: { text: string; query: string }) {
	const term = query.trim();
	const index = term ? text.toLocaleLowerCase().indexOf(term.toLocaleLowerCase()) : -1;
	return index < 0 ? (
		text
	) : (
		<>
			{text.slice(0, index)}
			<mark>{text.slice(index, index + term.length)}</mark>
			{text.slice(index + term.length)}
		</>
	);
}

export default function SongBookV2() {
	const data = useSongDataStore((state) => state.data);
	const isLoading = useSongDataStore((state) => state.isSongDataLoading);
	const hasLoaded = useSongDataStore((state) => state.hasLoaded);
	const error = useSongDataStore((state) => state.error);
	const { retrySongbook } = useOutletContext<{ retrySongbook: () => void }>();
	const initialLoading = !hasLoaded && isLoading;
	const [filterOpen, setFilterOpen] = useState(false);
	const [filterPortal, setFilterPortal] = useState<{ current: HTMLElement } | null>(null);
	useEffect(() => {
		const container = document.getElementById("kub-music-room");
		if (container) setFilterPortal({ current: container });
	}, []);
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [source, setSource] = useState("all");
	const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
	const [selectedCheeses, setSelectedCheeses] = useState<string[]>([]);
	const [history, setHistory] = useState<string[]>([]);
	const [sort, setSort] = useState<SortType>("title-asc");
	const [selection, setSelection] = useState<Song | null>(null);
	const [copied, setCopied] = useState<string | null>(null);
	const [copyFallback, setCopyFallback] = useState<Song | null>(null);
	const [knotSwing, setKnotSwing] = useState(0);
	const [detailClosing, setDetailClosing] = useState(false);
	const searchRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLElement>(null);
	const detailRef = useRef<HTMLElement>(null);
	const detailContentRef = useRef<HTMLDivElement>(null);
	const previousDetailHeight = useRef<number | null>(null);
	const copyRef = useRef<HTMLTextAreaElement>(null);
	const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const search = useMemo(() => createSongSearch(data), [data]);
	const selected = useMemo(() => findSelectedSong(data, selection), [data, selection]);
	const lyricsSearchUrl = selected
		? `https://www.google.com/search?q=${encodeURIComponent(`${selected.artist} ${selected.title} 가사`)}&udm=14`
		: "";
	const registeredCount = useMemo(() => data.filter((song) => song.isOfficial).length, [data]);
	const filteredSongs = useMemo(() => {
		const keyword = normalizeKeyword(debouncedQuery);
		const songs = keyword ? search.search(keyword).map((result) => result.item) : data;
		return filterAndSortSongs(
			songs,
			{
				genre: selectedGenres,
				official: source === "all" ? [] : [source],
				cheese: selectedCheeses,
				history,
			},
			sort,
			Boolean(keyword),
		);
	}, [data, search, debouncedQuery, source, selectedGenres, selectedCheeses, history, sort]);
	const pageCount = Math.max(1, Math.ceil(filteredSongs.length / pageSize));
	const currentPage = Math.min(page, pageCount);
	const pageSongs = filteredSongs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
	useEffect(() => setPage(1), [debouncedQuery, source, selectedGenres, selectedCheeses, history, sort, pageSize]);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedQuery(query), 225);
		return () => clearTimeout(timer);
	}, [query]);

	useEffect(() => () => clearTimeout(copyTimer.current), []);

	useLayoutEffect(() => {
		const from = previousDetailHeight.current;
		previousDetailHeight.current = null;
		const content = detailContentRef.current;
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
		const finishClose = () => {
			if (!detailClosing) return;
			setDetailClosing(false);
			setSelection(null);
		};
		if (
			!content ||
			!from ||
			reducedMotion.matches ||
			detailRef.current?.closest<HTMLElement>("#kub-music-room")?.dataset.effects === "false"
		) {
			finishClose();
			return;
		}
		const to = detailClosing ? 0 : content.getBoundingClientRect().height;
		if (Math.abs(from - to) < 1) return;
		const animation = content.animate(
			{
				height: [`${from}px`, `${to}px`],
				...(detailClosing
					? {
							paddingTop: [getComputedStyle(content).paddingTop, "0px"],
							paddingBottom: [getComputedStyle(content).paddingBottom, "0px"],
						}
					: {}),
			},
			{ duration: 280, easing: "cubic-bezier(.22,1,.36,1)", fill: detailClosing ? "forwards" : "none" },
		);
		const fade = detailClosing
			? detailRef.current?.animate({ opacity: [1, 1, 0] }, { duration: 280, fill: "forwards" })
			: undefined;
		animation.onfinish = finishClose;
		const cancel = () => {
			animation.cancel();
			fade?.cancel();
			finishClose();
		};
		reducedMotion.addEventListener("change", cancel);
		window.addEventListener("resize", cancel);
		return () => {
			animation.cancel();
			fade?.cancel();
			reducedMotion.removeEventListener("change", cancel);
			window.removeEventListener("resize", cancel);
		};
	}, [selected, detailClosing]);

	useEffect(() => {
		if (copyFallback && copyRef.current) {
			copyRef.current.focus();
			copyRef.current.select();
		}
	}, [copyFallback]);

	useEffect(() => {
		const handleKey = (event: KeyboardEvent) => {
			const active = document.activeElement as HTMLElement | null;
			if (filterOpen || document.querySelector("dialog[open]")) return;
			if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
			if (active?.closest("input, textarea, select") || active?.isContentEditable) return;
			if (event.key === "Escape") {
				setQuery("");
				setDebouncedQuery("");
				searchRef.current?.focus();
				return;
			}
			if (event.key === " " || event.key.length !== 1) return;
			event.preventDefault();
			searchRef.current?.focus();
		};
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [filterOpen]);

	const reset = () => {
		setQuery("");
		setDebouncedQuery("");
		setSource("all");
		setSelectedGenres([]);
		setSelectedCheeses([]);
		setHistory([]);
	};
	const selectSong = (song: Song) => {
		previousDetailHeight.current = detailContentRef.current?.getBoundingClientRect().height ?? null;
		setDetailClosing(false);
		setSelection(song);
		setKnotSwing((value) => value + 1);
		setCopyFallback(null);
		if (window.matchMedia("(max-width: 680px)").matches) {
			requestAnimationFrame(() => {
				detailRef.current?.scrollIntoView({ block: "nearest" });
				detailRef.current?.focus({ preventScroll: true });
			});
		}
	};
	const closeDetail = () => {
		previousDetailHeight.current = detailContentRef.current?.getBoundingClientRect().height ?? null;
		setKnotSwing((value) => value + 1);
		setCopyFallback(null);
		if (detailRef.current && getComputedStyle(detailRef.current).position === "relative") {
			setDetailClosing(true);
		} else {
			setSelection(null);
		}
		searchRef.current?.focus({ preventScroll: true });
	};
	const copySong = async (song: Song) => {
		try {
			await navigator.clipboard.writeText(`${song.title} - ${song.artist}`);
			setCopied(songKey(song));
			if (findSelectedSong([song], selected)) setKnotSwing((value) => value + 1);
			setCopyFallback(null);
			toaster.create({
				type: "success",
				description: `${song.title} - ${song.artist} · 복사했어요.`,
				duration: 2400,
			});
			clearTimeout(copyTimer.current);
			copyTimer.current = setTimeout(() => {
				setCopied(null);
			}, 2400);
		} catch {
			setDetailClosing(false);
			setSelection(song);
			setCopyFallback(song);
			toaster.create({
				type: "info",
				description: "복사할 문구를 선택했어요. 직접 복사해 주세요.",
			});
		}
	};
	const filterCount = (source === "false" ? 0 : selectedCheeses.length) + history.length;
	const isFiltered = !!debouncedQuery.trim() || source !== "all" || selectedGenres.length > 0 || filterCount > 0;
	const changePage = (nextPage: number) => {
		setPage(nextPage);
	};

	return (
		<>
			<link rel="canonical" href="https://hamkubby.pages.dev/" />
			<div className="kub-tools">
				<div className="kub-search">
					<Search aria-hidden="true" />
					<input
						ref={searchRef}
						type="search"
						aria-label="곡 제목, 가수 검색"
						aria-describedby="kub-search-hint"
						placeholder="노래 / 가수 검색"
						autoComplete="off"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Escape" && !event.nativeEvent.isComposing) {
								setQuery("");
								setDebouncedQuery("");
							}
						}}
					/>
					<span id="kub-search-hint" className="kub-search-hint">
						키 입력으로 포커스
					</span>
					{query.length > 0 && (
						<button
							type="button"
							className="kub-search-clear"
							aria-label="검색어 지우기"
							aria-keyshortcuts="Escape"
							onClick={() => {
								setQuery("");
								setDebouncedQuery("");
								searchRef.current?.focus();
							}}
						>
							<span>ESC</span>
							<X aria-hidden="true" />
						</button>
					)}
				</div>
				<Popover.Root
					unstyled
					open={filterOpen}
					lazyMount
					unmountOnExit
					onOpenChange={({ open }) => setFilterOpen(open)}
					positioning={{
						placement: "bottom-end",
						strategy: "fixed",
						gutter: 8,
						overflowPadding: 12,
						flip: true,
						slide: true,
					}}
				>
					<Popover.Trigger asChild>
						<button type="button" className="kub-button kub-filter-toggle" aria-label="상세 필터">
							<SlidersHorizontal />
							<span>상세 필터</span>
							{filterCount > 0 && <b>{filterCount}</b>}
						</button>
					</Popover.Trigger>
					{filterPortal && (
						<Portal container={filterPortal}>
							<Popover.Positioner className="kub-filter-positioner">
								<Popover.Content className="kub-filter-popover">
									<header className="kub-filter-header">
										<Popover.Title>상세 필터</Popover.Title>
										<Popover.CloseTrigger asChild>
											<button type="button" aria-label="상세 필터 닫기">
												<X size={18} />
											</button>
										</Popover.CloseTrigger>
									</header>
									<div className="kub-filter-panel" data-source={source}>
										<fieldset hidden={source === "false"}>
											<legend>노래 분류</legend>
											{cheeses.map((cheese) => (
												<label key={cheese}>
													<input
														type="checkbox"
														checked={selectedCheeses.includes(cheese)}
														onChange={() => setSelectedCheeses(toggleValue(selectedCheeses, cheese))}
													/>
													{cheese}
												</label>
											))}
											<p className="kub-filter-note">분류 필터는 쿠비 등록곡에 적용됩니다.</p>
										</fieldset>
										<fieldset>
											<legend>영상</legend>
											{[
												{ value: "yes", label: "영상 있음" },
												{ value: "no", label: "영상 없음" },
											].map((item) => (
												<label key={item.value}>
													<input
														type="checkbox"
														checked={history.includes(item.value)}
														onChange={() => setHistory(toggleValue(history, item.value))}
													/>
													{item.label}
												</label>
											))}
										</fieldset>
									</div>
									<footer className="kub-filter-footer">
										<button type="button" className="kub-reset" onClick={reset}>
											검색·필터 초기화
										</button>
										<Popover.CloseTrigger asChild>
											<button type="button" className="kub-button">
												닫기
											</button>
										</Popover.CloseTrigger>
									</footer>
								</Popover.Content>
							</Popover.Positioner>
						</Portal>
					)}
				</Popover.Root>
			</div>
			<div className="kub-sourcebar">
				<span className="kub-source-label">등록 출처</span>
				<div className="kub-sources" role="group" aria-label="등록 출처 필터">
					{[
						{ value: "all", label: "전체", count: data.length },
						{ value: "true", label: "쿠비 등록곡", count: registeredCount },
						{ value: "false", label: "추가 수록곡", count: data.length - registeredCount },
					].map((item) => (
						<button
							key={item.value}
							className="kub-source"
							aria-pressed={source === item.value}
							onClick={() => setSource(item.value)}
						>
							{item.label}
							<small>{hasLoaded ? item.count.toLocaleString() : "—"}</small>
						</button>
					))}
				</div>
			</div>
			<div className="kub-filterbar">
				<div className="kub-genres" role="group" aria-label="장르 필터">
					<button className="kub-genre" aria-pressed={!selectedGenres.length} onClick={() => setSelectedGenres([])}>
						전체
					</button>
					{genres.map((genre) => (
						<button
							key={genre}
							className="kub-genre"
							aria-pressed={selectedGenres.includes(genre)}
							onClick={() => setSelectedGenres(toggleValue(selectedGenres, genre))}
						>
							{genre}
						</button>
					))}
				</div>
			</div>
			<div className="kub-workspace" data-detail-open={!!selected}>
				<section className="kub-song-section" ref={listRef} tabIndex={-1} aria-label="노래 목록" aria-busy={isLoading}>
					{error && !initialLoading && (
						<div className="kub-data-feedback" role="status">
							<p>{hasLoaded ? "목록을 갱신하지 못해 마지막으로 불러온 노래를 표시하고 있어요." : error}</p>
							<button className="kub-button" onClick={retrySongbook} disabled={isLoading}>
								{isLoading ? "다시 불러오는 중…" : "다시 불러오기"}
							</button>
						</div>
					)}
					{hasLoaded && (
						<Pagination
							page={currentPage}
							pageCount={pageCount}
							pageSize={pageSize}
							total={filteredSongs.length}
							onPageChange={changePage}
							onPageSizeChange={setPageSize}
							position="상단"
						>
							<select
								className="kub-page-sort"
								name="kub-page-sort"
								aria-label="곡 정렬"
								value={sort}
								onChange={(event) => setSort(event.target.value as SortType)}
							>
								<option value="title-asc">제목 오름차순</option>
								<option value="title-desc">제목 내림차순</option>
								<option value="artist-asc">가수 오름차순</option>
								<option value="artist-desc">가수 내림차순</option>
							</select>
						</Pagination>
					)}
					<div className="kub-list-head" aria-hidden="true">
						<span>곡 / 아티스트</span>
						<span className="kub-column-tags">분류</span>
						<span>복사</span>
					</div>
					{initialLoading && <SongListLoading />}
					<ul className="kub-list" hidden={!pageSongs.length}>
						{pageSongs.map((song) => {
							const isSelected = !!findSelectedSong([song], selected);
							const familiarityNotice = song.song_histories?.some((history) => history.memo?.includes("몰루"))
								? "잘 모르는 곡일 수 있어요"
								: "";
							return (
								<li key={songKey(song)} className="kub-song" data-selected={isSelected}>
									<button
										className="kub-song-main"
										aria-label={`${song.title} · ${song.artist} 상세 보기${familiarityNotice ? ` · ${familiarityNotice}` : ""}`}
										aria-pressed={isSelected}
										onClick={() => selectSong(song)}
									>
										<span>
											<span className="kub-song-name">
												<Highlight text={song.title} query={debouncedQuery} />
											</span>
											<span className="kub-song-artist">
												<Highlight text={song.artist} query={debouncedQuery} />
											</span>
											{song.notes?.trim() && (
												<span className="kub-song-note" title={song.notes}>
													쿠비 메모 · {song.notes}
												</span>
											)}
										</span>
										<span className="kub-song-tags">
											<SongTags song={song} />
											{familiarityNotice && <span className="kub-tag kub-tag-amber">{familiarityNotice}</span>}
										</span>
									</button>
									<button
										className="kub-copy-icon"
										aria-label={`${song.title} 신청 문구 복사`}
										onClick={() => void copySong(song)}
									>
										{copied === songKey(song) ? <Check /> : <Copy />}
									</button>
								</li>
							);
						})}
					</ul>
					{hasLoaded && !filteredSongs.length && (
						<div className="kub-empty" role="status">
							<p>{isFiltered ? "조건에 맞는 곡이 없어요." : "아직 등록된 노래가 없어요."}</p>
							{isFiltered ? (
								<button className="kub-reset" onClick={reset}>
									검색·필터 초기화
								</button>
							) : (
								<p>노래가 등록되면 이곳에서 볼 수 있어요.</p>
							)}
						</div>
					)}
					{!!pageSongs.length && (
						<Pagination
							page={currentPage}
							pageCount={pageCount}
							pageSize={pageSize}
							total={filteredSongs.length}
							onPageChange={changePage}
							position="하단"
						/>
					)}
				</section>
				<aside
					className="kub-detail"
					aria-label="선택한 곡 상세"
					ref={detailRef}
					tabIndex={-1}
					data-closing={detailClosing}
					inert={detailClosing}
				>
					<img className="kub-detail-flower" src="/images/v2/head_flower.svg" alt="" aria-hidden="true" />
					<img
						key={`${selected ? songKey(selected) : "empty"}:${knotSwing}`}
						className="kub-detail-knot"
						data-swing={knotSwing > 0}
						src="/images/v2/head_knot.svg"
						alt=""
						aria-hidden="true"
					/>
					<div className="kub-detail-content" ref={detailContentRef}>
						<div className="kub-detail-scroll">
							{selected ? (
								<>
									<div className="kub-detail-top">
										<span className="kub-detail-label">고른 노래</span>
										<button className="kub-close" aria-label="곡 상세 닫기" onClick={closeDetail}>
											<X />
										</button>
									</div>
									<h2>{selected.title}</h2>
									<p className="kub-detail-artist">{selected.artist}</p>
									<div className="kub-tags">
										<SongTags song={selected} />
									</div>
									{selected.notes && (
										<dl className="kub-note">
											<dt>쿠비 메모</dt>
											<dd>{selected.notes}</dd>
										</dl>
									)}
									<div className="kub-detail-actions">
										<button className="kub-button kub-button-primary" onClick={() => void copySong(selected)}>
											{copied === songKey(selected) ? <Check /> : <Copy />}
											{copied === songKey(selected) ? "문구 복사 완료" : "신청 문구 복사"}
										</button>
										<div className="kub-lyrics-links" role="group" aria-label="가사 찾아보기">
											<button
												onClick={() => window.open(lyricsSearchUrl, "lyrics", "noopener,width=540,height=600")}
												aria-label="가사 찾아보기 새 창으로 열기"
											>
												가사 새 창 <ArrowUpRight aria-hidden="true" />
											</button>
											<a
												href={lyricsSearchUrl}
												target="_blank"
												rel="noopener noreferrer"
												aria-label="가사 찾아보기 새 탭으로 열기"
											>
												가사 새 탭 <ArrowUpRight aria-hidden="true" />
											</a>
										</div>
									</div>
									{copyFallback && findSelectedSong([selected], copyFallback) && (
										<div className="kub-copy-fallback">
											<label htmlFor="kub-copy-text">문구를 선택해 직접 복사해 주세요.</label>
											<textarea
												id="kub-copy-text"
												ref={copyRef}
												readOnly
												rows={2}
												value={`${selected.title} - ${selected.artist}`}
											/>
										</div>
									)}
									<SongHistory key={songKey(selected)} song={selected} />
									{selected.lyric && <Lyrics text={selected.lyric} />}
								</>
							) : (
								<div className="kub-detail-empty">
									<RiceCake color="white" />
									<span>
										어떤 곡이 궁금해요?
										<br />
										목록에서 하나 골라보세요.
									</span>
								</div>
							)}
						</div>
					</div>
				</aside>
			</div>
		</>
	);
}

