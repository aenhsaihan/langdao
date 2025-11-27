import { useMemo } from "react";
import { BanknotesIcon } from "@heroicons/react/24/outline";

interface BalanceMeterProps {
  current: number;
  initial: number;
  ratePerSecond: number;
}

export const BalanceMeter = ({ current, initial, ratePerSecond }: BalanceMeterProps) => {
  const percentage = useMemo(() => Math.max(0, Math.min(100, (current / initial) * 100)), [current, initial]);
  const isLow = current <= 2;

  return (
    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white backdrop-blur-lg">
      <BanknotesIcon className={`h-5 w-5 ${isLow ? "text-amber-300" : "text-emerald-300"}`} />
      <div className="flex min-w-32 flex-col gap-1">
        <div className="flex items-center justify-between text-sm">
          <span className={`font-semibold ${isLow ? "text-amber-200" : "text-white"}`}>${current.toFixed(2)}</span>
          <span className="text-white/60">${ratePerSecond.toFixed(4)}/s</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${isLow ? "bg-amber-300" : "bg-emerald-300"}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
