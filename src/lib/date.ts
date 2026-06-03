export const formatDateToYYYYMMDD = (dateString?: string): string => {
	if (!dateString) return "";

	// 이미 YYYY-MM-DD 형식으로 입력된 상태라면 그대로 반환
	if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
		return dateString;
	}

	const date = new Date(dateString);

	// 유효하지 않은 날짜인 경우 빈 문자열 반환
	if (isNaN(date.getTime())) return "";

	const yyyy = date.getFullYear();
	const mm = String(date.getMonth() + 1).padStart(2, "0");
	const dd = String(date.getDate()).padStart(2, "0");

	return `${yyyy}-${mm}-${dd}`;
};
