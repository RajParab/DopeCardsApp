// Opens the Movement Mania campaign in an in-app browser (Chrometab/SFSafariViewController)
// and attempts to share session via a short-lived token in a first-party cookie.

const CAMPAIGN_URL = 'https://kbw2025.vercel.app/';
// reserved for future cookie-based sharing if needed

export async function openCampaignWebview(getJwt?: () => Promise<string | undefined>): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    const { Browser } = await import('@capacitor/browser');

    // On native, try to set a short-lived cookie so the hosted app can read it on first request
    // SFSafariViewController/Chrome Custom Tabs share cookie store with system browser.
    if (Capacitor.isNativePlatform() && typeof getJwt === 'function') {
      try {
        const token = await getJwt();
        if (token) {
          // Use document.cookie on webview launch domain via a preflight hidden page is complex.
          // Simpler: append a one-time token param for bootstrap and let the site set its own cookie.
          const url = new URL(CAMPAIGN_URL);
          url.searchParams.set('auth-token', token);
          await Browser.open({ url: url.toString(), presentationStyle: 'popover' });
          return;
        }
      } catch {
        // Fall through to opening without token
      }
    }

    await Browser.open({ url: CAMPAIGN_URL, presentationStyle: 'popover' });
  } catch (e) {
    // Graceful no-op
  }
}

// Wire a global event so UI can trigger without importing native module at top-level
export function registerCampaignWebview(getJwt?: () => Promise<string | undefined>) {
  if (typeof window === 'undefined') return;
  const handler = () => void openCampaignWebview(getJwt);
  window.addEventListener('open-campaign-webview', handler as EventListener);
  return () => window.removeEventListener('open-campaign-webview', handler as EventListener);
}


