"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { client } from "../../client";
import { activeChain } from "../../lib/chains";
import { CONTRACTS } from "../../lib/constants/contracts";
import { StudentDashboard } from "../dashboard/StudentDashboard";
import { DepositFlow } from "../deposit/DepositFlow";
import { TutorAvailabilityFlow } from "../tutor/TutorAvailabilityFlow";
import { RoleSelection } from "./RoleSelection";
import { StudentRegistration } from "./StudentRegistration";
import { TutorRegistration } from "./TutorRegistration";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import deployedContracts from "~~/contracts/deployedContracts";

type OnboardingStep = "role" | "registration" | "deposit" | "dashboard" | "tutor-availability" | "complete";
type UserRole = "student" | "tutor" | null;

interface OnboardingFlowProps {
  onComplete: () => void;
}

interface StudentInfo {
  address: string;
  name: string;
  totalSessions: number;
  averageRating: number;
  isRegistered: boolean;
}

interface TutorInfo {
  address: string;
  name: string;
  languages: string[];
  ratePerSecond: string;
  totalSessions: number;
  rating: number;
  isRegistered: boolean;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("role");
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [tutorInfo, setTutorInfo] = useState<TutorInfo | null>(null);
  const router = useRouter();

  const account = useActiveAccount();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  // Create contract instance for fallback (direct on-chain query)
  const contract = getContract({
    client,
    chain: activeChain,
    address: CONTRACTS.LANGDAO,
    abi:
      deployedContracts[activeChain.id as keyof typeof deployedContracts]?.LangDAO?.abi ||
      deployedContracts[31337].LangDAO.abi,
  });

  // Fallback: Direct on-chain queries (used when backend is unavailable)
  const {
    data: studentInfoOnChain,
    isLoading: isLoadingStudentOnChain,
    error: studentErrorOnChain,
  } = useReadContract({
    contract,
    method: "getStudentInfo",
    params: [account?.address || "0x0000000000000000000000000000000000000000"],
  });

  const {
    data: tutorInfoOnChain,
    isLoading: isLoadingTutorOnChain,
    error: tutorErrorOnChain,
  } = useReadContract({
    contract,
    method: "getTutorInfo",
    params: [account?.address || "0x0000000000000000000000000000000000000000"],
  });

