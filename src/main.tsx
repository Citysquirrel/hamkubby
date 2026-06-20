import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppProvider } from "./providers/AppProvider.tsx";
import { Toaster } from "./components/ui/toaster.tsx";
import { lazy, Suspense } from "react";

const DevComponents = import.meta.env.DEV
	? lazy(() =>
			import("./components/DevDock.tsx").then((module) => ({
				default: () => (
					<>
						<module.ConsoleDock />
						<module.NetworkDock />
					</>
				),
			})),
		)
	: null;

createRoot(document.getElementById("root")!).render(
	<AppProvider>
		<Toaster />
		{DevComponents && (
			<Suspense fallback={null}>
				<DevComponents />
			</Suspense>
		)}
		<App />
	</AppProvider>,
);

