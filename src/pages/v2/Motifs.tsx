export function Horn({
	side,
	tone = "light",
	className = "",
}: {
	side: "left" | "right";
	tone?: "light" | "dark";
	className?: string;
}) {
	return <img className={`kub-horn ${className}`} src={`/images/v2/horn-${tone}-${side}.svg`} alt="" aria-hidden="true" />;
}

const riceCakeColors = {
	pink: { fill: "#E6A8B8", shade: "#CB839D" },
	white: { fill: "#FFF5E9", shade: "#DFCCC2" },
	green: { fill: "#A9C5B4", shade: "#7EAA96" },
};

export function RiceCake({ color, className = "" }: { color: keyof typeof riceCakeColors; className?: string }) {
	const { fill, shade } = riceCakeColors[color];
	return (
		<svg className={`kub-rice-cake ${className}`} viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
			<path d="M4 21C4 11 10 5 20 5s16 6 16 16c0 9-6 14-16 14S4 30 4 21Z" fill={fill} />
			<path d="M7 25c6 6 19 7 26-1-1 7-6 11-13 11S9 32 7 25Z" fill={shade} />
			<path d="M4 21C4 11 10 5 20 5s16 6 16 16c0 9-6 14-16 14S4 30 4 21Z" stroke="#493B3D" strokeWidth="2.4" strokeLinejoin="round" />
			<path d="M12 14q3-3 7-3" stroke="#FFFDF8" strokeWidth="2.8" strokeLinecap="round" />
		</svg>
	);
}

function GoblinFlame({ className = "" }: { className?: string }) {
	return (
		<svg className={`kub-goblin-flame ${className}`} viewBox="0 0 80 108" fill="none" aria-hidden="true" focusable="false">
			<path d="M43 8c5 21-16 25-9 43 3-9 11-12 14-21 0 16 19 23 18 42-1 17-12 28-27 28S13 88 14 73c1-13 12-19 9-33 9 4 10 10 9 15C24 34 44 29 43 8Z" fill="currentColor" />
			<path d="M41 55c-2 14 12 19 10 30-1 8-7 12-13 10-11-3-13-15-7-24-1 10 5 12 6 8-2-9 4-14 4-24Z" fill="var(--kub-bg)" opacity=".7" />
		</svg>
	);
}

function FrostCurl() {
	return (
		<svg className="kub-frost-curl" viewBox="0 0 480 200" fill="none" aria-hidden="true" focusable="false">
			<path d="M-30 143c92 37 113-92 206-55 40 16 40 61 12 66-28 5-40-31-14-39m-50 38c89 74 172-37 237-24 48 10 59 45 104 34" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
			<path d="M-20 162c83 19 131-8 168-40m148 23c38-3 40-51 91-52 33-1 56 14 90 9" stroke="currentColor" strokeWidth=".8" strokeLinecap="round" />
		</svg>
	);
}

export function BackgroundEffects() {
	return (
		<div className="kub-background-effects" aria-hidden="true">
			<div className="kub-frost-mist" />
			<GoblinFlame className="kub-flame-left" />
			<GoblinFlame className="kub-flame-right" />
			<FrostCurl />
			<div className="kub-frost-motes"><span /><span /><span /><span /></div>
		</div>
	);
}

export function ProfileEffects() {
	return (
		<div className="kub-ambient" aria-hidden="true">
			<GoblinFlame className="kub-flame-profile" />
			<FrostCurl />
		</div>
	);
}
