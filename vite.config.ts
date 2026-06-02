import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import ssl from "@vitejs/plugin-basic-ssl";
import viteCompression from "vite-plugin-compression"; // 압축 플러그인 (npm i -D vite-plugin-compression)

export default defineConfig(({ mode }) => {
	const isProd = mode === "production";

	return {
		plugins: [
			react(),
			!isProd && ssl(),
			isProd &&
				viteCompression({
					algorithm: "gzip",
					ext: ".gz",
				}),
			isProd &&
				viteCompression({
					algorithm: "brotliCompress",
					ext: ".br",
				}),
		].filter(Boolean),

		server: {
			proxy: {
				"/api": "http://localhost:8788",
			},
		},

		esbuild: {
			drop: isProd ? ["console", "debugger"] : [],
		},

		build: {
			sourcemap: false,

			assetsInlineLimit: 2048,

			rollupOptions: {
				output: {
					manualChunks: (id) => {
						if (id.includes("node_modules")) {
							if (id.includes("@chakra-ui")) {
								return "vendor-chakra";
							}
							if (id.includes("recharts")) {
								return "vendor-recharts";
							}
							if (id.includes("react-icons")) {
								return "vendor-icons";
							}
							if (id.includes("lodash")) {
								return "vendor-lodash";
							}
						}
					},
					entryFileNames: "[name].[hash].js",
					chunkFileNames: "chunks/[name].[hash].js",
					assetFileNames: "assets/[name].[hash].[ext]",
				},
			},
		},
	};
});

