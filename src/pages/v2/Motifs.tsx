import { useState } from "react";

export function Horn({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
	return <img className={`kub-horn ${className}`} src={`/images/v2/horn_${tone}.svg`} alt="" aria-hidden="true" />;
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
			<path
				d="M4 21C4 11 10 5 20 5s16 6 16 16c0 9-6 14-16 14S4 30 4 21Z"
				stroke="#493B3D"
				strokeWidth="2.4"
				strokeLinejoin="round"
			/>
			<path d="M12 14q3-3 7-3" stroke="#FFFDF8" strokeWidth="2.8" strokeLinecap="round" />
		</svg>
	);
}

function GoblinFlame({ className = "" }: { className?: string }) {
	return (
		<svg
			className={`kub-goblin-flame ${className}`}
			viewBox="0 0 80 108"
			fill="none"
			aria-hidden="true"
			focusable="false"
		>
			<path
				d="M43 8c5 21-16 25-9 43 3-9 11-12 14-21 0 16 19 23 18 42-1 17-12 28-27 28S13 88 14 73c1-13 12-19 9-33 9 4 10 10 9 15C24 34 44 29 43 8Z"
				fill="currentColor"
			/>
			<path
				d="M41 55c-2 14 12 19 10 30-1 8-7 12-13 10-11-3-13-15-7-24-1 10 5 12 6 8-2-9 4-14 4-24Z"
				fill="var(--kub-bg)"
				opacity=".7"
			/>
		</svg>
	);
}

function FrostFlower({ variant, offset }: { variant: "folded" | "rounded"; offset: { x: number; y: number } }) {
	return (
		<svg
			viewBox="0 0 144 144"
			fill="none"
			style={{ translate: `${offset.x}px ${offset.y}px` }}
			aria-hidden="true"
			focusable="false"
		>
			{variant === "rounded" ? (
				Array.from({ length: 5 }, (_, index) => (
					<g key={index} transform={`rotate(${index * 72} 72 74)`}>
						<path d="M72 74C58 62 47 43 52 28c3-11 14-12 20-4 7-9 18-6 21 5 5 16-9 35-21 45Z" fill="currentColor" />
						<path
							d="M72 62c-4-13-4-24 0-31"
							stroke="var(--kub-bg)"
							strokeWidth="3"
							strokeLinecap="round"
							opacity=".55"
						/>
					</g>
				))
			) : (
				<>
					<path
						d="M69 72C48 75 20 78 18 59c-2-15 8-32 19-29 16 3 26 22 32 42ZM69 72C56 52 48 30 61 18 72 7 86 8 94 18c14 18-5 37-25 54ZM71 73c10-20 26-47 39-38 11 8 18 28 12 39-7 12-32 8-51-1ZM71 75c22 4 47 12 40 29-5 14-20 22-32 15-12-8-11-28-8-44ZM68 75c0 23-3 43-17 44-15 2-28-9-28-22 1-14 26-19 45-22Z"
						fill="currentColor"
					/>
					<path
						d="M58 61C46 44 35 41 30 57m39-4c-4-16 2-27 10-28M86 67c10-3 18-9 20-16M82 89c10 12 10 18 4 20M55 89c-8 5-15 9-16 15"
						stroke="var(--kub-bg)"
						strokeWidth="3"
						strokeLinecap="round"
						opacity=".55"
					/>
				</>
			)}
			<circle cx={variant === "rounded" ? 72 : 69} cy="74" r="6" fill="var(--kub-bg)" opacity=".7" />
		</svg>
	);
}

function FrostCurl() {
	return (
		<svg className="kub-frost-curl" viewBox="0 0 480 200" fill="none" aria-hidden="true" focusable="false">
			<path
				d="M-30 143c92 37 113-92 206-55 40 16 40 61 12 66-28 5-40-31-14-39m-50 38c89 74 172-37 237-24 48 10 59 45 104 34"
				stroke="currentColor"
				strokeWidth="1.3"
				strokeLinecap="round"
			/>
			<path
				d="M-20 162c83 19 131-8 168-40m148 23c38-3 40-51 91-52 33-1 56 14 90 9"
				stroke="currentColor"
				strokeWidth=".8"
				strokeLinecap="round"
			/>
		</svg>
	);
}

export function BackgroundEffects() {
	const [flowerOffsets] = useState(() =>
		Array.from({ length: 5 }, () => ({
			x: Math.round((Math.random() - 0.5) * 24),
			y: Math.round((Math.random() - 0.5) * 40),
		})),
	);

	return (
		<div className="kub-background-effects" aria-hidden="true">
			<div className="kub-frost-mist" />
			<GoblinFlame className="kub-flame-left" />
			<GoblinFlame className="kub-flame-right" />
			<FrostCurl />
			<div className="kub-frost-flowers">
				{flowerOffsets.map((offset, index) => (
					<FrostFlower key={index} variant={index % 2 ? "rounded" : "folded"} offset={offset} />
				))}
			</div>
			<div className="kub-frost-motes">
				<span />
				<span />
				<span />
				<span />
			</div>
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

