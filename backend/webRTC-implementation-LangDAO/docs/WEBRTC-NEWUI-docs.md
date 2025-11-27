# Session UI — Design + Developer Handoff

## Goals
- Provide an image-generation prompt to recreate the UI mockup.
- Provide a developer-spec prompt for reimplementation in React + TypeScript + Tailwind.
- Include full source code for the Session route and all session components for handoff.

---

## 1) Image Generation Prompt (paste into Midjourney / SDXL / DALL·E)

High-fidelity UI mockup of a modern web video tutoring session dashboard, 1920x1080, widescreen, realistic app interface, glassmorphism. Top fixed semi-transparent frosted bar with a left 'Exit' ghost button including a small left arrow icon, centered session timer, and on the right a compact translucent balance meter and connection status chip labeled 'excellent'. Main area: two side‑by‑side video tiles (left: tutor 'María González' — warm Hispanic female, natural smile; right: student labeled 'You'), both tiles with rounded 12px corners, subtle inner shadow, webcam-style frames and small speaker glow when speaking. Under videos: three small pop-cards in a single row showing 'Language: Spanish', 'Level: Intermediate', 'Focus: Conversation' with subtle icons. Right column: a 320px wide chat panel with messages and input field, floating slightly elevated with soft shadow. Bottom fixed control bar spanning width with centered circular controls: microphone (toggle), camera (toggle), screen-share, large red 'End Session' button, and a small battery-like balance indicator. Show contextual warnings: a small amber banner near top of video area for low balance, and a modal overlay variant for critical low-balance (semi-opaque dark overlay with rounded white modal). Color palette: deep navy background gradient to teal/soft-cyan; UI surfaces: translucent white (glass), accent teal/cyan for primary controls, amber for warnings, soft green for connected state. Typography: clean sans (Inter), medium weights, clear corner radiuses. Lighting: soft ambient, high contrast for UI elements, subtle reflections. Style: modern product UI, soft shadows, minimal skeuomorphism, no watermark, no extra text artifacts. Negative prompt: avoid distorted faces, extra text labels, low-detail UI, glaring chrome reflections, off proportions.

---

## 2) Developer Prompt / Implementation Spec (React + TypeScript + Tailwind)

Recreate a responsive video tutoring session UI in React + TypeScript + Tailwind CSS. Implement the following components and behavior to match the attached design:

1. Components to build:
  - `Session.tsx` — top-level page with fixed frosted top bar, main video grid, right chat column, bottom control bar, and conditional warnings/modals.
  - `VideoFeed.tsx` — individual video tile with props: `name: string`, `role: 'tutor'|'student'`, `isAudioEnabled: boolean`, `isVideoEnabled: boolean`, `isSpeaking: boolean`. Visuals: 2-up grid, rounded 12px corners, subtle inner shadow, speaking glow animation (pulse border or glow).
  - `SessionTimer.tsx`, `BalanceMeter.tsx`, `ConnectionStatus.tsx`, `SessionControls.tsx`, `ChatPanel.tsx`, `BalanceWarningToast.tsx`, `BalanceWarningBanner.tsx`, `BalanceTopUpModal.tsx`, `SessionPausedOverlay.tsx`.

