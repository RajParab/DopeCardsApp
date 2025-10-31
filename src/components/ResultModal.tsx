import React from "react";

interface ResultModalProps {
  open: boolean;
  onClose: () => void;
  status: "success" | "error";
  kind?: "referral" | "claim";
  title?: string;
  message?: string;
  ctaText?: string;
  onCta?: () => void;
  loading?: boolean;
}

const ResultModal: React.FC<ResultModalProps> = ({
  open,
  onClose,
  status,
  kind,
  title,
  message,
  ctaText,
  onCta,
  loading,
}) => {
  if (!open) return null;

  const isSuccess = status === "success";
  const headerTitle = title || (kind === "claim" ? "Claim card" : isSuccess ? "Success" : "Error");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={(e) => e.stopPropagation()}>
      <div
        className="absolute inset-0 bg-black/50"
        onClick={(e) => { e.stopPropagation(); if (!loading) onClose(); }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      />
      <div className="relative w-full max-w-md mx-2 mb-4 rounded-t-3xl bg-[#171717] text-white shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
        {/* Grab handle */}
        <div className="w-full flex items-center justify-center mb-3">
          <div className="h-1.5 w-12 rounded-full bg-white/15" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold opacity-90">
            {/* Simple QR-like glyph */}
            <div className="w-4 h-4 rounded-sm bg-white/10 grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5">
              <div className="bg-white/40" />
              <div className="bg-white/20" />
              <div className="bg-white/20" />
              <div className="bg-white/40" />
            </div>
            <span>{headerTitle}</span>
          </div>
          {/* No top-right close button */}
        </div>

        {/* Body */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-5">
            {loading ? (
              <svg className="w-8 h-8 animate-spin text-white" viewBox="0 0 24 24" fill="none" aria-label="Loading">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : (
              <img
                src={isSuccess ? "/happy.png" : "/sad.png"}
                alt={isSuccess ? "Success" : "Error"}
                className="w-24 h-24 object-contain"
              />
            )}
          </div>

          {message && (
            <div className="text-[15px] text-white/80 mb-6">
              {message}
            </div>
          )}

          {ctaText ? (
            <button
              onClick={(e) => { e.stopPropagation(); if (!loading) onCta?.(); }}
              disabled={!!loading}
              className={`w-full rounded-2xl text-white font-semibold py-3 active:scale-[0.99] ${loading ? "bg-[#1a58bf] opacity-80" : "bg-[#1677ff] hover:bg-[#1665d6]"}`}
            >
              {loading ? "Please wait…" : ctaText}
            </button>
          ) : null}

          {/* Close button (not shown during loading) */}
          {status === "error" && !loading && (
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="w-full mt-3 rounded-2xl bg:white/10 hover:bg-white/15 text-white font-semibold py-3 active:scale-[0.99]"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultModal;


