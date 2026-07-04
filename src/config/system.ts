import { createSystem, defaultConfig, defineConfig, defineRecipe } from "@chakra-ui/react";

const badgeRecipe = defineRecipe({
	base: {
		fontFamily: `"Spoqa Han Sans Neo", Consolas, Roboto, sans-serif`,
	},
});

const config = defineConfig({
	theme: {
		recipes: {
			badge: badgeRecipe,
		},
		tokens: {
			fonts: {
				body: {
					value: `"LINE Seed Sans EN", "LINE Seed Sans JP", "Spoqa Han Sans Neo", Consolas, Roboto, sans-serif`,
				},
				heading: {
					value: `"LINE Seed Sans EN", "LINE Seed Sans JP", "Spoqa Han Sans Neo", Consolas, Roboto, sans-serif`,
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

				primary: {
					lightest: { value: { _light: "#EDF7F4", _dark: "#0F2826" } },
					light: { value: { _light: "#B8E0DC", _dark: "#1A4947" } },
					base: { value: { _light: "#2F7974", _dark: "#54BCB5" } },
					hover: { value: { _light: "#22625F", _dark: "#7BD3CE" } },
					deep: { value: { _light: "#164644", _dark: "#AEE5E2" } },
				},

				// --- Secondary ---
				secondary: {
					lightest: { value: { _light: "#F7F1ED", _dark: "#2A1F1C" } },
					light: { value: { _light: "#DFCBC3", _dark: "#4A3630" } },
					base: { value: { _light: "#946657", _dark: "#D0A18E" } },
					hover: { value: { _light: "#764E42", _dark: "#E3BAA8" } },
					deep: { value: { _light: "#56372E", _dark: "#F0D2C6" } },
				},

				// --- Accent ---
				accent: {
					lightest: { value: { _light: "#FBEEF1", _dark: "#2E1B20" } },
					light: { value: { _light: "#F3D3D9", _dark: "#54303A" } },
					base: { value: { _light: "#E18EA0", _dark: "#F0B3C1" } },
					hover: { value: { _light: "#C8415E", _dark: "#F5C8D3" } },
					deep: { value: { _light: "#AC3954", _dark: "#F9DCE3" } },
				},

				// --- Wine ---
				wine: {
					base: { value: { _light: "#6B2E3E", _dark: "#C96880" } },
					hover: { value: { _light: "#511F2D", _dark: "#D9869A" } },
				},

				// --- Neutral ---
				neutral: {
					0: { value: { _light: "#FEFCFB", _dark: "#1A100E" } },
					50: { value: { _light: "#FBF7F4", _dark: "#2C1E1C" } },
					100: { value: { _light: "#F5EEEA", _dark: "#493531" } },
					200: { value: { _light: "#E7DEDA", _dark: "#7C615A" } },
					300: { value: { _light: "#D1C2BD", _dark: "#AC9791" } },
					400: { value: { _light: "#AC9791", _dark: "#D1C2BD" } },
					600: { value: { _light: "#7C615A", _dark: "#E7DEDA" } },
					800: { value: { _light: "#493531", _dark: "#F5EEEA" } },
					900: { value: { _light: "#2C1E1C", _dark: "#FEFCFB" } },
				},

				// --- Semantic / Status ---
				success: {
					lightest: { value: { _light: "#E3F7EE", _dark: "#143A2A" } },
					base: { value: { _light: "#3B9169", _dark: "#5AC997" } },
					deep: { value: { _light: "#297A56", _dark: "#84E3B7" } },
				},
				warning: {
					lightest: { value: { _light: "#F9EFE2", _dark: "#3B2A16" } },
					base: { value: { _light: "#D6A266", _dark: "#F2C48D" } },
					deep: { value: { _light: "#A05D22", _dark: "#F7DBB4" } },
				},
				danger: {
					lightest: { value: { _light: "#FBEAEB", _dark: "#3D171A" } },
					base: { value: { _light: "#D25660", _dark: "#F07F89" } },
					deep: { value: { _light: "#B82E37", _dark: "#F5AAB1" } },
				},
				info: {
					lightest: { value: { _light: "#F4EEF7", _dark: "#2E2136" } },
					base: { value: { _light: "#A076B2", _dark: "#C49ED4" } },
					deep: { value: { _light: "#814E97", _dark: "#DEBFEA" } },
				},
			},
		},
	},
});

export default createSystem(defaultConfig, config);
