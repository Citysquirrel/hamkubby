import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ComposeProviders } from "./ComposeProviders";
import { ChakraProvider } from "@chakra-ui/react";
import { ColorModeProvider } from "../components/ui/color-mode";
import system from "../config/system";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5,
			refetchOnWindowFocus: false,
		},
	},
});

const ReactQueryProvider = ({ children }: { children: React.ReactNode }) => (
	<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const ChakraProviders = ({ children }: { children: React.ReactNode }) => (
	<ChakraProvider value={system}>
		<ColorModeProvider>{children}</ColorModeProvider>
	</ChakraProvider>
);

interface AppProviderProps {
	children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
	return <ComposeProviders components={[ReactQueryProvider, ChakraProviders]}>{children}</ComposeProviders>;
}
