import React from "react";
import { Copy, ExternalLink, FileText, Shield, LogOut, ArrowLeft, X } from "lucide-react";
import { useTurnkey } from "@turnkey/react-wallet-kit";
import { useNavigate } from "react-router-dom";
import { clearToken, getUserWallets, getToken } from "../lib/authStorage";
import { requestAccountDeletion } from "../api/dopeApi";
import { toast } from "sonner";
// Settings no longer fetches /auth/me itself; Landing caches it for reuse

// Removed Skeleton import; using inline skeleton span

type ChainKey = "evm" | "solana" | "movement";

const chains: { key: ChainKey; label: string }[] = [
  { key: "movement", label: "MOVEMENT" },
  { key: "solana", label: "Solana" },
  { key: "evm", label: "EVM" },
];

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function short(addr: string) {
  if (!addr) return "";
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { handleExportWallet, wallets, turnkey, indexedDbClient } = useTurnkey() as any;

  const [hydrating, setHydrating] = React.useState(true);
  const [savedAddrs, setSavedAddrs] = React.useState<{ chain: string; address: string }[]>([]);
  const [copiedKey, setCopiedKey] = React.useState<ChainKey | null>(null);
  const copiedTimerRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    // Initial read
    setSavedAddrs(getUserWallets());
    // Brief hydration window to allow Landing to cache addresses
    const t = window.setTimeout(() => setHydrating(false), 900);
    return () => {
      window.clearTimeout(t);
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const addressFor = (chainName: ChainKey) => {
    const match = savedAddrs.find((w) => {
      const c = (w.chain || "").toLowerCase();
      if (chainName === "movement") return c === "movement" || c === "aptos"; // backward-compat with stored 'aptos'
      return c === chainName;
    });
    return match?.address || "";
  };

  const onExport = async () => {
    try {
      const embedded = (wallets as any)?.[0];
      if (!embedded?.walletId) return;
      await handleExportWallet({ walletId: embedded.walletId });
    } catch {}
  };

  const onLogout = async () => {
    try {
      // Turnkey logout (clears auth with provider)
      await turnkey?.logout?.();
      await indexedDbClient?.clear?.();

      // Clear local/session storage
      localStorage.clear();
      sessionStorage.clear();
      try { await clearToken(); } catch {}

      // Best-effort cookie clear (domain-wide)
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        if (name) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });
      // Force a full reload so the Turnkey provider resets its auth state
      window.location.replace("/login");
    } catch {
      window.location.replace("/login");
    }
  };

  const onDeleteAccount = async () => {
    try {
      const ok = window.confirm(
        "Are you sure you want to request account deletion? We will follow up to ensure keys are exported before deletion."
      );
      if (!ok) return;
      const token = await getToken();
      if (!token) {
        toast.error("Please login to continue");
        return;
      }
      const res = await requestAccountDeletion(token);
      toast.success(res?.message || "Deletion request placed. We will follow up shortly.");
    } catch (e: any) {
      const msg = e?.body?.message || e?.message || "Failed to place deletion request";
      toast.error(String(msg));
    }
  };

  const handleCopyAddr = async (key: ChainKey, addr: string) => {
    const ok = await copyToClipboard(addr);
    if (ok) {
      setCopiedKey(key);
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = window.setTimeout(() => setCopiedKey(null), 1500) as any;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 safe-top safe-bottom">
      <div className="max-w-md mx-auto px-5 py-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 active:scale-95">
            <ArrowLeft className="w-5 h-5" />
          </button>
        <h1 className="text-xl font-semibold">Settings</h1>
        </div>

        <div className="text-sm text-gray-500 mb-2">Wallet address</div>
        <div className="space-y-3">
          {chains.map(({ key, label }) => {
            const addr = addressFor(key);
            const showSkeleton = hydrating && !addr;
            const isCopied = copiedKey === key;
            return (
              <div key={key} className="bg-white rounded-xl px-4 py-3 shadow-sm border flex items-center justify-between">
                <div className="flex items-center gap-2 min-h-[24px]">
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-gray-500 font-mono">[
                    {showSkeleton ? (
                      <span className="inline-block align-middle"><span className="inline-block w-16 h-3 bg-gray-200 rounded animate-pulse" /></span>
                    ) : (
                      short(addr) || "—"
                    )}
                  ]</div>
                </div>
                {addr && (
                  <button
                    onClick={async () => { await handleCopyAddr(key, addr); }}
                    className={`p-2 rounded-lg border hover:bg-gray-50 active:scale-95 ${isCopied ? "border-green-500" : "border-gray-200"}`}
                    aria-label={`Copy ${label} address`}
                  >
                    <Copy className={`w-4 h-4 ${isCopied ? "text-green-600" : "text-black"}`} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-sm text-gray-500 mt-6 mb-2">General</div>
        <div className="bg-white rounded-xl shadow-sm border divide-y">
          <button onClick={onExport} className="w-full px-4 py-4 flex items-center gap-3 text-left hover:bg-gray-50">
            <ExternalLink className="w-4 h-4 text-gray-600" />
            <span className="text-sm">Export Wallet</span>
          </button>
          <a href="https://dope.cards/privacy" target="_blank" rel="noreferrer" className="px-4 py-4 flex items-center gap-3 hover:bg-gray-50">
            <Shield className="w-4 h-4 text-gray-600" />
            <span className="text-sm">Privacy Policy</span>
          </a>
          <a href="https://dope.cards/terms" target="_blank" rel="noreferrer" className="px-4 py-4 flex items-center gap-3 hover:bg-gray-50">
            <FileText className="w-4 h-4 text-gray-600" />
            <span className="text-sm">Terms of Service</span>
          </a>
          <button onClick={onDeleteAccount} className="w-full px-4 py-4 flex items-center gap-3 text-left hover:bg-red-50">
            <X className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">Delete Account</span>
          </button>
          <button onClick={onLogout} className="w-full px-4 py-4 flex items-center gap-3 text-left hover:bg-gray-50">
            <LogOut className="w-4 h-4 text-gray-600" />
            <span className="text-sm">Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;


