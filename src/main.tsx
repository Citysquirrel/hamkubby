import { createRoot } from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { ColorModeProvider } from "./components/ui/color-mode.tsx";
import App from "./App.tsx";
import system from "./config/system.ts";

createRoot(document.getElementById("root")!).render(
	<ChakraProvider value={system}>
		<ColorModeProvider>
			<App />
		</ColorModeProvider>
	</ChakraProvider>,
);

