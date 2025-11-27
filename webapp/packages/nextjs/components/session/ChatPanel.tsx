import { FormEvent, useState } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
}

interface ChatPanelProps {
  initialMessages?: Message[];
}

export const ChatPanel = ({ initialMessages }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>(
    initialMessages ?? [
      {
        id: "1",
        sender: "María González",
        text: "¡Hola! Ready to practice?",
        timestamp: new Date(Date.now() - 120000),
      },
      {
        id: "2",
        sender: "You",
        text: "Yes, let's focus on conversational topics.",
        timestamp: new Date(Date.now() - 60000),
      },
    ],
  );
  const [draft, setDraft] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;

    setMessages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender: "You",
        text: draft.trim(),
        timestamp: new Date(),
      },
    ]);
    setDraft("");
  };

  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 text-white shadow-elegant">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Session Chat</p>
        <p className="text-xs text-white/50">Share notes and resources</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.map(message => (
          <div key={message.id} className={`flex flex-col ${message.sender === "You" ? "items-end" : "items-start"}`}>
            <span className="text-xs text-white/50">{message.sender}</span>
            <div
              className={`mt-1 max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                message.sender === "You" ? "bg-cyan-500/80 text-white" : "bg-white/10 text-white"
              }`}
            >
              {message.text}
            </div>
            <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-white/40">
              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-3">
          <input
            value={draft}
            onChange={event => setDraft(event.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent py-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
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
