"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useActiveAccount } from "thirdweb/react";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const ActiveSessionPrompt = () => {
  const account = useActiveAccount();
  const pathname = usePathname();
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  
  // Read sessionStorage synchronously on component initialization (not in useEffect)
  // This ensures it's available immediately for the query, not after a render cycle
  let tutorAddressFromStorage: string | null = null;
  let sessionFromStorage: any = null;
  
  if (typeof window !== 'undefined') {
    try {
      const pendingSessionStr = sessionStorage.getItem('pendingSession');
      if (pendingSessionStr) {
        sessionFromStorage = JSON.parse(pendingSessionStr);
        tutorAddressFromStorage = sessionFromStorage.tutorAddress || null;
      }
    } catch (error) {
      console.error('Failed to parse pending session:', error);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pendingSession');
      }
    }
  }

  // Query 1: For tutors - query immediately with account address (tutor is the key)
  const { data: tutorSessionData, refetch: refetchTutor } = useScaffoldReadContract({
    contractName: "LangDAO",
    functionName: "activeSessions",
    args: [account?.address as `0x${string}`],
  });

  // Query 2: For students - query with tutorAddress from sessionStorage (if available)
  // Only query if we have tutorAddressFromStorage (undefined args will prevent query)
  const { data: studentSessionData, refetch: refetchStudent } = useScaffoldReadContract({
    contractName: "LangDAO",
    functionName: "activeSessions",
    args: tutorAddressFromStorage ? [tutorAddressFromStorage as `0x${string}`] : undefined,
  });

  // Use tutor session data if available (tutor), otherwise use student session data (student)
  const activeSessionData = tutorSessionData || studentSessionData;
  
  // Refetch function that refetches both
  const refetch = () => {
    refetchTutor();
    if (tutorAddressFromStorage) {
      refetchStudent();
    }
  };

  const { writeContractAsync, isMining } = useScaffoldWriteContract({
    contractName: "LangDAO",
  });

  // Update current time every second for live duration display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Poll for active session every 5 seconds
  useEffect(() => {
    if (!account?.address && !tutorAddressFromStorage) return;

    const interval = setInterval(() => {
      refetchTutor();
      if (tutorAddressFromStorage) {
        refetchStudent();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [account?.address, tutorAddressFromStorage, refetchTutor, refetchStudent]);

  // Check if session is active
  useEffect(() => {
    // Don't show prompt on tutor or find-tutor pages (they're in the session flow)
    // Also check for exact matches and pathname starts with
    const isInSessionFlow = 
      pathname === "/tutor" || 
      pathname === "/find-tutor" || 
      pathname?.startsWith("/tutor/") || 
      pathname?.startsWith("/find-tutor/") ||
      pathname?.includes("/tutor") ||
      pathname?.includes("/find-tutor");
    
    console.log("ActiveSessionPrompt check:", { 
      pathname, 
      isInSessionFlow, 
      hasActiveSession: !!activeSessionData,
      hasSessionStorage: !!sessionFromStorage,
      tutorAddressToCheck 
    });
    
    // Always hide if in session flow
    if (isInSessionFlow) {
      console.log("ActiveSessionPrompt: Hiding (in session flow)");
      setShowPrompt(false);
      return;
    }
    
    if (activeSessionData) {
      const [student, tutor, token, startTime, endTime, ratePerSecond, totalPaid, languageId, sessionId, isActive] =
        activeSessionData;

      // For students: verify the session belongs to them
      // For tutors: they're the key, so it's always their session
      const isStudent = sessionFromStorage && account?.address?.toLowerCase() !== tutor?.toLowerCase();
      const studentAddressMatches = !isStudent || (student?.toLowerCase() === account?.address?.toLowerCase());
      
      console.log("ActiveSessionPrompt session check:", {
        isStudent,
        studentAddress: student,
        currentAddress: account?.address,
        studentAddressMatches,
        isActive,
        hasStartTime: !!startTime
      });

      // Show prompt if session is active, has started, and belongs to current user
      if (isActive && startTime && startTime > 0n && studentAddressMatches) {
        // Don't show prompt if session just started (within last 60 seconds)
        // This prevents showing it during the session-starting flow
        // Increased from 30 to 60 seconds to give more time for the flow to complete
        const sessionStartTime = Number(startTime);
        const sessionAge = currentTime - sessionStartTime;
        const isNewSession = sessionAge < 60; // 60 seconds grace period
        
        if (isNewSession) {
          console.log("ActiveSessionPrompt: Hiding (session just started, in session-starting flow, age:", sessionAge, "s)");
          setShowPrompt(false);
        } else {
          // Also hide if we're on the home page (/) and session is very new
          // This handles the case where tutor is on root path during session-starting
          if (pathname === "/" && sessionAge < 120) {
            console.log("ActiveSessionPrompt: Hiding (on home page with new session, age:", sessionAge, "s)");
            setShowPrompt(false);
          } else {
            console.log("ActiveSessionPrompt: Showing modal");
            setShowPrompt(true);
          }
        }
      } else {
        if (!studentAddressMatches) {
          console.log("ActiveSessionPrompt: Hiding (session doesn't belong to current user)");
        } else {
          console.log("ActiveSessionPrompt: Session not active or not started");
        }
        setShowPrompt(false);
      }
    } else {
      console.log("ActiveSessionPrompt: Hiding (no active session)");
      setShowPrompt(false);
    }
  }, [activeSessionData, pathname, currentTime, sessionFromStorage, account?.address]);

  const handleEndSession = async () => {
    if (!activeSessionData) return;

    const [student, tutor, token, startTime, endTime, ratePerSecond, totalPaid, languageId, sessionId, isActive] =
      activeSessionData;

    try {
      toast.loading("Ending session...");

      await writeContractAsync({
        functionName: "endSession",
        args: [tutor],
      });

      toast.dismiss();
      toast.success("Session ended successfully!");
      setShowPrompt(false);
      refetch();
    } catch (error) {
      console.error("Error ending session:", error);
      toast.dismiss();
      toast.error("Failed to end session. Please try again.");
    }
  };

  if (!showPrompt || !activeSessionData) return null;

  const [student, tutor, token, startTime, endTime, ratePerSecond, totalPaid, languageId, sessionId, isActive] =
    activeSessionData;

  // Calculate session duration using current time state for live updates
  const duration = startTime ? currentTime - Number(startTime) : 0;
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"
      >
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl p-6 shadow-2xl border-2 border-white">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
              >
                <span className="text-2xl">⚠️</span>
              </motion.div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">Active Session Detected!</h3>
              <p className="text-sm text-white/90 mb-3">
                You have an ongoing tutoring session. Please end it to avoid unnecessary charges.
              </p>
              <div className="bg-white/20 rounded-lg p-3 mb-4">
                <div className="text-xs text-white/80 mb-1">Session Duration</div>
                <div className="text-2xl font-bold font-mono">
                  {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
                  {String(seconds).padStart(2, "0")}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleEndSession}
                  disabled={isMining}
                  className="flex-1 px-4 py-2 bg-white text-red-600 rounded-lg font-medium hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMining ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Ending...
                    </div>
                  ) : (
                    <>
                      <span className="mr-1">🛑</span>
                      End Session Now
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowPrompt(false)}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-all duration-200"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
