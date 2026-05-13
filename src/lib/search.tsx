import { getChoseong } from "es-hangul";

export const normalizeKeyword = (str: string) => {
	return str.replace(/\s+/g, "").toLowerCase();
};

export const isChoseongMatch = (text: string, query: string) => {
	const t = normalizeKeyword(text);
	const q = normalizeKeyword(query);

	// 1. 둘 다 한글이면 정상 초성 비교
	if (isKorean(t) && isKorean(q)) {
		return getChoseong(t).includes(getChoseong(q));
	}

	// 2. query가 초성 입력이면 (ㄱㄴㄷ 형태)
	if (isChoseongLike(q)) {
		return getChoseong(t).includes(q);
	}

	return false;
};

export const isKorean = (str: string) => /[가-힣]/.test(str);

export const isChoseongLike = (str: string) => /^[ㄱ-ㅎ]+$/.test(str); // 초성 입력 감지

export const getScore = (song: any, query: string) => {
	const q = normalizeKeyword(query);

	const title = normalizeKeyword(song.title);
	const artist = normalizeKeyword(song.artist);

	let score = 0;

	// 1. 완전일치
	if (title === q) score += 100;
	if (artist === q) score += 90;

	// 2. prefix 점수
	if (title.startsWith(q)) score += 70;
	if (artist.startsWith(q)) score += 60;

	// 3. 포함
	if (title.includes(q)) score += 50;
	if (artist.includes(q)) score += 40;

	// 4. 초성
	if (isChoseongMatch(song.title, query)) score += 40;
	if (isChoseongMatch(song.artist, query)) score += 35;

	// 5. 별칭 점수(각각 완전일치, 포함, 초성 점수)
	song.synonyms?.forEach((syn: string) => {
		const s = normalizeKeyword(syn);

		if (s === q) score += 80;
		if (s.includes(q)) score += 30;
		if (isChoseongMatch(syn, query)) score += 20;
	});

	return score;
};

export const highlightText = (text: string, query: string) => {
	if (!query) return text;

	const normalizedText = normalizeKeyword(text);
	const normalizedQuery = normalizeKeyword(query);

	const start = normalizedText.indexOf(normalizedQuery);
	if (start === -1) return text;

	const end = start + normalizedQuery.length;

	const map = buildIndexMap(text);

	const realStart = map[start];
	const realEnd = map[end - 1] + 1;

	return (
		<>
			{text.slice(0, realStart)}
			<mark>{text.slice(realStart, realEnd)}</mark>
			{text.slice(realEnd)}
		</>
	);
};

export const highlightChosung = (text: string, query: string) => {
	const map = buildIndexMap(text);

	const t = getChoseong(text);
	const q = getChoseong(query);

	const start = t.indexOf(q);
	if (start === -1) return null;

	const end = start + q.length;

	const realStart = map[start];
	const realEnd = map[end - 1] + 1;

	return (
		<>
			{text.slice(0, realStart)}
			<mark>{text.slice(realStart, realEnd)}</mark>
			{text.slice(realEnd)}
		</>
	);
};

export const getChoseongMatchRange = (text: string, query: string) => {
	const t = getChoseong(text);
	const q = getChoseong(query);

	const start = t.indexOf(q);
	if (start === -1) return null;

	return {
		start,
		end: start + q.length,
	};
};

export const buildIndexMap = (text: string) => {
	const map: number[] = [];
	let j = 0;

	for (let i = 0; i < text.length; i++) {
		if (text[i] !== " ") {
			map[j++] = i;
		}
	}

	return map;
};
