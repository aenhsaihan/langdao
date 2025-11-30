import { useState } from "react";
import { BanknotesIcon, CheckCircleIcon } from "@heroicons/react/24/solid";

interface BalanceTopUpModalProps {
  isOpen: boolean;
  currentBalance: number;
  secondsRemaining: number;
  ratePerSecond: number;
  onTopUp: (amount: number) => void;
  onEndSession: () => void;
  onClose: () => void;
}

const quickTopUps = [
  { amount: 5, label: "$5" },
  { amount: 10, label: "$10" },
  { amount: 20, label: "$20" },
];

export const BalanceTopUpModal = ({
  isOpen,
  currentBalance,
  secondsRemaining,
  ratePerSecond,
  onTopUp,
  onEndSession,
  onClose,
}: BalanceTopUpModalProps) => {
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTopUp = (amount: number) => {
    if (amount <= 0) {
      onTopUp(amount);
      onClose();
      return;
    }

    onTopUp(amount);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1500);
  };

  const minutesFromAmount = (amount: number) => Math.floor(amount / (ratePerSecond * 60));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-8 text-white shadow-elegant">
        {showSuccess ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircleIcon className="h-16 w-16 text-emerald-300" />
            <p className="text-xl font-semibold">Funds added!</p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">Balance low</p>
              <h2 className="mt-2 text-3xl font-bold">Add funds to continue</h2>
              <p className="mt-3 text-white/70">
                ${currentBalance.toFixed(2)} · {secondsRemaining}s remaining
              </p>
            </div>

            <div className="grid gap-3">
              {quickTopUps.map(option => (
                <button
                  key={option.amount}
                  onClick={() => handleTopUp(option.amount)}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-left transition hover:bg-white/20"
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

              <button
                onClick={() => handleTopUp(0)}
                className="rounded-2xl border border-dashed border-white/30 px-5 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:bg-white/5"
              >
                Custom amount soon
              </button>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={onEndSession}
                className="flex-1 rounded-full border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                End session
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-full bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-white/90"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
