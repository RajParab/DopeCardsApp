import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "@turnkey/react-wallet-kit/styles.css";
import { Providers } from "./providers.tsx";
import { BrowserRouter} from "react-router-dom";
import { RootRouter } from "./RootRouter.tsx";
import { getToken } from "./lib/authStorage";
import { setupStatusBar } from "./native/statusBar";
import { registerCampaignWebview } from "./native/campaignWebview";
import DeepLinkListener from "./native/DeepLinkListener";
import { Toaster } from "sonner";
// Initialize native status bar configuration (no-op on web)
setupStatusBar();

// Register the campaign webview trigger. We can later pass a real JWT getter here.
registerCampaignWebview(async () => (await getToken()) || undefined);


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <BrowserRouter>
        <DeepLinkListener />
        <RootRouter />
        <Toaster position="top-center" richColors closeButton toastOptions={{
          classNames: { toast: "rounded-xl shadow-lg", title: "font-semibold" },
        }} />
      </BrowserRouter>
    </Providers>
  </StrictMode>
);
