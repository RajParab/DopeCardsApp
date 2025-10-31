function resolveApiBase(): string {
  const env: any = (import.meta as any)?.env || {};
  const mobileOverride = env?.VITE_DOPE_API_BASE_MOBILE as string | undefined;
  const raw = (env?.VITE_DOPE_API_BASE as string | undefined) || "https://api.dope.cards";
  try {
    const cap = (window as any)?.Capacitor;
    const isNative = !!cap?.isNativePlatform?.();
    if (isNative) {
      if (mobileOverride) return mobileOverride;
      const platform = cap.getPlatform?.();
      if (/^(http:\/\/)?(localhost|127\.0\.0\.1)(:|\/|$)/i.test(raw)) {
        if (platform === "android") {
          return raw.replace(/localhost|127\.0\.0\.1/i, "10.0.2.2");
        }
      }
    }
  } catch {}
  return raw;
}

const BASE = resolveApiBase();

// Minimal authorized fetch with unified 401 handling. We continue using the
// Turnkey-provided JWT (your chosen model). On unauthorized, clear local state
// and signal the app to route back to /login.
async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const r = await fetch(input, init);
  if (r.status === 401) {
    try { localStorage.removeItem('app_jwt'); } catch {}
    try { window.dispatchEvent(new Event('app-jwt-updated')); } catch {}
  }
  return r;
}

export async function getAuthMe(token: string): Promise<any> {
  const r = await authFetch(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("authme_failed");
  return r.json();
}

export async function postAuthVerify(token: string, walletId: string): Promise<any> {
  const r = await authFetch(`${BASE}/auth/verify`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ walletId }),
  });
  if (!r.ok) throw new Error("auth_verify_failed");
  return r.json();
}

// Redeem a referral using a referral code (token optional; include if available)
export async function postReferralRedeem(code: string, token?: string): Promise<any> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await authFetch(`${BASE}/referral/redeem`, {
    method: "POST",
    headers,
    body: JSON.stringify({ code }),
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(json?.error || "referral_redeem_failed"), { status: r.status, body: json });
  return json;
}

// Claim using an authorization code (from NFC/QR) - requires auth token
export async function postClaimAuthorization(token: string, authorization: string): Promise<any> {
  const r = await authFetch(`${BASE}/claim`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ authorization }),
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(json?.message || json?.error || "claim_failed"), { status: r.status, body: json });
  return json;
}

// Request account deletion (soft workflow: backend confirms key export is complete before deletion)
export async function requestAccountDeletion(token: string): Promise<{ status: string; message?: string }> {
  const r = await authFetch(`${BASE}/auth/delete-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(json?.message || json?.error || "delete_request_failed"), { status: r.status, body: json });
  return json;
}


