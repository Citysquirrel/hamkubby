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
		<p>영상의 ▶는 바로 재생, +는 대기열에 담기예요. 플레이어에서 목록을 저장하고 순서를 바꿀 수 있어요.</p>
		<p>목록은 현재 브라우저에 저장됩니다. 플레이어를 닫아도 곡과 위치는 남으며, 헤더의 플레이어 버튼으로 다시 열 수 있어요.</p>
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
	const page = path === "/videos" ? "videos" : path === "/recap" ? "recap" : "songbook";
	const label = page === "videos" ? "유튜브 영상" : page === "recap" ? "리캡" : "노래책";
	return <section id="kub-help" className="kub-help" hidden={!open} aria-label={label + " 이용 안내"}>
		{page === "songbook" ? <SongbookHelp /> : page === "videos" ? <>
			<h2>유튜브 영상 이용 안내</h2>
			<p>검색어를 입력하면 자동으로 찾아드려요. 채널·카테고리·공개일 필터도 선택 즉시 적용되며, 최근 7·30·90일을 빠르게 고를 수 있어요.</p>
			<p>최신순·인기순·오래된순으로 정렬할 수 있어요. 인기순은 마지막으로 확인한 조회수 기준이에요.</p>
			<p>최근 7일 내 본채널의 가장 최신 영상은 상단에 따로 소개해요. 검색 결과 위의 조건을 누르면 해당 조건만 해제돼요.</p>
			<p>날짜는 한국 시간 기준 유튜브 공개일이며, 제목에 적힌 방송 날짜와 다를 수 있어요.</p>
			<p>썸네일이나 제목을 누르면 YouTube 새 탭에서 영상을 볼 수 있어요.</p>
			<p>가창 기록이 연결된 영상은 ‘등록된 노래’를 펼쳐 곡별로 대기열에 담을 수 있어요. 노래책에 등록된 시작·끝 구간을 사용하며, 이미 담긴 기록은 중복으로 추가되지 않아요.</p>
			<a href="https://www.youtube.com/@hamkubby" target="_blank" rel="noopener noreferrer">햄쿠비 유튜브 ↗</a>{" · "}
			<a href="https://www.youtube.com/@kubbyreplay" target="_blank" rel="noopener noreferrer">방송 다시보기 ↗</a>
		</> : <>
			<h2>리캡 이용 안내</h2>
			<p>한 해 동안 쿠비가 부른 노래와 방송의 순간들을 돌아보는 연말 리캡입니다.</p>
			<p>노래 기록을 중심으로 준비하고 있어요. 현재는 준비 중이며, 완성된 리캡은 이 페이지에서 볼 수 있어요.</p>
		</>}
	</section>;
}
