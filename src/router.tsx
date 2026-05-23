import { createBrowserRouter, Navigate } from "react-router-dom";
import { App } from "./App";
import { ListView } from "./features/list/ListView";
import { DetailView } from "./features/detail/DetailView";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      children: [
        { index: true, element: <ListView /> },
        { path: "symbol/:symbol", element: <DetailView /> },
        { path: "*", element: <Navigate to="/" replace /> },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);