2. Layout & styling rules:
  - Global background: gradient from deep navy (#071026) to soft teal (#0ea5a0) at 3–5% opacity; use Tailwind `bg-gradient-to-br from-[color] to-[color]`.
  - Top bar: fixed, height ~64px, `backdrop-blur-xl`, `bg-white/6` or `bg-card/60`, border bottom `border-border`. Left ghost `Exit` button with an arrow icon.
  - Main content: container with left main column (video grid + info cards) and right sidebar (320px) for chat. Use `grid lg:grid-cols-[1fr_320px] gap-6`.
  - Video tiles: `grid grid-cols-2 gap-4` desktop, stack vertically on small screens. Each tile: `rounded-lg overflow-hidden bg-black/10` and a name badge in the lower-left.
  - Pop-cards row: three equal cards using `pop-card` utility class (subtle background + rounded corners + padding).
  - Bottom controls: fixed bottom bar with centered `SessionControls` containing circular buttons (`w-12 h-12 rounded-full`) and a larger red `End` button.
  - Notifications: toast / banner for low funds (amber), modal for critical low funds (centered, rounded, drop shadow), paused overlay darkens content and shows CTA to top-up.

3. Behavior:
  - Local state: `balance`, `isPaused`, `isAudioEnabled`, `isVideoEnabled`, `isSpeaking`, `startTime`.
  - Balance deduction: simulated `ratePerSecond` (0.007) with `setInterval` while not paused; when balance below thresholds show toast/banner/modal and when 0 pause the session.
  - Speaking indicator randomly toggles for demo using setInterval.
  - Accessibility: keyboard focusable controls, `aria-label` on interactive buttons, semantic HTML where possible, and `prefers-reduced-motion` respect for animations.
  - Animations: use Tailwind transitions for hover, `animate-pulse` or CSS keyframes for speaking glow. Keep motion subtle.
  - Styling tokens: expose tailwind config color tokens: `--bg`, `--card`, `--primary`, `--accent-warning`, `--muted-foreground` to tune theme.

4. Deliverables:
  - Complete React components with TypeScript props and PropTypes where needed.
  - Tailwind utility classes and a small set of reusable UI tokens.
  - A storybook or a small `preview` route (`/session`) demonstrating the components with mock data and toggles for `isSpeaking`, `isPaused`, and balance quick-topups.
  - README with run instructions and short notes on accessibility and theming.

5. Example Tailwind snippets:
  - Top bar: `<div className="fixed top-0 left-0 right-0 z-50 bg-card/60 backdrop-blur-xl border-b border-border h-16">…</div>`
  - Video tile: `<div className="rounded-lg overflow-hidden bg-black/10 shadow-sm relative">…</div>`
  - Bottom control button: `<button className="w-12 h-12 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/12 transition">…</button>`

Use this spec to generate components and a one-page demo. Keep design tokens centralized, make components composable, and mock the real-time state with small intervals so the demo feels live.

---

## 3) Files (full source)

### `src/pages/Session.tsx`

```tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SessionTimer } from "@/components/session/SessionTimer";
import { BalanceMeter } from "@/components/session/BalanceMeter";
import { ConnectionStatus } from "@/components/session/ConnectionStatus";
import { VideoFeed } from "@/components/session/VideoFeed";
import { SessionControls } from "@/components/session/SessionControls";
import { ChatPanel } from "@/components/session/ChatPanel";
import { BalanceWarningToast } from "@/components/session/BalanceWarningToast";
import { BalanceWarningBanner } from "@/components/session/BalanceWarningBanner";
import { BalanceTopUpModal } from "@/components/session/BalanceTopUpModal";
import { SessionPausedOverlay } from "@/components/session/SessionPausedOverlay";
import { useToast } from "@/hooks/use-toast";

const Session = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Session state
  const [startTime] = useState(new Date());
  const [balance, setBalance] = useState(5.50);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showCriticalModal, setShowCriticalModal] = useState(false);

  const initialBalance = 5.50;
  const ratePerSecond = 0.007; // $0.42/min = $0.007/sec

  // Calculate time remaining
  const secondsRemaining = Math.floor(balance / ratePerSecond);
  const minutesRemaining = Math.floor(secondsRemaining / 60);

  // Simulate balance deduction
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setBalance(prev => {
        const newBalance = Math.max(0, prev - ratePerSecond);
        
        // Critical: < 30 seconds (show modal)
        if (newBalance > 0 && newBalance <= 0.21 && !showCriticalModal) {
          setShowCriticalModal(true);
        }

        // Paused: balance depleted
        if (newBalance === 0) {
          setIsPaused(true);
          toast({
            title: "Session Paused",
            description: "Funds depleted. Add balance to continue.",
            variant: "destructive",
          });
        }

        return newBalance;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, showCriticalModal]);

  // Simulate speaking indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSpeaking(Math.random() > 0.7);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleEndSession = () => {
    toast({
      title: "Session Ended",
      description: "Your language session has been completed. Great work!",
    });
    setTimeout(() => navigate('/'), 1500);
  };

  const handleTopUp = (amount: number) => {
    setBalance(prev => prev + amount);
    setShowCriticalModal(false);
    setIsPaused(false);
    toast({
      title: "Balance Added",
      description: `$${amount.toFixed(2)} added to your session balance.`,
    });
  };

  const handleQuickTopUp = (minutes: number) => {
    const amount = minutes * 60 * ratePerSecond;
    handleTopUp(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-card/60 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit
          </Button>

          <div className="flex items-center gap-4">
            <SessionTimer startTime={startTime} />
            <BalanceMeter 
              current={balance} 
              initial={initialBalance}
              ratePerSecond={ratePerSecond}
            />
            <ConnectionStatus isConnected={true} quality="excellent" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-32 px-6">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            {/* Video Grid */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <VideoFeed
                  name="María González"
                  role="tutor"
                  isAudioEnabled={true}
                  isVideoEnabled={true}
                  isSpeaking={isSpeaking}
                />
                <VideoFeed
                  name="You"
                  role="student"
                  isAudioEnabled={isAudioEnabled}
                  isVideoEnabled={isVideoEnabled}
                  isSpeaking={false}
                />
              </div>

              {/* Session Info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="pop-card">
                  <p className="text-sm text-muted-foreground mb-1">Language</p>
                  <p className="text-lg font-bold">Spanish</p>
                </div>
                <div className="pop-card">
                  <p className="text-sm text-muted-foreground mb-1">Level</p>
                  <p className="text-lg font-bold">Intermediate</p>
                </div>
                <div className="pop-card">
                  <p className="text-sm text-muted-foreground mb-1">Focus</p>
                  <p className="text-lg font-bold">Conversation</p>
                </div>
              </div>
            </div>

            {/* Chat Panel */}
            <div className="hidden lg:block">
              <ChatPanel />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <SessionControls
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          onToggleAudio={() => setIsAudioEnabled(!isAudioEnabled)}
          onToggleVideo={() => setIsVideoEnabled(!isVideoEnabled)}
          onScreenShare={() => toast({ title: "Screen sharing coming soon!" })}
          onEndSession={handleEndSession}
        />
      </div>

      {/* Warning System */}
      {!isPaused && balance > 0.84 && balance <= 2.10 && minutesRemaining <= 5 && (
        <BalanceWarningToast 
          minutesRemaining={minutesRemaining}
          onTopUp={() => handleTopUp(5)}
        />
      )}

      {!isPaused && balance > 0.21 && balance <= 0.84 && (
        <BalanceWarningBanner
          minutesRemaining={minutesRemaining}
          ratePerSecond={ratePerSecond}
          onQuickTopUp={handleQuickTopUp}
        />
      )}

      <BalanceTopUpModal
        isOpen={showCriticalModal && !isPaused}
        currentBalance={balance}
        secondsRemaining={secondsRemaining}
        ratePerSecond={ratePerSecond}
        onTopUp={handleTopUp}
        onEndSession={handleEndSession}
      />

      {isPaused && (
        <SessionPausedOverlay
          ratePerSecond={ratePerSecond}
          onTopUp={handleTopUp}
        />
      )}
    </div>
  );
};

export default Session;
```


### `src/components/session/VideoFeed.tsx`

```tsx
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";

interface VideoFeedProps {
  name: string;
  role: 'tutor' | 'student';
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isSpeaking?: boolean;
}

export const VideoFeed = ({ 
  name, 
  role, 
  isAudioEnabled, 
  isVideoEnabled,
  isSpeaking = false 
}: VideoFeedProps) => {
  const initials = name.split(' ').map(n => n[0]).join('');
  
  return (
    <div className={`relative w-full aspect-video bg-muted rounded-2xl overflow-hidden ${
      isSpeaking ? 'ring-4 ring-success' : ''
    } transition-all`}>
      {/* Video placeholder - in real implementation, this would be a video element */}
      {!isVideoEnabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
          <Avatar className="h-24 w-24 border-4 border-card">
            <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Overlay info */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent pointer-events-none" />
      
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className="bg-card/80 backdrop-blur-lg text-foreground border-border">
            {name}
          </Badge>
          <Badge className={`${role === 'tutor' ? 'bg-primary' : 'bg-accent'} text-xs`}>
            {role}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {!isAudioEnabled && (
            <div className="p-2 bg-destructive rounded-full">
              <MicOff className="h-4 w-4 text-destructive-foreground" />
            </div>
          )}
          {isSpeaking && isAudioEnabled && (
            <div className="p-2 bg-success rounded-full animate-pulse">
              <Mic className="h-4 w-4 text-success-foreground" />
            </div>
          )}
          {!isVideoEnabled && (
            <div className="p-2 bg-destructive rounded-full">
              <VideoOff className="h-4 w-4 text-destructive-foreground" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```


### `src/components/session/BalanceMeter.tsx`

```tsx
import { DollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BalanceMeterProps {
  current: number;
  initial: number;
  ratePerSecond: number;
}

export const BalanceMeter = ({ current, initial, ratePerSecond }: BalanceMeterProps) => {
  const percentage = (current / initial) * 100;
  const isLow = current < 2;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-card/80 backdrop-blur-lg rounded-full border border-border">
      <DollarSign className={`h-4 w-4 ${isLow ? 'text-warning' : 'text-success'}`} />
      <div className="flex flex-col gap-1 min-w-32">
        <div className="flex items-center justify-between">
          <span className={`text-lg font-bold ${isLow ? 'text-warning' : 'text-foreground'}`}>
            ${current.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">
            ${ratePerSecond.toFixed(4)}/s
          </span>
        </div>
        <Progress 
          value={percentage} 
          className={`h-1.5 ${isLow ? '[&>div]:bg-warning' : '[&>div]:bg-success'}`}
        />
      </div>
    </div>
  );
};
```


### `src/components/session/BalanceTopUpModal.tsx`

```tsx
import { DollarSign, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";

interface BalanceTopUpModalProps {
  isOpen: boolean;
  currentBalance: number;
  secondsRemaining: number;
  ratePerSecond: number;
  onTopUp: (amount: number) => void;
  onEndSession: () => void;
}

export const BalanceTopUpModal = ({
  isOpen,
  currentBalance,
  secondsRemaining,
  ratePerSecond,
  onTopUp,
  onEndSession
}: BalanceTopUpModalProps) => {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleTopUp = (amount: number) => {
    onTopUp(amount);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const calculateMinutes = (amount: number) => {
    return Math.floor(amount / (ratePerSecond * 60));
  };

  const quickAmounts = [
    { amount: 5, label: "$5" },
    { amount: 10, label: "$10" },
    { amount: 20, label: "$20" }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-card border-warning">
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-success" />
            </div>
            <p className="text-lg font-semibold text-success">Funds Added!</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Add Funds to Continue</DialogTitle>
              <DialogDescription className="text-base">
                <span className="text-destructive font-semibold">
                  ${currentBalance.toFixed(2)} ({secondsRemaining} seconds)
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4">
              {quickAmounts.map(({ amount, label }) => (
                <Button
                  key={amount}
                  onClick={() => handleTopUp(amount)}
                  size="lg"
                  className="h-16 text-lg bg-primary hover:bg-primary/90 hover:scale-105 transition-all"
                >
                  <DollarSign className="h-5 w-5" />
                  {label}
                  <span className="text-sm opacity-80 ml-2">
                    ({calculateMinutes(amount)} min)
                  </span>
                </Button>
              ))}
              
              <Button
                onClick={() => handleTopUp(0)}
                size="lg"
                variant="outline"
                className="h-16 text-lg hover:scale-105 transition-all"
              >
                Custom Amount
              </Button>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={onEndSession}
                variant="ghost"
                className="flex-1"
              >
                End Session
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
```


### `src/components/session/BalanceWarningBanner.tsx`

```tsx
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BalanceWarningBannerProps {
  minutesRemaining: number;
  ratePerSecond: number;
  onQuickTopUp: (minutes: number) => void;
}

export const BalanceWarningBanner = ({ 
  minutesRemaining, 
  ratePerSecond,
  onQuickTopUp 
}: BalanceWarningBannerProps) => {
  const calculateCost = (minutes: number) => {
    return (minutes * 60 * ratePerSecond).toFixed(2);
  };

  return (
    <div className="fixed top-20 left-0 right-0 z-50 animate-fade-in">
      <div className="bg-warning text-warning-foreground px-6 py-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
            <p className="font-semibold">
              ⚠️ {minutesRemaining} minute{minutesRemaining !== 1 ? 's' : ''} left! Top up now to avoid interruption
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onQuickTopUp(5)}
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-warning-foreground border-white/40"
              variant="outline"
            >
              +5 min ${calculateCost(5)}
            </Button>
            <Button
              onClick={() => onQuickTopUp(15)}
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-warning-foreground border-white/40"
              variant="outline"
            >
              +15 min ${calculateCost(15)}
            </Button>
            <Button
              onClick={() => onQuickTopUp(30)}
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-warning-foreground border-white/40"
              variant="outline"
            >
              +30 min ${calculateCost(30)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
```


### `src/components/session/BalanceWarningToast.tsx`

```tsx
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface BalanceWarningToastProps {
  minutesRemaining: number;
  onTopUp: () => void;
}

export const BalanceWarningToast = ({ minutesRemaining, onTopUp }: BalanceWarningToastProps) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    setShow(true);
    const timer = setTimeout(() => setShow(false), 10000);
    return () => clearTimeout(timer);
  }, [minutesRemaining]);

  if (!show) return null;

  return (
    <div className="fixed top-24 right-6 z-50 animate-fade-in">
      <div className="pop-card bg-card border-warning/20 flex items-center gap-3 px-4 py-3 shadow-elegant min-w-[280px]">
        <AlertCircle className="h-5 w-5 text-warning shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            {minutesRemaining} min remaining
          </p>
        </div>
        <Button 
          onClick={onTopUp}
          size="sm"
          className="bg-warning text-warning-foreground hover:bg-warning/90"
        >
          Top Up
        </Button>
      </div>
    </div>
  );
};
```


### `src/components/session/ChatPanel.tsx`

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { useState } from "react";

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
}

