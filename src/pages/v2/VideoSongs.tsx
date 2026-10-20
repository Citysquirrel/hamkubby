import { useId, useState } from "react";
import { Check, ChevronDown, Music2, Plus } from "lucide-react";
import { formatPlaybackTime, type QueueTrack } from "../../lib/player";
import { usePlayerStore } from "../../store/usePlayerStore";

export function VideoSongs({ tracks, loading }: { tracks: QueueTrack[]; loading: boolean }) {
	const [open, setOpen] = useState(false);
	const [notice, setNotice] = useState("");
	const listId = useId();
	const queue = usePlayerStore((state) => state.queue);
	const add = usePlayerStore((state) => state.add);

	if (!tracks.length) {
		return loading ? <p className="kub-video-song-status" role="status">가창 기록을 불러오고 있어요.</p> : null;
	}

	return <section className="kub-video-songs" aria-label="영상에 등록된 노래">
		<button className="kub-video-songs-toggle" aria-expanded={open} aria-controls={listId} onClick={() => setOpen(!open)}>
			<Music2 size={16} aria-hidden="true" />
			<span>등록된 노래 {tracks.length}곡</span>
			<ChevronDown size={16} aria-hidden="true" />
		</button>
		<div id={listId} hidden={!open}>
			<p className="kub-video-hint">등록된 가창 구간을 대기열에 담을 수 있어요.</p>
			<ul className="kub-video-song-list">
				{tracks.map((track) => {
					const added = queue.some((entry) => entry.id === track.id);
					return <li key={track.id}>
						<div>
							<strong>{track.title}</strong>
							<span>{track.artist}</span>
							<small>{formatPlaybackTime(track.start)} ~ {track.end === null ? "끝 미등록" : formatPlaybackTime(track.end)}</small>
						</div>
						<button
							className="kub-video-song-add"
							aria-label={`${track.title} · ${formatPlaybackTime(track.start)} ${added ? "대기열에 담김" : "대기열에 담기"}`}
							disabled={added}
							onClick={() => {
								add(track);
								setNotice(`${track.title} 대기열에 담았어요.`);
							}}
						>
							{added ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
							<span>{added ? "담김" : "담기"}</span>
						</button>
					</li>;
				})}
			</ul>
			<p className="kub-video-hint" role="status">{notice}</p>
		</div>
	</section>;
}
