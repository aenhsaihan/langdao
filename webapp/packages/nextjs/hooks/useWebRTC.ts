import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "~~/lib/socket/socketContext";

export interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  connectionStatus: "new" | "connecting" | "connected" | "disconnected" | "failed" | "closed";
  mediaError: {
    type: "permission-denied" | "no-device" | "not-supported" | "unknown" | null;
    message: string;
  } | null;
  isRequestingMedia: boolean;
}

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const useWebRTC = (
  sessionId: string,
  userRole: "tutor" | "student",
  localAddress: string,
  remoteAddress: string,
) => {
  const { socket } = useSocket();
  const [state, setState] = useState<WebRTCState>({
    localStream: null,
    remoteStream: null,
    isAudioEnabled: true,
    isVideoEnabled: true,
    connectionStatus: "new",
    mediaError: null,
    isRequestingMedia: false,
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize Media
  const initializeMedia = useCallback(async () => {
    // Bypass media check - allow session to continue without camera/microphone
    console.log("Media initialization bypassed - continuing without camera/microphone");
    setState(prev => ({
      ...prev,
      localStream: null,
      isRequestingMedia: false,
      mediaError: null,
      isAudioEnabled: false,
      isVideoEnabled: false,
    }));
    return null;

    // Original code commented out for bypass
    /*
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const error = {
        type: "not-supported" as const,
        message: "Your browser does not support camera/microphone access. Please use a modern browser.",
      };
      setState(prev => ({ ...prev, mediaError: error, isRequestingMedia: false }));
      console.error("getUserMedia not supported");
      return null;
    }

    // Check if we're in a secure context (HTTPS or localhost)
    if (!window.isSecureContext && location.protocol !== "https:" && location.hostname !== "localhost") {
      const error = {
        type: "not-supported" as const,
        message: "HTTPS is required for camera/microphone access. Please access this page over HTTPS.",
      };
      setState(prev => ({ ...prev, mediaError: error, isRequestingMedia: false }));
      console.error("Not in secure context");
      return null;
    }

    setState(prev => ({ ...prev, isRequestingMedia: true, mediaError: null }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setState(prev => ({
        ...prev,
        localStream: stream,
        isRequestingMedia: false,
        mediaError: null,
        isAudioEnabled: true,
        isVideoEnabled: true,
      }));
      return stream;
    } catch (error: any) {
      console.error("Error accessing media devices:", error);
      
      let errorType: "permission-denied" | "no-device" | "not-supported" | "unknown" = "unknown";
      let errorMessage = "Failed to access camera/microphone: ";

      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorType = "permission-denied";
        errorMessage = "Permission denied. Please allow camera and microphone access in your browser settings and try again.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorType = "no-device";
        errorMessage = "No camera or microphone found. You can continue without video/audio.";
      } else if (error.name === "NotSupportedError" || error.name === "ConstraintNotSatisfiedError") {
        errorType = "not-supported";
        errorMessage = "Camera/microphone not supported or constraints cannot be satisfied. You can continue without video/audio.";
      } else {
        errorMessage += error.message || "Unknown error occurred.";
      }

      setState(prev => ({
        ...prev,
        mediaError: { type: errorType, message: errorMessage },
        isRequestingMedia: false,
      }));

      return null;
    }
    */
  }, []);

  // Initialize Peer Connection
  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    pc.onicecandidate = event => {
      if (event.candidate && socket) {
        socket.emit("webrtc:ice-candidate", {
          candidate: event.candidate,
          targetAddress: remoteAddress,
          senderAddress: localAddress,
          sessionId,
        });
      }
    };

    pc.ontrack = event => {
      console.log("Received remote track:", event.streams[0]);
      setState(prev => ({ ...prev, remoteStream: event.streams[0] }));
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state changed:", pc.connectionState);
      setState(prev => ({ ...prev, connectionStatus: pc.connectionState }));
    };

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    return pc;
  }, [socket, remoteAddress, localAddress, sessionId]);

  // Handle Offer (Called by Tutor usually, or whoever initiates)
  const createOffer = useCallback(async () => {
    const pc = initializePeerConnection();
    if (!pc) return;

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (socket) {
        console.log("Sending offer to:", remoteAddress);
        socket.emit("webrtc:offer", {
          offer,
          targetAddress: remoteAddress,
          senderAddress: localAddress,
          sessionId,
        });
      }
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  }, [initializePeerConnection, socket, remoteAddress, localAddress, sessionId]);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket) return;

    const handleOffer = async (data: any) => {
      console.log("Received offer from:", data.senderAddress);
      const pc = initializePeerConnection();
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("webrtc:answer", {
          answer,
          targetAddress: data.senderAddress,
          senderAddress: localAddress,
          sessionId,
        });
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    };

    const handleAnswer = async (data: any) => {
      console.log("Received answer from:", data.senderAddress);
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      } catch (error) {
        console.error("Error handling answer:", error);
      }
    };

    const handleIceCandidate = async (data: any) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (error) {
        console.error("Error handling ICE candidate:", error);
      }
    };

    socket.on("webrtc:offer", handleOffer);
    socket.on("webrtc:answer", handleAnswer);
    socket.on("webrtc:ice-candidate", handleIceCandidate);

    return () => {
      socket.off("webrtc:offer", handleOffer);
      socket.off("webrtc:answer", handleAnswer);
      socket.off("webrtc:ice-candidate", handleIceCandidate);
    };
  }, [socket, initializePeerConnection, localAddress, sessionId]);

  // Media Controls
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setState(prev => ({ ...prev, isAudioEnabled: audioTrack.enabled }));
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setState(prev => ({ ...prev, isVideoEnabled: videoTrack.enabled }));
      }
    }
  }, []);

  // Cleanup
  useEffect(() => {
    const localStream = localStreamRef.current;
    const peerConnection = peerConnectionRef.current;

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection) {
        peerConnection.close();
      }
    };
  }, []);

  return {
    ...state,
    initializeMedia,
    createOffer,
    toggleAudio,
    toggleVideo,
  };
};
