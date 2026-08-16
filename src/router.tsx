import AdminPanel from "@pages/obs/AdminPanel";
import OverlayScreen from "@pages/obs/OverlayScreen";
import { createBrowserRouter, Navigate, redirect } from "react-router-dom";
import App from "./App";
import { generateRoomId, isValidRoomId } from "./lib/generate";
import SongBook from "./pages/SongBook";
import DockPanel from "./pages/obs/DockPanel";

const findLastManagedRoom = () => {
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key && key.startsWith("obs_pin_")) {
			const savedRoomId = key.replace("obs_pin_", "");
			if (isValidRoomId(savedRoomId)) {
				return savedRoomId;
			}
		}
	}
	return null;
};

const redirectToRoom = () => {
	const lastRoom = findLastManagedRoom();
	if (lastRoom) {
		return redirect(`/obs/admin/${lastRoom}`);
	}
	return redirect(`/obs/admin/${generateRoomId()}`);
};

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
				loader: redirectToRoom,
			},
			{
				path: "admin/:roomId?",
				loader: ({ params }) => {
					if (!isValidRoomId(params.roomId)) {
						return redirectToRoom();
					}
					return null; // 정상 통과
				},
				element: <AdminPanel />,
			},
			{
				path: "overlay/:roomId",
				element: <OverlayScreen />,
			},
			{
				path: "dock/:roomId",
				element: <DockPanel />,
			},
			{
				path: "*",
				element: <Navigate to="/" replace />,
			},
		],
	},

	{
		path: "*",
		element: <Navigate to="/" replace />,
	},
]);
