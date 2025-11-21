"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useActiveAccount } from "thirdweb/react";
import { useScaffoldReadContract, useScaffoldWriteContract, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { useBlockNumber } from "wagmi";

export const ActiveSessionPrompt = () => {
  const account = useActiveAccount();
  const pathname = usePathname();
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const [tutorAddressFromStorage, setTutorAddressFromStorage] = useState<string | null>(null);
  const [sessionFromStorage, setSessionFromStorage] = useState<any>(null);
  
  // Read sessionStorage and localStorage reactively
  // This ensures we can detect when storage changes and update queries accordingly
  useEffect(() => {
    const readStorage = () => {
      if (typeof window === 'undefined') return;
      
      try {
        let tutorAddress: string | null = null;
        let session: any = null;
        
        // First try sessionStorage (for current session)
        const pendingSessionStr = sessionStorage.getItem('pendingSession');
        if (pendingSessionStr) {
          session = JSON.parse(pendingSessionStr);
          tutorAddress = session.tutorAddress || null;
        }
        
        // Fallback to localStorage (more persistent, survives tab closes)
        if (!tutorAddress) {
          const storedTutorAddress = localStorage.getItem('activeSessionTutorAddress');
          if (storedTutorAddress) {
            tutorAddress = storedTutorAddress;
          }
        }
        
        setTutorAddressFromStorage(tutorAddress);
        setSessionFromStorage(session);
        
        console.log("ActiveSessionPrompt: Read storage", { tutorAddress, hasSession: !!session });
      } catch (error) {
        console.error('Failed to parse pending session:', error);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pendingSession');
          localStorage.removeItem('activeSessionTutorAddress');
        }
        setTutorAddressFromStorage(null);
        setSessionFromStorage(null);
      }
    };
    
    // Read immediately
    readStorage();
    
    // Also listen for storage events (in case storage changes in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pendingSession' || e.key === 'activeSessionTutorAddress') {
        readStorage();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Poll storage every 2 seconds to catch changes (in case storage events don't fire)
    const interval = setInterval(readStorage, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Query 1: For tutors - query immediately with account address (tutor is the key)
  const { data: tutorSessionData, refetch: refetchTutor } = useScaffoldReadContract({
    contractName: "LangDAO",
    functionName: "activeSessions",
    args: [account?.address as `0x${string}`],
  });

  // Query 2: For students - query with tutorAddress from storage (if available)
  // This query will automatically update when tutorAddressFromStorage changes
  const { data: studentSessionData, refetch: refetchStudent } = useScaffoldReadContract({
    contractName: "LangDAO",
    functionName: "activeSessions",
    args: tutorAddressFromStorage ? [tutorAddressFromStorage as `0x${string}`] : undefined,
  });

  // Query 3: Check if student is studying (fallback to detect active student sessions)
  const { data: isStudying, refetch: refetchIsStudying } = useScaffoldReadContract({
    contractName: "LangDAO",
    functionName: "isStudying",
    args: [account?.address as `0x${string}`],
  });

  // Query 4: If student is studying but we don't have tutor address, query recent SessionStarted events
  // to find the tutor address
  const { data: blockNumber } = useBlockNumber();
  const shouldQueryEvents = isStudying && !tutorAddressFromStorage && account?.address;
  const { data: sessionStartedEvents } = useScaffoldEventHistory({
    contractName: "LangDAO",
    eventName: "SessionStarted",
    filters: { student: account?.address as `0x${string}` },
    fromBlock: blockNumber ? blockNumber - BigInt(10000) : undefined, // Last ~10000 blocks (roughly last hour on most chains)
    enabled: !!shouldQueryEvents,
    blocksBatchSize: 1000,
  });

  // Extract tutor address from most recent SessionStarted event
  useEffect(() => {
    if (sessionStartedEvents && sessionStartedEvents.length > 0 && !tutorAddressFromStorage && account?.address) {
      // Get the most recent event (events are typically in chronological order)
      const mostRecentEvent = sessionStartedEvents[sessionStartedEvents.length - 1];
      if (mostRecentEvent?.args?.tutor) {
        const tutorAddress = mostRecentEvent.args.tutor as string;
        console.log("ActiveSessionPrompt: Found tutor address from SessionStarted event:", tutorAddress);
        setTutorAddressFromStorage(tutorAddress);
        // Also store it in localStorage for future use
        if (typeof window !== 'undefined') {
          localStorage.setItem('activeSessionTutorAddress', tutorAddress);
        }
      }
    }
  }, [sessionStartedEvents, tutorAddressFromStorage, account?.address]);

  // Determine which session data to use
  // Filter out invalid/zero session data first, then prioritize student sessions
  // Note: We do basic validation here (non-zero addresses), but ownership validation happens in useEffect
  const isValidTutorSessionBasic = tutorSessionData && tutorSessionData[0] && tutorSessionData[1] &&
    tutorSessionData[0] !== '0x0000000000000000000000000000000000000000' &&
    tutorSessionData[1] !== '0x0000000000000000000000000000000000000000';
  
  const isValidStudentSessionBasic = studentSessionData && studentSessionData[0] && studentSessionData[1] &&
    studentSessionData[0] !== '0x0000000000000000000000000000000000000000' &&
    studentSessionData[1] !== '0x0000000000000000000000000000000000000000';
  
  // Priority: student session > tutor session (basic validation only - ownership check in useEffect)
  const activeSessionData = isValidStudentSessionBasic ? studentSessionData : (isValidTutorSessionBasic ? tutorSessionData : null);
  
  // Refetch function that refetches all queries
  const refetch = () => {
    refetchTutor();
    if (tutorAddressFromStorage) {
      refetchStudent();
    }
    refetchIsStudying();
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

  // Refetch student session immediately when tutor address becomes available
  useEffect(() => {
    if (tutorAddressFromStorage && account?.address) {
      console.log("ActiveSessionPrompt: Tutor address available, refetching student session", tutorAddressFromStorage);
      refetchStudent();
    }
  }, [tutorAddressFromStorage, account?.address, refetchStudent]);

  // Poll for active session every 5 seconds
  useEffect(() => {
    if (!account?.address && !tutorAddressFromStorage) return;

    const interval = setInterval(() => {
      refetchTutor();
      if (tutorAddressFromStorage) {
        refetchStudent();
      }
      refetchIsStudying();
    }, 5000);

    return () => clearInterval(interval);
  }, [account?.address, tutorAddressFromStorage, refetchTutor, refetchStudent, refetchIsStudying]);

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
      tutorAddressFromStorage,
      accountAddress: account?.address,
      isStudying,
      tutorSessionData: tutorSessionData ? 'has data' : 'no data',
      studentSessionData: studentSessionData ? 'has data' : 'no data',
    });
    
    // Always hide if in session flow
    if (isInSessionFlow) {
      console.log("ActiveSessionPrompt: Hiding (in session flow)");
      setShowPrompt(false);
      return;
    }
    
    // Check if student is studying but we don't have session data (tutor address missing from storage)
    // This handles the case where a student has an active session but the tutor address isn't stored
    if (!activeSessionData && isStudying && account?.address && !tutorSessionData) {
      console.log("ActiveSessionPrompt: Student is studying but tutor address not in storage - cannot show prompt without tutor address");
      // Note: We can't show the prompt without the tutor address because we need it to end the session
      // This is a limitation of the contract design (activeSessions is keyed by tutor address)
      // The best we can do is log this case - the student would need to navigate to find-tutor page
      // or the tutor address needs to be stored more persistently
      setShowPrompt(false);
      return;
    }
    
    if (activeSessionData) {
      const [student, tutor, token, startTime, endTime, ratePerSecond, totalPaid, languageId, sessionId, isActive] =
        activeSessionData;

      // Validate session data - check if it's a real session (not a zero struct)
      // Zero structs have zero addresses, so we check if student and tutor are non-zero
      const isValidSession = student && tutor && 
        student !== '0x0000000000000000000000000000000000000000' && 
        tutor !== '0x0000000000000000000000000000000000000000';
      
      if (!isValidSession) {
        console.log("ActiveSessionPrompt: Hiding (invalid/zero session data)");
        setShowPrompt(false);
        return;
      }

      // Determine if current user is a student or tutor
      // If account address matches tutor, user is tutor; otherwise, check if it matches student
      const isTutor = account?.address?.toLowerCase() === tutor?.toLowerCase();
      const isStudent = !isTutor && account?.address?.toLowerCase() === student?.toLowerCase();
      
      // For students: verify the session belongs to them
      // For tutors: they're the key, so it's always their session
      const sessionBelongsToUser = isTutor || (isStudent && student?.toLowerCase() === account?.address?.toLowerCase());
      
      console.log("ActiveSessionPrompt session check:", {
        isTutor,
        isStudent,
        studentAddress: student,
        tutorAddress: tutor,
        currentAddress: account?.address,
        sessionBelongsToUser,
        isActive,
        hasStartTime: !!startTime,
        isValidSession
      });

      // Show prompt if session is active, has started, and belongs to current user
      if (isActive && startTime && startTime > 0n && sessionBelongsToUser) {
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
        if (!sessionBelongsToUser) {
          console.log("ActiveSessionPrompt: Hiding (session doesn't belong to current user)");
        } else {
          console.log("ActiveSessionPrompt: Session not active or not started");
        }
        setShowPrompt(false);
      }
    } else {
      // No active session data found
      // If isStudying is true but we don't have session data, it means tutor address is missing
      // This is logged above, but we still hide the prompt since we can't end the session without tutor address
      console.log("ActiveSessionPrompt: Hiding (no active session data)", {
        isStudying,
        hasTutorAddress: !!tutorAddressFromStorage
      });
      setShowPrompt(false);
    }
  }, [activeSessionData, pathname, currentTime, sessionFromStorage, account?.address, isStudying, tutorSessionData]);

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
      // Clean up storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pendingSession');
        localStorage.removeItem('activeSessionTutorAddress');
      }
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
