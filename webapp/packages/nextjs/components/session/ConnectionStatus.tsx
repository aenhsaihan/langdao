import clsx from "clsx";
import { SignalIcon } from "@heroicons/react/24/outline";

export type ConnectionQuality = "excellent" | "good" | "unstable" | "offline";

interface ConnectionStatusProps {
  isConnected: boolean;
  quality: ConnectionQuality;
}

const qualityCopy: Record<ConnectionQuality, string> = {
  excellent: "excellent",
  good: "good",
  unstable: "unstable",
  offline: "offline",
};

export const ConnectionStatus = ({ isConnected, quality }: ConnectionStatusProps) => {
  const statusClass = clsx(
    "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
    quality === "excellent" && "status-success",
    quality === "good" && "bg-cyan-500/30 text-cyan-100",
    quality === "unstable" && "status-warning",
    (quality === "offline" || !isConnected) && "status-critical",
  );

  return (
    <div className={statusClass}>
      <span className={clsx("flex h-2 w-2 rounded-full", isConnected ? "bg-emerald-300" : "bg-rose-400")} />
      <SignalIcon className="h-4 w-4" />
      {isConnected ? qualityCopy[quality] : "offline"}
    </div>
  );
};
