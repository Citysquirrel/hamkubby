import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import ssl from "@vitejs/plugin-basic-ssl";
import viteCompression from "vite-plugin-compression"; // 압축 플러그인 (npm i -D vite-plugin-compression)

export default defineConfig(({ mode }) => {
	const isProd = mode === "production";
	const env = loadEnv(mode, process.cwd(), "VITE_");

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
				"/api/feedback": {
					target: "http://127.0.0.1:3477",
					changeOrigin: true,
					configure: (proxy) => {
						proxy.on("proxyReq", (request) => {
							request.removeHeader("origin");
							request.removeHeader("cookie");
							request.removeHeader("authorization");
						});
					},
				},
				"/api/v2/songbook": {
					target: "https://api.stelcount.fans",
					changeOrigin: true,
					configure: (proxy) => {
						proxy.on("proxyReq", (request) => {
							request.removeHeader("origin");
							request.removeHeader("cookie");
							request.removeHeader("authorization");
						});
					},
				},
				"/api/v1/youtube": {
					target: env.VITE_HAMKUBBY_API_URL || "https://hamkubby.stelcount.fans",
					changeOrigin: true,
					configure: (proxy) => {
						// 공개 영상 API는 개발 서버에서 서버 간 요청으로 전달한다.
						proxy.on("proxyReq", (request) => {
							request.removeHeader("origin");
							request.removeHeader("cookie");
							request.removeHeader("authorization");
						});
					},
				},
				"/api": "http://localhost:8788",
			},
		},

		resolve: {
			tsconfigPaths: true,
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

