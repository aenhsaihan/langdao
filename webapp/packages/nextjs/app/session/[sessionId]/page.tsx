"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { BalanceMeter } from "~~/components/session/BalanceMeter";
import { BalanceTopUpModal } from "~~/components/session/BalanceTopUpModal";
import { BalanceWarningBanner } from "~~/components/session/BalanceWarningBanner";
import { BalanceWarningToast } from "~~/components/session/BalanceWarningToast";
import { ChatPanel } from "~~/components/session/ChatPanel";
import { ConnectionQuality, ConnectionStatus } from "~~/components/session/ConnectionStatus";
import { SessionControls } from "~~/components/session/SessionControls";
import { SessionPausedOverlay } from "~~/components/session/SessionPausedOverlay";
import { SessionTimer } from "~~/components/session/SessionTimer";
import { VideoFeed } from "~~/components/session/VideoFeed";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useWebRTC } from "~~/hooks/useWebRTC";
import { useWebRTCSession } from "~~/hooks/useWebRTCSession";

const INITIAL_BALANCE = 5.5;
const RATE_PER_SECOND = 0.007; // $0.42/min

const infoCards = [
  { label: "Language", key: "language", fallback: "Spanish" },
  { label: "Level", key: "level", fallback: "Intermediate" },
  { label: "Focus", key: "focus", fallback: "Conversation" },
];

