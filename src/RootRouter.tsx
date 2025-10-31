import { useTurnkey, AuthState } from "@turnkey/react-wallet-kit";
import { Routes, Route, Navigate } from "react-router-dom";
import React from "react";
import { Preferences } from "@capacitor/preferences";
import Landing from "./landing";
import NewAuthLanding from "./components/NewAuthLanding";
import SettingsPage from "./components/SettingsPage";
import BackendAuth from "./components/BackendAuth";

export function RootRouter() {
  const { authState } = useTurnkey();
  const isAuthenticated = authState === AuthState.Authenticated;
  const [hasAppJwt, setHasAppJwt] = React.useState<boolean>(() => !!localStorage.getItem("app_jwt"));

  // Trace auth state changes if needed
  // React.useEffect(() => {
  //   console.log("[RootRouter] Auth state changed - isAuthenticated:", isAuthenticated, "hasAppJwt:", hasAppJwt);
  // }, [isAuthenticated, hasAppJwt]);

  // Listen for JWT updates
  React.useEffect(() => {
    const onUpdate = () => {
      const hasJwt = !!localStorage.getItem("app_jwt");
      setHasAppJwt(hasJwt);
    };
    window.addEventListener("app-jwt-updated", onUpdate as EventListener);
    return () => window.removeEventListener("app-jwt-updated", onUpdate as EventListener);
  }, []);

  // Hydrate JWT from native preferences on mobile
  React.useEffect(() => {
    if (isAuthenticated && !hasAppJwt) {
      Preferences.get({ key: "app_jwt" }).then(({ value }) => {
        if (value) {
          localStorage.setItem("app_jwt", value);
          setHasAppJwt(true);
          // Notify listeners that token is now available (important on native cold start)
          try { window.dispatchEvent(new Event("app-jwt-updated")); } catch {}
        }
      });
    }
  }, [isAuthenticated]); // Remove hasAppJwt from dependencies to prevent loop

  // Remove excessive logging - was causing performance issues

  return (
    <>
      {/* Handle backend verification after Turnkey auth */}
      {isAuthenticated && <BackendAuth />}
      
      <Routes>
        <Route path="/" element={<Navigate to={hasAppJwt ? "/dashboard" : "/login"} replace />} />
        {/* If already authenticated (has JWT), redirect login to dashboard */}
        <Route path="/login" element={hasAppJwt ? <Navigate to="/dashboard" replace /> : <NewAuthLanding />} />
        <Route path="/dashboard" element={hasAppJwt ? <Landing /> : <Navigate to="/login" replace />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </>
  );
}