"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { formatUnits } from "viem";
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
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useWebRTC } from "~~/hooks/useWebRTC";
import { useWebRTCSession } from "~~/hooks/useWebRTCSession";
import { CONTRACTS, LANGUAGES, PYUSD_DECIMALS, getLanguageById } from "~~/lib/constants/contracts";
import { useSocket } from "~~/lib/socket/socketContext";

// Info cards config - language comes from blockchain, level/focus from URL params
const INFO_CARD_CONFIG = [
  { label: "Language", key: "language" },
  { label: "Level", key: "level" },
  { label: "Focus", key: "focus" },
];

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { socket } = useSocket();
  const { currentSession, endSession, isEndingSession } = useWebRTCSession();
  const { writeContractAsync: writeEndSessionAsync } = useScaffoldWriteContract({
    contractName: "LangDAO",
  });
  const hasRedirectedRef = useRef(false);

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
    // @ts-expect-error - Type system doesn't handle conditional args well, but enabled flag prevents execution
    args: tutorAddress ? [tutorAddress as `0x${string}`] : undefined,
    enabled: !!tutorAddress,
  });

  // Read student balance from blockchain (only for students)
  const { data: studentBalanceData } = useScaffoldReadContract({
    contractName: "LangDAO",
    functionName: "studentBalances",
    // @ts-expect-error - Type system doesn't handle conditional args well, but enabled flag prevents execution
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
  const { currentBalance, initialBalance, ratePerSecond, hasValidData } = useMemo(() => {
    if (!sessionData || !sessionData.startTime) {
      // Return null to indicate no valid data - don't use fallback to prevent flickering
      return {
        currentBalance: null,
        initialBalance: null,
        ratePerSecond: null,
        hasValidData: false,
      };
    }

    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const elapsedSeconds = now - sessionData.startTime;
    const rate = sessionData.ratePerSecond;

    if (role === "student") {
      // Student: balance decreases over time
      // Only calculate if we have studentBalanceData - don't use fallback
      if (!studentBalanceData) {
        return {
          currentBalance: null,
          initialBalance: null,
          ratePerSecond: rate,
          hasValidData: false,
        };
      }

      const initialBalanceValue = parseFloat(formatUnits(studentBalanceData, PYUSD_DECIMALS));
      const consumed = elapsedSeconds * rate;
      const currentBalanceValue = Math.max(0, initialBalanceValue - consumed);

      return {
        currentBalance: currentBalanceValue,
        initialBalance: initialBalanceValue,
        ratePerSecond: rate,
        hasValidData: true,
      };
    } else {
      // Tutor: earnings increase over time
      const earnings = elapsedSeconds * rate;

      return {
        currentBalance: earnings,
        initialBalance: 0,
        ratePerSecond: rate,
        hasValidData: true,
      };
    }
  }, [sessionData, studentBalanceData, role]);

  // Initialize balance state only once with valid data, then preserve it during refetches
  const [balance, setBalance] = useState<number | null>(null);
  const hasInitializedRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showCriticalModal, setShowCriticalModal] = useState(false);
  // Store language info in state to persist even after session ends
  const [languageInfo, setLanguageInfo] = useState<{ flag: string; name: string } | null>(null);
  // Connection quality - always excellent if session is active
  const connectionQuality: ConnectionQuality = sessionData?.isActive ? "excellent" : "offline";

  // Track previous isActive state to detect when session ends
  const prevIsActiveRef = useRef<boolean | null>(null);

  // Initialize balance from useMemo only once when we get valid data
  useEffect(() => {
    if (hasValidData && currentBalance !== null && !hasInitializedRef.current) {
      setBalance(currentBalance);
      hasInitializedRef.current = true;
    }
  }, [hasValidData, currentBalance]);

  // Store language info when session data is available - ALWAYS from blockchain
  useEffect(() => {
    // Priority 1: Get language from blockchain session data (even if session ended, languageId should still be available)
    if (sessionData?.languageId !== undefined && sessionData.languageId !== null) {
      const lang = getLanguageById(sessionData.languageId);
      if (lang) {
        setLanguageInfo({ flag: lang.flag, name: lang.name });
        return; // Always prefer blockchain data
      }
    }

    // Priority 2: If blockchain data not available yet, try to get from activeSessionData directly
    if (activeSessionData && activeSessionData[7] !== undefined) {
      const languageId = Number(activeSessionData[7]);
      const lang = getLanguageById(languageId);
      if (lang) {
        setLanguageInfo({ flag: lang.flag, name: lang.name });
        return;
      }
    }

    // Only use URL param as last resort if blockchain data is completely unavailable
    // This should rarely happen, but provides a fallback during initial load
    const langFromUrl = searchParams.get("language");
    if (langFromUrl && !languageInfo) {
      const lang = LANGUAGES.find(l => l.code === langFromUrl);
      if (lang) {
        setLanguageInfo({ flag: lang.flag, name: lang.name });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData?.languageId, activeSessionData, searchParams]);

  // Update balance/earnings in real-time (only when we have valid data)
  useEffect(() => {
    if (!sessionData || !sessionData.startTime || !hasValidData) return;
    if (role === "student" && !studentBalanceData) return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const elapsedSeconds = now - sessionData.startTime!;
      const rate = sessionData.ratePerSecond;

      if (role === "student") {
        if (!studentBalanceData) return;
        const initialBalanceValue = parseFloat(formatUnits(studentBalanceData, PYUSD_DECIMALS));
        const consumed = elapsedSeconds * rate;
        const newBalance = Math.max(0, initialBalanceValue - consumed);
        setBalance(newBalance);

        if (newBalance <= 0.21 && balance !== null && balance > 0.21) {
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
  }, [sessionData, studentBalanceData, role, balance, hasValidData]);

  // WebRTC Hook
  const {
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
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

  // Tutor initiates the call (creates offer) - works even without local media
  useEffect(() => {
    if (role === "tutor") {
      // Small delay to ensure socket is ready
      const timer = setTimeout(() => {
        console.log("Tutor initiating call...");
        createOffer();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [role, createOffer]);

  // METHOD 1: Watch blockchain state changes - PRIMARY METHOD
  // When isActive changes from true to false, redirect both parties
  useEffect(() => {
    if (!sessionData) {
      // Initialize prevIsActiveRef if sessionData is null
      if (prevIsActiveRef.current === null) {
        prevIsActiveRef.current = false;
      }
      return;
    }

    const currentIsActive = sessionData.isActive;
    const prevIsActive = prevIsActiveRef.current;

    console.log("🔍 Blockchain state check:", {
      prevIsActive,
      currentIsActive,
      hasRedirected: hasRedirectedRef.current,
      sessionId: sessionData.sessionId,
    });

    // Detect when session ends: isActive changes from true to false
    if (prevIsActive === true && currentIsActive === false) {
      console.log("✅ Session ended detected via blockchain state change!");

      // Prevent multiple redirects
      if (hasRedirectedRef.current) {
        console.log("⚠️ Already redirected, ignoring duplicate redirect");
        return;
      }
      hasRedirectedRef.current = true;

      // Clean up storage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("pendingSession");
        localStorage.removeItem("activeSessionTutorAddress");
      }

      // Show appropriate toast
      if (role === "tutor") {
        const earnings = sessionData.totalPaid || 0;
        toast.success(`Session ended! You earned $${earnings.toFixed(2)}`);
      } else {
        const cost = sessionData.totalPaid || 0;
        toast.success(`Session ended! Total cost: $${cost.toFixed(2)}`);
      }

      console.log("✅ Redirecting to dashboard via blockchain state change...");

      // Redirect based on role - tutor goes to /tutor, student goes to /dashboard
      const targetUrl = role === "tutor" ? "/tutor" : "/dashboard";

      // Use window.location for reliable redirect
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 500);
    }

    // Update previous state
    prevIsActiveRef.current = currentIsActive;
  }, [sessionData, role]);

  // METHOD 2: Listen for session:ended socket event - BACKUP METHOD
  // This is a backup in case blockchain state change detection fails
  useEffect(() => {
    if (!socket) return;

    const handleSessionEnded = (data: any) => {
      console.log("📡 Session ended event received (backup method):", data);

      // Prevent multiple redirects
      if (hasRedirectedRef.current) {
        console.log("⚠️ Already redirected, ignoring socket event");
        return;
      }

      // Verify this event is for the current session
      const isForCurrentSession =
        (data.tutorAddress && data.tutorAddress.toLowerCase() === tutorAddress.toLowerCase()) ||
        (data.studentAddress && data.studentAddress.toLowerCase() === studentAddress.toLowerCase()) ||
        (data.tutorAddress && data.tutorAddress.toLowerCase() === localAddress.toLowerCase()) ||
        (data.studentAddress && data.studentAddress.toLowerCase() === localAddress.toLowerCase());

      if (!isForCurrentSession) {
        console.log("⚠️ Ignoring session:ended event - not for current session");
        return;
      }

      hasRedirectedRef.current = true;

      console.log("✅ Session ended event verified, processing redirect (backup method)...");

      // Clean up storage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("pendingSession");
        localStorage.removeItem("activeSessionTutorAddress");
      }

      // Show appropriate toast
      if (role === "tutor") {
        toast.success(`Session ended! You earned $${data.earnings?.toFixed(2) || data.cost?.toFixed(2) || "0.00"}`);
      } else {
        toast.success(`Session ended! Total cost: $${data.cost?.toFixed(2) || "0.00"}`);
      }

      console.log("✅ Redirecting to dashboard via socket event (backup)...");

      // Redirect based on role
      const targetUrl = role === "tutor" ? "/tutor" : "/dashboard";

      setTimeout(() => {
        window.location.href = targetUrl;
      }, 500);
    };

    socket.on("session:ended", handleSessionEnded);

    return () => {
      socket.off("session:ended", handleSessionEnded);
    };
  }, [socket, role, localAddress, tutorAddress, studentAddress]);

  const secondsRemaining =
    role === "student" && balance !== null && ratePerSecond !== null ? Math.floor(balance / ratePerSecond) : 0;
  const minutesRemaining = Math.floor(secondsRemaining / 60);

  const handleTopUp = useCallback((amount: number) => {
    if (amount <= 0) {
      toast("Custom top ups coming soon.");
      return;
    }

    setBalance(prev => {
      if (prev === null) return amount;
      return prev + amount;
    });
    setIsPaused(false);
    setShowCriticalModal(false);
    toast.success(`Added $${amount.toFixed(2)} to your balance`);
  }, []);

  const handleQuickTopUp = useCallback(
    (minutes: number) => {
      if (ratePerSecond === null) return;
      const amount = minutes * 60 * ratePerSecond;
      handleTopUp(amount);
    },
    [handleTopUp, ratePerSecond],
  );

  const handleEndSession = useCallback(async () => {
    // Prevent multiple end session calls
    if (hasRedirectedRef.current) return;

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
      console.error(
        "No tutor address found. URL:",
        tutorAddress,
        "Session:",
        currentSession,
        "SessionData:",
        sessionData,
      );
      // Still redirect even if we can't end on blockchain
      hasRedirectedRef.current = true;
      const targetUrl = role === "tutor" ? "/tutor" : "/dashboard";
      window.location.href = targetUrl;
      return;
    }

    try {
      let transactionHash: string | undefined;

      // End session on blockchain
      if (currentSession) {
        // Use useWebRTCSession's endSession if available (for students)
        // This already notifies backend
        transactionHash = await endSession();
      } else {
        // Direct contract call (for tutors or when currentSession is not available)
        const tx = await writeEndSessionAsync({
          functionName: "endSession",
          args: [targetTutorAddress as `0x${string}`],
        });
        transactionHash = typeof tx === "string" ? tx : (tx as any)?.hash || undefined;

        // Notify backend so both parties get socket event
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/webrtc-session-ended`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sessionId: sessionId,
              userAddress: localAddress,
              transactionHash: transactionHash,
            }),
          });

          if (!response.ok) {
            console.warn("Failed to notify backend of session end, but session was ended on blockchain");
          }
        } catch (notifyError) {
          console.warn("Error notifying backend:", notifyError);
          // Continue anyway - session was ended on blockchain
        }
      }

      // Don't redirect immediately - wait for socket event to ensure both parties are notified
      // The socket event handler will handle the redirect
      // But add a fallback timeout in case socket event doesn't arrive
      console.log("✅ Session ended on blockchain, waiting for socket event to redirect...");

      // Fallback: if socket event doesn't arrive within 5 seconds, redirect anyway
      setTimeout(() => {
        if (!hasRedirectedRef.current) {
          console.warn("⚠️ Socket event didn't arrive, redirecting via fallback...");
          hasRedirectedRef.current = true;

          // Clean up storage
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("pendingSession");
            localStorage.removeItem("activeSessionTutorAddress");
          }

          toast.success("Session ended successfully! Redirecting...");
          const targetUrl = role === "tutor" ? "/tutor" : "/dashboard";
          window.location.href = targetUrl;
        }
      }, 5000);
    } catch (error: any) {
      console.error("Error ending session:", error);

      // Check if user rejected the transaction
      if (error?.message?.includes("user rejected") || error?.code === 4001 || error?.code === "ACTION_REJECTED") {
        toast.error("Transaction rejected. Session not ended.");
        return; // Don't redirect if user rejected
      } else {
        // Even if blockchain call failed, still redirect (session might have ended anyway)
        toast.error("Unable to end the session on blockchain, but redirecting...");
        hasRedirectedRef.current = true;
        const targetUrl = role === "tutor" ? "/tutor" : "/dashboard";
        window.location.href = targetUrl;
      }
    }
  }, [currentSession, endSession, tutorAddress, sessionData, writeEndSessionAsync, role, sessionId, localAddress]);

  const localName = role === "tutor" ? tutorName : studentName;
  const remoteName = role === "tutor" ? studentName : tutorName;

  // Only show balance warnings for students
  const shouldShowToast =
    role === "student" && !isPaused && balance !== null && balance > 0.84 && balance <= 2.1 && minutesRemaining <= 5;
  const shouldShowBanner = role === "student" && !isPaused && balance !== null && balance > 0.21 && balance <= 0.84;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#030617] via-[#05122b] to-[#083745] text-white">
      <div className="fixed inset-x-0 top-0 z-30 border-b border-white/5 bg-slate-900/70 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={() => {
              if (role === "tutor") {
                router.push("/tutor");
              } else {
                router.push("/");
              }
            }}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Exit
          </button>

          <SessionTimer startTime={sessionData?.startTime ? sessionData.startTime * 1000 : undefined} />

          <div className="flex items-center gap-3">
            {role === "student" ? (
              balance !== null && initialBalance !== null && ratePerSecond !== null ? (
                <BalanceMeter current={balance} initial={initialBalance} ratePerSecond={ratePerSecond} mode="balance" />
              ) : null
            ) : balance !== null && ratePerSecond !== null ? (
              <BalanceMeter current={balance} initial={0} ratePerSecond={ratePerSecond} mode="earnings" />
            ) : null}
            <ConnectionStatus isConnected={sessionData?.isActive ?? false} quality={connectionQuality} />
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
              {INFO_CARD_CONFIG.map(card => {
                let value: string;
                if (card.key === "language") {
                  // Use stored language info (persists even after session ends)
                  if (languageInfo) {
                    value = `${languageInfo.flag} ${languageInfo.name}`;
                  } else {
                    // Fallback to URL param or show loading
                    const langFromUrl = searchParams.get("language");
                    if (langFromUrl) {
                      const lang = LANGUAGES.find(l => l.code === langFromUrl);
                      value = lang ? `${lang.flag} ${lang.name}` : langFromUrl;
                    } else {
                      value = "Loading...";
                    }
                  }
                } else {
                  // Level and Focus come from URL params
                  value = searchParams.get(card.key) || "—";
                }
                return (
                  <div key={card.label} className="pop-card">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">{card.label}</p>
                    <p className="mt-2 text-xl font-semibold">{value}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="hidden lg:block">
            <ChatPanel sessionId={sessionId} localAddress={localAddress} remoteAddress={remoteAddress} />
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30">
        <SessionControls
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          isEndingSession={isEndingSession}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onScreenShare={() => toast("Screen share coming soon")}
          onEndSession={handleEndSession}
        />
      </div>

      {shouldShowToast && <BalanceWarningToast minutesRemaining={minutesRemaining} onTopUp={() => handleTopUp(5)} />}

      {shouldShowBanner && role === "student" && ratePerSecond !== null && (
        <BalanceWarningBanner
          minutesRemaining={minutesRemaining}
          ratePerSecond={ratePerSecond}
          onQuickTopUp={handleQuickTopUp}
        />
      )}

      {role === "student" && balance !== null && ratePerSecond !== null && (
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

      {isPaused && role === "student" && ratePerSecond !== null && (
        <SessionPausedOverlay ratePerSecond={ratePerSecond} onTopUp={handleTopUp} />
      )}

      {/* Media Permission Request Overlay - Disabled for now */}
      {false && (isRequestingMedia || mediaError !== null) && (
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
                <p className="mb-6 text-white/70">{mediaError?.message || "Unknown error"}</p>
                {mediaError?.type === "permission-denied" && (
                  <div className="mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-left">
                    <p className="mb-2 text-sm font-semibold text-amber-300">How to enable permissions:</p>
                    <ul className="list-inside list-disc space-y-1 text-xs text-white/80">
                      <li>Click the lock icon in your browser&apos;s address bar</li>
                      <li>Find &quot;Camera&quot; and &quot;Microphone&quot; settings</li>
                      <li>Set them to &quot;Allow&quot;</li>
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
