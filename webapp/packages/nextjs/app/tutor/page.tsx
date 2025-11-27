"use client";

import { useState } from "react";
import { AuthGuard } from "~~/components/auth/AuthGuard";
import { TutorDashboard } from "~~/components/dashboard/TutorDashboard";
import { TutorAvailabilityFlow } from "~~/components/tutor/TutorAvailabilityFlow";

export default function TutorPage() {
  const [showAvailabilityFlow, setShowAvailabilityFlow] = useState(false);

  if (showAvailabilityFlow) {
    return (
      <AuthGuard requireAuth={true}>
        <TutorAvailabilityFlow />
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <TutorDashboard onGoLive={() => setShowAvailabilityFlow(true)} />
    </AuthGuard>
  );
}
