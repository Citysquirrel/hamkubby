import { useEffect, useState, type CSSProperties } from "react";
import YouTube from "react-youtube";
import { ArrowDown, ArrowUp, ExternalLink, GripHorizontal, ListMusic, LoaderCircle, Maximize2, Minimize2, MoreHorizontal, Pause, Play, Plus, Repeat, Repeat1, RotateCcw, Shuffle, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { formatPlaybackTime, type QueueTrack } from "../lib/player";
import { formatDateToYYYYMMDD } from "../lib/date";
import { useQueuePlayback } from "../hooks/useQueuePlayback";
import type { usePlayerLayout } from "../hooks/usePlayerLayout";
import { usePlayerStore } from "../store/usePlayerStore";
import { PlayerTimeline } from "./PlayerTimeline";
import { isBoolean, readStoredValue, writeStoredValue } from "../lib/storage";
import "./queue-player.css";

const options = { width: "100%", height: "100%", playerVars: { playsinline: 1, controls: 1, rel: 0, origin: window.location.origin } };

function VolumeControl({ value, muted, onMute, onChange }: { value: number; muted: boolean; onMute: () => void; onChange: (value: number) => void }) {
	const [dismissed, setDismissed] = useState(false);
	const silent = muted || value === 0;
	const volume = muted ? 0 : value;
	return <div className="kub-player-volume" data-player-no-drag data-dismissed={dismissed}
		onPointerEnter={() => setDismissed(false)} onFocus={() => setDismissed(false)}
		onKeyDown={(event) => {
			if (event.key === "Escape") {
				event.preventDefault();
				event.currentTarget.querySelector("button")?.focus();
				setDismissed(true);
			}
		}}>
		<button aria-label={silent ? "음소거 해제" : "음소거"} aria-pressed={silent} onClick={onMute}>{silent ? <VolumeX /> : <Volume2 />}</button>
		<div className="kub-player-volume-popup">
			<div className="kub-player-volume-slider">
				<input aria-label="볼륨" aria-orientation="vertical" aria-valuetext={`${volume}%`} type="range" min={0} max={100} step={1}
					value={volume} style={{ "--kub-range-fill": `${volume}%` } as CSSProperties}
					onChange={(event) => onChange(Number(event.target.value))} />
				<output aria-hidden="true">{volume}%</output>
			</div>
		</div>
	</div>;
}

function TrackList({ tracks, currentId, onPlay, onMove, onRemove }: {
	tracks: QueueTrack[]; currentId?: string; onPlay: (id: string) => void; onMove: (id: string, offset: number) => void; onRemove: (id: string) => void;
}) {
	return <ol className="kub-queue-tracks">
		{tracks.map((track, index) => <li key={track.id} data-current={track.id === currentId}>
			<button className="kub-queue-track" onClick={() => onPlay(track.id)} aria-label={`${track.title} 재생`} aria-current={track.id === currentId ? "true" : undefined}>
				<span className="kub-queue-number">{track.id === currentId ? <Play /> : index + 1}</span>
				<span><strong>{track.title}</strong><small>{track.artist} · {formatDateToYYYYMMDD(track.sungAt)}</small><small>{formatPlaybackTime(track.start)}–{track.end === null ? "종료 미등록" : formatPlaybackTime(track.end)}</small></span>
			</button>
			<div className="kub-queue-row-actions">
				<button aria-label={`${track.title} 위로`} disabled={index === 0} onClick={() => onMove(track.id, -1)}><ArrowUp /></button>
				<button aria-label={`${track.title} 아래로`} disabled={index === tracks.length - 1} onClick={() => onMove(track.id, 1)}><ArrowDown /></button>
				<button aria-label={`${track.title} 삭제`} onClick={() => onRemove(track.id)}><X /></button>
			</div>
		</li>)}
	</ol>;
}

export function QueuePlayer({ layout, onClose }: { layout: ReturnType<typeof usePlayerLayout>; onClose: () => void }) {
	const state = usePlayerStore();
	const playback = useQueuePlayback();
	const [tab, setTab] = useState("queue");
	const [name, setName] = useState("");
	const [selectedList, setSelectedList] = useState("");
	const [segmentOnly, setSegmentOnly] = useState(() => readStoredValue("songbook-player-segment-only", false, isBoolean));
	useEffect(() => { writeStoredValue("songbook-player-segment-only", segmentOnly); }, [segmentOnly]);
	const track = state.queue.find((item) => item.id === state.currentId);
	const showThumbnail = !!track && !state.playing && !state.wantPlay;
	const playLabel = playback.loading ? playback.ready && state.wantPlay ? "불러오는 중 · 일시정지" : "영상 준비 중"
		: state.playing ? "일시정지" : playback.error ? "다시 재생" : "재생";
	const list = state.lists.find((item) => item.id === selectedList);
	const hasNext = state.queue.length > 0 && (state.repeat === "all" || (state.shuffle ? state.queue.some((item) => !state.visited.includes(item.id)) : state.queue.findIndex((item) => item.id === state.currentId) < state.queue.length - 1));
	const repeatLabel = state.repeat === "off" ? "반복 끔" : state.repeat === "one" ? "한 곡 반복" : "전체 반복";
	const cycleRepeat = () => usePlayerStore.setState({ repeat: state.repeat === "off" ? "all" : state.repeat === "all" ? "one" : "off" });
	const resizeEdges = layout.mobile ? [] : layout.dock === "bottom" ? ["top"] as const
		: layout.compact ? [] : layout.dock === "floating" ? ["width", "top", "bottom", "corner"] as const : ["width", "top", "bottom"] as const;
	useEffect(() => {
		if (state.open && layout.mobile && layout.dock === "expanded" && !layout.minimized && !layout.panelRef.current?.contains(document.activeElement)) {
			layout.panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
		}
	}, [state.open, layout.mobile, layout.dock, layout.minimized, layout.panelRef]);

	return <>
		{layout.candidate && <div className="kub-dock-preview" data-dock={layout.candidate} aria-hidden="true">여기에 놓아 고정</div>}
		<section ref={layout.panelRef} className="kub-player" style={{ ...layout.panelStyle, "--kub-bar-height": `${layout.panelStyle.height}px` } as CSSProperties} data-dock={layout.dock} data-mobile={layout.mobile} data-moving={layout.moving} data-compact={layout.compact} data-list-above={layout.listAbove} hidden={!state.open} aria-label="영상 플레이어" onKeyDown={(event) => event.stopPropagation()} onPointerDown={(event) => { if (layout.compact) layout.begin(event); }}>
			<header className="kub-player-header" onPointerDown={(event) => { if (!layout.compact) layout.begin(event); }}>
				<GripHorizontal aria-hidden="true" /><strong>쿠비 플레이어</strong>
				<VolumeControl value={state.volume} muted={state.muted} onMute={playback.mute} onChange={playback.volume} />
				<button aria-label={layout.listOpen ? "목록 접기" : "목록 펼치기"} title="재생 목록" aria-expanded={layout.listOpen} onClick={layout.toggleList}><ListMusic /></button>
				<details className="kub-player-menu" onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus(); } }}>
					<summary aria-label="플레이어 설정" title="플레이어 설정"><MoreHorizontal /></summary>
					<div className="kub-player-menu-content">
						<label>배치 <select aria-label="플레이어 배치" value={layout.dock} onChange={(event) => layout.place(event.target.value)}>
							{layout.mobile ? <><option value="top">상단</option><option value="bottom">하단</option><option value="expanded">펼쳐 보기</option></> : <><option value="floating">떠 있기</option><option value="left">왼쪽</option><option value="right">오른쪽</option><option value="bottom">하단</option></>}
						</select></label>
						<button onClick={layout.reset}><RotateCcw />크기·위치 초기화</button>
						<button aria-pressed={segmentOnly && track?.end != null} disabled={track?.end == null} onClick={() => setSegmentOnly(!segmentOnly)}>재생바: {segmentOnly && track?.end != null ? "노래 구간만 보기" : "전체 영상 보기"}</button>
						<button aria-pressed={state.shuffle} onClick={() => usePlayerStore.setState({ shuffle: !state.shuffle, visited: state.currentId ? [state.currentId] : [] })}><Shuffle />셔플 {state.shuffle ? "켬" : "끔"}</button>
						<button aria-label={`반복 재생: ${repeatLabel}`} aria-pressed={state.repeat !== "off"} onClick={cycleRepeat}>{state.repeat === "one" ? <Repeat1 /> : <Repeat />}{repeatLabel}</button>
						{track && <a href={`https://www.youtube.com/watch?v=${track.videoId}&t=${Math.floor(state.position)}s`} target="_blank" rel="noopener noreferrer">YouTube에서 열기 <ExternalLink /></a>}
						{track && <small>{playback.status}{track.end === null && " · 종료 지점 미등록"}</small>}
					</div>
				</details>
				<button aria-label={layout.compact ? "플레이어 펼치기" : "플레이어 최소화"} title={layout.compact ? "펼치기" : "최소화"} onClick={() => { if (layout.dock === "bottom") layout.place(layout.mobile ? "expanded" : "floating"); else layout.toggleMinimized(); }}>{layout.compact ? <Maximize2 /> : <Minimize2 />}</button>
				<button aria-label="플레이어 닫기" title="닫기" onClick={onClose}><X /></button>
			</header>
			{layout.compact && (playback.error || playback.longPlay) && <div className="kub-player-alert" data-player-no-drag role="status">
				{playback.error ? <>{playback.error} <button onClick={() => track && state.select(track.id)}>다시 시도</button></> : <>종료 지점이 없는 곡을 5분 넘게 재생하고 있어요. <button onClick={playback.dismissLongPlay}>안내 닫기</button></>}
				{hasNext && <button onClick={() => state.next()}>다음 곡</button>}
			</div>}
			<div className="kub-player-body">
				<div className="kub-player-media">
					<div className="kub-player-video" data-player-no-drag data-empty={!track} data-thumbnail={showThumbnail} aria-hidden={!track} inert={!track}>
						{(track || playback.ready) && <YouTube opts={options} title="쿠비 노래 영상" onReady={playback.onReady} onStateChange={playback.onStateChange} onError={playback.onError} />}
						{showThumbnail && track && <button className="kub-player-thumbnail" aria-label={`${track.title} 재생`} disabled={!playback.ready || playback.loading} onClick={playback.toggle}>
							<img src={`https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg`} alt="" draggable={false} />
						</button>}
					</div>
					<div className="kub-player-now" onPointerDown={(event) => { if (!layout.compact) layout.begin(event); }} title={track ? `${track.title} · ${track.artist}` : "쿠비 플레이어"}>
						<strong>{track?.title ?? "아직 담긴 노래가 없어요"}</strong>
						{track && <small>{track.artist} · {formatDateToYYYYMMDD(track.sungAt)}</small>}
						<p role="status">{track ? playback.status : "노래 상세에서 + 버튼으로 대기열에 담을 수 있어요."}</p>
						{track?.end === null && <p className="kub-player-note">종료 지점 미등록 · 원본 영상 끝까지 재생해요.</p>}
						{playback.error && <p role="alert">{playback.error} <button onClick={() => track && state.select(track.id)}>다시 시도</button></p>}
						{playback.longPlay && <div className="kub-player-note" role="status">종료 지점이 없는 곡을 5분 넘게 재생하고 있어요. {hasNext && <button onClick={() => state.next()}>다음 곡</button>} <button onClick={playback.dismissLongPlay}>안내 닫기</button></div>}
					</div>
					<div className="kub-player-controls">
						<PlayerTimeline key={track?.id ?? "empty"} track={track} duration={playback.duration} position={state.position} ready={playback.ready} segmentOnly={segmentOnly} onToggleSegment={() => setSegmentOnly(!segmentOnly)} onSeek={playback.seek} />
						<div className="kub-player-buttons">
							<button aria-label="이전 곡" disabled={!track} onClick={state.previous}><SkipBack /></button>
							<button className="kub-player-play" aria-label={playLabel} title={playLabel} aria-busy={playback.loading} disabled={!track || !playback.ready || (playback.loading && !state.wantPlay)} onClick={playback.toggle}>{playback.loading ? <LoaderCircle className="kub-player-loading" aria-hidden="true" /> : state.playing ? <Pause /> : <Play />}</button>
							<button aria-label="다음 곡" disabled={!hasNext} onClick={() => state.next()}><SkipForward /></button>
							<button aria-label="셔플" aria-pressed={state.shuffle} onClick={() => usePlayerStore.setState({ shuffle: !state.shuffle, visited: state.currentId ? [state.currentId] : [] })}><Shuffle /></button>
							<button aria-label={`반복 재생: ${repeatLabel}`} title={repeatLabel} aria-pressed={state.repeat !== "off"} onClick={cycleRepeat}>{state.repeat === "one" ? <Repeat1 /> : <Repeat />}</button>
						</div>
					</div>
				</div>
				<div className="kub-player-library" data-player-no-drag hidden={!layout.listOpen}>
					<div className="kub-player-tabs" role="group" aria-label="재생 목록 보기">
						<button aria-pressed={tab === "queue"} onClick={() => setTab("queue")}>현재 대기열 <span>{state.queue.length}</span></button>
						<button aria-pressed={tab === "lists"} onClick={() => setTab("lists")}>저장 목록 <span>{state.lists.length}</span></button>
					</div>
					<p className="kub-player-storage">목록은 이 브라우저에 저장돼요.</p>
					{tab === "queue" ? <>
						<form className="kub-player-save" onSubmit={(event) => { event.preventDefault(); const id = state.saveList(name); if (id) { setName(""); setSelectedList(id); } }}>
							<input aria-label="새 저장 목록 이름" placeholder="목록 이름" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} />
							<button disabled={!name.trim()} type="submit"><Plus />목록 저장</button>
						</form>
						{state.lists.length > 0 && <div className="kub-player-save"><select aria-label="덮어쓸 저장 목록" value={selectedList} onChange={(event) => setSelectedList(event.target.value)}><option value="">기존 목록 선택</option>{state.lists.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button disabled={!list} onClick={() => list && state.saveList(list.name, list.id)}>대기열로 덮어쓰기</button></div>}
						<TrackList tracks={state.queue} currentId={state.currentId ?? undefined} onPlay={state.select} onMove={state.move} onRemove={state.remove} />
						{!state.queue.length && <p className="kub-player-empty">+ 담기로 듣고 싶은 노래를 모아보세요.</p>}
					</> : <>
						<select className="kub-player-list-select" aria-label="저장 목록 선택" value={selectedList} onChange={(event) => setSelectedList(event.target.value)}><option value="">목록 선택</option>{state.lists.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.tracks.length})</option>)}</select>
						{list ? <>
							<div className="kub-player-list-actions"><button disabled={!list.tracks.length} onClick={() => { state.useList(list.id, true); setTab("queue"); }}><Play />목록 재생</button><button disabled={!list.tracks.length} onClick={() => state.useList(list.id, false)}><Plus />대기열에 추가</button><button onClick={() => { state.deleteList(list.id); setSelectedList(""); }}>목록 삭제</button></div>
							<form key={list.id} className="kub-player-save" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); state.renameList(list.id, String(data.get("listName") ?? "")); }}><input name="listName" aria-label="저장 목록 이름 변경" defaultValue={list.name} maxLength={80} required /><button type="submit">이름 변경</button></form>
							<TrackList tracks={list.tracks} onPlay={(id) => { state.useList(list.id, true); state.select(id); setTab("queue"); }} onMove={(id, offset) => state.editList(list.id, id, offset)} onRemove={(id) => state.editList(list.id, id)} />
						</> : <p className="kub-player-empty">현재 대기열에서 목록을 저장하거나, 저장된 목록을 선택해 주세요.</p>}
					</>}
					{state.undoList && <button className="kub-player-undo" onClick={state.restoreList}>‘{state.undoList.name}’ 삭제 실행 취소</button>}
					<p className="kub-player-notice" role="status">{state.notice}</p>
				</div>
			</div>
			{resizeEdges.map((edge) => <div key={edge} className="kub-player-resize" data-edge={edge} role="separator"
				aria-label={edge === "width" ? "너비 조절" : edge === "corner" ? "너비와 높이 조절" : edge === "top" ? "위쪽 높이 조절" : "아래쪽 높이 조절"}
				title="드래그 또는 방향키로 크기 조절" aria-orientation={edge === "width" || edge === "corner" ? "vertical" : "horizontal"}
				tabIndex={0} onPointerDown={(event) => layout.begin(event, edge)} onKeyDown={(event) => {
					const horizontal = event.key === "ArrowLeft" || event.key === "ArrowRight";
					const vertical = event.key === "ArrowUp" || event.key === "ArrowDown";
					if ((!horizontal && !vertical) || (edge === "width" && !horizontal) || ((edge === "top" || edge === "bottom") && !vertical)) return;
					event.preventDefault();
					const targetEdge = edge === "corner" ? horizontal ? "width" : "bottom" : edge;
					const grow = targetEdge === "width" ? event.key === (layout.dock === "right" ? "ArrowLeft" : "ArrowRight")
						: event.key === (targetEdge === "top" ? "ArrowUp" : "ArrowDown");
					layout.resizeBy(targetEdge, grow ? 20 : -20);
				}} />)}
		</section>
	</>;
}
