"use client";

import { AuthGuard } from "~~/components/auth/AuthGuard";
import { TutorAvailabilityFlow } from "~~/components/tutor/TutorAvailabilityFlow";

export default function TutorPage() {
  return (
    <AuthGuard requireAuth={true}>
      <TutorAvailabilityFlow />
    </AuthGuard>
  );
}
