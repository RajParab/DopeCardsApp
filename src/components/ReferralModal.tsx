/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import { X, Copy, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface ReferralModalProps {
  open: boolean;
  onClose: () => void;
}

const ReferralModal: React.FC<ReferralModalProps> = ({ open, onClose }) => {
  // QR pattern state removed; using real QR code now

  // Read cached user info written by dashboard (Landing)
  const cachedMeRaw = typeof window !== 'undefined' ? localStorage.getItem("user_me") : null;
  const { link } = React.useMemo(() => {
    try {
      const parsed = cachedMeRaw ? JSON.parse(cachedMeRaw) : null;
      const user = parsed?.user || {};
      return {
        link: user?.referralLink || "https://dope.cards/referral",
      };
    } catch {
      return { link: "https://dope.cards/referral" };
    }
  }, [cachedMeRaw]);

  const [copied, setCopied] = React.useState(false);
  const copiedTimerRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.body.classList.add("modal-open");
      window.addEventListener("keydown", handler);
    }
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handler);
      if (copiedTimerRef.current) {
        window.clearTimeout(copiedTimerRef.current);
        copiedTimerRef.current = undefined;
      }
      setCopied(false);
    };
  }, [open, onClose]);

  const handleCopy = async () => {
    const value = String(link || "");
    if (!value) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(value);
      ok = true;
    } catch {}
    if (!ok) {
      try {
        const input = document.createElement("input");
        input.value = value;
        input.style.position = "fixed";
        input.style.left = "-9999px";
        input.setAttribute("readonly", "");
        document.body.appendChild(input);
        input.select();
        input.setSelectionRange(0, value.length);
        document.execCommand("copy");
        document.body.removeChild(input);
        ok = true;
      } catch {}
    }
    if (ok) {
      setCopied(true);
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = window.setTimeout(() => setCopied(false), 1500) as any;
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Referral", url: link, text: "Join me on DOPE" });
        return;
      }
    } catch {
      // ignore
    }
    handleCopy();
  };

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-modal="true"
      role="dialog"
    >
      {/* Dimmed background */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className={`relative w-full max-w-md mx-2 mb-2 rounded-t-[28px] bg-yellow-400 shadow-xl transform transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        } safe-bottom`}
        style={{ zIndex: 60 }}
      >
        {/* Grab handle */}
        <div className="w-full flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-black/25" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 pt-2 pb-1">
          <button onClick={handleShare} className="text-black/80 hover:text-black" aria-label="Share">
            <Share2 className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold text-black">Referral</h2>
          <button onClick={onClose} className="text-black/80 hover:text-black" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* QR Code Area */}
        <div className="px-5 pt-2 pb-5 flex justify-center">
          <div className="rounded-2xl p-3 relative flex flex-col items-center bg-yellow-400">
            <QRCodeSVG value={link} size={220} bgColor="#facc15" fgColor="#000" includeMargin={false} />
          </div>
        </div>

        {/* URL Section */}
        <div className="px-4 pb-2">
          <div className="bg-white rounded-2xl p-3 flex items-center justify-between">
            <span className="text-gray-700 text-sm font-mono truncate">{link}</span>
            <button onClick={handleCopy} className={`bg-white rounded-full p-1.5 border shadow-sm ml-2 ${copied ? "border-green-500" : "border-gray-200"}`} title="Copy link" style={{ minWidth: 36, minHeight: 36 }}>
              {copied ? (
                // Using same Copy icon but green to reduce imports; could switch to Check icon if desired
                <Copy className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-black" />
              )}
            </button>
          </div>
        </div>

        {/* Share Button */}
        <div className="px-4 pt-2 pb-4">
          <button onClick={handleShare} className="w-full bg-gray-900 text-white py-3.5 rounded-2xl font-semibold text-base hover:bg-gray-800 transition-colors">
            Share link
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralModal;
