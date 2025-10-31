import React from "react";
import { Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
// import ReferralsCard from "./components/ReferralsCard";
import CampaignCard from "./components/CampaignCard";
import PaymentCard from "./components/PaymentsCard";
import RedeemCard from "./components/RedeemCard";
import ReferralModal from "./components/ReferralModal";
// import LogoutButton from "./components/logoutButton";
import { getAuthMe } from "./api/dopeApi";
import { getToken, saveUserMe, saveUserWallets } from "./lib/authStorage";

const Landing: React.FC = () => {
  const [showReferralModal, setShowReferralModal] = React.useState(false);
  const navigate = useNavigate();

  // Fetch /auth/me once on dashboard load and cache result for other pages (e.g., Settings)
  React.useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const me = await getAuthMe(token);
        saveUserMe(me);
        const u = me?.user || {};
        const addrs: { chain: string; address: string }[] = [];
        if (u?.evmAddress) addrs.push({ chain: "evm", address: u.evmAddress });
        if (u?.solanaAddress) addrs.push({ chain: "solana", address: u.solanaAddress });
        if (u?.movementAddress) addrs.push({ chain: "movement", address: u.movementAddress });
        if (addrs.length) saveUserWallets(addrs);
      } catch {}
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 safe-bottom">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-md mx-auto w-full safe-top-3 safe-x-5 py-2 flex items-center justify-between">
          <img src="/logoflat.png" alt="Logo" className="h-6 shrink-0" />
          <Settings onClick={() => navigate('/settings')} className="w-6 h-6 text-gray-600 shrink-0 cursor-pointer hover:text-gray-800 transition-colors duration-200" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Campaign section */}
        <div className="space-y-4">
          <CampaignCard
            variant="hero"
            onClick={() => window.dispatchEvent(new CustomEvent('open-campaign-webview'))}
            onReferralClick={() => setShowReferralModal(true)}
            referralsCount={0}
          />
          <PaymentCard variant="hint" />
          <RedeemCard variant="full" />
        </div>

        {/* Spacer bottom safe area handled */}
      </main>

      {/* Modal */}
      <ReferralModal
        open={showReferralModal}
        onClose={() => setShowReferralModal(false)}
      />
    </div>
  );
};

export default Landing;