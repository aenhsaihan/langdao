"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { formatUnits } from "viem";
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
import { CONTRACTS, PYUSD_DECIMALS } from "~~/lib/constants/contracts";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useWebRTC } from "~~/hooks/useWebRTC";
import { useWebRTCSession } from "~~/hooks/useWebRTCSession";

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

  // Read active session from blockchain (keyed by tutor address)
  const { data: activeSessionData } = useScaffoldReadContract({
    contractName: "LangDAO",
    functionName: "activeSessions",
    args: tutorAddress ? [tutorAddress as `0x${string}`] : undefined,
    enabled: !!tutorAddress,
  });

  // Read student balance from blockchain (only for students)
  const { data: studentBalanceData } = useScaffoldReadContract({
    contractName: "LangDAO",
    functionName: "studentBalances",
    args: role === "student" && studentAddress ? [studentAddress as `0x${string}`, CONTRACTS.PYUSD] : undefined,
    enabled: role === "student" && !!studentAddress,
  });

  // Parse session data from blockchain
  const sessionData = useMemo(() => {
    if (!activeSessionData) return null;
    const [student, tutor, token, startTime, endTime, ratePerSecond, totalPaid, languageId, sessionId, isActive] =
      activeSessionData;
    return {
      student,
      tutor,
      token,
      startTime: startTime ? Number(startTime) : null,
      endTime: endTime ? Number(endTime) : null,
      ratePerSecond: ratePerSecond ? parseFloat(formatUnits(ratePerSecond, PYUSD_DECIMALS)) : 0,
      totalPaid: totalPaid ? parseFloat(formatUnits(totalPaid, PYUSD_DECIMALS)) : 0,
      languageId: Number(languageId),
      sessionId: sessionId ? Number(sessionId) : null,
      isActive: Boolean(isActive),
    };
  }, [activeSessionData]);

  // Calculate balance for student or earnings for tutor
  const { currentBalance, initialBalance, ratePerSecond, teachingTimeSeconds } = useMemo(() => {
    if (!sessionData || !sessionData.startTime) {
      // Fallback to mock data if no session data
      return {
        currentBalance: 5.5,
        initialBalance: 5.5,
        ratePerSecond: 0.007,
        teachingTimeSeconds: 0,
      };
    }

    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const elapsedSeconds = now - sessionData.startTime;
    const rate = sessionData.ratePerSecond;

    if (role === "student") {
      // Student: balance decreases over time
      const initialBalanceValue = studentBalanceData
        ? parseFloat(formatUnits(studentBalanceData, PYUSD_DECIMALS))
        : 5.5; // Fallback
      const consumed = elapsedSeconds * rate;
      const currentBalanceValue = Math.max(0, initialBalanceValue - consumed);

      return {
        currentBalance: currentBalanceValue,
        initialBalance: initialBalanceValue,
        ratePerSecond: rate,
        teachingTimeSeconds: 0,
      };
    } else {
      // Tutor: earnings increase over time
      const earnings = elapsedSeconds * rate;

      return {
        currentBalance: earnings,
        initialBalance: 0,
        ratePerSecond: rate,
        teachingTimeSeconds: elapsedSeconds,
      };
    }
  }, [sessionData, studentBalanceData, role]);

  const [balance, setBalance] = useState(currentBalance);
  const [isPaused, setIsPaused] = useState(false);
  const [showCriticalModal, setShowCriticalModal] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>("excellent");

  // Update balance/earnings in real-time
  useEffect(() => {
    if (!sessionData || !sessionData.startTime) return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const elapsedSeconds = now - sessionData.startTime!;
      const rate = sessionData.ratePerSecond;

      if (role === "student") {
        const initialBalanceValue = studentBalanceData
          ? parseFloat(formatUnits(studentBalanceData, PYUSD_DECIMALS))
          : 5.5;
        const consumed = elapsedSeconds * rate;
        const newBalance = Math.max(0, initialBalanceValue - consumed);
        setBalance(newBalance);

        if (newBalance <= 0.21 && balance > 0.21) {
          setShowCriticalModal(true);
        }

        if (newBalance === 0) {
          setIsPaused(true);
          toast.error("Funds depleted. Session paused.");
        }
      } else {
        // Tutor: earnings increase
        const earnings = elapsedSeconds * rate;
        setBalance(earnings);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionData, studentBalanceData, role, balance]);

  // WebRTC Hook
  const {
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    connectionStatus,
    mediaError,
    isRequestingMedia,
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

  const secondsRemaining = role === "student" ? Math.floor(balance / ratePerSecond) : 0;
  const minutesRemaining = Math.floor(secondsRemaining / 60);

  const sessionStartTime = useMemo(() => {
    if (currentSession?.startTime) {
      return currentSession.startTime;
    }
    const fromQuery = searchParams.get("sessionStart");
    return fromQuery ? Number(fromQuery) : undefined;
  }, [currentSession?.startTime, searchParams]);

  // Note: Balance/earnings update is now handled in the useEffect above (lines 136-168)
  // This old useEffect has been removed as it used hardcoded RATE_PER_SECOND

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
      const amount = minutes * 60 * ratePerSecond;
      handleTopUp(amount);
    },
    [handleTopUp, ratePerSecond],
  );

  const handleEndSession = useCallback(async () => {
    try {
      // Determine tutor address - priority: URL param > session data > activeSessionData
      let targetTutorAddress = tutorAddress;
      
      if (!targetTutorAddress && currentSession?.tutorAddress) {
        targetTutorAddress = currentSession.tutorAddress;
      }
      
      if (!targetTutorAddress && sessionData?.tutor) {
        targetTutorAddress = sessionData.tutor;
      }

      if (!targetTutorAddress) {
        toast.error("Unable to determine tutor address for this session.");
        console.error("No tutor address found. URL:", tutorAddress, "Session:", currentSession, "SessionData:", sessionData);
        return;
      }

      // End session on blockchain
      if (currentSession) {
        // Use useWebRTCSession's endSession if available (for students)
        await endSession();
      } else {
        // Direct contract call (for tutors or when currentSession is not available)
        await writeEndSessionAsync({
          functionName: "endSession",
          args: [targetTutorAddress as `0x${string}`],
        });
      }

      // Clean up storage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("pendingSession");
        localStorage.removeItem("activeSessionTutorAddress");
      }

      toast.success("Session ended successfully");
      
      // Redirect both student and tutor to home page
      router.push("/");
    } catch (error: any) {
      console.error("Error ending session:", error);
      
      // Check if user rejected the transaction
      if (error?.message?.includes("user rejected") || error?.code === 4001 || error?.code === "ACTION_REJECTED") {
        toast.error("Transaction rejected. Session not ended.");
      } else {
        toast.error("Unable to end the session. Please retry.");
      }
    }
  }, [currentSession, endSession, router, tutorAddress, sessionData, writeEndSessionAsync]);

  const localName = role === "tutor" ? tutorName : studentName;
  const remoteName = role === "tutor" ? studentName : tutorName;

  // Only show balance warnings for students
  const shouldShowToast = role === "student" && !isPaused && balance > 0.84 && balance <= 2.1 && minutesRemaining <= 5;
  const shouldShowBanner = role === "student" && !isPaused && balance > 0.21 && balance <= 0.84;

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
            {role === "student" ? (
              <BalanceMeter
                current={balance}
                initial={initialBalance}
                ratePerSecond={ratePerSecond}
                mode="balance"
              />
            ) : (
              <BalanceMeter
                current={balance}
                initial={0}
                ratePerSecond={ratePerSecond}
                mode="earnings"
                teachingTimeSeconds={teachingTimeSeconds}
              />
            )}
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
          balance={role === "student" ? balance : undefined}
          initialBalance={role === "student" ? initialBalance : undefined}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onScreenShare={() => toast("Screen share coming soon")}
          onEndSession={handleEndSession}
        />
      </div>

      {shouldShowToast && <BalanceWarningToast minutesRemaining={minutesRemaining} onTopUp={() => handleTopUp(5)} />}

      {shouldShowBanner && role === "student" && (
        <BalanceWarningBanner
          minutesRemaining={minutesRemaining}
          ratePerSecond={ratePerSecond}
          onQuickTopUp={handleQuickTopUp}
        />
      )}

      {role === "student" && (
        <BalanceTopUpModal
          isOpen={showCriticalModal && !isPaused}
          currentBalance={balance}
          secondsRemaining={secondsRemaining}
          ratePerSecond={ratePerSecond}
          onTopUp={handleTopUp}
          onEndSession={handleEndSession}
          onClose={() => setShowCriticalModal(false)}
        />
      )}

      {isPaused && role === "student" && <SessionPausedOverlay ratePerSecond={ratePerSecond} onTopUp={handleTopUp} />}

      {/* Media Permission Request Overlay */}
      {(isRequestingMedia || mediaError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="mx-4 max-w-md rounded-2xl border border-white/10 bg-slate-900/95 p-8 text-center shadow-2xl">
            {isRequestingMedia ? (
              <>
                <div className="mb-4 flex justify-center">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
                </div>
                <h2 className="mb-2 text-2xl font-bold text-white">Requesting Camera & Microphone Access</h2>
                <p className="text-white/70">Please allow access when prompted by your browser.</p>
              </>
            ) : mediaError ? (
              <>
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                    <span className="text-3xl">⚠️</span>
                  </div>
                </div>
                <h2 className="mb-2 text-2xl font-bold text-white">Camera & Microphone Access Required</h2>
                <p className="mb-6 text-white/70">{mediaError.message}</p>
                {mediaError.type === "permission-denied" && (
                  <div className="mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-left">
                    <p className="mb-2 text-sm font-semibold text-amber-300">How to enable permissions:</p>
                    <ul className="list-inside list-disc space-y-1 text-xs text-white/80">
                      <li>Click the lock icon in your browser's address bar</li>
                      <li>Find "Camera" and "Microphone" settings</li>
                      <li>Set them to "Allow"</li>
                      <li>Refresh this page</li>
                    </ul>
                  </div>
                )}
                <button
                  onClick={() => initializeMedia()}
                  className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  Try Again
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
