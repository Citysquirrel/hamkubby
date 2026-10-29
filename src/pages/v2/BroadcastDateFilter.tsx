import { useEffect, useRef, useState } from "react";
import { Popover, Portal } from "@chakra-ui/react";
import { CalendarDays, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { youtubeDateRange, type YoutubeFilters } from "../../lib/youtube";
import "./broadcast-date-filter.css";

type BroadcastRange = Pick<YoutubeFilters, "broadcastFrom" | "broadcastTo">;
type CalendarView = "days" | "years";
const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
const dateLabel = new Intl.DateTimeFormat("ko-KR", {
	timeZone: "UTC",
	year: "numeric",
	month: "long",
	day: "numeric",
	weekday: "long",
});
const toDate = (value: string) => new Date(`${value}T00:00:00Z`);
const dateKey = (date: Date) => date.toISOString().slice(0, 10);

export function BroadcastDateFilter({
	value,
	bounds,
	onChange,
}: {
	value: BroadcastRange;
	bounds: ReturnType<typeof youtubeDateRange> | null;
	onChange: (range: BroadcastRange) => void;
}) {
	const today = youtubeDateRange(1).to;
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState(value);
	const [month, setMonth] = useState((value.broadcastFrom || today).slice(0, 7));
	const [hovered, setHovered] = useState("");
	const [view, setView] = useState<CalendarView>("days");
	const [portalContainer, setPortalContainer] = useState<{ current: HTMLElement } | null>(null);
	const calendarRef = useRef<HTMLDivElement>(null);
	const pendingFocus = useRef("");
	const pendingViewFocus = useRef(false);
	const minMonth = bounds?.from.slice(0, 7) || today.slice(0, 7);
	const maxMonth = bounds?.to.slice(0, 7) || today.slice(0, 7);
	const visibleMonth = month < minMonth ? minMonth : month > maxMonth ? maxMonth : month;
	const minYear = Number(minMonth.slice(0, 4));
	const maxYear = Number(maxMonth.slice(0, 4));
	const clampDate = (date: string) =>
		bounds ? (date < bounds.from ? bounds.from : date > bounds.to ? bounds.to : date) : date;
	useEffect(() => {
		const container = document.getElementById("kub-music-room");
		if (container) setPortalContainer({ current: container });
	}, []);
	useEffect(() => {
		if (pendingFocus.current) {
			calendarRef.current?.querySelector<HTMLButtonElement>(`[data-date="${pendingFocus.current}"]`)?.focus();
			pendingFocus.current = "";
		} else if (pendingViewFocus.current) {
			if (view === "days" && calendarRef.current) calendarRef.current.scrollTop = 0;
			const target =
				calendarRef.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]:not(:disabled)') ??
				calendarRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)");
			target?.focus();
			pendingViewFocus.current = false;
		}
	}, [visibleMonth, view]);

	const firstDay = toDate(`${visibleMonth}-01`);
	const year = firstDay.getUTCFullYear();
	const monthIndex = firstDay.getUTCMonth();
	const dayCount = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
	const choosingEnd = !!draft.broadcastFrom && !draft.broadcastTo;
	const previewEnd = draft.broadcastTo || (choosingEnd ? hovered : "");
	const rangeStart = previewEnd && previewEnd < draft.broadcastFrom ? previewEnd : draft.broadcastFrom;
	const rangeEnd = previewEnd && previewEnd < draft.broadcastFrom ? draft.broadcastFrom : previewEnd;
	const validDraft =
		(!draft.broadcastFrom && !draft.broadcastTo) ||
		(!!bounds &&
			draft.broadcastFrom >= bounds.from &&
			draft.broadcastTo <= bounds.to &&
			draft.broadcastFrom <= draft.broadcastTo);
	const changeMonth = (next: string) => {
		setMonth(next < minMonth ? minMonth : next > maxMonth ? maxMonth : next);
		setHovered("");
	};
	const changeView = (next: CalendarView) => {
		pendingViewFocus.current = true;
		setHovered("");
		setView(next);
	};
	const moveMonth = (amount: number) => {
		changeMonth(dateKey(new Date(Date.UTC(year, monthIndex + amount, 1))).slice(0, 7));
	};
	const selectDate = (day: string) => {
		if (!bounds || day < bounds.from || day > bounds.to) return;
		setDraft((previous) => {
			if (!previous.broadcastFrom || previous.broadcastTo) return { broadcastFrom: day, broadcastTo: "" };
			return day < previous.broadcastFrom
				? { broadcastFrom: day, broadcastTo: previous.broadcastFrom }
				: { broadcastFrom: previous.broadcastFrom, broadcastTo: day };
		});
		setHovered("");
	};

	return (
		<Popover.Root
			unstyled
			open={open}
			lazyMount
			unmountOnExit
			onOpenChange={({ open: next }) => {
				if (next) {
					if (!bounds) return;
					setDraft({
						broadcastFrom: value.broadcastFrom ? clampDate(value.broadcastFrom) : "",
						broadcastTo: value.broadcastTo ? clampDate(value.broadcastTo) : "",
					});
					setMonth(clampDate(value.broadcastFrom || today).slice(0, 7));
					setView("days");
					pendingViewFocus.current = false;
					setHovered("");
				}
				setOpen(next);
			}}
			initialFocusEl={() =>
				calendarRef.current?.querySelector<HTMLButtonElement>(
					`[data-date="${clampDate(value.broadcastFrom || today)}"]`,
				) ?? null
			}
			positioning={{
				placement: "bottom-end",
				strategy: "fixed",
				gutter: 8,
				overflowPadding: 12,
				flip: true,
				slide: true,
			}}
		>
			<Popover.Trigger asChild>
				<button
					type="button"
					className="kub-broadcast-trigger"
					disabled={!bounds}
					aria-describedby="kub-video-broadcast-help"
				>
					<CalendarDays size={17} aria-hidden="true" />
					<span>
						방송일{" "}
						<strong>
							{value.broadcastFrom
								? `${value.broadcastFrom.replaceAll("-", ".")} ~ ${value.broadcastTo.replaceAll("-", ".")}`
								: "전체 기간"}
						</strong>
					</span>
				</button>
			</Popover.Trigger>
			{portalContainer && (
				<Portal container={portalContainer}>
					<Popover.Positioner className="kub-broadcast-positioner">
						<Popover.Content className="kub-broadcast-calendar" aria-label="방송일 선택">
							<div className="kub-broadcast-selection" aria-live="polite">
								<span data-active={!choosingEnd}>
									시작일<strong>{draft.broadcastFrom || "선택 전"}</strong>
								</span>
								<span aria-hidden="true">~</span>
								<span data-active={choosingEnd}>
									종료일<strong>{draft.broadcastTo || "선택 전"}</strong>
								</span>
							</div>
							<div className="kub-broadcast-month">
								{view === "days" ? (
									<>
										<button
											type="button"
											aria-label="이전 달"
											disabled={visibleMonth <= minMonth}
											onClick={() => moveMonth(-1)}
										>
											<ChevronLeft size={18} />
										</button>
										<button
											type="button"
											className="kub-broadcast-heading"
											aria-label={`${year}년 ${monthIndex + 1}월, 연도와 월 선택`}
											onClick={() => changeView("years")}
										>
											{year}년 {monthIndex + 1}월
										</button>
										<button
											type="button"
											aria-label="다음 달"
											disabled={visibleMonth >= maxMonth}
											onClick={() => moveMonth(1)}
										>
											<ChevronRight size={18} />
										</button>
									</>
								) : (
									<>
										<strong className="kub-broadcast-heading">연월 선택</strong>
										<button type="button" className="kub-broadcast-back" onClick={() => changeView("days")}>
											날짜로
										</button>
									</>
								)}
							</div>
							<div
								className={view === "days" ? "kub-broadcast-days" : "kub-broadcast-picker"}
								ref={calendarRef}
								role="group"
								aria-label={view === "years" ? "연월 선택" : `${year}년 ${monthIndex + 1}월 날짜 선택`}
								onMouseLeave={() => setHovered("")}
							>
								{view === "years" ? (
									Array.from({ length: maxYear - minYear + 1 }, (_, index) => {
										const optionYear = minYear + index;
										return (
											<section className="kub-broadcast-year" key={optionYear} aria-label={`${optionYear}년`}>
												<h3>{optionYear}년</h3>
												<div className="kub-broadcast-year-months">
													{Array.from({ length: 12 }, (_, monthNumber) => {
														const option = `${optionYear}-${String(monthNumber + 1).padStart(2, "0")}`;
														return (
															<button
																type="button"
																key={option}
																aria-label={`${optionYear}년 ${monthNumber + 1}월`}
																disabled={!bounds || option < minMonth || option > maxMonth}
																aria-pressed={option === visibleMonth}
																onClick={() => {
																	changeMonth(option);
																	changeView("days");
																}}
															>
																{monthNumber + 1}월
															</button>
														);
													})}
												</div>
											</section>
										);
									})
								) : (
									<>
										{weekdays.map((day) => (
											<span className="kub-broadcast-weekday" key={day} aria-hidden="true">
												{day}
											</span>
										))}
										{Array.from({ length: firstDay.getUTCDay() }, (_, index) => (
											<span key={`blank-${index}`} />
										))}
										{Array.from({ length: dayCount }, (_, index) => {
											const day = `${visibleMonth}-${String(index + 1).padStart(2, "0")}`;
											const disabled = !bounds || day < bounds.from || day > bounds.to;
											const endpoint = day === draft.broadcastFrom || day === draft.broadcastTo;
											return (
												<button
													type="button"
													key={day}
													disabled={disabled}
													data-date={day}
													data-in-range={!!rangeEnd && day >= rangeStart && day <= rangeEnd}
													data-endpoint={endpoint}
													data-preview={choosingEnd && !!hovered}
													aria-label={`${dateLabel.format(toDate(day))}${day === draft.broadcastFrom ? ", 시작일" : ""}${day === draft.broadcastTo ? ", 종료일" : ""}`}
													aria-pressed={
														endpoint || (!!draft.broadcastTo && day > draft.broadcastFrom && day < draft.broadcastTo)
													}
													aria-current={day === today ? "date" : undefined}
													onClick={() => selectDate(day)}
													onMouseEnter={() => setHovered(disabled ? "" : day)}
													onFocus={() => setHovered(day)}
													onKeyDown={(event) => {
														const offset = (
															{ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 } as Record<string, number>
														)[event.key];
														if (!offset) return;
														event.preventDefault();
														const target = toDate(day);
														target.setUTCDate(target.getUTCDate() + offset);
														const next = dateKey(target);
														if (!bounds || next < bounds.from || next > bounds.to) return;
														if (next.slice(0, 7) !== visibleMonth) {
															pendingFocus.current = next;
															setMonth(next.slice(0, 7));
														} else
															calendarRef.current?.querySelector<HTMLButtonElement>(`[data-date="${next}"]`)?.focus();
													}}
												>
													{index + 1}
												</button>
											);
										})}
									</>
								)}
							</div>
							<p className="kub-broadcast-status" role="status">
								{view === "years"
									? "월을 선택하면 날짜로 돌아가요."
									: choosingEnd
										? "종료일을 선택해 주세요."
										: draft.broadcastTo
											? "다시 클릭하면 새로 선택해요."
											: "시작일을 선택해 주세요."}
							</p>
							<footer className="kub-broadcast-footer">
								<button
									type="button"
									className="kub-button"
									onClick={() => {
										setDraft({ broadcastFrom: "", broadcastTo: "" });
										setHovered("");
									}}
								>
									<RotateCcw size={14} aria-hidden="true" />
									초기화
								</button>
								<button
									type="button"
									className="kub-button kub-broadcast-done"
									disabled={choosingEnd || !validDraft}
									onClick={() => {
										onChange(draft);
										setOpen(false);
									}}
								>
									적용
								</button>
							</footer>
						</Popover.Content>
					</Popover.Positioner>
				</Portal>
			)}
		</Popover.Root>
	);
}

