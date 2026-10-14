import { Navigate, type RouteObject } from "react-router-dom";

export const v2Routes: RouteObject[] = [
	{
		path: "/v2",
		lazy: async () => ({ Component: (await import("./AppV2")).default }),
		children: [
			{
				index: true,
				lazy: async () => ({ Component: (await import("./pages/v2/SongBook")).default }),
			},
			{ path: "videos", lazy: async () => ({ Component: (await import("./pages/v2/Videos")).default }) },
			{ path: "recap", lazy: async () => ({ Component: (await import("./pages/v2/Recap")).default }) },
			{ path: "*", element: <Navigate to="/v2" replace /> },
		],
	},
];
