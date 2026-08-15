import { createBrowserRouter, Navigate } from "react-router-dom";
// import AdminPanel from './pages/AdminPanel';
// import OverlayScreen from './pages/OverlayScreen';

export const router = createBrowserRouter([
	{
		path: "/",
	},
	// {
	//   path: "/admin",
	//   element: <AdminPanel />,
	// },
	// {
	//   path: "/overlay",
	//   element: <OverlayScreen />,
	// },
	{
		path: "*",
		element: <Navigate to="/" replace />,
	},
]);
