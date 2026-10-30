import { ProfileEffects } from "./Motifs";

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

export function Profile({
	portrait,
	onPortraitError,
}: {
	portrait: string;
	onPortraitError: () => void;
}) {
	return (
		<section className="kub-hero" aria-label="햄쿠비 소개">
			<ProfileEffects />
			<div className="kub-hero-copy">
				<SocialLinks />
			</div>
			<div className="kub-portrait-wrap" aria-hidden="true">
				<img className="kub-portrait" src={portrait} alt="" onError={onPortraitError} />
			</div>
		</section>
	);
}

