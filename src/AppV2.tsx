import { Stack, Text, Heading, Link } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import Cursor from "./components/Cursor";
import { useSongbookData } from "./hooks/useSongbookData";
import { PageShell } from "./pages/v2/PageShell";
import "./index.css";
import { useState } from "react";
import { isBoolean, readStoredValue, writeStoredValue } from "./lib/storage";

export default function AppV2() {
	const { isLoading, maintenance } = useSongbookData();
	const [cursorEnabled, setCursorEnabled] = useState(() => readStoredValue("songbook-v2-cursor", true, isBoolean));
	const toggleCursor = () => {
		const next = !cursorEnabled;
		setCursorEnabled(next);
		writeStoredValue("songbook-v2-cursor", next);
	};

	if (isLoading || maintenance.maintenance_mode_hamkubby) {
		return (
			<Stack minH="100dvh" align="center" justify="center" bg="sqBg" color="fg" p="6">
				{cursorEnabled && <Cursor />}
				{isLoading ? <Text role="status">노래책을 준비하고 있어요.</Text> : <>
					<Heading>사이트 점검중</Heading>
					<Text>{maintenance.maintenance_message_hamkubby}</Text>
					<Link href="https://docs.google.com/spreadsheets/d/1KcU5pDIiE6rsiTzbSj5-OEF2pzEKbBkPSgjNT2pq2KE" target="_blank" rel="noopener noreferrer">원본 노래책 열기</Link>
				</>}
			</Stack>
		);
	}

	return <>
		{cursorEnabled && <Cursor />}
		<PageShell cursorEnabled={cursorEnabled} onToggleCursor={toggleCursor}><Outlet /></PageShell>
	</>;
}
