import {
  ComputerDesktopIcon,
  MicrophoneIcon,
  NoSymbolIcon,
  PhoneXMarkIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
} from "@heroicons/react/24/solid";

interface SessionControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isEndingSession?: boolean;
  balance?: number; // Optional for tutor role
  initialBalance?: number; // Optional for tutor role
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onScreenShare: () => void;
  onEndSession: () => void;
}

export const SessionControls = ({
  isAudioEnabled,
  isVideoEnabled,
  isEndingSession = false,
  balance,
  initialBalance,
  onToggleAudio,
  onToggleVideo,
  onScreenShare,
  onEndSession,
}: SessionControlsProps) => {
  // Only show balance meter for students (when balance and initialBalance are provided)
  const showBalanceMeter = balance !== undefined && initialBalance !== undefined && initialBalance > 0;
  const percentage = showBalanceMeter
    ? Math.max(0, Math.min(100, (balance! / initialBalance!) * 100))
    : 0;

  const circleButton =
    "flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300";

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 border-t border-white/5 bg-slate-900/80 px-6 py-5 backdrop-blur-lg">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleAudio}
          aria-label={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
          className={`${circleButton} ${!isAudioEnabled ? "bg-rose-500/80" : ""}`}
        >
          {isAudioEnabled ? <MicrophoneIcon className="h-6 w-6" /> : <NoSymbolIcon className="h-6 w-6" />}
        </button>

        <button
          type="button"
          onClick={onToggleVideo}
          aria-label={isVideoEnabled ? "Turn camera off" : "Turn camera on"}
          className={`${circleButton} ${!isVideoEnabled ? "bg-rose-500/80" : ""}`}
        >
          {isVideoEnabled ? <VideoCameraIcon className="h-6 w-6" /> : <VideoCameraSlashIcon className="h-6 w-6" />}
        </button>

        <button type="button" onClick={onScreenShare} aria-label="Share screen" className={circleButton}>
          <ComputerDesktopIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="h-10 w-px bg-white/5" />

      <button
        type="button"
        onClick={onEndSession}
        disabled={isEndingSession}
        className="flex items-center gap-2 rounded-full bg-rose-500 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <PhoneXMarkIcon className="h-5 w-5" />
        {isEndingSession ? "Ending…" : "End session"}
      </button>

      {showBalanceMeter && (
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.3em] text-white/70">
          <span className="relative block h-2 w-16 overflow-hidden rounded-full bg-white/10">
            <span className="absolute inset-y-0 left-0 rounded-full bg-cyan-300" style={{ width: `${percentage}%` }} />
          </span>
          ${balance!.toFixed(2)}
        </div>
      )}
    </div>
  );
};

export default SessionControls;
