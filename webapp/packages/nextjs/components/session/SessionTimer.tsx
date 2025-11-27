import { useEffect, useMemo, useState } from "react";
import { ClockIcon } from "@heroicons/react/24/outline";

interface SessionTimerProps {
  elapsedSeconds?: number;
  startTime?: Date | number;
}

export const SessionTimer = ({ elapsedSeconds, startTime }: SessionTimerProps) => {
  const [internalElapsed, setInternalElapsed] = useState(0);

  const startTimestamp = useMemo(() => {
    if (!startTime) return null;
    return startTime instanceof Date ? startTime.getTime() : startTime;
  }, [startTime]);

  useEffect(() => {
    if (typeof elapsedSeconds === "number") {
      setInternalElapsed(elapsedSeconds);
      return;
    }

    if (!startTimestamp) return;

    const updateElapsed = () => {
      const diff = Math.max(0, Math.floor((Date.now() - startTimestamp) / 1000));
      setInternalElapsed(diff);
    };

    updateElapsed();

    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [elapsedSeconds, startTimestamp]);

  const totalSeconds = typeof elapsedSeconds === "number" ? elapsedSeconds : internalElapsed;
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white backdrop-blur">
      <ClockIcon className="h-4 w-4 text-white/70" />
      <span className="text-lg font-semibold tabular-nums">
        {minutes}:{seconds}
      </span>
    </div>
  );
};
