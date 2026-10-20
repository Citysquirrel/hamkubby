import { useEffect, useState } from "react";
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

export function useSongbookData() {
	const [isLoading, setIsLoading] = useState(true);
	const [maintenance, setMaintenance] = useState<Maintenance>({
		maintenance_mode_hamkubby: false,
		maintenance_message_hamkubby: "",
	});

	const { setData, startSongDataLoading, stopSongDataLoading } = useSongDataStore(
		useShallow((state) => ({
			setData: state.setData,
			startSongDataLoading: state.startSongDataLoading,
			stopSongDataLoading: state.stopSongDataLoading,
		})),
	);

	// load data api & modify
	useEffect(() => {
		let isCancelled = false;
		const fetchSongbookData = (isInitialLoad = false) => {
			if (isInitialLoad) {
				startSongDataLoading();
			}

			fetch_(SONGBOOK_API_URL)
				.then((res) => {
					if (isCancelled) return;
					if (res.status >= 200 && res.status < 300) {
						if (!Array.isArray(res.data?.data)) throw new Error("Invalid songbook response");
						setData(parseSongbookData(res.data.data));
					} else {
						toaster.create({
							id: "network-error",
							description: "노래책 데이터 로드 실패: 서버에 문제가 발생했습니다!",
							type: "error",
							closable: true,
						});
					}
				})
				.catch(() => {
					if (isCancelled) return;
					toaster.create({
						id: "network-error",
						description: "노래책 데이터 로드 실패: 서버에 문제가 발생했습니다!",
						type: "error",
						closable: true,
					});
				})
				.finally(() => {
					if (isInitialLoad && !isCancelled) {
						stopSongDataLoading();
					}
				});
		};

		fetchSongbookData(true);

		const POLLING_INTERVAL = 30 * 1000;
		const intervalId = setInterval(() => {
			fetchSongbookData(false);
		}, POLLING_INTERVAL);

		return () => {
			isCancelled = true;
			clearInterval(intervalId);
			stopSongDataLoading();
		};
	}, [setData, startSongDataLoading, stopSongDataLoading]);

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

	return { isLoading, maintenance };
}
