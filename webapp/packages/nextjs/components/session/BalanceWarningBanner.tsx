import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

interface BalanceWarningBannerProps {
  minutesRemaining: number;
  ratePerSecond: number;
  onQuickTopUp: (minutes: number) => void;
}

const quickOptions = [5, 15, 30];

export const BalanceWarningBanner = ({ minutesRemaining, ratePerSecond, onQuickTopUp }: BalanceWarningBannerProps) => {
  const calculateCost = (minutes: number) => (minutes * 60 * ratePerSecond).toFixed(2);

  return (
    <div className="fixed top-20 left-0 right-0 z-40 animate-fade-in">
      <div className="bg-amber-400/90 py-3 shadow-lg backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 text-slate-900">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span>
              {minutesRemaining} minute{minutesRemaining !== 1 ? "s" : ""} left — add funds to keep your session live.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {quickOptions.map(option => (
              <button
                key={option}
                onClick={() => onQuickTopUp(option)}
                className="rounded-full border border-slate-900/30 bg-white/50 px-3 py-1 text-xs font-semibold transition hover:bg-white/80"
              >
                +{option} min (${calculateCost(option)})
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
