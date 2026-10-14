import { useLayoutEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";

export function GoToTop() {
	const buttonRef = useRef<HTMLButtonElement>(null);
	useLayoutEffect(() => {
		const button = buttonRef.current;
		const footer = button?.closest("#kub-music-room")?.querySelector(".kub-footer");
		if (!button || !footer) return;
		let frame = 0;
		const update = () => {
			frame = 0;
			button.hidden = window.scrollY <= 80;
			button.style.bottom = `max(${Math.max(16, window.innerHeight - footer.getBoundingClientRect().top + 16)}px, env(safe-area-inset-bottom) + 16px)`;
		};
		const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
		const observer = new ResizeObserver(schedule);
		observer.observe(document.documentElement);
		observer.observe(footer);
		window.addEventListener("scroll", schedule, { passive: true });
		window.addEventListener("resize", schedule);
		update();
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			window.removeEventListener("scroll", schedule);
			window.removeEventListener("resize", schedule);
		};
	}, []);
	return <button ref={buttonRef} className="kub-go-top" aria-label="맨 위로 이동" title="맨 위로 이동" hidden
		onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}>
		<ArrowUp aria-hidden="true" />
	</button>;
}
