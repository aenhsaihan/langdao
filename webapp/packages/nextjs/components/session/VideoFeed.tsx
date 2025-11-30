import { useEffect, useMemo, useRef } from "react";
import clsx from "clsx";
import { MicrophoneIcon, NoSymbolIcon, VideoCameraIcon, VideoCameraSlashIcon } from "@heroicons/react/24/outline";

export type ParticipantRole = "tutor" | "student";

export interface VideoFeedProps {
  name: string;
  role: ParticipantRole;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isSpeaking?: boolean;
  mediaStream?: MediaStream | null;
}

const roleColors: Record<ParticipantRole, string> = {
  tutor: "bg-cyan-500/90 text-white",
  student: "bg-emerald-500/90 text-white",
};

export const VideoFeed = ({
  name,
  role,
  isAudioEnabled,
  isVideoEnabled,
  isSpeaking = false,
  mediaStream,
}: VideoFeedProps) => {
  const initials = useMemo(
    () =>
      name
        .split(" ")
        .map(word => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [name],
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  return (
    <div
      className={clsx(
        "relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-slate-900/70 backdrop-blur-lg transition-all duration-300",
        isSpeaking && "ring-2 ring-cyan-300 shadow-elegant",
      )}
    >
      <video
        ref={videoRef}
        className={clsx("h-full w-full object-cover", (!mediaStream || !isVideoEnabled) && "hidden")}
        autoPlay
        muted
        playsInline
      />

      {(!mediaStream || !isVideoEnabled) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-cyan-900/30">
          <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-white/10 bg-slate-800/80 text-3xl font-semibold text-white shadow-inner">
            {initials}
          </div>
          <p className="text-sm uppercase tracking-[0.25em] text-white/60">
            {mediaStream ? "video off" : "connecting"}
          </p>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-white/10 bg-white/15 px-3 py-1 text-sm font-semibold text-white backdrop-blur">
            {name}
          </div>
          <div
            className={clsx("rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide", roleColors[role])}
          >
            {role}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={clsx(
              "flex h-10 w-10 items-center justify-center rounded-full border border-white/10 backdrop-blur",
              isAudioEnabled ? "bg-white/10 text-white" : "bg-rose-500/80 text-white",
              isSpeaking && isAudioEnabled && "ring-2 ring-emerald-400/80",
            )}
            aria-label={isAudioEnabled ? "Mic on" : "Mic muted"}
          >
            {isAudioEnabled ? <MicrophoneIcon className="h-5 w-5" /> : <NoSymbolIcon className="h-5 w-5" />}
          </div>

          <div
            className={clsx(
              "flex h-10 w-10 items-center justify-center rounded-full border border-white/10 backdrop-blur",
              isVideoEnabled ? "bg-white/10 text-white" : "bg-rose-500/80 text-white",
            )}
          >
            {isVideoEnabled ? <VideoCameraIcon className="h-5 w-5" /> : <VideoCameraSlashIcon className="h-5 w-5" />}
          </div>
        </div>
      </div>
    </div>
  );
};
