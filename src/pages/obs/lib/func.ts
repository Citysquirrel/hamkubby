import { parseColor } from "@chakra-ui/react";

export const getShadow = (s?: Broadcast.ShadowSettings) =>
	s?.enabled ? `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color || "rgba(0,0,0,0.5)"}` : "none";

export const getMask = (top?: number, bottom?: number) =>
	`linear-gradient(to bottom, transparent, black ${top || 0}%, black ${100 - (bottom || 0)}%, transparent)`;

export const safeParseColor = (val: string) => {
	try {
		return parseColor(val);
	} catch {
		return parseColor("#ffffff");
	}
};
