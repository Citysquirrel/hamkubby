import { ArrowUpRight } from "lucide-react";

export default function Videos() {
	return <section className="kub-secondary-page" aria-label="유튜브 영상">
		<h1>유튜브 영상</h1>
		<p className="kub-page-description">햄쿠비 유튜브 채널의 영상을 모아볼 공간이에요.</p>
		<section className="kub-page-placeholder" aria-label="영상 목록">
			<h2>영상 목록을 준비하고 있어요.</h2>
			<p>지금은 유튜브 채널에서 영상을 볼 수 있어요.</p>
			<a className="kub-button" href="https://www.youtube.com/@hamkubby" target="_blank" rel="noopener noreferrer">햄쿠비 유튜브 <ArrowUpRight /></a>
		</section>
	</section>;
}
