import { useState, type CSSProperties } from "react";
import { Focus } from "lucide-react";
import { formatPlaybackTime, type QueueTrack } from "../lib/player";

export function PlayerTimeline({ track, duration, position, ready, segmentOnly, onToggleSegment, onSeek }: {
	track?: QueueTrack; duration: number; position: number; ready: boolean;
	segmentOnly: boolean; onToggleSegment: () => void; onSeek: (time: number) => void;
}) {
	const [preview, setPreview] = useState<number | null>(null);
	const [anchor, setAnchor] = useState(50);
	const [dismissed, setDismissed] = useState(false);
	const start = track?.start ?? 0;
	const end = Math.min(track?.end ?? Infinity, duration || track?.end || start);
	const canZoom = track?.end != null && end > start;
	const zoomed = segmentOnly && canZoom;
	const minimum = zoomed ? start : 0;
	const maximum = zoomed ? end : duration;
	const span = Math.max(0, maximum - minimum);
	const percent = (time: number) => span ? Math.max(0, Math.min(100, (time - minimum) / span * 100)) : 0;
	const disabled = !track || !ready || span <= 0 || end <= start;
	const startPercent = percent(start);
	const endPercent = percent(end);
	const elapsed = Math.max(0, Math.min(position, end) - start);
	const previewTime = preview ?? position;
	const style = {
		"--kub-range-fill": `${percent(position)}%`, "--kub-segment-start": `${startPercent}%`,
		"--kub-segment-end": `${endPercent}%`, "--kub-segment-mid": `${(startPercent + endPercent) / 2}%`,
		"--kub-preview-anchor": `${anchor}%`,
	} as CSSProperties;

	return <div className="kub-player-progress" data-player-no-drag style={style} data-dismissed={dismissed}
		onPointerEnter={() => setDismissed(false)} onPointerLeave={() => setPreview(null)}
		onFocusCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDismissed(false); }}
		onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); setDismissed(true); } }}>
		<div className="kub-timeline-heading">
			<output>{formatPlaybackTime(elapsed)} / {end > start ? formatPlaybackTime(end - start) : "--:--"}</output>
			<button aria-pressed={zoomed} disabled={!canZoom} onClick={onToggleSegment}><Focus />구간만 보기</button>
		</div>
		<div className="kub-timeline-rail" data-has-end={track?.end != null}>
			<input aria-label={zoomed ? "노래 구간 확대 탐색" : "전체 영상에서 노래 구간 탐색"}
				aria-valuetext={`원본 ${formatPlaybackTime(position)}, 노래 구간 ${formatPlaybackTime(elapsed)} / ${formatPlaybackTime(Math.max(0, end - start))}`}
				type="range" min={minimum} max={Math.max(minimum + .1, maximum)} step={.1}
				value={Math.max(minimum, Math.min(position, maximum))} disabled={disabled}
				onFocus={() => { setPreview(null); setAnchor(percent(position)); }}
				onPointerMove={(event) => {
					const rect = event.currentTarget.getBoundingClientRect();
					const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width)));
					setAnchor(ratio * 100);
					setPreview(minimum + ratio * span);
				}}
				onChange={(event) => { const time = Number(event.target.value); setPreview(time); setAnchor(percent(time)); onSeek(Math.max(start, Math.min(time, end - .1))); }} />
			{track && span > 0 && <>
				<span className="kub-timeline-segment" aria-hidden="true" />
				<span className="kub-timeline-tick" data-edge="start" aria-hidden="true" />
				{track.end !== null && <span className="kub-timeline-tick" data-edge="end" aria-hidden="true" />}
			</>}
			{track && <>
				<button className="kub-timeline-marker" data-edge="start" disabled={disabled}
					aria-label={`구간 시작 ${formatPlaybackTime(start)} · 시작으로 이동`}
					onPointerEnter={() => { setPreview(start); setAnchor(startPercent); }} onFocus={() => { setPreview(start); setAnchor(startPercent); }}
					onClick={() => onSeek(start)}><span>시작 <b>{formatPlaybackTime(start)}</b></span></button>
				{track.end !== null ? <button className="kub-timeline-marker" data-edge="end" disabled={disabled}
					aria-label={`구간 끝 ${formatPlaybackTime(end)} · 종료 직전으로 이동`}
					onPointerEnter={() => { setPreview(end); setAnchor(endPercent); }} onFocus={() => { setPreview(end); setAnchor(endPercent); }}
					onClick={() => onSeek(end - .1)}><span>끝 <b>{formatPlaybackTime(end)}</b></span></button>
					: <span className="kub-timeline-no-end">끝 미등록</span>}
			</>}
		</div>
		{track && !disabled && <output className="kub-timeline-preview" aria-hidden="true">{formatPlaybackTime(previewTime)}</output>}
	</div>;
}
