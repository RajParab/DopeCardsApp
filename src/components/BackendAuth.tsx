import React from "react";
import { useTurnkey, AuthState } from "@turnkey/react-wallet-kit";
import { getAuthMe, postAuthVerify } from "../api/dopeApi";
import { saveToken, clearToken, getToken } from "../lib/authStorage";

const RECENT_VERIFY_MS = 15_000; // 15s window to suppress loader on quick re-auth

const BackendAuth: React.FC = () => {
  const { wallets, createWallet, refreshWallets, authState } = useTurnkey() as any;
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isVerified, setIsVerified] = React.useState(false);
  const [jwtAvailable, setJwtAvailable] = React.useState(() => !!localStorage.getItem("app_jwt"));
  const [showLoader, setShowLoader] = React.useState(false);

  // Keep a live reference to the latest wallets array, so reads after an
  // awaited refresh are not taken from a stale render snapshot.
  const walletsRef = React.useRef<any[]>(wallets || []);
  React.useEffect(() => {
    walletsRef.current = Array.isArray(wallets) ? wallets : [];
  }, [wallets]);

  // Track last verified JWT to avoid redundant work across re-renders
  const lastVerifiedJwtRef = React.useRef<string | null>(null);

  // Track mount state to avoid setState after unmount
  const mountedRef = React.useRef(true);
  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Debounce showing loader to avoid flash for very quick verifications
  React.useEffect(() => {
    if (isVerifying) {
      const t = setTimeout(() => setShowLoader(true), 250);
      return () => clearTimeout(t);
    } else {
      setShowLoader(false);
    }
  }, [isVerifying]);

  // Waits for wallets to be available, optionally creating one if allowed.
  // This routine avoids using stale state by reading from walletsRef.
  async function ensureWalletId(options: { allowCreate: boolean }): Promise<string | undefined> {
    const { allowCreate } = options;

    // Poll helper: resolves when predicate returns a truthy value or times out
    const waitFor = async <T,>(predicate: () => T | undefined, timeoutMs = 2000, intervalMs = 200): Promise<T | undefined> => {
      const start = Date.now();
      // First immediate check
      const now = predicate();
      if (now) return now;
      return new Promise<T | undefined>((resolve) => {
        const timer = setInterval(() => {
          const value = predicate();
          if (value) {
            clearInterval(timer);
            resolve(value);
            return;
          }
          if (Date.now() - start >= timeoutMs) {
            clearInterval(timer);
            resolve(undefined);
          }
        }, intervalMs);
      });
    };

    // Pass 1: try without creating
    try { await refreshWallets(); } catch {}
    let id = await waitFor<string>(() => walletsRef.current?.[0]?.walletId);
    if (id) return id;

    // Optionally create, then re-check
    if (allowCreate) {
      try {
        await createWallet({
          walletName: "Primary",
          accounts: [
            "ADDRESS_FORMAT_ETHEREUM",
            "ADDRESS_FORMAT_SOLANA",
            "ADDRESS_FORMAT_APTOS",
          ],
        });
      } catch (e) {
        // Surface non-fatal Turnkey creation errors to the caller via undefined
      }
      try { await refreshWallets(); } catch {}
      id = await waitFor<string>(() => walletsRef.current?.[0]?.walletId);
      if (id) return id;
    }

    return undefined;
  }

  // Listen for JWT updates
  React.useEffect(() => {
    const handleJwtUpdate = () => {
      const hasJwt = !!localStorage.getItem("app_jwt");
      setJwtAvailable(hasJwt);
    };
    
    window.addEventListener("app-jwt-updated", handleJwtUpdate);
    return () => window.removeEventListener("app-jwt-updated", handleJwtUpdate);
  }, []);

  React.useEffect(() => {
    if (authState !== AuthState.Authenticated) {
      return;
    }
    if (!jwtAvailable) {
      return;
    }
    if (isVerifying || isVerified) {
      return;
    }

    const verifyWithBackend = async () => {
      // Check for very recent verification to keep things silent
      const last = Number(localStorage.getItem("app_jwt_verified_at") || 0);
      const nowTs = Date.now();
      const withinWindow = nowTs - last < RECENT_VERIFY_MS;

      if (!withinWindow) setIsVerifying(true);
      
      try {
        // Always read token via Capacitor Preferences fallback for native-first
        const appJwt = await getToken();
        
        if (!appJwt) {
          if (mountedRef.current) setIsVerifying(false);
          return;
        }

        // Skip if we've already verified this exact JWT
        if (lastVerifiedJwtRef.current === appJwt) {
          if (mountedRef.current) {
            setIsVerified(true);
            setIsVerifying(false);
          }
          return;
        }

        // First check backend user; use presence of addresses to decide wallet creation
        let me: any | undefined;
        let hasAnyAddress = false;
        try {
          me = await getAuthMe(appJwt);
          const u = me?.user || {};
          hasAnyAddress = !!(u?.evmAddress || u?.solanaAddress || u?.movementAddress);
        } catch {
          // ignore here; we may register below if needed
        }

        // Ensure we have a wallet – read from fresh provider state.
        // Only create if backend does not yet have any addresses.
        const walletId = await ensureWalletId({ allowCreate: !hasAnyAddress });

        // If backend user did not exist earlier, register now when we have a walletId (if available)
        if (!me) {
          if (!walletId) throw new Error("Failed to obtain wallet after refresh");
          await postAuthVerify(appJwt, walletId);
          me = await getAuthMe(appJwt);
        }

        // Success - save token and mark as verified
        await saveToken(appJwt);
        lastVerifiedJwtRef.current = appJwt;
        try { localStorage.setItem("app_jwt_verified_at", String(nowTs)); } catch {}
        if (!mountedRef.current) return;
        setIsVerified(true);
        setIsVerifying(false);

      } catch (error: any) {
        console.error("Verification failed:", error);
        // Non-fatal Turnkey wallet creation issues shouldn't log the user out
        if (error?.code === "CREATE_WALLET_ERROR" || error?.name === "TurnkeyError") {
          if (mountedRef.current) {
            setIsVerified(true);
            setIsVerifying(false);
          }
          return;
        }
        // Otherwise treat as fatal auth failure
        try { localStorage.removeItem("app_jwt"); } catch {}
        try { await clearToken(); } catch {}
        try { window.dispatchEvent(new Event("app-jwt-updated")); } catch {}
      } finally {
        if (mountedRef.current) setIsVerifying(false);
      }
    };

    verifyWithBackend();
  }, [authState, jwtAvailable]);

  // Show loading state while verifying (bottom sheet)
  if (authState === AuthState.Authenticated && showLoader && isVerifying && !isVerified) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative w-full max-w-md mx-2 mb-4 rounded-t-3xl bg-white shadow-xl p-5 text-center">
          <div className="w-full flex items-center justify-center mb-3">
            <div className="h-1.5 w-12 rounded-full bg-black/10" />
          </div>
          <div className="mx-auto mb-3 h-9 w-9 rounded-full bg-black text-white flex items-center justify-center">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-label="Loading">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          </div>
          <div className="text-sm font-semibold">Setting up your account</div>
          <div className="mt-1 text-xs text-gray-600">Verifying your session…</div>
        </div>
      </div>
    );
  }

  // Don't render anything once verification is complete
  return null;
};

export default BackendAuth;
