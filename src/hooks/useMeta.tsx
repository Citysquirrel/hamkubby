import { useEffect } from "react";

interface UseMetaProps {
	title: string;
}

export function useMeta({ title }: UseMetaProps) {
	useEffect(() => {
		document.title = title;
	}, []);
}
