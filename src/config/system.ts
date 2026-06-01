import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

// 예시이므로 이후 사용할 시 적절히 수정하여 사용
const config = defineConfig({
	theme: {
		tokens: {
			fonts: {
				body: {
					value: `"Spoqa Han Sans Neo", Consolas, Roboto, sans-serif`,
				},
				heading: {
					value: `"Spoqa Han Sans Neo", Consolas, Roboto, sans-serif`,
				},
			},
		},
		semanticTokens: {
			colors: {
				bg: {
					value: {
						_light: "#fff",
						_dark: "#141517",
					},
				},
				cardBg: {
					value: {
						_light: "#f4f4f5",
						_dark: "#242529",
					},
				},
				kbg: {
					value: {
						_dark: "#7bb18f",
						_light: "#b6d2a9",
					},
				},
				kbc: {
					value: {
						_light: "#7bb18f",
						_dark: "#b6d2a9",
					},
				},
			},
		},
	},
});

export default createSystem(defaultConfig, config);
