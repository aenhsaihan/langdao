import { FormEvent, useEffect, useRef, useState } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { useSocket } from "~~/lib/socket/socketContext";

interface Message {
  id: string;
  sender: string;
  senderAddress: string;
  text: string;
  timestamp: Date;
}

interface ChatPanelProps {
  sessionId: string;
  localAddress: string;
  remoteAddress: string;
  initialMessages?: Message[];
}

// Helper to shorten address
const shortenAddress = (address: string): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const ChatPanel = ({ sessionId, localAddress, remoteAddress, initialMessages }: ChatPanelProps) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>(initialMessages ?? []);
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSubmittingRef = useRef(false);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for incoming chat messages via socket
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data: any) => {
      // Only process messages for this session
      if (data.sessionId !== sessionId) return;
      // Don't show our own messages (they're already added locally)
      if (data.senderAddress?.toLowerCase() === localAddress?.toLowerCase()) return;

      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: shortenAddress(data.senderAddress || ""),
          senderAddress: data.senderAddress || "",
          text: data.message || data.text || "",
          timestamp: new Date(data.timestamp || Date.now()),
        },
      ]);
    };

    socket.on("chat:message", handleChatMessage);

    return () => {
      socket.off("chat:message", handleChatMessage);
    };
  }, [socket, sessionId, localAddress]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Prevent double submission
    if (isSubmittingRef.current || !draft.trim() || !socket) return;

    isSubmittingRef.current = true;
    const messageText = draft.trim();
    const newMessage: Message = {
      id: crypto.randomUUID(),
      sender: shortenAddress(localAddress),
      senderAddress: localAddress,
      text: messageText,
      timestamp: new Date(),
    };

    // Add message locally immediately
    setMessages(prev => [...prev, newMessage]);
    setDraft("");

    // Send message via socket
    socket.emit("chat:message", {
      sessionId,
      senderAddress: localAddress,
      targetAddress: remoteAddress,
      message: messageText,
      timestamp: Date.now(),
    });

    // Reset submission flag after a short delay
    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 100);

    // Scroll to bottom after a brief delay to ensure DOM update
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 0);
  };

  const isLocalMessage = (senderAddress: string) => {
    return senderAddress?.toLowerCase() === localAddress?.toLowerCase();
  };

  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 text-white shadow-elegant">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Session Chat</p>
        <p className="text-xs text-white/50">Share notes and resources</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.map(message => {
          const isLocal = isLocalMessage(message.senderAddress);
          return (
            <div key={message.id} className={`flex flex-col ${isLocal ? "items-end" : "items-start"}`}>
              <span className="text-xs text-white/50">{message.sender}</span>
              <div
                className={`mt-1 max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  isLocal ? "bg-cyan-500/80 text-white" : "bg-white/10 text-white"
                }`}
              >
                {message.text}
              </div>
              <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-white/40">
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-3">
          <input
            value={draft}
            onChange={event => setDraft(event.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent py-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
            onKeyDown={e => {
              // Prevent default Enter behavior and submit form
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                const form = e.currentTarget.closest("form");
                if (form && !isSubmittingRef.current) {
                  form.requestSubmit();
                }
              }
            }}
          />
          <button
            type="submit"
            aria-label="Send message"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 text-white transition hover:bg-cyan-400"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
