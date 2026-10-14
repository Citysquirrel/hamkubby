import { useLayoutEffect, useRef, useState } from "react";
import { ProfileEffects, RiceCake } from "./Motifs";

const greetings = [
	{ lead: "오늘은", title: "이 노래 어때요?", description: "쿠비에게 듣고 싶은 곡을 찾아보세요." },
	{ lead: "문득 생각난", title: "그 노래 있나요?", description: "제목이 가물가물하면 가수 이름으로 찾아보세요." },
	{ lead: "오늘 듣고 싶은", title: "한 곡을 골라봐요.", description: "익숙한 노래도, 오랜만에 듣는 노래도 좋아요." },
	{ lead: "다음 노래는", title: "어떤 곡으로 할까요?", description: "목록을 넘겨 보며 듣고 싶은 곡을 찾아보세요." },
	{ lead: "좋아하는 노래", title: "여기 있나요?", description: "노래 제목이나 가수 이름으로 검색해 보세요." },
];
const portraits = Object.values(
	import.meta.glob<string>(
		["/public/images/v2/portrait*.{webp,png,jpg,jpeg,avif}", "/public/images/v2/portraits/*.{webp,png,jpg,jpeg,avif}"],
		{ eager: true, query: "?url", import: "default" },
	),
);

const socials = [
	{ label: "치지직", image: "chzzk.svg", href: "https://chzzk.naver.com/9351fb8417f73405c84e0846409e3263" },
	{ label: "YouTube", image: "youtube.svg", href: "https://www.youtube.com/@hamkubby" },
	{ label: "다시보기", image: "youtube.svg", href: "https://www.youtube.com/@kubbyreplay" },
	{ label: "팬카페", image: "naver_cafe.svg", href: "https://cafe.naver.com/f-e/cafes/30907241/menus/104?viewType=L" },
	{ label: "X", image: "x.svg", href: "https://x.com/hamkubby" },
];

function SocialLinks() {
	return (
		<div className="kub-socials" aria-label="햄쿠비 바로가기">
			{socials.map(({ label, image, href }) => (
				<a key={label} href={href} target="_blank" rel="noopener noreferrer">
					<img className="kub-platform" src={`/images/${image}`} alt="" />
					{label}
				</a>
			))}
		</div>
	);
}

export function Profile({ open }: { open: boolean }) {
	const [greeting] = useState(() => greetings[Math.floor(Math.random() * greetings.length)]);
	const [portrait] = useState(
		() => portraits[Math.floor(Math.random() * portraits.length)] ?? "/images/v2/portrait.webp",
	);
	const shellRef = useRef<HTMLDivElement>(null);
	const cardRef = useRef<HTMLElement>(null);
	const previousOpen = useRef(open);

	useLayoutEffect(() => {
		if (previousOpen.current === open) return;
		previousOpen.current = open;
		const shell = shellRef.current;
		const card = cardRef.current;
		const avatar = shell?.closest("#kub-music-room")?.querySelector(".kub-avatar-button");
		if (!shell || !card || !avatar || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const bounds = card.getBoundingClientRect();
		const target = avatar.getBoundingClientRect();
		if (!bounds.width || !bounds.height) return;
		const folded = {
			transform: `translate(${target.left - bounds.left}px, ${target.top - bounds.top}px) scale(${target.width / bounds.width}, ${target.height / bounds.height})`,
			opacity: 0,
			borderRadius: "50%",
		};
		const expanded = {
			transform: "translate(0, 0) scale(1)",
			opacity: 1,
			borderRadius: getComputedStyle(card).borderRadius,
		};
		shell.dataset.animating = "true";
		const animation = card.animate(open ? [folded, expanded] : [expanded, folded], {
			duration: 460,
			easing: open ? "cubic-bezier(.16,1,.3,1)" : "cubic-bezier(.6,0,.8,.3)",
		});
		animation.onfinish = () => {
			delete shell.dataset.animating;
		};
		return () => {
			animation.cancel();
			delete shell.dataset.animating;
		};
	}, [open]);

	return (
		<>
			<div className="kub-hero-shell" id="kub-hero" ref={shellRef} inert={!open} aria-hidden={!open}>
				<div className="kub-hero-clip">
					<section className="kub-hero" ref={cardRef} aria-label="햄쿠비 소개">
						<ProfileEffects />
						<RiceCake color="pink" className="kub-profile-cake" />
						<div className="kub-hero-copy">
							<div className="kub-profile-line">
								<img className="kub-avatar kub-profile-avatar" src="/images/v2/avatar.png" alt="" />
								<div>
									<strong>노래하는 얼음도깨비, 햄쿠비</strong>
									<div className="kub-eyebrow">HAMKUBBY'S MUSIC ROOM</div>
								</div>
							</div>
							<h1>
								{greeting.lead}
								<br />
								<span>{greeting.title}</span>
							</h1>
							<p>
								{greeting.description}
								<br />
								제목과 가수를 복사하면 신청 준비 끝.
							</p>
							<SocialLinks />
						</div>
						<div className="kub-portrait-wrap">
							<img
								className="kub-portrait"
								src={portrait}
								alt="햄쿠비"
								onError={(event) => {
									if (!event.currentTarget.src.endsWith("/images/v2/portrait.webp"))
										event.currentTarget.src = "/images/v2/portrait.webp";
								}}
							/>
							<img className="kub-ribbon" src="/images/v2/ribbon.svg" alt="" />
						</div>
					</section>
				</div>
			</div>
			<div className="kub-compact-profile" hidden={open}>
				<span>노래하는 얼음도깨비, 햄쿠비</span>
				<SocialLinks />
			</div>
		</>
	);
}

