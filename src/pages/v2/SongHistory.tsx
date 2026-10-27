import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Check, Minus, Music2, Play, Plus, Search, X } from "lucide-react";
import type { HamkubbySongHistoryModel, Song } from "../../config/types";
import { formatDateToYYYYMMDD } from "../../lib/date";
import { normalizeKeyword } from "../../lib/search";
import { usePlayerStore } from "../../store/usePlayerStore";
import { toQueueTrack } from "../../lib/player";

const previewLimit = 5;
type HistorySort = "recommended" | "newest" | "oldest";

function HistoryItems({
	song,
	items,
	onPlay,
}: {
	song: Song;
	items: HamkubbySongHistoryModel[];
	onPlay: (item: HamkubbySongHistoryModel) => void;
}) {
	const queue = usePlayerStore((state) => state.queue);
	const add = usePlayerStore((state) => state.add);
	const remove = usePlayerStore((state) => state.remove);
	return (
		<div className="kub-histories">
			{items.map((item) => {
				const track = toQueueTrack(song, item);
				const added = !!track && queue.some((entry) => entry.id === track.id);
				return (
					<div key={item.id} className="kub-history-row">
						<button className="kub-video-link" disabled={!track} onClick={() => onPlay(item)}>
							<Play className="kub-play-icon" aria-hidden="true" />
							<span>
								<time dateTime={formatDateToYYYYMMDD(item.sungAt)}>{formatDateToYYYYMMDD(item.sungAt)}</time>
								{item.priority === 7 && " · 추천"}
								<small>
									{!item.youtubeVideoId
										? "등록된 영상이 없어요"
										: !track
											? "재생 구간 정보가 올바르지 않아요"
											: item.memo || "영상 재생"}
								</small>
							</span>
						</button>
						{track && (
							<a
								className="kub-history-external"
								href={`https://www.youtube.com/watch?v=${track.videoId}&t=${Math.floor(track.start)}s`}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={`${song.title} · ${formatDateToYYYYMMDD(item.sungAt)} 영상 새 탭에서 열기`}
								title="YouTube 새 탭에서 열기"
							>
								<ArrowUpRight size={18} aria-hidden="true" />
							</a>
						)}
						<button
							className="kub-history-add"
							aria-label={`${formatDateToYYYYMMDD(item.sungAt)} 영상 ${added ? "대기열에서 제외" : "대기열에 담기"}`}
							title={added ? "대기열에서 제외" : "대기열에 담기"}
							aria-pressed={added}
							disabled={!track}
							onClick={() => {
								if (!track) return;
								if (added) remove(track.id);
								else add(track);
							}}
						>
							{added ? <>
								<Check className="kub-history-check-icon" aria-hidden="true" />
								<Minus className="kub-history-remove-icon" aria-hidden="true" />
							</> : <Plus aria-hidden="true" />}
						</button>
					</div>
				);
			})}
		</div>
	);
}

