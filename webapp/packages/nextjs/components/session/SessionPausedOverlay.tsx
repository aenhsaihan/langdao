import { BanknotesIcon, PauseCircleIcon } from "@heroicons/react/24/solid";

interface SessionPausedOverlayProps {
  ratePerSecond: number;
  onTopUp: (amount: number) => void;
}

const quickAmounts = [
  { amount: 5, label: "$5" },
  { amount: 10, label: "$10" },
  { amount: 20, label: "$20" },
];

export const SessionPausedOverlay = ({ ratePerSecond, onTopUp }: SessionPausedOverlayProps) => {
  const minutesFromAmount = (amount: number) => Math.floor(amount / (ratePerSecond * 60));

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 px-6 backdrop-blur">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/90 p-8 text-white shadow-elegant">
        <div className="flex flex-col items-center gap-4 text-center">
          <PauseCircleIcon className="h-16 w-16 text-amber-300" />
          <h2 className="text-3xl font-semibold">Session paused</h2>
          <p className="text-white/70">Funds ran out. Add balance to continue your conversation.</p>
        </div>

        <div className="mt-6 space-y-3">
          {quickAmounts.map(option => (
            <button
              key={option.amount}
              onClick={() => onTopUp(option.amount)}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-left transition hover:bg-white/20"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                  <BanknotesIcon className="h-6 w-6 text-cyan-200" />
                </span>
                <div>
                  <p className="text-lg font-semibold">{option.label}</p>
                  <p className="text-sm text-white/60">{minutesFromAmount(option.amount)} min</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-cyan-200">Add</span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-xs uppercase tracking-[0.3em] text-white/50">
          Session will auto-resume after funds arrive
        </p>
      </div>
    </div>
  );
};
