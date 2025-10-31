import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'app_jwt';
const USER_ME_KEY = 'user_me';
const USER_WALLETS_KEY = 'user_wallets';

// Token utilities
export async function saveToken(token: string): Promise<void> {
  try { await Preferences.set({ key: TOKEN_KEY, value: token }); } catch {}
  try { localStorage.setItem(TOKEN_KEY, token); } catch {}
}

export async function getToken(): Promise<string | null> {
  try { const { value } = await Preferences.get({ key: TOKEN_KEY }); if (value) return value; } catch {}
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export async function clearToken(): Promise<void> {
  try { await Preferences.remove({ key: TOKEN_KEY }); } catch {}
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}

// Cached profile utilities
export function saveUserMe(me: any): void {
  try { localStorage.setItem(USER_ME_KEY, JSON.stringify(me)); } catch {}
}

export function getUserMe(): any | null {
  try { const raw = localStorage.getItem(USER_ME_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export function saveUserWallets(addresses: { chain: string; address: string }[]): void {
  try { localStorage.setItem(USER_WALLETS_KEY, JSON.stringify(addresses)); } catch {}
}

export function getUserWallets(): { chain: string; address: string }[] {
  try { const raw = localStorage.getItem(USER_WALLETS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}


