import { useCallback, useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { API_BASE_URL, SONGBOOK_API_URL } from "../config/base-url";
import { toaster } from "../components/ui/toaster";
import { fetch_ } from "../lib/fetch";
import { parseSongbookData } from "../lib/songbook";
import useSongDataStore from "../store/useSongDataStore";

interface Maintenance {
	maintenance_mode_hamkubby: boolean;
	maintenance_message_hamkubby: string;
}

const SONGBOOK_TIMEOUT = 4000;
const SONGBOOK_RETRY_DELAY = 500;
const SONGBOOK_MAX_RETRIES = 1;

export function useSongbookData() {
	const [isLoading, setIsLoading] = useState(true);
	const [retryAttempt, setRetryAttempt] = useState(0);
	const retrySongbook = useCallback(() => setRetryAttempt((attempt) => attempt + 1), []);
	const [maintenance, setMaintenance] = useState<Maintenance>({
		maintenance_mode_hamkubby: false,
		maintenance_message_hamkubby: "",
	});

	const { setData, setError, startSongDataLoading, stopSongDataLoading } = useSongDataStore(
		useShallow((state) => ({
			setData: state.setData,
			setError: state.setError,
			startSongDataLoading: state.startSongDataLoading,
			stopSongDataLoading: state.stopSongDataLoading,
		})),
	);

	// load data api & modify
	useEffect(() => {
		let isCancelled = false;
		let inFlight = false;
		let requestController: AbortController | undefined;
		let retryTimer: ReturnType<typeof setTimeout> | undefined;
		let finishRetryDelay: (() => void) | undefined;
		const fetchSongbookData = async (isInitialLoad = false) => {
			if (inFlight) return;
			inFlight = true;
			requestController = new AbortController();
			if (isInitialLoad || !useSongDataStore.getState().hasLoaded) {
				startSongDataLoading();
			}

			try {
				for (let attempt = 0; attempt <= SONGBOOK_MAX_RETRIES; attempt++) {
					const res = await fetch_(SONGBOOK_API_URL, {
						timeout: SONGBOOK_TIMEOUT,
						signal: requestController.signal,
					});
					if (isCancelled) return;
					if (res.status >= 200 && res.status < 300) {
						if (!Array.isArray(res.data?.data)) throw new Error("Invalid songbook response");
						setData(parseSongbookData(res.data.data));
						return;
					}
					const canRetry = res.status === 408 || res.status >= 500;
					if (!canRetry || attempt === SONGBOOK_MAX_RETRIES) {
						throw new Error("Failed to load songbook");
					}
					await new Promise<void>((resolve) => {
						finishRetryDelay = resolve;
						retryTimer = setTimeout(() => {
							finishRetryDelay = undefined;
							resolve();
						}, SONGBOOK_RETRY_DELAY);
					});
					if (isCancelled) return;
				}
			} catch {
				if (isCancelled) return;
				setError("노래 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
				toaster.create({
					id: "network-error",
					description: "노래책 데이터 로드 실패: 서버에 문제가 발생했습니다!",
					type: "error",
					closable: true,
				});
			} finally {
				inFlight = false;
				if (!isCancelled) stopSongDataLoading();
			}
		};

		void fetchSongbookData(true);

		const POLLING_INTERVAL = 30 * 1000;
		const intervalId = setInterval(() => {
			void fetchSongbookData(false);
		}, POLLING_INTERVAL);

		return () => {
			isCancelled = true;
			clearInterval(intervalId);
			requestController?.abort();
			clearTimeout(retryTimer);
			finishRetryDelay?.();
			stopSongDataLoading();
		};
	}, [setData, setError, startSongDataLoading, stopSongDataLoading, retryAttempt]);

	// Maintenance API Call
	useEffect(() => {
		let isCancelled = false;
		let timerId: ReturnType<typeof setTimeout>;

		const fetchMaintenance = () => {
			fetch_(`${API_BASE_URL}/api/v2/maintenance`)
				.then((res) => {
					if (isCancelled) return;

					if (res.status !== 200) {
						return;
					}

					const data: { msg: string; data: Maintenance } = res.data;
					if (data) {
						const { maintenance_mode_hamkubby, maintenance_message_hamkubby } = data.data;
						setMaintenance({ maintenance_mode_hamkubby, maintenance_message_hamkubby });

						if (maintenance_mode_hamkubby) {
							timerId = setTimeout(fetchMaintenance, 5000);
						}
					}
				})
				.finally(() => {
					if (!isCancelled) {
						setIsLoading(false);
					}
				});
		};

		fetchMaintenance();

		return () => {
			isCancelled = true;
			clearTimeout(timerId);
		};
	}, []);

	return { isLoading, maintenance, retrySongbook };
}

