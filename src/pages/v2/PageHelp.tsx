import { useLocation } from "react-router-dom";

function SongbookHelp() {
	return (
		<>
			<h2>노래책 설명서</h2>
			<ol>
				<li>
					<strong>검색</strong> — 곡명·가수·초성으로 찾기
				</li>
				<li>
					<strong>신청</strong> — 제목 - 가수 복사 후, 원본 시트의 가격에 맞춰 미션 신청
				</li>
			</ol>
			<p>
				<span className="kub-tag kub-tag-green">쿠비 등록곡</span> 쿠비가 시트에 등록한 곡
			</p>
			<p>
				<span className="kub-tag kub-tag-brown">추가 수록곡</span> 가창 기록을 바탕으로 추가한 곡
			</p>
			<p>아무 글자 키로 검색창 이동이 가능해요</p>
			<a
				href="https://docs.google.com/spreadsheets/d/1KcU5pDIiE6rsiTzbSj5-OEF2pzEKbBkPSgjNT2pq2KE"
				target="_blank"
				rel="noopener noreferrer"
			>
				원본 노래책 열기 ↗
			</a>
		</>
	);
}

export function PageHelp({ open }: { open: boolean }) {
	const { pathname } = useLocation();
	const path = pathname.replace(/\/+$/, "");
	const page = path === "/videos" ? "videos" : path === "/recap" ? "recap" : "songbook";
	const label = page === "videos" ? "유튜브 영상" : page === "recap" ? "리캡" : "노래책";
	return (
		<section id="kub-help" className="kub-help" hidden={!open} aria-label={label + " 이용 안내"}>
			{page === "songbook" ? (
				<SongbookHelp />
			) : page === "videos" ? (
				<>
					<h2>유튜브 영상 이용 안내</h2>
					<ul>
						<li>
							<strong>찾기</strong> — 제목 검색 · 채널·방송일 필터
						</li>
						<li>
							<strong>보기</strong> — 썸네일·제목을 누르면 YouTube 새탭 열림
						</li>
					</ul>
					<a href="https://www.youtube.com/@hamkubby" target="_blank" rel="noopener noreferrer">
						햄쿠비 유튜브 ↗
					</a>
					{" · "}
					<a href="https://www.youtube.com/@kubbyreplay" target="_blank" rel="noopener noreferrer">
						방송 다시보기 ↗
					</a>
				</>
			) : (
				<>
					<h2>리캡 이용 안내</h2>
					<p>한 해의 노래 기록을 돌아보는 연말 리캡. 현재 준비 중이에요.</p>
				</>
			)}
		</section>
	);
}

