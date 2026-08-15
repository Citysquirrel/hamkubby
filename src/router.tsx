import { createBrowserRouter, Navigate } from "react-router-dom";
import AdminPanel from "@pages/obs/AdminPanel";
import OverlayScreen from "@pages/obs/OverlayScreen";
import App from "./App";
import SongBook from "./pages/SongBook";

export const router = createBrowserRouter([
	{
		path: "/",
		element: <App />,
		children: [{ index: true, element: <SongBook /> }],
	},
	{
		path: "/obs",
		children: [
			{
				path: "admin",
				element: <AdminPanel />,
			},
			{
				path: "overlay",
				element: <OverlayScreen />,
			},
		],
	},

	{
		path: "*",
		element: <Navigate to="/" replace />,
	},
]);
