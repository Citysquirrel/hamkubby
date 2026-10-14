import { useLocation } from "react-router-dom";

function SongbookHelp() {
	return <>
		<h2>노래책 설명서</h2>
		<ol>
			<li>검색창에 원하는 곡이나 가수를 입력해 주세요. 초성·영타로도 검색할 수 있어요.</li>
			<li>
				곡을 누르면 상세 정보가 열립니다. 복사 버튼으로 <strong>제목 - 가수</strong>를 복사해 주세요.
			</li>
			<li>스프레드시트에서 안내하는 알맞은 가격의 미션으로 노래 신청!</li>
		</ol>
		<p>
			<span className="kub-tag kub-tag-green">쿠비 등록곡</span> 쿠비가 직접 시트에 입력한 곡입니다.
		</p>
		<p>
			<span className="kub-tag kub-tag-brown">추가 수록곡</span> 시트에는 없지만, 과거에 불렀던 기록을 토대로
			등록한 곡입니다.
		</p>
		<p>
			입력 중이 아닐 때 글자 키를 누르면 검색창으로 이동합니다. <kbd>Esc</kbd>로 검색어를 지울 수 있어요.
		</p>
		<a
			href="https://docs.google.com/spreadsheets/d/1KcU5pDIiE6rsiTzbSj5-OEF2pzEKbBkPSgjNT2pq2KE"
			target="_blank"
			rel="noopener noreferrer"
		>
			원본 노래책 열기 ↗
		</a>
	</>;
}

export function PageHelp({ open }: { open: boolean }) {
	const { pathname } = useLocation();
	const path = pathname.replace(/\/+$/, "");
	const page = path === "/v2/videos" ? "videos" : path === "/v2/recap" ? "recap" : "songbook";
	const label = page === "videos" ? "유튜브 영상" : page === "recap" ? "리캡" : "노래책";
	return <section id="kub-help" className="kub-help" hidden={!open} aria-label={label + " 이용 안내"}>
		{page === "songbook" ? <SongbookHelp /> : page === "videos" ? <>
			<h2>유튜브 영상 이용 안내</h2>
			<p>햄쿠비 유튜브 채널의 영상을 모아볼 페이지입니다. 영상 목록은 준비 중이에요.</p>
			<p>지금은 아래 채널에서 영상을 보실 수 있어요. 방송 다시보기는 다시보기 채널을 이용해 주세요.</p>
			<a href="https://www.youtube.com/@hamkubby" target="_blank" rel="noopener noreferrer">햄쿠비 유튜브 ↗</a>{" · "}
			<a href="https://www.youtube.com/@kubbyreplay" target="_blank" rel="noopener noreferrer">방송 다시보기 ↗</a>
		</> : <>
			<h2>리캡 이용 안내</h2>
			<p>한 해 동안 쿠비가 부른 노래와 방송의 순간들을 돌아보는 연말 리캡입니다.</p>
			<p>노래 기록을 중심으로 준비하고 있어요. 현재는 준비 중이며, 완성된 리캡은 이 페이지에서 볼 수 있어요.</p>
		</>}
	</section>;
}
