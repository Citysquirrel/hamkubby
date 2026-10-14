import { useState } from "react";
import { Bold, Minus, Plus } from "lucide-react";
import { isBoolean, readStoredValue, writeStoredValue } from "../../lib/storage";

const fontSizes = [12, 14, 16, 20, 24];

export function Lyrics({ text }: { text: string }) {
	const [size, setSize] = useState(() => readStoredValue("lyric-font-size-index", 2,
		(value): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0 && value < fontSizes.length,
	));
	const [bold, setBold] = useState(() => readStoredValue("lyric-font-bold", false, isBoolean));
	const changeSize = (delta: number) => {
		const next = Math.max(0, Math.min(fontSizes.length - 1, size + delta));
		setSize(next);
		writeStoredValue("lyric-font-size-index", next);
	};

	return (
		<section className="kub-lyrics-section" aria-label="가사">
			<div className="kub-lyrics-tools" role="group" aria-label="가사 글자 설정">
				<span>가사</span>
				<button type="button" aria-label="가사 글자 작게" disabled={size === 0} onClick={() => changeSize(-1)}><Minus /></button>
				<button type="button" aria-label="가사 글자 크게" disabled={size === fontSizes.length - 1} onClick={() => changeSize(1)}><Plus /></button>
				<button type="button" aria-label="가사 굵게" aria-pressed={bold} onClick={() => {
					setBold(!bold);
					writeStoredValue("lyric-font-bold", !bold);
				}}><Bold /></button>
			</div>
			<p className="kub-lyrics font-lyric" style={{ fontSize: fontSizes[size], fontWeight: bold ? 700 : 400 }}>{text}</p>
		</section>
	);
}
