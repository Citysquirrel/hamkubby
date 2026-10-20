import { useEffect, useState } from "react";
import { Popover, Portal } from "@chakra-ui/react";
import { Check, ChevronDown, Music2, Plus, X } from "lucide-react";
import { formatPlaybackTime, type QueueTrack } from "../../lib/player";
import { usePlayerStore } from "../../store/usePlayerStore";

export function VideoSongs({ tracks, loading, videoTitle }: { tracks: QueueTrack[]; loading: boolean; videoTitle: string }) {
	const [open, setOpen] = useState(false);
	const [notice, setNotice] = useState("");
	const [portalContainer, setPortalContainer] = useState<{ current: HTMLElement } | null>(null);
	const queue = usePlayerStore((state) => state.queue);
	const add = usePlayerStore((state) => state.add);
	useEffect(() => {
		const container = document.getElementById("kub-music-room");
		if (container) setPortalContainer({ current: container });
	}, []);

	if (!tracks.length) {
		return loading ? <p className="kub-video-song-status" role="status">가창 기록을 불러오고 있어요.</p> : null;
	}

	return <section className="kub-video-songs" aria-label="영상에 등록된 노래">
		<Popover.Root
			unstyled open={open} lazyMount unmountOnExit
			onOpenChange={({ open: next }) => { setOpen(next); setNotice(""); }}
			closeOnInteractOutside closeOnEscape
			positioning={{ placement: "bottom-start", strategy: "fixed", gutter: 8, overflowPadding: 12, flip: true, slide: true }}
		>
			<Popover.Trigger asChild>
				<button className="kub-video-songs-toggle">
					<Music2 size={16} aria-hidden="true" />
					<span>등록된 노래 <b>{tracks.length}</b></span>
					<ChevronDown size={16} aria-hidden="true" />
				</button>
			</Popover.Trigger>
			{portalContainer && <Portal container={portalContainer}>
				<Popover.Positioner className="kub-video-songs-positioner">
					<Popover.Content className="kub-video-songs-popover">
						<header className="kub-video-songs-header">
							<div>
								<Popover.Title className="kub-video-songs-title"><Music2 size={17} aria-hidden="true" />등록된 노래 <span>{tracks.length}곡</span></Popover.Title>
								<Popover.Description className="kub-video-songs-description">{videoTitle}</Popover.Description>
							</div>
							<Popover.CloseTrigger asChild>
								<button className="kub-video-songs-close" aria-label="등록된 노래 닫기"><X size={18} /></button>
							</Popover.CloseTrigger>
						</header>
						<ul className="kub-histories kub-video-song-list">
							{tracks.map((track) => {
								const added = queue.some((entry) => entry.id === track.id);
								return <li key={track.id} className="kub-history-row">
									<div className="kub-video-link">
										<Music2 className="kub-play-icon" aria-hidden="true" />
										<span>
											<strong>{track.title}</strong>
											<small>{track.artist}</small>
											<small className="kub-video-song-time">{formatPlaybackTime(track.start)} ~ {track.end === null ? "끝 미등록" : formatPlaybackTime(track.end)}</small>
										</span>
									</div>
									<button
										className="kub-history-add"
										aria-label={`${track.title} · ${formatPlaybackTime(track.start)} ${added ? "대기열에 담김" : "대기열에 담기"}`}
										title={added ? "대기열에 담김" : "대기열에 담기"}
										aria-pressed={added}
										disabled={added}
										onClick={() => {
											add(track);
											setNotice(`${track.title} 대기열에 담았어요.`);
										}}
									>
										{added ? <Check size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
									</button>
								</li>;
							})}
						</ul>
						<p className="kub-video-songs-notice" role="status">{notice || "+ 버튼으로 가창 구간을 대기열에 담아보세요."}</p>
					</Popover.Content>
				</Popover.Positioner>
			</Portal>}
		</Popover.Root>
	</section>;
}
