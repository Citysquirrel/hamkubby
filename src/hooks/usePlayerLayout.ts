import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { readStoredValue, writeStoredValue } from "../lib/storage";

type DesktopDock = "floating" | "left" | "right" | "bottom";
type MobileDock = "top" | "bottom" | "expanded";
type ResizeEdge = "width" | "top" | "bottom" | "corner";
interface PlayerLayout {
	dock: DesktopDock;
	mobileDock: MobileDock;
	x: number;
	y: number;
	width: number;
	height: number;
	bottomHeight: number;
}
const initial: PlayerLayout = { dock: "floating", mobileDock: "bottom", x: 40, y: 40, width: 360, height: 560, bottomHeight: 72 };
const key = "songbook-player-layout";
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, Math.max(min, max)));
function isLayout(value: unknown): value is PlayerLayout {
	if (!value || typeof value !== "object") return false;
	const layout = value as PlayerLayout;
	return ["floating", "left", "right", "bottom"].includes(layout.dock) &&
		["top", "bottom", "expanded"].includes(layout.mobileDock) &&
		[layout.x, layout.y, layout.width, layout.height, layout.bottomHeight].every(Number.isFinite);
}

export function usePlayerLayout(open: boolean) {
	const [layout, setLayout] = useState(() => {
		const saved = readStoredValue(key, initial, isLayout);
		return saved.dock === "right" && saved.width === 400 && saved.height === 640 && saved.x === 40 && saved.y === 40 ? initial : saved;
	});
	const [minimized, setMinimized] = useState(false);
	const [listOpen, setListOpen] = useState(false);
	const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
	const [candidate, setCandidate] = useState<DesktopDock | null>(null);
	const [moving, setMoving] = useState(false);
	const [reservedDock, setReservedDock] = useState<DesktopDock | null>(null);
	const panelRef = useRef<HTMLElement>(null);
	const cancelRef = useRef<(() => void) | null>(null);
	const mobile = viewport.width < 768;
	const width = clamp(layout.width, 360, Math.min(640, viewport.width - 320));
	const dock = mobile ? layout.mobileDock : layout.dock;
	const compact = minimized || dock === "bottom";
	const sideDocked = dock === "left" || dock === "right";
	const bottomHeight = clamp(layout.bottomHeight, 72, Math.min(260, viewport.height * .5));
	const minHeight = Math.min(listOpen ? 560 : 410, viewport.height - 16);
	const expandedHeight = Math.min(clamp(layout.height - (listOpen ? 0 : 150), minHeight, viewport.height - 16), viewport.height - 16);
	const height = compact ? 72 : expandedHeight;
	const mobileHeight = compact ? 72 : Math.min(listOpen ? 560 : 410, viewport.height - 80);
	const x = clamp(layout.x, -width / 2, viewport.width - width / 2);
	const y = clamp(layout.y, 0, viewport.height - (sideDocked ? height : height / 2));

	useEffect(() => {
		const resize = () => {
			cancelRef.current?.();
			setViewport({ width: window.innerWidth, height: window.innerHeight });
		};
		window.addEventListener("resize", resize);
		return () => { window.removeEventListener("resize", resize); cancelRef.current?.(); };
	}, []);
	useEffect(() => { if (reservedDock === null) writeStoredValue(key, layout); }, [layout, reservedDock]);
	useEffect(() => { if (!open) cancelRef.current?.(); }, [open]);

	const place = (value: string) => {
		cancelRef.current?.();
		setMinimized(false);
		setLayout((prev) => mobile ? { ...prev, mobileDock: value as MobileDock }
			: { ...prev, dock: value as DesktopDock });
	};
	const begin = (event: ReactPointerEvent<HTMLElement>, resize?: ResizeEdge) => {
		if (mobile || event.button !== 0 || !event.isPrimary || event.defaultPrevented ||
			(!resize && (event.target as Element).closest("button, select, input, textarea, a, details, summary, [contenteditable], [data-player-no-drag], [role='separator']"))) return;
		event.preventDefault();
		event.stopPropagation();
		cancelRef.current?.();
		const original = layout;
		const wasMinimized = minimized;
		const rect = panelRef.current?.getBoundingClientRect();
		if (!rect) return;
		const handle = event.currentTarget;
		handle.setPointerCapture(event.pointerId);
		setReservedDock(original.dock);
		const startX = event.clientX;
		const startY = event.clientY;
		const offsetX = original.dock === "bottom" ? (startX - rect.left) / rect.width * width : startX - rect.left;
		const offsetY = original.dock === "bottom" ? (startY - rect.top) / rect.height * height : startY - rect.top;
		let nextDock: DesktopDock | null = null;
		let started = false;
		let detached = false;
		const move = (pointer: PointerEvent) => {
			if (pointer.pointerId !== event.pointerId) return;
			const dx = pointer.clientX - startX;
			const dy = pointer.clientY - startY;
			if (!started && Math.hypot(dx, dy) < 5) return;
			started = true;
			setMoving(true);
			if (resize) {
				if (original.dock === "bottom") {
					setLayout((prev) => ({ ...prev, bottomHeight: clamp(bottomHeight - dy, 72, Math.min(260, viewport.height * .5)) }));
					return;
				}
				const top = resize === "top" ? clamp(rect.top + dy, 0, rect.bottom - minHeight) : rect.top;
				const nextHeight = resize === "top" ? rect.bottom - top
					: clamp(rect.height + dy, minHeight, sideDocked ? viewport.height - rect.top : viewport.height - 16);
				setLayout((prev) => ({ ...prev,
					...((resize === "width" || resize === "corner") ? { width: clamp(width + (original.dock === "right" ? -dx : dx), 360, Math.min(640, viewport.width - 320)) } : {}),
					...(resize !== "width" ? { height: nextHeight + (listOpen ? 0 : 150), y: top } : {}),
				}));
				return;
			}
			if (sideDocked && !detached && Math.abs(dx) <= 48 && !pointer.altKey) {
				setLayout((prev) => ({ ...prev, y: clamp(rect.top + dy, 0, viewport.height - rect.height) }));
				return;
			}
			if (original.dock === "bottom") setMinimized(true);
			detached = true;
			const nextX = pointer.clientX - offsetX;
			const nextY = pointer.clientY - offsetY;
			const edges: { dock: DesktopDock; distance: number }[] = [
				{ dock: "left", distance: Math.abs(pointer.clientX) },
				{ dock: "right", distance: Math.abs(viewport.width - pointer.clientX) },
				{ dock: "bottom", distance: Math.abs(viewport.height - pointer.clientY) },
			];
			const nearest = edges.filter((edge) => edge.distance <= 64).sort((a, b) => a.distance - b.distance)[0];
			const previous = edges.find((edge) => edge.dock === nextDock);
			// 포인터와 화면 가장자리의 거리만으로 도킹을 판정한다.
			nextDock = pointer.altKey ? null : previous && previous.distance <= 96 && (!nearest || previous.distance <= nearest.distance + 16)
				? previous.dock : nearest?.dock ?? null;
			setCandidate(nextDock);
			setLayout((prev) => ({ ...prev, dock: "floating", x: clamp(nextX, -width / 2, viewport.width - width / 2), y: clamp(nextY, 0, viewport.height - height / 2) }));
		};
		const finish = (cancel: boolean) => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
			window.removeEventListener("pointercancel", abort);
			window.removeEventListener("keydown", escape, true);
			window.removeEventListener("blur", abort);
			handle.removeEventListener("lostpointercapture", abort);
			if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
			if (cancel) { setLayout(original); setMinimized(wasMinimized); }
			else if (started && !resize && nextDock) {
				setMinimized(false);
				setLayout((prev) => ({ ...prev, dock: nextDock!, y: clamp(prev.y, 0, viewport.height - expandedHeight) }));
			}
			setCandidate(null);
			setMoving(false);
			setReservedDock(null);
			cancelRef.current = null;
		};
		const up = (pointer: PointerEvent) => { if (pointer.pointerId === event.pointerId) finish(false); };
		const abort = () => finish(true);
		const escape = (keyboard: KeyboardEvent) => { if (keyboard.key === "Escape") { keyboard.preventDefault(); keyboard.stopPropagation(); finish(true); } };
		cancelRef.current = abort;
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
		window.addEventListener("pointercancel", abort);
		window.addEventListener("keydown", escape, true);
		window.addEventListener("blur", abort);
		handle.addEventListener("lostpointercapture", abort);
	};

	const panelStyle: CSSProperties = mobile
		? { left: 0, right: 0, height: dock === "expanded" && !minimized ? viewport.height : mobileHeight, [dock === "top" ? "top" : "bottom"]: 0 }
		: dock === "floating" ? { left: x, top: y, width, height }
		: dock === "bottom" ? { left: 0, right: 0, bottom: 0, height: bottomHeight }
		: { [dock]: 0, top: y, width, height };
	const contentDock = reservedDock ?? dock;
	const contentStyle: CSSProperties = !open ? {} : mobile
		? dock === "expanded" && !minimized ? {} : { [dock === "top" ? "paddingTop" : "paddingBottom"]: mobileHeight }
		: contentDock === "left" && !minimized ? { paddingLeft: width } : contentDock === "right" && !minimized ? { paddingRight: width } : contentDock === "bottom" ? { paddingBottom: bottomHeight } : {};
	return { panelRef, panelStyle, contentStyle, dock, mobile, moving, candidate, begin, place, compact, minimized, listOpen,
		listAbove: typeof panelStyle.bottom === "number" ? viewport.height - panelStyle.bottom - Number(panelStyle.height) > viewport.height / 2
			: typeof panelStyle.top === "number" && panelStyle.top > viewport.height / 2,
		toggleList: () => setListOpen((prev) => !prev),
		toggleMinimized: () => {
			cancelRef.current?.();
			if (!minimized && sideDocked) setLayout((prev) => ({ ...prev, dock: "floating", x: dock === "left" ? 16 : viewport.width - width - 16, y }));
			setMinimized((prev) => !prev);
			setListOpen(false);
		},
		resizeBy: (edge: ResizeEdge, delta: number) => setLayout((prev) => {
			if (dock === "bottom") return { ...prev, bottomHeight: clamp(bottomHeight + delta, 72, Math.min(260, viewport.height * .5)) };
			if (edge === "width") return { ...prev, width: clamp(width + delta, 360, Math.min(640, viewport.width - 320)) };
			const top = edge === "top" ? clamp(y - delta, 0, y + height - minHeight) : y;
			const nextHeight = edge === "top" ? y + height - top : clamp(height + delta, minHeight, viewport.height - y);
			return { ...prev, y: top, height: nextHeight + (listOpen ? 0 : 150) };
		}),
		reset: () => { cancelRef.current?.(); setLayout(initial); setMinimized(false); setListOpen(false); } };
}