export const ChatPanel = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'María González',
      text: '¡Hola! Ready to practice?',
      timestamp: new Date(Date.now() - 120000)
    },
    {
      id: '2',
      sender: 'You',
      text: 'Yes! Let\'s start with conversational Spanish.',
      timestamp: new Date(Date.now() - 60000)
    }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (!newMessage.trim()) return;
    
    setMessages([...messages, {
      id: Date.now().toString(),
      sender: 'You',
      text: newMessage,
      timestamp: new Date()
    }]);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold">Session Chat</h3>
        <p className="text-xs text-muted-foreground">Share notes and resources</p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex flex-col gap-1 ${
                msg.sender === 'You' ? 'items-end' : 'items-start'
              }`}
            >
              <span className="text-xs text-muted-foreground">{msg.sender}</span>
              <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                msg.sender === 'You' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground'
              }`}>
                {msg.text}
              </div>
              <span className="text-xs text-muted-foreground">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="rounded-full"
          />
          <Button 
            onClick={handleSend}
            size="icon"
            className="rounded-full flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
```


### `src/components/session/ConnectionStatus.tsx`

```tsx
import { Badge } from "@/components/ui/badge";
import { Wifi } from "lucide-react";

interface ConnectionStatusProps {
  isConnected: boolean;
  quality: 'excellent' | 'good' | 'poor';
}