  // Check registration status using backend API (with Redis cache) with fallback to on-chain
  useEffect(() => {
    const checkRegistration = async () => {
      if (!account?.address) {
        setIsCheckingRegistration(false);
        return;
      }

      let studentData: StudentInfo | null = null;
      let tutorData: TutorInfo | null = null;
      let useFallback = false;

      // Try backend API first
      try {
        console.log("🔍 Checking registration via backend API for address:", account.address);
        console.log("🌐 Backend URL:", backendUrl);

        // Fetch both student and tutor info in parallel with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        try {
          const [studentResponse, tutorResponse] = await Promise.all([
            fetch(`${backendUrl}/api/students/${account.address}`, {
              signal: controller.signal,
            }).catch(err => {
              console.warn("⚠️ Student API fetch failed:", err);
              return null;
            }),
            fetch(`${backendUrl}/api/tutors/${account.address}`, {
              signal: controller.signal,
            }).catch(err => {
              console.warn("⚠️ Tutor API fetch failed:", err);
              return null;
            }),
          ]);

          clearTimeout(timeoutId);

          if (studentResponse && studentResponse.ok) {
            const studentResult = await studentResponse.json();
            if (studentResult.success && studentResult.student) {
              studentData = studentResult.student;
              setStudentInfo(studentData);
            }
          }

          if (tutorResponse && tutorResponse.ok) {
            const tutorResult = await tutorResponse.json();
            if (tutorResult.success && tutorResult.tutor) {
              tutorData = tutorResult.tutor;
              setTutorInfo(tutorData);
            }
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            console.warn("⏱️ Backend API request timed out, falling back to on-chain query");
          } else {
            console.warn("⚠️ Backend API request failed, falling back to on-chain query:", fetchError.message);
          }
          useFallback = true;
        }
      } catch (error: any) {
        console.warn("⚠️ Backend API unavailable, falling back to on-chain query:", error.message);
        useFallback = true;
      }

      // Fallback to on-chain query if backend is unavailable
      if (useFallback || (!studentData && !tutorData)) {
        console.log("⛓️ Using on-chain fallback for registration check");
        
        // Wait for on-chain queries to complete
        if (isLoadingStudentOnChain || isLoadingTutorOnChain) {
          return; // Will re-run when loading completes
        }

        if (studentInfoOnChain) {
          // getStudentInfo returns: (uint8 targetLanguage, uint256 budgetPerSec, bool isRegistered)
          studentData = {
            address: account.address,
            name: `Student_${account.address.slice(-4)}`,
            totalSessions: 0, // Not available from getStudentInfo
            averageRating: 0, // Not available from getStudentInfo
            isRegistered: Boolean(studentInfoOnChain[2]), // isRegistered is the 3rd element (index 2)
          };
          setStudentInfo(studentData);
        }

        if (tutorInfoOnChain) {
          // getTutorInfo returns: (uint256 totalEarnings, uint256 sessionCount, bool isRegistered)
          tutorData = {
            address: account.address,
            name: `Tutor_${account.address.slice(-4)}`,
            languages: [], // Not available from getTutorInfo
            ratePerSecond: '0', // Not available from getTutorInfo
            totalSessions: Number(tutorInfoOnChain[1] || 0), // sessionCount is the 2nd element (index 1)
            rating: 0, // Not available from getTutorInfo
            isRegistered: Boolean(tutorInfoOnChain[2]), // isRegistered is the 3rd element (index 2)
          };
          setTutorInfo(tutorData);
        }
      }

      // Debug logging
      console.log("📚 Student Info:", studentData);
      console.log("👨‍🏫 Tutor Info:", tutorData);

      const isStudentRegistered = studentData?.isRegistered || false;
      const isTutorRegistered = tutorData?.isRegistered || false;

      console.log("✅ Is Student Registered:", isStudentRegistered);
      console.log("✅ Is Tutor Registered:", isTutorRegistered);

      if (isStudentRegistered) {
        console.log("✨ User is registered as STUDENT, going to dashboard");
        setSelectedRole("student");
        setCurrentStep("dashboard");
      } else if (isTutorRegistered) {
        console.log("✨ User is registered as TUTOR, going to availability flow");
        setSelectedRole("tutor");
        setCurrentStep("tutor-availability");
      } else {
        console.log("❌ User is NOT registered, showing role selection");
        setCurrentStep("role");
      }

      setIsCheckingRegistration(false);
    };

    checkRegistration();
  }, [
    account?.address,
    backendUrl,
    studentInfoOnChain,
    tutorInfoOnChain,
    isLoadingStudentOnChain,
    isLoadingTutorOnChain,
  ]);

  const handleRoleSelect = (role: "student" | "tutor") => {
    setSelectedRole(role);
    setCurrentStep("registration");
  };

  const handleRegistrationComplete = () => {
    // For students, go to deposit flow
    // For tutors, go to availability flow
    if (selectedRole === "student") {
      setCurrentStep("deposit");
    } else {
      setCurrentStep("tutor-availability");
    }
  };

  const handleDepositComplete = () => {
    setCurrentStep("dashboard"); // Show dashboard after deposit
  };

  const handleStartLearning = () => {
    onComplete(); // This will take them to the main app
  };

  const handleAddFunds = () => {
    setCurrentStep("deposit"); // Go back to deposit flow
  };

  const handleBack = () => {
    switch (currentStep) {
      case "registration":
        setCurrentStep("role");
        setSelectedRole(null);
        break;
      case "deposit":
        // If user is already registered, go back to dashboard
        // Otherwise go back to registration
        if (selectedRole === "student" && studentInfo?.isRegistered) {
          setCurrentStep("dashboard");
        } else {
          setCurrentStep("registration");
        }
        break;
      case "tutor-availability":
        // If tutor is already registered, they can go back to complete
        // Otherwise go back to registration
        if (selectedRole === "tutor" && tutorInfo?.isRegistered) {
          setCurrentStep("complete");
        } else {
          setCurrentStep("registration");
        }
        break;
      default:
        break;
    }
  };

  // Show loading while checking registration status
  if (isCheckingRegistration) {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border-2 border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <span className="text-2xl">🔍</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Checking Registration Status</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Please wait while we check if you're already registered...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === "complete") {
    return (
      <div className="min-h-[calc(100vh-8rem)] bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border-2 border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl">🎉</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Welcome to LangDAO!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Your account is set up and ready to go.
              {selectedRole === "student"
                ? " Start finding tutors and begin your language learning journey!"
                : " Students can now find and book sessions with you!"}
            </p>
            <button
              onClick={() => {
                // Determine role from registration status if selectedRole is not set
                const isStudentRegistered = studentInfo?.isRegistered || false;
                const isTutorRegistered = tutorInfo?.isRegistered || false;
                const role = selectedRole || (isTutorRegistered ? "tutor" : isStudentRegistered ? "student" : null);

                // Navigate based on role
                if (role === "tutor") {
                  router.push("/tutor");
                } else if (role === "student") {
                  router.push("/find-tutor");
                } else {
                  // Fallback: call onComplete and navigate to home
                  onComplete();
                  router.push("/");
                }
              }}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Content */}
      <div>
        {currentStep === "role" && <RoleSelection onRoleSelect={handleRoleSelect} />}

        {currentStep === "registration" && selectedRole === "student" && (
          <StudentRegistration 
            onComplete={handleRegistrationComplete} 
            onBack={handleBack}
            onRegistrationSuccess={() => {
              // Invalidate cache and refresh registration status
              if (account?.address) {
                fetch(`${backendUrl}/api/students/${account.address}/invalidate-cache`, { method: "POST" })
                  .then(() => {
                    // Re-check registration status
                    const checkAgain = async () => {
                      try {
                        const response = await fetch(`${backendUrl}/api/students/${account.address}`);
                        if (response.ok) {
                          const result = await response.json();
                          if (result.success && result.student) {
                            setStudentInfo(result.student);
                          }
                        }
                      } catch (error) {
                        console.error("Error refreshing student info:", error);
                      }
                    };
                    checkAgain();
                  })
                  .catch(err => console.error("Error invalidating cache:", err));
              }
            }}
          />
        )}

        {currentStep === "registration" && selectedRole === "tutor" && (
          <TutorRegistration 
            onComplete={handleRegistrationComplete} 
            onBack={handleBack}
            onRegistrationSuccess={() => {
              // Invalidate cache and refresh registration status
              if (account?.address) {
                fetch(`${backendUrl}/api/tutors/${account.address}/invalidate-cache`, { method: "POST" })
                  .then(() => {
                    // Re-check registration status
                    const checkAgain = async () => {
                      try {
                        const response = await fetch(`${backendUrl}/api/tutors/${account.address}`);
                        if (response.ok) {
                          const result = await response.json();
                          if (result.success && result.tutor) {
                            setTutorInfo(result.tutor);
                          }
                        }
                      } catch (error) {
                        console.error("Error refreshing tutor info:", error);
                      }
                    };
                    checkAgain();
                  })
                  .catch(err => console.error("Error invalidating cache:", err));
              }
            }}
          />
        )}

        {currentStep === "deposit" && <DepositFlow onComplete={handleDepositComplete} onBack={handleBack} />}

        {currentStep === "dashboard" && (
          <StudentDashboard onStartLearning={handleStartLearning} onAddFunds={handleAddFunds} />
        )}

        {currentStep === "tutor-availability" && <TutorAvailabilityFlow onBack={handleBack} />}
      </div>
    </div>
  );
};
