import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageSquare, X } from "lucide-react";
import { FEEDBACK_API_URL, FEEDBACK_SITE_KEY } from "../../config/feedback";
import { loadTurnstile, type Turnstile } from "../../lib/turnstile";
import "./feedback.css";

type FeedbackCategory = "bug" | "suggestion" | "other";

function FeedbackDialog({ onClose, retryAt, onRateLimit }: {
	onClose: () => void;
	retryAt: number;
	onRateLimit: (until: number) => void;
}) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const widgetRef = useRef<HTMLDivElement>(null);
	const requestRef = useRef<AbortController | null>(null);
	const mountedRef = useRef(false);
	const [category, setCategory] = useState<FeedbackCategory>("bug");
	const [message, setMessage] = useState("");
	const [token, setToken] = useState("");
	const [verificationError, setVerificationError] = useState("");
	const [widgetVersion, setWidgetVersion] = useState(0);
	const [error, setError] = useState("");
	const [pending, setPending] = useState(false);
	const [sent, setSent] = useState(false);
	const [now, setNow] = useState(Date.now);
	const normalizedMessage = message.replace(/\s+/gu, " ").trim();
	const length = Array.from(normalizedMessage).length;
	const validMessage = length >= 10 && length <= 300 && !/[\u0000-\u0008\u000e-\u001f\u007f]/u.test(normalizedMessage);
	const retrySeconds = Math.max(0, Math.ceil((retryAt - now) / 1000));
	const refreshVerification = () => {
		setToken("");
		setVerificationError("");
		setWidgetVersion((value) => value + 1);
	};

	useEffect(() => {
		mountedRef.current = true;
		const dialog = dialogRef.current;
		const overflow = document.body.style.overflow;
		dialog?.showModal();
		document.body.style.overflow = "hidden";
		return () => {
			mountedRef.current = false;
			requestRef.current?.abort();
			dialog?.close();
			document.body.style.overflow = overflow;
		};
	}, []);

	useEffect(() => {
		if (retryAt <= Date.now()) return;
		setNow(Date.now());
		const timer = setInterval(() => {
			setNow(Date.now());
			if (Date.now() >= retryAt) clearInterval(timer);
		}, 1000);
		return () => clearInterval(timer);
	}, [retryAt]);

	useEffect(() => {
		if (!FEEDBACK_SITE_KEY || sent) return;
		let active = true;
		let api: Turnstile | undefined;
		let widgetId: string | undefined;
		const verificationFailed = () => {
			if (!active) return true;
			setToken("");
			setVerificationError("보안 인증을 완료하지 못했어요. 다시 인증해 주세요.");
			return true;
		};
		void loadTurnstile().then((turnstile) => {
			if (!active || !widgetRef.current) return;
			api = turnstile;
			widgetId = api.render(widgetRef.current, {
				sitekey: FEEDBACK_SITE_KEY,
				action: "feedback",
				language: "ko",
				size: "flexible",
				callback: (value) => {
					if (!active) return;
					setToken(value);
					setVerificationError("");
				},
				"error-callback": verificationFailed,
				"expired-callback": verificationFailed,
				"timeout-callback": verificationFailed,
			});
			if (widgetId === undefined) verificationFailed();
		}).catch(verificationFailed);
		return () => {
			active = false;
			if (widgetId !== undefined) api?.remove(widgetId);
		};
	}, [widgetVersion, sent]);

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		if (requestRef.current || sent || !validMessage || !token || retryAt > Date.now()) return;
		const controller = new AbortController();
		requestRef.current = controller;
		setPending(true);
		setError("");
		const timer = setTimeout(() => controller.abort(), 20000);
		try {
			// 공통 fetch_는 요청 본문을 로깅하므로 피드백 내용과 인증 토큰은 별도로 전송한다.
			const response = await fetch(FEEDBACK_API_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "omit",
				cache: "no-store",
				signal: controller.signal,
				body: JSON.stringify({ category, message: normalizedMessage, turnstileToken: token }),
			});
			if (!mountedRef.current) return;
			if (response.status === 201) {
				setSent(true);
				setToken("");
				setMessage("");
				return;
			}
			if (response.status === 429) {
				const header = response.headers.get("Retry-After");
				const seconds = header && /^\d+$/.test(header) ? Number(header) : NaN;
				const date = header ? Date.parse(header) : NaN;
				const until = Number.isFinite(seconds) ? Date.now() + seconds * 1000 : date;
				onRateLimit(Number.isFinite(until) && until > Date.now() ? until : Date.now() + 20000);
				setError("요청이 잠시 많아요. 잠시 후 다시 보내주세요.");
			} else {
				const result: unknown = await response.json().catch(() => null);
				if (!mountedRef.current) return;
				const serverMessage = result && typeof result === "object" && "message" in result
					&& typeof result.message === "string" ? result.message : "피드백을 접수하지 못했어요. 잠시 후 다시 시도해 주세요.";
				setError(serverMessage);
			}
			refreshVerification();
		} catch {
			if (!mountedRef.current) return;
			setError("접수 결과를 확인하지 못했어요. 이미 접수되었을 수 있으니 잠시 후 확인해 주세요.");
			refreshVerification();
		} finally {
			clearTimeout(timer);
			requestRef.current = null;
			if (mountedRef.current) setPending(false);
		}
	};

	return (
		<dialog ref={dialogRef} className="kub-feedback-dialog" aria-labelledby="kub-feedback-title"
			onClose={onClose} onCancel={(event) => { if (requestRef.current) event.preventDefault(); }}
			onKeyDown={(event) => event.stopPropagation()}>
			<header className="kub-feedback-header">
				<div>
					<h2 id="kub-feedback-title">개발자에게 피드백</h2>
					<p>사이트 오류나 개선 의견을 익명으로 보내주세요.</p>
				</div>
				<button type="button" className="kub-feedback-close" aria-label="피드백 창 닫기"
					disabled={pending} onClick={() => dialogRef.current?.close()}><X aria-hidden="true" /></button>
			</header>
			{sent ? (
				<div className="kub-feedback-success">
					<p role="status">피드백이 접수되었어요. 의견 감사합니다!</p>
					<button type="button" className="kub-feedback-submit" onClick={() => dialogRef.current?.close()}>닫기</button>
				</div>
			) : (
				<form onSubmit={(event) => void submit(event)} aria-busy={pending}>
					<label htmlFor="kub-feedback-category">유형</label>
					<select id="kub-feedback-category" value={category} disabled={pending}
						onChange={(event) => setCategory(event.target.value as FeedbackCategory)}>
						<option value="bug">오류 제보</option>
						<option value="suggestion">개선 제안</option>
						<option value="other">기타</option>
					</select>
					<label htmlFor="kub-feedback-message">내용</label>
					<textarea id="kub-feedback-message" rows={5} value={message} disabled={pending}
						aria-describedby="kub-feedback-hint kub-feedback-count" aria-invalid={message.length > 0 && !validMessage}
						placeholder="어느 화면에서 어떤 문제가 있었는지 알려주세요."
						onChange={(event) => setMessage(event.target.value)} />
					<div className="kub-feedback-meta">
						<span id="kub-feedback-hint">10~300자 · 연속 공백은 한 칸으로 계산</span>
						<span id="kub-feedback-count">{length} / 300</span>
					</div>
					<p className="kub-feedback-note">개인정보는 적지 말아 주세요. 별도 답변은 제공되지 않아요.</p>
					{FEEDBACK_SITE_KEY ? (
						<>
							<div ref={widgetRef} className="kub-feedback-verification" />
							{verificationError && <div className="kub-feedback-error" role="alert">
								<p>{verificationError}</p>
								<button type="button" disabled={pending} onClick={refreshVerification}>다시 인증하기</button>
							</div>}
						</>
					) : <p className="kub-feedback-note" role="status">현재 피드백 접수를 준비 중이에요. 문의는 <a href="mailto:tok1324@naver.com">이메일</a>로 보내주세요.</p>}
					{error && <p className="kub-feedback-error" role="alert">{error}</p>}
					<button type="submit" className="kub-feedback-submit"
						disabled={pending || !validMessage || !token || retrySeconds > 0}>
						{pending ? "보내는 중…" : retrySeconds > 0 ? `${retrySeconds}초 후 다시 보내기` : "피드백 보내기"}
					</button>
				</form>
			)}
		</dialog>
	);
}

export function Feedback() {
	const [open, setOpen] = useState(false);
	const [retryAt, setRetryAt] = useState(0);
	const triggerRef = useRef<HTMLButtonElement>(null);
	return <>
		<button ref={triggerRef} type="button" className="kub-feedback-trigger" aria-haspopup="dialog"
			onClick={() => setOpen(true)}><MessageSquare aria-hidden="true" /> 개발자에게 피드백</button>
		{open && <FeedbackDialog retryAt={retryAt} onRateLimit={setRetryAt} onClose={() => {
			setOpen(false);
			triggerRef.current?.focus({ preventScroll: true });
		}} />}
	</>;
}