export const ConnectionStatus = ({ isConnected, quality }: ConnectionStatusProps) => {
  const getStatusColor = () => {
    if (!isConnected) return 'bg-destructive';
    if (quality === 'excellent') return 'status-success';
    if (quality === 'good') return 'bg-primary';
    return 'status-warning';
  };

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected';
    if (quality === 'excellent') return 'Live';
    if (quality === 'good') return 'Connected';
    return 'Unstable';
  };

  return (
    <Badge className={`${getStatusColor()} text-xs font-medium rounded-full px-3 py-1 flex items-center gap-2`}>
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'animate-pulse' : ''}`} 
           style={{ backgroundColor: 'currentColor' }} />
      <Wifi className="h-3 w-3" />
      {getStatusText()}
    </Badge>
  );
};
```


### `src/components/session/SessionControls.tsx`

```tsx
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff } from "lucide-react";

interface SessionControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onScreenShare: () => void;
  onEndSession: () => void;
}

export const SessionControls = ({
  isAudioEnabled,
  isVideoEnabled,
  onToggleAudio,
  onToggleVideo,
  onScreenShare,
  onEndSession
}: SessionControlsProps) => {
  return (
    <div className="flex items-center justify-center gap-3 p-4 bg-card/90 backdrop-blur-lg border-t border-border">
      <Button
        variant={isAudioEnabled ? "secondary" : "destructive"}
        size="lg"
        onClick={onToggleAudio}
        className="rounded-full w-14 h-14 p-0"
      >
        {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </Button>

      <Button
        variant={isVideoEnabled ? "secondary" : "destructive"}
        size="lg"
        onClick={onToggleVideo}
        className="rounded-full w-14 h-14 p-0"
      >
        {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </Button>

      <Button
        variant="secondary"
        size="lg"
        onClick={onScreenShare}
        className="rounded-full w-14 h-14 p-0"
      >
        <MonitorUp className="h-5 w-5" />
      </Button>

      <div className="w-px h-8 bg-border mx-2" />

      <Button
        variant="accent"
        size="lg"
        onClick={onEndSession}
        className="rounded-full gap-2 px-6"
      >
        <PhoneOff className="h-5 w-5" />
        End Session
      </Button>
    </div>
  );
};
```


