import { TurnkeyProvider } from "@turnkey/react-wallet-kit";
import type { TurnkeyProviderConfig } from "@turnkey/react-wallet-kit";
import { saveToken } from "./lib/authStorage";

const turnkeyConfig: TurnkeyProviderConfig = {
  organizationId: import.meta.env.VITE_ORGANIZATION_ID!,
  authProxyConfigId: import.meta.env.VITE_AUTH_PROXY_CONFIG_ID!,
  auth: {
    oauthConfig: {
      googleClientId: import.meta.env.VITE_PUBLIC_GOOGLE_CLIENT_ID || "",
      appleClientId: import.meta.env.VITE_PUBLIC_APPLE_CLIENT_ID || "",
    },
  },
  ui: {
    darkMode: false,
    colors: { light: { primary: "#111827" } },
    borderRadius: "16px",
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TurnkeyProvider
      config={turnkeyConfig}
      callbacks={{
        onAuthenticationSuccess: async (payload) => {
          try {
            const p: any = payload || {};
            
            // Extract token from the nested session object
            const session = p.session?.token || p.token || p.jwt;
            
            if (session && typeof session === 'string' && session.length > 10) {
              // Use saveToken as the single source of truth (writes Preferences + localStorage)
              await saveToken(session);
              window.dispatchEvent(new Event("app-jwt-updated"));
            }
          } catch (e) {
            console.error("[Turnkey] Auth error:", e);
          }
        },
        onError: (error) => console.error("Turnkey error:", error),
      }}
    >
      {children}
    </TurnkeyProvider>
  );
}
