import React from "react";

interface ReferralsCardProps {
  onClick?: () => void;
  variant?: "default" | "compact";
}

const ReferralsCard: React.FC<ReferralsCardProps> = ({ onClick, variant = "default" }) => {
  // Read referral count from cached user_me
  const cachedMeRaw = typeof window !== 'undefined' ? localStorage.getItem("user_me") : null;
  const count = React.useMemo(() => {
    try {
      const parsed = cachedMeRaw ? JSON.parse(cachedMeRaw) : null;
      const user = parsed?.user || {};
      return typeof user?.referralCount === 'number' ? user.referralCount : 0;
    } catch {
      return 0;
    }
  }, [cachedMeRaw]);
  return (
    <div
      onClick={onClick}
      className={`bg-yellow-400 rounded-2xl p-4 flex flex-col items-start justify-between w-full h-full cursor-pointer active:scale-[0.99] transition-transform ${variant === "compact" ? "min-h-[120px]" : "min-h-[160px]"}`}
    >
      <div className="w-full">
        <h3 className={`${variant === "compact" ? "text-base" : "text-lg sm:text-xl"} font-semibold text-black leading-tight mb-1`}>Referrals</h3>
        <p className={`${variant === "compact" ? "text-xs" : "text-xs sm:text-sm"} text-black opacity-80 leading-snug mb-1`}>Invite your friends :)</p>
      </div>
      <div className="w-full flex justify-center items-end flex-1">
        <span className={`${variant === "compact" ? "text-5xl" : "text-6xl"} font-extrabold text-black leading-none`}>{count}</span>
      </div>
    </div>
  );
};

export default ReferralsCard;