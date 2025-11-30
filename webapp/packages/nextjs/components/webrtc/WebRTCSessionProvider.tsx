"use client";

import React from "react";
import { WebRTCSessionEndPrompt } from "./WebRTCSessionEndPrompt";
import { WebRTCSessionStatus } from "./WebRTCSessionStatus";
import { useWebRTCSession } from "~~/hooks/useWebRTCSession";

interface WebRTCSessionProviderProps {
  children: React.ReactNode;
}

export const WebRTCSessionProvider: React.FC<WebRTCSessionProviderProps> = ({ children }) => {
  const { showEndSessionPrompt, dismissPrompt } = useWebRTCSession();

  return (
    <>
      {children}
      <WebRTCSessionStatus />
      <WebRTCSessionEndPrompt isOpen={showEndSessionPrompt} onClose={dismissPrompt} />
    </>
  );
};
