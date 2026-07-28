import { useState, useEffect } from "react";

export const useIsMobile = (): boolean => {
	const [isMobile, setIsMobile] = useState<boolean>(false);

	useEffect(() => {
		const checkMobile = (): boolean => {
			// SSR 환경 등 브라우저가 아닐 경우
			if (typeof window === "undefined" || typeof navigator === "undefined") {
				return false;
			}

			const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || "";

			// 일반적인 스마트폰 및 태블릿
			const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());

			// 최신 iPadOS 대응
			const isMacWithTouch = /Macintosh/i.test(userAgent) && (navigator.maxTouchPoints ?? 0) > 1;

			return isMobileUA || isMacWithTouch;
		};

		setIsMobile(checkMobile());
	}, []);

	return isMobile;
};
