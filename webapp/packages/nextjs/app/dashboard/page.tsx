"use client";

import { redirect } from "next/navigation";

// Dashboard route - redirects to home page which shows the onboarding flow
export default function DashboardPage() {
  redirect("/");
}