function HistoryDialog({
	song,
	items,
	onClose,
	onPlay,
}: {
	song: Song;
	items: HamkubbySongHistoryModel[];
	onClose: () => void;
	onPlay: (item: HamkubbySongHistoryModel) => void;
}) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const searchRef = useRef<HTMLInputElement>(null);
	const [query, setQuery] = useState("");
	const [sort, setSort] = useState<HistorySort>("recommended");
	const results = useMemo(() => {
		const keyword = normalizeKeyword(query);
		const filtered = items.filter((item) =>
			normalizeKeyword(`${formatDateToYYYYMMDD(item.sungAt)} ${item.memo ?? ""}`).includes(keyword),
		);
		if (sort === "recommended") return filtered;
		return filtered.sort(
			(a, b) => (new Date(a.sungAt).getTime() - new Date(b.sungAt).getTime()) * (sort === "oldest" ? 1 : -1),
		);
	}, [items, query, sort]);

	useEffect(() => {
		const dialog = dialogRef.current;
		const overflow = document.body.style.overflow;
		dialog?.showModal();
		searchRef.current?.focus();
		document.body.style.overflow = "hidden";
		return () => {
			dialog?.close();
			document.body.style.overflow = overflow;
		};
	}, []);

	return (
		<dialog
			ref={dialogRef}
			className="kub-history-dialog"
			aria-labelledby="kub-history-title"
			onClose={onClose}
			onKeyDown={(event) => {
				event.stopPropagation();
				if (event.key === "Escape" && !event.nativeEvent.isComposing) {
					event.preventDefault();
					event.currentTarget.close();
				}
			}}
			onClick={(event) => {
				if (event.target !== event.currentTarget) return;
				const rect = event.currentTarget.getBoundingClientRect();
				if (
					event.clientX < rect.left ||
					event.clientX > rect.right ||
					event.clientY < rect.top ||
					event.clientY > rect.bottom
				)
					event.currentTarget.close();
			}}
		>
			<header className="kub-history-header">
				<div>
					<h2 id="kub-history-title">방송 히스토리</h2>
					<p>
						{song.title} · {song.artist}
					</p>
				</div>
				<button
					className="kub-history-close"
					aria-label="방송 히스토리 닫기"
					onClick={() => dialogRef.current?.close()}
				>
					<X />
				</button>
			</header>
			<div className="kub-history-controls">
				<label className="kub-history-search">
					<Search aria-hidden="true" />
					<input
						ref={searchRef}
						type="search"
						aria-label="방송 날짜·메모 검색"
						placeholder="날짜·메모 검색"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
					/>
				</label>
				<select
					name="kub-history-sort"
					aria-label="방송 히스토리 정렬"
					value={sort}
					onChange={(event) => setSort(event.target.value as HistorySort)}
				>
					<option value="recommended">추천순</option>
					<option value="newest">최신순</option>
					<option value="oldest">오래된순</option>
				</select>
			</div>
			<p className="kub-history-count" role="status">
				전체 {items.length}개 · {results.length}개 표시
			</p>
			<div className="kub-history-results">
				{results.length ? (
					<HistoryItems
						song={song}
						items={results}
						onPlay={(item) => {
							dialogRef.current?.close();
							onPlay(item);
						}}
					/>
				) : (
					<p className="kub-history-empty">일치하는 방송 기록이 없어요.</p>
				)}
			</div>
		</dialog>
	);
}

export function SongHistory({ song }: { song: Song }) {
	const add = usePlayerStore((state) => state.add);
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const histories = useMemo(
		() =>
			[...(song.song_histories ?? [])].sort((a, b) => {
				if ((a.priority === 7) !== (b.priority === 7)) return a.priority === 7 ? -1 : 1;
				return b.priority - a.priority || new Date(b.sungAt).getTime() - new Date(a.sungAt).getTime();
			}),
		[song.song_histories],
	);
	const play = (item: HamkubbySongHistoryModel) => {
		const track = toQueueTrack(song, item);
		if (track) add(track, true);
	};
	return (
		<section className="kub-detail-section">
			<h3>
				<Music2 />
				쿠비가 부른 영상
			</h3>
			{histories.length ? (
				<HistoryItems song={song} items={histories.slice(0, previewLimit)} onPlay={play} />
			) : (
				<p>아직 등록된 노래 영상이 없어요.</p>
			)}
			{histories.length > previewLimit && (
				<button ref={triggerRef} className="kub-history-more" aria-haspopup="dialog" onClick={() => setOpen(true)}>
					방송 기록 {histories.length}개 전체 보기 <Search aria-hidden="true" />
				</button>
			)}
			{open && (
				<HistoryDialog
					song={song}
					items={histories}
					onClose={() => {
						setOpen(false);
						triggerRef.current?.focus({ preventScroll: true });
					}}
					onPlay={play}
				/>
			)}
		</section>
	);
}
