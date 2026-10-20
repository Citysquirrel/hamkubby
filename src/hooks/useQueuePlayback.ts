import { useEffect, useRef, useState } from "react";
import type { YouTubeProps } from "react-youtube";
import { useBlocker } from "react-router-dom";
import { persistPlayerState, usePlayerStore } from "../store/usePlayerStore";
import { confirmOnExit } from "../lib/confirm";

interface PlayerApi {
	loadVideoById: (options: { videoId: string; startSeconds: number; endSeconds?: number }) => void;
	cueVideoById: PlayerApi["loadVideoById"];
	playVideo: () => void;
	pauseVideo: () => void;
	stopVideo: () => void;
	seekTo: (seconds: number, allowSeekAhead: boolean) => void;
	getCurrentTime: () => number;
	getDuration: () => number;
	getPlayerState: () => number;
	getVideoData: () => { video_id?: string };
	getVolume: () => number;
	isMuted: () => boolean;
	setVolume: (volume: number) => void;
	mute: () => void;
	unMute: () => void;
	addEventListener: (event: string, listener: () => void) => void;
	removeEventListener: (event: string, listener: () => void) => void;
}

export function useQueuePlayback() {
	const currentId = usePlayerStore((state) => state.currentId);
	const revision = usePlayerStore((state) => state.revision);
	const open = usePlayerStore((state) => state.open);
	const playing = usePlayerStore((state) => state.playing);
	const wantPlay = usePlayerStore((state) => state.wantPlay);
	const blocker = useBlocker(({ nextLocation }) => {
		const state = usePlayerStore.getState();
		return (state.playing || state.wantPlay) && !["/", "/videos", "/recap"].includes(nextLocation.pathname.replace(/\/+$/, "") || "/");
	});
	const [ready, setReady] = useState(false);
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState("영상을 준비하고 있어요.");
	const [error, setError] = useState("");
	const [duration, setDuration] = useState(0);
	const [longPlay, setLongPlay] = useState(false);
	const playerRef = useRef<PlayerApi | null>(null);
	const loadedRevision = useRef(-1);
	const started = useRef(false);
	const ended = useRef(false);
	const elapsed = useRef(0);
	const notified = useRef(false);
	const previousTime = useRef<number | null>(null);
	const previousTick = useRef(0);
	const blocked = useRef(() => {
		setLoading(false);
		usePlayerStore.setState({ playing: false, wantPlay: false });
		setStatus("재생 버튼을 눌러 시작해 주세요.");
	});

	const finish = () => {
		const state = usePlayerStore.getState();
		if (ended.current || !started.current || loadedRevision.current !== state.revision) return;
		ended.current = true;
		setLoading(false);
		playerRef.current?.pauseVideo();
		state.next(true);
	};
	const onReady: YouTubeProps["onReady"] = (event) => {
		playerRef.current = event.target as PlayerApi;
		playerRef.current.addEventListener("onAutoplayBlocked", blocked.current);
		setReady(true);
	};
	const onStateChange: YouTubeProps["onStateChange"] = (event) => {
		const state = usePlayerStore.getState();
		const track = state.queue.find((item) => item.id === state.currentId);
		const player = playerRef.current;
		if (!player) return;
		if (!track) { if (event.data === 1) player.pauseVideo(); return; }
		if (loadedRevision.current !== state.revision || player.getVideoData().video_id !== track.videoId) return;
		setLoading(event.data === -1 || event.data === 3);
		if (event.data === 1) {
			if (!state.open) { player.pauseVideo(); return; }
			started.current = true;
			ended.current = false;
			setError("");
			setStatus("재생 중");
			usePlayerStore.setState({ playing: true, wantPlay: true });
		} else {
			usePlayerStore.setState({ playing: false });
			previousTime.current = null;
			if (event.data === -1) setStatus("영상을 준비하고 있어요.");
			if (event.data === 2) { setStatus("일시정지"); usePlayerStore.setState({ wantPlay: false }); }
			if (event.data === 3) setStatus("불러오는 중");
			if (event.data === 5) setStatus("재생 버튼을 눌러 시작해 주세요.");
			if (event.data === 0) { setStatus("재생 종료"); finish(); }
		}
	};
	const onError: YouTubeProps["onError"] = (event) => {
		setLoading(false);
		const messages: Record<number, string> = {
			2: "영상 정보가 올바르지 않아요.", 5: "영상을 불러오지 못했어요. 다시 시도해 주세요.",
			100: "삭제되었거나 비공개인 영상이에요.", 101: "외부 사이트 재생이 허용되지 않은 영상이에요.",
			150: "외부 사이트 재생이 허용되지 않은 영상이에요.", 153: "YouTube가 재생 환경을 확인하지 못했어요. YouTube에서 열어 주세요.",
		};
		setError(messages[event.data] ?? "재생 중 문제가 생겼어요. 다시 시도해 주세요.");
		setStatus("재생 불가");
		usePlayerStore.setState({ playing: false, wantPlay: false });
	};

	useEffect(() => {
		const player = playerRef.current;
		if (!ready || !player) return;
		const state = usePlayerStore.getState();
		const track = state.queue.find((item) => item.id === state.currentId);
		loadedRevision.current = state.revision;
		started.current = false;
		ended.current = false;
		elapsed.current = 0;
		notified.current = false;
		previousTime.current = null;
		setLongPlay(false);
		setError("");
		setDuration(0);
		setLoading(!!track);
		if (!track) { player.stopVideo(); return; }
		if (state.muted) player.mute(); else player.unMute();
		player.setVolume(state.volume);
		const position = state.position >= (track.end ?? Infinity) ? track.start : Math.max(track.start, state.position);
		const options = { videoId: track.videoId, startSeconds: position, ...(track.end !== null ? { endSeconds: track.end } : {}) };
		usePlayerStore.setState({ position });
		if (state.wantPlay && state.open) player.loadVideoById(options);
		else player.cueVideoById(options);
		setStatus(state.wantPlay ? "불러오는 중" : "영상을 준비하고 있어요.");
	}, [ready, currentId, revision]);

	useEffect(() => {
		if (!open) { playerRef.current?.pauseVideo(); setLoading(false); }
	}, [open]);

	useEffect(() => {
		if (!ready) return;
		const timer = window.setInterval(() => {
			const player = playerRef.current;
			const state = usePlayerStore.getState();
			const track = state.queue.find((item) => item.id === state.currentId);
			if (!player || !track || state.revision !== loadedRevision.current || player.getVideoData().video_id !== track.videoId) return;
			const time = player.getCurrentTime();
			const fullDuration = player.getDuration();
			if (Number.isFinite(fullDuration)) setDuration(fullDuration);
			if (!Number.isFinite(time)) return;
			const playing = player.getPlayerState() === 1;
			if (playing && time >= track.start - 1) {
				started.current = true;
				if (time < track.start) player.seekTo(track.start, true);
				if (track.end !== null && time >= track.end) { finish(); return; }
				const now = performance.now();
				const delta = previousTime.current === null ? 0 : time - previousTime.current;
				const wall = Math.min(1, (now - previousTick.current) / 1000);
				if (delta > 0 && delta < 1.5) elapsed.current += Math.min(delta, wall);
				previousTime.current = time;
				previousTick.current = now;
				if (track.end === null && elapsed.current >= 300 && !notified.current) { notified.current = true; setLongPlay(true); }
			} else previousTime.current = null;
			if (started.current && !ended.current) usePlayerStore.setState({ position: Math.max(track.start, Math.min(time, track.end ?? Infinity)) });
			const volume = player.getVolume();
			const muted = player.isMuted();
			if (Number.isFinite(volume) && (state.volume !== volume || state.muted !== muted)) usePlayerStore.setState({ volume, muted });
		}, 250);
		return () => window.clearInterval(timer);
	}, [ready]);

	useEffect(() => {
		const savePosition = () => {
			const player = playerRef.current;
			const state = usePlayerStore.getState();
			const track = state.queue.find((item) => item.id === state.currentId);
			if (player && track && started.current) {
				const time = player.getCurrentTime();
				if (Number.isFinite(time)) usePlayerStore.setState({ position: Math.max(track.start, Math.min(time, track.end ?? Infinity)) });
			}
			persistPlayerState();
		};
		window.addEventListener("pagehide", savePosition);
		return () => {
			savePosition();
			usePlayerStore.setState({ playing: false, wantPlay: false });
			playerRef.current?.removeEventListener("onAutoplayBlocked", blocked.current);
			window.removeEventListener("pagehide", savePosition);
		};
	}, []);

	useEffect(() => {
		const { enableBeforeUnload, disableBeforeUnload } = confirmOnExit();
		if (playing || wantPlay) enableBeforeUnload();
		return disableBeforeUnload;
	}, [playing, wantPlay]);

	useEffect(() => {
		if (blocker.state !== "blocked") return;
		if (window.confirm("영상이 재생 중이에요. 이 페이지를 떠나 재생을 멈출까요?")) blocker.proceed();
		else blocker.reset();
	}, [blocker]);

	const toggle = () => {
		const player = playerRef.current;
		const state = usePlayerStore.getState();
		if (!player || !state.currentId) return;
		if (state.playing || state.wantPlay) {
			player.pauseVideo();
			setLoading(false);
			setStatus("일시정지");
			usePlayerStore.setState({ wantPlay: false, playing: false });
		}
		else if (error || ended.current) state.select(state.currentId);
		else { setLoading(true); setStatus("불러오는 중"); usePlayerStore.setState({ wantPlay: true }); player.playVideo(); }
	};
	const seek = (time: number) => {
		const state = usePlayerStore.getState();
		const track = state.queue.find((item) => item.id === state.currentId);
		if (!track || !playerRef.current) return;
		const value = Math.max(track.start, Math.min(time, (track.end ?? duration) - .1));
		previousTime.current = null;
		ended.current = false;
		playerRef.current.seekTo(value, true);
		usePlayerStore.setState({ position: value });
	};
	const volume = (value: number) => {
		const player = playerRef.current;
		if (value > 0 && player?.isMuted()) player.unMute();
		if (value === 0) player?.mute();
		// 음소거 해제 후 지정한 볼륨을 마지막에 적용한다.
		player?.setVolume(value);
		usePlayerStore.setState({ volume: value, muted: value === 0 });
	};
	const mute = () => {
		const state = usePlayerStore.getState();
		if (state.muted || state.volume === 0) {
			volume(state.volume === 0 ? 20 : state.volume);
		} else { playerRef.current?.mute(); usePlayerStore.setState({ muted: true }); }
	};
	return { onReady, onStateChange, onError, ready, loading: !!currentId && !error && (!ready || loading), status, error, duration, longPlay, dismissLongPlay: () => setLongPlay(false), toggle, seek, volume, mute };
}
