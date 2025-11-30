import { useEffect, useState } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";

interface BalanceWarningToastProps {
  minutesRemaining: number;
  onTopUp: () => void;
}

export const BalanceWarningToast = ({ minutesRemaining, onTopUp }: BalanceWarningToastProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(timer);
  }, [minutesRemaining]);

  if (!visible) return null;

  return (
    <div className="fixed top-24 right-6 z-50 animate-fade-in">
      <div className="flex min-w-[280px] items-center gap-3 rounded-2xl border border-amber-200/30 bg-slate-900/80 px-4 py-3 text-white shadow-elegant backdrop-blur">
        <ExclamationCircleIcon className="h-5 w-5 text-amber-300" />
        <div className="flex-1">
          <p className="text-sm font-semibold">{minutesRemaining} min remaining</p>
          <p className="text-xs text-white/70">Top up soon to avoid a pause.</p>
        </div>
        <button
          onClick={onTopUp}
          className="rounded-full bg-amber-400/90 px-3 py-1 text-xs font-semibold text-slate-900 transition hover:bg-amber-300"
        >
          Top up
        </button>
      </div>
    </div>
  );
};
