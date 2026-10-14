import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
	page: number;
	pageCount: number;
	pageSize: number;
	total: number;
	onPageChange: (page: number) => void;
	onPageSizeChange?: (size: number) => void;
	position: "상단" | "하단";
}

export function Pagination({ page, pageCount, pageSize, total, onPageChange, onPageSizeChange, position }: PaginationProps) {
	const start = Math.max(1, Math.min(page - 1, pageCount - 2));
	const pages = Array.from({ length: Math.min(3, pageCount) }, (_, index) => start + index);
	return <nav className="kub-pagination" aria-label={`노래 목록 페이지 ${position}`}>
		<div className="kub-page-meta">
			<span aria-live="polite">{total ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, total)} / {total}곡</span>
			{onPageSizeChange && <select aria-label="페이지당 곡 수" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
				{[10, 20, 50].map((size) => <option key={size} value={size}>{size}곡씩</option>)}
			</select>}
		</div>
		<div className="kub-page-buttons">
			<button aria-label="이전 페이지" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft /></button>
			{start > 1 && <><button aria-label="1페이지" onClick={() => onPageChange(1)}>1</button>{start > 2 && <span aria-hidden="true">…</span>}</>}
			{pages.map((number) => <button key={number} aria-label={`${number}페이지`} aria-current={number === page ? "page" : undefined} onClick={() => onPageChange(number)}>{number}</button>)}
			{pages.at(-1)! < pageCount && <>{pages.at(-1)! < pageCount - 1 && <span aria-hidden="true">…</span>}<button aria-label={`${pageCount}페이지`} onClick={() => onPageChange(pageCount)}>{pageCount}</button></>}
			<button aria-label="다음 페이지" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}><ChevronRight /></button>
		</div>
	</nav>;
}
