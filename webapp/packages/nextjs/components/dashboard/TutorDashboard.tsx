"use client";

import { CONTRACTS, PYUSD_DECIMALS, getLanguageById } from "../../lib/constants/contracts";
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

  // Get tutor balance from LangDAO contract
  const { data: balance } = useScaffoldReadContract({
    contractName: "LangDAO",
    functionName: "tutorBalances",
    args: [account?.address, CONTRACTS.PYUSD],
  });

  const balanceFormatted = balance ? parseFloat(formatUnits(balance, PYUSD_DECIMALS)) : 0;
  
  // Parse tutor info
  const isAvailable = tutorInfo ? tutorInfo[0] : false;
  const languageIds = tutorInfo ? tutorInfo[1] : [];
  const ratesPerSecond = tutorInfo ? tutorInfo[2] : [];

  // Get primary language (first registered language)
  const primaryLanguageId = languageIds && languageIds.length > 0 ? Number(languageIds[0]) : 0;
  const primaryRate = ratesPerSecond && ratesPerSecond.length > 0 ? Number(ratesPerSecond[0]) : 0;
  const primaryRatePerHour = primaryRate * 3600;
  const primaryRatePerHourPYUSD = primaryRatePerHour / Math.pow(10, PYUSD_DECIMALS);

  const languageData = getLanguageById(primaryLanguageId) || { name: "Unknown", flag: "🌍", id: 0, code: "unknown" };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-[#0F0520] via-[#1A0B2E] to-[#0F0520] p-6 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight">Tutor Dashboard</h1>
          <p className="text-base text-white/60 font-light">Your teaching command center</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          {/* Balance - Hero Card */}
          <div className="lg:col-span-2 relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1">Earnings Balance</div>
              <div
                className="text-5xl sm:text-6xl font-black text-white mb-1"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ${balanceFormatted.toFixed(2)}
              </div>
              <div className="text-white/80 text-sm font-light mb-4">PYUSD</div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <button
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm rounded-lg font-semibold transition-all"
                >
                  💸 Withdraw
                </button>
                <div className="text-white/60 text-xs">Available to withdraw</div>
              </div>
            </div>
          </div>

          {/* Language Card */}
          <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 overflow-hidden">
            <div className="absolute -top-6 -right-6 text-7xl opacity-10">{languageData.flag}</div>
            <div className="relative">
              <div className="text-white/60 text-xs font-medium uppercase tracking-wider mb-3">Teaching</div>
              <div className="text-4xl mb-2">{languageData.flag}</div>
              <div className="text-xl font-bold text-white mb-1">{languageData.name}</div>
              <div className="text-white/60 text-xs">
                {languageIds && languageIds.length > 1 ? `+${languageIds.length - 1} more` : "Primary language"}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <div className="text-white/60 text-xs font-medium uppercase tracking-wider mb-2">Sessions</div>
            <div className="text-3xl font-black text-white mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              0
            </div>
            <div className="text-white/60 text-xs">Completed</div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <div className="text-white/60 text-xs font-medium uppercase tracking-wider mb-2">Hourly Rate</div>
            <div className="text-3xl font-black text-white mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ${primaryRatePerHourPYUSD.toFixed(2)}
            </div>
            <div className="text-white/60 text-xs">Per hour</div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <div className="text-white/60 text-xs font-medium uppercase tracking-wider mb-2">Status</div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
              <div className={`text-lg font-bold ${isAvailable ? 'text-emerald-400' : 'text-gray-400'}`}>
                {isAvailable ? 'Available' : 'Offline'}
              </div>
            </div>
            <div className="text-white/60 text-xs">{isAvailable ? 'Ready to teach' : 'Not accepting students'}</div>
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
