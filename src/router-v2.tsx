import { Navigate, useLocation, type RouteObject } from "react-router-dom";
import { RouteLoading } from "./pages/v2/LoadingState";

function V2Redirect() {
	const { pathname, search, hash } = useLocation();
	const path = pathname.replace(/\/+$/, "");
	const target = path === "/v2/videos" ? "/videos" : path === "/v2/recap" ? "/recap" : "/";
	return <Navigate to={{ pathname: target, search, hash }} replace />;
}

export const v2Routes: RouteObject[] = [
	{
		path: "/",
		HydrateFallback: RouteLoading,
		lazy: async () => ({ Component: (await import("./AppV2")).default }),
		children: [
			{
				index: true,
				lazy: async () => ({ Component: (await import("./pages/v2/SongBook")).default }),
			},
			{ path: "videos", lazy: async () => ({ Component: (await import("./pages/v2/Videos")).default }) },
			{ path: "recap", lazy: async () => ({ Component: (await import("./pages/v2/Recap")).default }) },
		],
	},
	{ path: "/v2/*", element: <V2Redirect /> },
];
