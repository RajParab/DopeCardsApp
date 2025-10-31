import React from "react";
import { X } from "lucide-react";

interface RevealCardModalProps {
  open: boolean;
  imageUrl: string;
  onClose: () => void;
  message?: string;
}

const RevealCardModal: React.FC<RevealCardModalProps> = ({ open, imageUrl, onClose, message }) => {
  const [entered, setEntered] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => setEntered(true), 30);
      return () => window.clearTimeout(t);
    } else {
      setEntered(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative h-full w-full flex items-center justify-center p-6" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        <div
          className={`relative w-full max-w-sm rounded-3xl bg-[#0f0f10] shadow-2xl p-4 transition-all duration-500 ease-out ${
            entered ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
          }`}
        >
          <div className="relative overflow-hidden rounded-2xl bg-black">
            <img
              src={imageUrl}
              alt="Revealed card"
              className="w-full h-auto block object-cover"
            />
            {/* Subtle highlight edge */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />
          </div>
          {message ? (
            <div className="mt-3 text-center text-white/90 text-sm">
              {message}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default RevealCardModal;