### `src/components/session/SessionPausedOverlay.tsx`

```tsx
import { Pause, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionPausedOverlayProps {
  ratePerSecond: number;
  onTopUp: (amount: number) => void;
}

export const SessionPausedOverlay = ({ ratePerSecond, onTopUp }: SessionPausedOverlayProps) => {
  const calculateMinutes = (amount: number) => {
    return Math.floor(amount / (ratePerSecond * 60));
  };

  const quickAmounts = [
    { amount: 5, label: "$5" },
    { amount: 10, label: "$10" },
    { amount: 20, label: "$20" }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-md flex items-center justify-center animate-fade-in">
      <div className="pop-card max-w-md w-full mx-4 p-8 text-center animate-scale-in">
        <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-4">
          <Pause className="h-8 w-8 text-warning" />
        </div>
        
        <h2 className="text-2xl font-bold mb-2">Session Paused</h2>
        <p className="text-muted-foreground mb-6">
          Funds depleted. Add balance to continue your session.
        </p>

        <div className="grid gap-3">
          {quickAmounts.map(({ amount, label }) => (
            <Button
              key={amount}
              onClick={() => onTopUp(amount)}
              size="lg"
              className="h-14 text-lg bg-primary hover:bg-primary/90"
            >
              <DollarSign className="h-5 w-5" />
              {label}
              <span className="text-sm opacity-80 ml-2">
                ({calculateMinutes(amount)} min)
              </span>
            </Button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Your tutor is waiting. Session will auto-reconnect when funded.
        </p>
      </div>
    </div>
  );
};
```


### `src/components/session/SessionTimer.tsx`

```tsx
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface SessionTimerProps {
  startTime: Date;
}

export const SessionTimer = ({ startTime }: SessionTimerProps) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = startTime.getTime();
      const diff = Math.floor((now - start) / 1000);
      setElapsed(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-lg rounded-full border border-border">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span className="text-2xl font-bold tabular-nums">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
};
```


### UI primitives used (already in repo)

#### `src/components/ui/avatar.tsx`

```tsx
import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn("aspect-square h-full w-full", className)} {...props} />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
```


#### `src/components/ui/badge.tsx`

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
```

---

## 4) Handoff checklist
- [ ] Add the image prompt to your design ticket/figma.
- [ ] Review these component files and copy into your repo if desired (file `new-ui-webrtc.md` created at repo root).
- [ ] Verify the `use-toast` hook exists and wire to your toast system.
- [ ] Run dev server and test `/session` route.


