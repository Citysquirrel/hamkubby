import { Stack, Text, Heading, Link } from "@chakra-ui/react";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import Cursor from "./components/Cursor";
import { DraggablePreview } from "./components/DraggablePreview";
import { useSongbookData } from "./hooks/useSongbookData";
import { confirmOnExit } from "./lib/confirm";
import useUiStore from "./store/useUiStore";
import { PageShell } from "./pages/v2/PageShell";
import "./index.css";

export default function AppV2() {
	const { isLoading, maintenance } = useSongbookData();
	const { showPreview, previewVideo, closePreview } = useUiStore(useShallow((state) => ({
		showPreview: state.showPreview,
		previewVideo: state.previewVideo,
		closePreview: state.closePreview,
	})));

	useEffect(() => {
		const { enableBeforeUnload, disableBeforeUnload } = confirmOnExit();
		if (showPreview) enableBeforeUnload();
		return disableBeforeUnload;
	}, [showPreview]);

	if (isLoading || maintenance.maintenance_mode_hamkubby) {
		return (
			<Stack minH="100dvh" align="center" justify="center" bg="sqBg" color="fg" p="6">
				<Cursor />
				{isLoading ? <Text role="status">노래책을 준비하고 있어요.</Text> : <>
					<Heading>사이트 점검중</Heading>
					<Text>{maintenance.maintenance_message_hamkubby}</Text>
					<Link href="https://docs.google.com/spreadsheets/d/1KcU5pDIiE6rsiTzbSj5-OEF2pzEKbBkPSgjNT2pq2KE" target="_blank" rel="noopener noreferrer">원본 노래책 열기</Link>
				</>}
			</Stack>
		);
	}

	return <>
		<Cursor />
		<PageShell><Outlet /></PageShell>
		{showPreview && <DraggablePreview videoId={previewVideo[0]} start={previewVideo[1]} end={previewVideo[2]} onClose={closePreview} />}
	</>;
}
