// Minimal Capacitor StatusBar setup with safe defaults for iOS/Android.
// This file is imported in main.tsx. It is safe to import on web.

export async function setupStatusBar(): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    const { StatusBar, Style } = await import('@capacitor/status-bar');

    // Use dark icons on light header background
    await StatusBar.setStyle({ style: Style.Dark });
    // Make status bar overlay the webview so safe areas matter
    await StatusBar.setOverlaysWebView({ overlay: true });
    // Match header color (white)
    await StatusBar.setBackgroundColor({ color: '#ffffff' });
  } catch {
    // No-op if plugin not available
  }
}


