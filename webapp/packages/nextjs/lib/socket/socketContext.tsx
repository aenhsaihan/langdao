"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Socket, io } from "socket.io-client";
import { useActiveAccount } from "thirdweb/react";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected" | "error">(
    "disconnected",
  );
  const account = useActiveAccount();
  const isConnectingRef = React.useRef(false);

  // Note: connect function reserved for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _connect = useCallback(() => {
    if (socket?.connected) {
      console.log("Socket already connected, skipping...");
      return;
    }

    console.log("Creating new socket connection...");
    setConnectionStatus("connecting");

    const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000", {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection events
    newSocket.on("connect", () => {
      setIsConnected(true);
      setConnectionStatus("connected");
      console.log("Socket connected:", newSocket.id);
      toast.success("Connected to LangDAO server");

      // Emit user info when connected
      if (account?.address) {
        console.log("Emitting user:connect for address:", account.address);
        newSocket.emit("user:connect", {
          address: account.address,
          timestamp: Date.now(),
        });
      }
    });

    newSocket.on("disconnect", reason => {
      setIsConnected(false);
      setConnectionStatus("disconnected");
      console.log("Socket disconnected:", reason);
      toast.error(`Disconnected from server: ${reason}`);
    });

    newSocket.on("connect_error", error => {
      setConnectionStatus("error");
      console.error("Socket connection error:", error);
      toast.error(`Connection failed: ${error.message}`);
    });

    newSocket.on("reconnect", attemptNumber => {
      toast.success(`Reconnected to server (attempt ${attemptNumber})`);
    });

    newSocket.on("reconnect_error", () => {
      toast.error("Reconnection failed");
    });

    // Note: Removed global debug toasts for tutor availability events
    // These were showing irrelevant "Global Tutor removed" messages to students
    // Individual components (TutorAvailabilityFlow, StudentTutorFinder) handle
    // these events contextually where appropriate
    newSocket.on("tutor:available-updated", data => {
      console.log("🌍 GLOBAL SOCKET RECEIVED tutor:available-updated:", data);
      // Toast removed - components handle this contextually
    });

    newSocket.on("tutor:became-unavailable", data => {
      console.log("🌍 GLOBAL SOCKET RECEIVED tutor:became-unavailable:", data);
      // Toast removed - components handle this contextually
    });

    setSocket(newSocket);
  }, [account?.address]);

  // Note: disconnect function reserved for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _disconnect = useCallback(() => {
    if (socket) {
      console.log("Disconnecting socket...");
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setConnectionStatus("disconnected");
    }
  }, [socket]);

  const emit = useCallback(
    (event: string, data?: any) => {
      if (socket?.connected) {
        socket.emit(event, data);
      } else {
        toast.error("Not connected to server");
      }
    },
    [socket],
  );

  const on = useCallback(
    (event: string, callback: (data: any) => void) => {
      if (socket) {
        socket.on(event, callback);
      }
    },
    [socket],
  );

  const off = useCallback(
    (event: string, callback?: (data: any) => void) => {
      if (socket) {
        if (callback) {
          socket.off(event, callback);
        } else {
          socket.off(event);
        }
      }
    },
    [socket],
  );

  // Connect when wallet connects, disconnect when wallet disconnects
  useEffect(() => {
    console.log(
      "Wallet connection effect triggered. Address:",
      account?.address,
      "Socket exists:",
      !!socket,
      "Is connecting:",
      isConnectingRef.current,
    );

    if (account?.address && !socket && !isConnectingRef.current) {
      console.log("Wallet connected, creating socket...");
      isConnectingRef.current = true;

      const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000", {
        transports: ["websocket", "polling"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Connection events
      newSocket.on("connect", () => {
        setIsConnected(true);
        setConnectionStatus("connected");
        console.log("Socket connected:", newSocket.id);
        toast.success("Connected to LangDAO server");

        // Emit user info when connected
        console.log("Emitting user:connect for address:", account.address);
        newSocket.emit("user:connect", {
          address: account.address,
          timestamp: Date.now(),
        });
      });

      newSocket.on("disconnect", reason => {
        setIsConnected(false);
        setConnectionStatus("disconnected");
        isConnectingRef.current = false;
        console.log("Socket disconnected:", reason);
        toast.error(`Disconnected from server: ${reason}`);
      });

      newSocket.on("connect_error", error => {
        setConnectionStatus("error");
        console.error("Socket connection error:", error);
        toast.error(`Connection failed: ${error.message}`);
      });

      newSocket.on("reconnect", attemptNumber => {
        toast.success(`Reconnected to server (attempt ${attemptNumber})`);
      });

      newSocket.on("reconnect_error", () => {
        toast.error("Reconnection failed");
      });

      // Note: Removed global debug toasts for tutor availability events
      // These were showing irrelevant "Global Tutor removed" messages to students
      // Individual components (TutorAvailabilityFlow, StudentTutorFinder) handle
      // these events contextually where appropriate
      newSocket.on("tutor:available-updated", data => {
        console.log("🌍 GLOBAL SOCKET RECEIVED tutor:available-updated:", data);
        // Toast removed - components handle this contextually
      });

      newSocket.on("tutor:became-unavailable", data => {
        console.log("🌍 GLOBAL SOCKET RECEIVED tutor:became-unavailable:", data);
        // Toast removed - components handle this contextually
      });

      newSocket.on("student:in-room", data => {
        console.log("🌍🌍🌍 GLOBAL SOCKET RECEIVED student:in-room:", data);
      });

      newSocket.on("student:in-room", data => {
        console.log("🌍🌍🌍 GLOBAL SOCKET RECEIVED student:in-room:", data);
      });

      setSocket(newSocket);
    } else if (!account?.address && socket) {
      console.log("Wallet disconnected, closing socket...");
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setConnectionStatus("disconnected");
      isConnectingRef.current = false;
    } else if (account?.address && socket) {
      console.log("Socket already exists and wallet is connected, doing nothing");
    }
  }, [account?.address]); // Only depend on account address

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      console.log("SocketProvider unmounting, cleaning up...");
      if (socket) {
        socket.disconnect();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value: SocketContextType = {
    socket,
    isConnected,
    connectionStatus,
    emit,
    on,
    off,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
