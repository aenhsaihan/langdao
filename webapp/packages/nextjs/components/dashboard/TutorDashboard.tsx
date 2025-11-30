"use client";

import { PYUSD_DECIMALS } from "../../lib/constants/contracts";
import { useActiveAccount } from "thirdweb/react";
import { formatUnits } from "viem";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface TutorDashboardProps {
  onGoLive?: () => void;
}

export const TutorDashboard = ({ onGoLive }: TutorDashboardProps) => {
  const account = useActiveAccount();

  // Get tutor info using scaffold hook
  const { data: tutorInfo } = useScaffoldReadContract({
    contractName: "LangDAO",
    functionName: "getTutorInfo",
    args: [account?.address],
  });

  // Parse tutor info - getTutorInfo returns (totalEarnings, sessionCount, isRegistered)
  const totalEarnings = tutorInfo ? tutorInfo[0] : 0n;
  const sessionCount = tutorInfo ? tutorInfo[1] : 0n;
  const isRegistered = tutorInfo ? tutorInfo[2] : false;

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-[#0F0520] via-[#1A0B2E] to-[#0F0520] p-6 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight">Tutor Dashboard</h1>
          <p className="text-base text-white/60 font-light">Your teaching command center</p>
        </div>

        {/* Total Earnings Card */}
        <div className="mb-6">
          <div className="relative bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1">Total Earnings</div>
              <div
                className="text-5xl sm:text-6xl font-black text-white mb-1"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ${totalEarnings ? parseFloat(formatUnits(totalEarnings, PYUSD_DECIMALS)).toFixed(2) : "0.00"}
              </div>
              <div className="text-white/80 text-sm font-light">All-time</div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <div className="text-white/60 text-xs font-medium uppercase tracking-wider mb-2">Sessions</div>
            <div className="text-3xl font-black text-white mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {sessionCount ? sessionCount.toString() : "0"}
            </div>
            <div className="text-white/60 text-xs">Completed</div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <div className="text-white/60 text-xs font-medium uppercase tracking-wider mb-2">Status</div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`w-2 h-2 rounded-full ${isRegistered ? "bg-emerald-400 animate-pulse" : "bg-gray-400"}`}
              />
              <div className={`text-lg font-bold ${isRegistered ? "text-emerald-400" : "text-gray-400"}`}>
                {isRegistered ? "Registered" : "Not Registered"}
              </div>
            </div>
            <div className="text-white/60 text-xs">{isRegistered ? "Ready to go live" : "Complete registration"}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={onGoLive}
            className="group relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 overflow-hidden hover:scale-105 transition-all"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="text-4xl mb-3">🎤</div>
              <div className="text-2xl font-black text-white mb-1">Go Live & Start Earning</div>
              <div className="text-white/80 text-xs">Accept students and start teaching</div>
            </div>
          </button>

          <a
            href="/student"
            className="group relative bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-6 overflow-hidden hover:scale-105 transition-all"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="text-4xl mb-3">🎓</div>
              <div className="text-2xl font-black text-white mb-1">Learn</div>
              <div className="text-white/80 text-xs">Switch to student mode</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};
