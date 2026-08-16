import { v4 as uuidv4, v7 as uuidv7 } from "uuid";

export const generatePin = () => {
	const array = new Uint32Array(1);
	window.crypto.getRandomValues(array);
	return (array[0] % 100000000).toString().padStart(8, "0");
};
export const generateRoomId = () => `${Date.now().toString(36)}-${uuidv7()}`;

export const isValidRoomId = (id: string | undefined) => {
	if (!id) return false;
	// 정규식 설명: [알파벳숫자] - [8자리]-[4자리]-[4자리]-[4자리]-[12자리] (대소문자 무관)
	return /^[a-z0-9]+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};
