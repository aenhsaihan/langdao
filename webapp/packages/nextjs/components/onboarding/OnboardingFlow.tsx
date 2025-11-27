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
import { getContract } from "thirdweb";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import deployedContracts from "~~/contracts/deployedContracts";

type OnboardingStep = "role" | "registration" | "deposit" | "dashboard" | "tutor-availability" | "complete";
type UserRole = "student" | "tutor" | null;

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("role");
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  const router = useRouter();

  const account = useActiveAccount();

  // Create contract instance using deployed contract ABI
  const contract = getContract({
    client,
    chain: activeChain,
    address: CONTRACTS.LANGDAO,
    abi:
      deployedContracts[activeChain.id as keyof typeof deployedContracts]?.LangDAO?.abi ||
      deployedContracts[31337].LangDAO.abi,
  });

  // Check if user is already registered as student
  const {
    data: studentInfo,
    isLoading: isLoadingStudent,
    error: studentError,
  } = useReadContract({
    contract,
    method: "getStudentInfo",
    params: [account?.address || "0x0000000000000000000000000000000000000000"],
  });

  // Check if user is already registered as tutor
  const {
    data: tutorInfo,
    isLoading: isLoadingTutor,
    error: tutorError,
  } = useReadContract({
    contract,
    method: "getTutorInfo",
    params: [account?.address || "0x0000000000000000000000000000000000000000"],
  });

  // Check registration status when account or contract data changes
  useEffect(() => {
    if (!account?.address) {
      setIsCheckingRegistration(false);
      return;
    }

    // Wait for both queries to finish loading
    if (isLoadingStudent || isLoadingTutor) {
      return;
    }

    // Debug logging
    console.log("🔍 Checking registration for address:", account.address);
    console.log("📚 Student Info:", studentInfo);
    console.log("📚 Student Error:", studentError);
    console.log("📚 Student Loading:", isLoadingStudent);
    console.log("👨‍🏫 Tutor Info:", tutorInfo);
    console.log("👨‍🏫 Tutor Error:", tutorError);
    console.log("👨‍🏫 Tutor Loading:", isLoadingTutor);

    // Check if user is already registered
    const isStudentRegistered = studentInfo && studentInfo[2]; // isRegistered is the 3rd element
    const isTutorRegistered = tutorInfo && tutorInfo[2]; // isRegistered is the 3rd element

    console.log("✅ Is Student Registered:", isStudentRegistered);
    console.log("✅ Is Tutor Registered:", isTutorRegistered);

    if (isStudentRegistered) {
      console.log("✨ User is registered as STUDENT, going to dashboard");
      setSelectedRole("student");
      setCurrentStep("dashboard"); // Go directly to dashboard to show balance
      setIsCheckingRegistration(false);
    } else if (isTutorRegistered) {
      console.log("✨ User is registered as TUTOR, going to availability flow");
      setSelectedRole("tutor");
      setCurrentStep("tutor-availability"); // Go to tutor availability flow
      setIsCheckingRegistration(false);
    } else {
      console.log("❌ User is NOT registered, showing role selection");
      // Not registered, start with role selection
      setCurrentStep("role");
      setIsCheckingRegistration(false);
    }
  }, [account?.address, studentInfo, tutorInfo, isLoadingStudent, isLoadingTutor, studentError, tutorError]);

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
        if (selectedRole === "student" && studentInfo && studentInfo[2]) {
          setCurrentStep("dashboard");
        } else {
          setCurrentStep("registration");
        }
        break;
      case "tutor-availability":
        // If tutor is already registered, they can go back to complete
        // Otherwise go back to registration
        if (selectedRole === "tutor" && tutorInfo && tutorInfo[2]) {
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
                const isStudentRegistered = studentInfo && studentInfo[2];
                const isTutorRegistered = tutorInfo && tutorInfo[2];
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
          <StudentRegistration onComplete={handleRegistrationComplete} onBack={handleBack} />
        )}

        {currentStep === "registration" && selectedRole === "tutor" && (
          <TutorRegistration onComplete={handleRegistrationComplete} onBack={handleBack} />
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
