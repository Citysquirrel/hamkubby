import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export const useRoomId = () => {
	const [roomId, setRoomId] = useState<string | null>(null);

	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search);
		const existingRoomId = searchParams.get("room");

		if (existingRoomId) {
			setRoomId(existingRoomId);
		} else {
			const generateUniqueId = () => `${Date.now().toString(36)}-${uuidv4()}`;
			const newRoomId = generateUniqueId();

			const newUrl = `${window.location.pathname}?room=${newRoomId}`;
			window.history.replaceState({}, "", newUrl);

			setRoomId(newRoomId);
		}
	}, []);

	return roomId;
};