const connectionOptions: ConnectionQuality[] = ["excellent", "good", "unstable"];

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentSession, sessionDuration, endSession, isEndingSession } = useWebRTCSession();
  const { writeContractAsync: writeEndSessionAsync } = useScaffoldWriteContract({
    contractName: "LangDAO",
  });

  const sessionId = (params?.sessionId as string) || "live-session";
  const role = (searchParams.get("role") as "tutor" | "student") || "student";
  const tutorName = searchParams.get("tutorName") || "Tutor";
  const studentName = searchParams.get("studentName") || "Student";

  // Get addresses from URL or session
  const studentAddress = searchParams.get("student") || currentSession?.studentAddress || "";
  const tutorAddress = searchParams.get("tutor") || currentSession?.tutorAddress || "";

  const localAddress = role === "student" ? studentAddress : tutorAddress;
  const remoteAddress = role === "student" ? tutorAddress : studentAddress;

  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [isPaused, setIsPaused] = useState(false);
  const [showCriticalModal, setShowCriticalModal] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>("excellent");

  // WebRTC Hook
  const {
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    connectionStatus,
    initializeMedia,
    createOffer,
    toggleAudio,
    toggleVideo,
  } = useWebRTC(sessionId, role, localAddress, remoteAddress);

  // Initialize Media on Mount
  useEffect(() => {
    initializeMedia();
  }, [initializeMedia]);

  // Tutor initiates the call (creates offer) once media is ready
  useEffect(() => {
    if (role === "tutor" && localStream) {
      // Small delay to ensure socket is ready
      const timer = setTimeout(() => {
        console.log("Tutor initiating call...");
        createOffer();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [role, localStream, createOffer]);

  const secondsRemaining = Math.floor(balance / RATE_PER_SECOND);
  const minutesRemaining = Math.floor(secondsRemaining / 60);

  const sessionStartTime = useMemo(() => {
    if (currentSession?.startTime) {
      return currentSession.startTime;
    }
    const fromQuery = searchParams.get("sessionStart");
    return fromQuery ? Number(fromQuery) : undefined;
  }, [currentSession?.startTime, searchParams]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setBalance(prev => {
        if (prev <= 0) return 0;

        const next = Math.max(0, parseFloat((prev - RATE_PER_SECOND).toFixed(4)));

        if (next <= 0.21 && prev > 0.21) {
          setShowCriticalModal(true);
        }

        if (next === 0) {
          setIsPaused(true);
          toast.error("Funds depleted. Session paused.");
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    // Simulate connection quality changes for now
    const interval = setInterval(() => {
      setConnectionQuality(prev => {
        const currentIndex = connectionOptions.indexOf(prev);
        const nextIndex = (currentIndex + 1) % connectionOptions.length;
        return connectionOptions[nextIndex];
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleTopUp = useCallback((amount: number) => {
    if (amount <= 0) {
      toast("Custom top ups coming soon.");
      return;
    }

    setBalance(prev => prev + amount);
    setIsPaused(false);
    setShowCriticalModal(false);
    toast.success(`Added $${amount.toFixed(2)} to your balance`);
  }, []);

  const handleQuickTopUp = useCallback(
    (minutes: number) => {
      const amount = minutes * 60 * RATE_PER_SECOND;
      handleTopUp(amount);
    },
    [handleTopUp],
  );

  const handleEndSession = useCallback(async () => {
    try {
      if (currentSession) {
        await endSession();
      } else if (tutorAddress) {
        await writeEndSessionAsync({
          functionName: "endSession",
          args: [tutorAddress as `0x${string}`],
        });
      } else {
        toast.error("Unable to determine tutor address for this session.");
        return;
      }
      toast.success("Session ended successfully");
      router.push("/");
    } catch (error) {
      console.error(error);
      toast.error("Unable to end the session. Please retry.");
    }
  }, [currentSession, endSession, router, tutorAddress, writeEndSessionAsync]);

  const localName = role === "tutor" ? tutorName : studentName;
  const remoteName = role === "tutor" ? studentName : tutorName;

  const shouldShowToast = !isPaused && balance > 0.84 && balance <= 2.1 && minutesRemaining <= 5;
  const shouldShowBanner = !isPaused && balance > 0.21 && balance <= 0.84;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#030617] via-[#05122b] to-[#083745] text-white">
      <div className="fixed inset-x-0 top-0 z-30 border-b border-white/5 bg-slate-900/70 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Exit
          </button>

          <SessionTimer elapsedSeconds={sessionDuration} startTime={sessionStartTime} />

          <div className="flex items-center gap-3">
            <BalanceMeter current={balance} initial={INITIAL_BALANCE} ratePerSecond={RATE_PER_SECOND} />
            <ConnectionStatus isConnected={connectionStatus === "connected"} quality={connectionQuality} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-32 pt-28">
        <p className="mb-4 text-xs uppercase tracking-[0.4em] text-white/40">Session {sessionId}</p>
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <VideoFeed
                name={localName}
                role={role}
                isAudioEnabled={isAudioEnabled}
                isVideoEnabled={isVideoEnabled}
                mediaStream={localStream}
                isSpeaking={false} // Todo: Implement audio level detection
              />
              <VideoFeed
                name={remoteName}
                role={role === "student" ? "tutor" : "student"}
                isAudioEnabled={true} // Remote status handling to be added
                isVideoEnabled={true}
                mediaStream={remoteStream}
                isSpeaking={false}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {infoCards.map(card => (
                <div key={card.label} className="pop-card">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">{card.label}</p>
                  <p className="mt-2 text-xl font-semibold">{searchParams.get(card.key) || card.fallback}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <ChatPanel />
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30">
        <SessionControls
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          isEndingSession={isEndingSession}
          balance={balance}
          initialBalance={INITIAL_BALANCE}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onScreenShare={() => toast("Screen share coming soon")}
          onEndSession={handleEndSession}
        />
      </div>

      {shouldShowToast && <BalanceWarningToast minutesRemaining={minutesRemaining} onTopUp={() => handleTopUp(5)} />}

      {shouldShowBanner && (
        <BalanceWarningBanner
          minutesRemaining={minutesRemaining}
          ratePerSecond={RATE_PER_SECOND}
          onQuickTopUp={handleQuickTopUp}
        />
      )}

      <BalanceTopUpModal
        isOpen={showCriticalModal && !isPaused}
        currentBalance={balance}
        secondsRemaining={secondsRemaining}
        ratePerSecond={RATE_PER_SECOND}
        onTopUp={handleTopUp}
        onEndSession={handleEndSession}
        onClose={() => setShowCriticalModal(false)}
      />

      {isPaused && <SessionPausedOverlay ratePerSecond={RATE_PER_SECOND} onTopUp={handleTopUp} />}
    </div>
  );
}
