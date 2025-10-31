import React from "react";

interface CampaignCardProps {
  onClick?: () => void;
  variant?: "default" | "hero" | "compact";
  onReferralClick?: () => void;
  referralsCount?: number;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ onClick, variant = "default", onReferralClick, referralsCount = 0 }) => {
  const outerHero = variant === "hero" ? "p-[1px] bg-gradient-to-r from-yellow-400 to-pink-500 shadow" : "";
  const innerRadius = variant === "hero" ? "rounded-[15px]" : "rounded-2xl";
  return (
    <div onClick={onClick} className={`rounded-2xl cursor-pointer active:scale-[0.99] transition-transform ${outerHero}`}>
      <div className={`bg-white ${innerRadius} p-5 flex flex-col items-start justify-between w-full relative overflow-hidden ${variant === "hero" ? "min-h-[240px]" : "min-h-[160px]"}`}>
      <div className="w-full z-10">
        {variant === "hero" ? (
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 text-green-700 border border-green-200">LIVE</span>
              <h3 className="text-1xl font-bold text-gray-900 leading-none tracking-tight">Movement Mania</h3>
            </div>
            <button className="text-xs font-semibold text-white bg-black rounded-lg px-3 py-1.5 hover:bg-gray-900">Open</button>
          </div>
        ) : (
          <h3 className="text-lg font-semibold text-gray-800 leading-tight">Movement Mania</h3>
        )}
      </div>
      <div className="w-full flex justify-end items-end flex-1 relative">
        <img
          src="/campaign.png"
          alt="Movement"
          className={`${variant === "hero" ? "h-32" : "h-16"} object-contain`}
        />
      </div>
      {variant === "hero" && (
        <div className="w-full mt-3" onClick={(e) => { e.stopPropagation(); onReferralClick?.(); }}>
          <div className="bg-yellow-400 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-black">Referrals</div>
              <div className="text-xs text-black/80">Invite your friends :)</div>
            </div>
            <div className="text-3xl font-extrabold text-black leading-none">{referralsCount}</div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default CampaignCard;