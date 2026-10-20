import React from "react";
// First, so a one-tap install offer is caught before any screen mounts.
import "./lib/install";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./lib/AuthContext";
import { AppDataProvider } from "./lib/AppDataContext";
import "./styles/tokens.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Last line of defence; App has its own, reset on every screen change. */}
    <ErrorBoundary>
    <AuthProvider>
      <AppDataProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppDataProvider>
    </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Registered only in production builds — in dev it would fight with Vite's
// own module reloading, caching stale modules across hot-reloads.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(err => console.error("SW registration failed:", err));
  });
}
