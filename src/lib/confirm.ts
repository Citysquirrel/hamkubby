export function confirmOnExit() {
	const handleBeforeUnload = (event: BeforeUnloadEvent) => {
		event.preventDefault();
		event.returnValue = "true";
	};

	const enableBeforeUnload = () => {
		window.addEventListener("beforeunload", handleBeforeUnload);
	};

	const disableBeforeUnload = () => {
		window.removeEventListener("beforeunload", handleBeforeUnload);
	};

	return { enableBeforeUnload, disableBeforeUnload };
}
