import { useMemo } from "react";
import { BanknotesIcon, ClockIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";

interface BalanceMeterProps {
  current: number;
  initial: number;
  ratePerSecond: number;
  mode?: "balance" | "earnings"; // "balance" for student, "earnings" for tutor
  teachingTimeSeconds?: number; // For earnings mode: teaching time in seconds
}

export const BalanceMeter = ({ 
  current, 
  initial, 
  ratePerSecond, 
  mode = "balance",
  teachingTimeSeconds 
}: BalanceMeterProps) => {
  const percentage = useMemo(() => {
    if (mode === "earnings") {
      // For earnings mode, we don't use percentage bar (or use time-based progress)
      return 100; // Always show full bar for earnings (or calculate based on session duration)
    }
    return Math.max(0, Math.min(100, (current / initial) * 100));
  }, [current, initial, mode]);
  
  const isLow = mode === "balance" && current <= 2;

  // Format time for earnings mode
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate rate per hour for display
  const ratePerHour = ratePerSecond * 3600;

  if (mode === "earnings") {
    return (
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white backdrop-blur-lg">
        <CurrencyDollarIcon className="h-5 w-5 text-emerald-300" />
        <div className="flex min-w-32 flex-col gap-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-white">${current.toFixed(2)}</span>
            <span className="text-white/60">${ratePerHour.toFixed(2)}/hr</span>
          </div>
          {teachingTimeSeconds !== undefined && (
            <div className="text-xs text-white/60">
              {formatTime(teachingTimeSeconds)}
            </div>
          )}
          <div className="h-1.5 w-full rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-300"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Balance mode (default, for students)
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
