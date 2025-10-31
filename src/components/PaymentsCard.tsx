import React from "react";

interface PaymentCardProps { variant?: "compact" | "hint" | "full" }

const PaymentCard: React.FC<PaymentCardProps> = ({ variant = "full" }) => {
  return (
    <div className={`bg-white rounded-2xl w-full flex items-center ${variant === "hint" ? "p-3 border border-dashed border-gray-300" : "p-4 shadow-sm"} ${variant === "compact" ? "min-h-[160px]" : ""}`}>
      <div className="flex-1">
        <h3 className={`text-gray-800 ${variant === "hint" ? "text-sm font-medium" : "text-lg font-semibold mb-1"}`}>
          Payments
        </h3>
        <p className={`${variant === "hint" ? "text-xs" : "text-sm"} text-gray-500`}>Coming soon</p>
      </div>
      <div className={`${variant === "hint" ? "w-14" : "w-24"} flex-shrink-0 flex justify-end`}>
        <img
          src="/payments.png"
          alt="Payments"
          className={`${variant === "hint" ? "h-10" : "h-20"} object-contain`}
        />
      </div>
    </div>
  );
};

export default PaymentCard;
