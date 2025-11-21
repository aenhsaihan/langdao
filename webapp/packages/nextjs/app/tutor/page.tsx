"use client";

import { TutorAvailabilityFlow } from "~~/components/tutor/TutorAvailabilityFlow";
import { AuthGuard } from "~~/components/auth/AuthGuard";

export default function TutorPage() {
  return (
    <AuthGuard requireAuth={true}>
      <TutorAvailabilityFlow />
    </AuthGuard>
  );
}