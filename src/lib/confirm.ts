export function confirmOnExit() {
	const handleBeforeUnload = (event: BeforeUnloadEvent) => {
		event.preventDefault();
	};

	const enableBeforeUnload = () => {
		window.addEventListener("beforeunload", handleBeforeUnload);
	};

	const disableBeforeUnload = () => {
		window.removeEventListener("beforeunload", handleBeforeUnload);
	};

	return { enableBeforeUnload, disableBeforeUnload };
}
