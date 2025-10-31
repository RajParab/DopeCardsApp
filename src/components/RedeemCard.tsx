import React from "react";
import { Wifi } from "lucide-react";
import { NFC } from "@exxili/capacitor-nfc";
import { postClaimAuthorization } from "../api/dopeApi";
import ResultModal from "./ResultModal";
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

interface RedeemCardProps {
  variant?: "compact" | "full";
}

const RedeemCard: React.FC<RedeemCardProps> = ({ variant = "full" }) => {
  const [showAndroidSheet, setShowAndroidSheet] = React.useState(false);
  const [modal, setModal] = React.useState<{ open: boolean; status: "success" | "error"; message?: string; loading?: boolean; title?: string }>(
    { open: false, status: "success" }
  );
  const nfcReadActiveRef = React.useRef(false);
  const cleanupRef = React.useRef<(() => void) | undefined>(undefined);
  const offReadRef = React.useRef<(() => void) | undefined>(undefined);
  const offErrorRef = React.useRef<(() => void) | undefined>(undefined);
  const startingRef = React.useRef(false);

  // Simple, lossless payload normalization (matches previously working approach)
  function normalizePayload(payload: unknown): string {
    // If array of bytes, convert directly to string without interpreting as NDEF header
    if (Array.isArray(payload)) {
      try { return String.fromCharCode(...(payload as number[])); } catch { return ""; }
    }
    if (typeof payload === "string") return payload;
    try { return String(payload ?? ""); } catch { return ""; }
  }

  const stopListening = async () => {
    try { offReadRef.current?.(); } catch {}
    try { offErrorRef.current?.(); } catch {}
    offReadRef.current = undefined;
    offErrorRef.current = undefined;
    nfcReadActiveRef.current = false;
  };

  const closeAndroidSheet = async () => {
    setShowAndroidSheet(false);
    await stopListening();
  };

  const readAndClaim = async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    try {
      const { supported } = await NFC.isSupported();
      if (!supported) {
        await stopListening();
        setShowAndroidSheet(false);
        setModal({ open: true, status: "error", message: "NFC not supported on this device" });
        return;
      }
      // Ensure no stale listeners from a previous attempt
      await stopListening();

      if (nfcReadActiveRef.current) return; // prevent stacking listeners
      if (Capacitor.getPlatform() === 'ios') {
        try { await NFC.startScan(); } catch {}
      }
      if (Capacitor.getPlatform() === 'android') setShowAndroidSheet(true);
      nfcReadActiveRef.current = true;
      offReadRef.current = NFC.onRead(async (data: any) => {
        if (!nfcReadActiveRef.current) return;
        try {
          const str = data.string();
          const rawPayload = str?.messages?.[0]?.records?.[0]?.payload as unknown;
          const authorization = normalizePayload(rawPayload).trim();
          if (!authorization) {
            await closeAndroidSheet();
            if (Capacitor.getPlatform() === 'ios') { try { await NFC.cancelScan?.(); } catch {} }
            setModal({ open: true, status: "error", message: "Unable to read authorization code" });
            return;
          }
          // Use backend JWT (Turnkey session) from Preferences/localStorage
          const pref = await Preferences.get({ key: "app_jwt" });
          const token = pref.value || localStorage.getItem("app_jwt") || "";
          if (!token) {
            await closeAndroidSheet();
            if (Capacitor.getPlatform() === 'ios') { try { await NFC.cancelScan?.(); } catch {} }
            setModal({ open: true, status: "error", message: "Please login to claim" });
            return;
          }
          // Show processing loader
          await closeAndroidSheet();
          if (Capacitor.getPlatform() === 'ios') { try { await NFC.cancelScan?.(); } catch {} }
          setModal({ open: true, status: "success", title: "Claim card", message: "Processing your claim…", loading: true });
          try {
            const json = await postClaimAuthorization(token, authorization);
            setModal({ open: true, status: "success", message: json?.message || "Successfully claimed the gift", loading: false });
          } catch (e: any) {
            const errMsg = e?.body?.message || e?.body?.error || e?.message || "An error occurred, try again later";
            setModal({ open: true, status: "error", message: errMsg, loading: false });
          }
        } catch {
          await closeAndroidSheet();
          if (Capacitor.getPlatform() === 'ios') { try { await NFC.cancelScan?.(); } catch {} }
          setModal({ open: true, status: "error", message: "Failed to process NFC data" });
        }
      });
      offErrorRef.current = NFC.onError?.(async (err: any) => {
        await closeAndroidSheet();
        if (Capacitor.getPlatform() === 'ios') { try { await NFC.cancelScan?.(); } catch {} }
        setModal({ open: true, status: "error", message: (err?.error || "NFC error").toString() });
      });
      cleanupRef.current = async () => {
        if (Capacitor.getPlatform() === 'ios') { try { await NFC.cancelScan?.(); } catch {} }
        await stopListening();
      };
    } catch (e) {
      await stopListening();
      setShowAndroidSheet(false);
      setModal({ open: true, status: "error", message: "Unable to start NFC" });
    } finally {
      startingRef.current = false;
    }
  };

  React.useEffect(() => {
    // Android back button should close the sheet if open
    let removeBack: (() => void) | undefined;
    if (Capacitor.getPlatform() === 'android') {
      try {
        const sub = App.addListener('backButton', ({ canGoBack }) => {
          if (showAndroidSheet) {
            setShowAndroidSheet(false);
            (async () => { await stopListening(); })();
          } else if (!canGoBack) {
            // Optionally, consume back press when on root
          }
        });
        removeBack = () => { sub.then(h => h.remove()).catch(() => {}); };
      } catch {}
    }
    return () => { cleanupRef.current?.(); removeBack?.(); };
  }, [showAndroidSheet]);
  return (
    <div
      className={`rounded-2xl p-6 text-white relative overflow-hidden flex flex-col items-center justify-center w-full ${variant === "compact" ? "h-40 min-h-[160px]" : "h-52"}`}
      style={{ background: "linear-gradient(135deg, #151515, #373737)" }}
      onClick={readAndClaim}
    >
      {/* Center Content */}
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Redeem Rewards</h3>
        <p className="text-base text-gray-400">Tap your DOPE card to reveal</p>
      </div>

      {/* Bottom Left - Wifi */}
      <div className="absolute bottom-4 left-4 transform -rotate-270 opacity-70">
        <Wifi className="w-8 h-8" />
      </div>

      {/* Bottom Right - DOPE Logo */}
      <div className="absolute bottom-4 right-4">
        <img src="/logo.png" alt="Logo" className="h-8" />
      </div>
      {showAndroidSheet && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => { (async () => { await closeAndroidSheet(); if (Capacitor.getPlatform()==='ios'){ try{ (NFC as any).cancelScan?.(); }catch{}} })(); }} />
          <div className="relative w-full max-w-md mx-2 mb-4 rounded-2xl bg-white shadow-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="h-1 w-10 rounded-full bg-gray-300" />
            </div>
            <div className="text-center">
              <h4 className="text-base font-semibold mb-1">Hold your card near the phone</h4>
              <p className="text-sm text-gray-500 mb-4">Scanning for NFC...</p>
              <button
                className="w-full rounded-xl border border-gray-300 py-2 text-sm font-medium"
                onClick={() => { (async () => { await closeAndroidSheet(); if (Capacitor.getPlatform()==='ios'){ try{ (NFC as any).cancelScan?.(); }catch{}} })(); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <ResultModal open={modal.open} status={modal.status} title={modal.title} message={modal.message} loading={modal.loading} kind="claim" onClose={() => setModal({ open: false, status: "success" })} />
    </div>
  );
};

export default RedeemCard;
