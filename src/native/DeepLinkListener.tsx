import React from "react";
import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { getToken } from "../lib/authStorage";
import { postReferralRedeem, postClaimAuthorization } from "../api/dopeApi";

function parseDeepLink(inputUrl: string): { kind: "refer" | "claim"; id: string } | null {
  try {
    const u = new URL(inputUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    // Expect /refer/:code or /claim/:id
    if (parts.length === 2 && (parts[0] === "refer" || parts[0] === "claim")) {
      return { kind: parts[0] as "refer" | "claim", id: parts[1] };
    }
    return null;
  } catch {
    return null;
  }
}

// (legacy toast-based handler removed)

import ResultModal from "../components/ResultModal";

const DeepLinkListener: React.FC = () => {
  const [modal, setModal] = React.useState<{ open: boolean; status: "success" | "error"; message?: string; ctaText?: string; onCta?: () => void; title?: string; loading?: boolean }>(() => ({ open: false, status: "success" } as any));
  const pendingRef = React.useRef<{ kind: "refer" | "claim"; id: string } | null>(null);

  React.useEffect(() => {
    // Handle cold starts on web / browser
    const cold = parseDeepLink(window.location.href);
    if (cold) presentConfirmation(cold);

    const sub = App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
      const parsed = parseDeepLink(event.url);
      if (parsed) presentConfirmation(parsed);
    });
    return () => {
      sub.then(h => h.remove()).catch(() => {});
    };
  }, []);

  function presentConfirmation(action: { kind: "refer" | "claim"; id: string }) {
    pendingRef.current = action;
    const isClaim = action.kind === "claim";
    setModal({
      open: true,
      status: "success",
      title: isClaim ? "Claim card" : "Apply referral",
      message: isClaim ? "Yay! you’ve got something!" : "You’re about to apply a referral. Continue?",
      ctaText: isClaim ? "Claim" : "Apply",
      loading: false,
      onCta: async () => {
        setModal(m => ({ ...m, loading: true } as any));
        const a = pendingRef.current;
        if (!a) { setModal(m => ({ ...m, open: false, loading: false } as any)); return; }
        await handleAction(a);
        pendingRef.current = null;
      },
    } as any);
  }

  async function handleAction(action: { kind: "refer" | "claim"; id: string }) {
    try {
      if (action.kind === "refer") {
        const token = (await getToken()) || undefined;
        try {
          const data = await postReferralRedeem(action.id, token);
          setModal({ open: true, status: "success", message: data?.message || "Referral processed" } as any);
        } catch (e: any) {
          const body = e?.body || {};
          setModal({ open: true, status: "error", message: body?.error || "Referral failed" } as any);
        }
        return;
      }
      if (action.kind === "claim") {
        const token = (await getToken()) || "";
        try {
          const authorization = action.id; // already base64 string
          const data = await postClaimAuthorization(token, authorization);
          setModal({ open: true, status: "success", message: data?.message || "Successfully claimed the gift" } as any);
        } catch (e: any) {
          const body = e?.body || {};
          setModal({ open: true, status: "error", message: body?.message || body?.error || "An error occurred, try again later" } as any);
        }
      }
    } catch {
      setModal({ open: true, status: "error", message: "Network error processing link" } as any);
    }
  }

  return (
    <>
      <ResultModal
        open={modal.open}
        status={modal.status}
        message={modal.message}
        title={modal.title}
        ctaText={modal.ctaText}
        onCta={modal.onCta}
        loading={modal.loading}
        kind={modal.message?.toLowerCase?.().includes("referr") ? "referral" : modal.message?.toLowerCase?.().includes("claim") ? "claim" : undefined}
        onClose={() => { setModal(m => ({ ...m, open: false, loading: false } as any)); pendingRef.current = null; }}
      />
    </>
  );
};

export default DeepLinkListener;


