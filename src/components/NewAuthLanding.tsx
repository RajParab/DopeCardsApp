import React from "react";
import { useTurnkey, AuthState } from "@turnkey/react-wallet-kit";
import { useNavigate } from "react-router-dom";

const NewAuthLanding: React.FC = () => {
  const navigate = useNavigate();
  const { handleLogin, authState } = useTurnkey();

  // Redirect to dashboard when authenticated and has JWT
  React.useEffect(() => {
    if (authState === AuthState.Authenticated && localStorage.getItem("app_jwt")) {
      navigate("/dashboard", { replace: true });
    }
  }, [authState, navigate]);

  return (
    <div className="min-h-screen bg-white safe-top safe-bottom flex items-center justify-center">
      <div className="w-full max-w-sm px-6 text-center">
        <div className="mb-8 flex items-center justify-center">
          <img src="/logoflat.png" alt="DOPE" className="h-20" />
        </div>
        <button
          onClick={() => handleLogin()}
          className="w-full bg-black text-white py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
        >
          <span>Continue</span>
        </button>
        <div className="mt-8 text-xs text-gray-500">Powered by <span className="font-semibold">Stableyard</span></div>
      </div>
    </div>
  );
};

export default NewAuthLanding;


