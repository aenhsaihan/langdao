"use client";

import { useEffect, useState } from "react";
import { client } from "../client";
import { activeChain } from "../lib/chains";
import { wallets } from "../wallets";
import { AnimatePresence, motion } from "framer-motion";
import type { NextPage } from "next";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { OnboardingFlow } from "~~/components/onboarding/OnboardingFlow";
import { TestimonialsSection } from "~~/components/testimonials";
import { usePageView } from "~~/hooks/usePageView";

// Staggered animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Mock tutor data
const mockTutors = [
  {
    id: 1,
    name: "María González",
    avatar: "MG",
    rating: 4.9,
    sessions: 234,
    languages: ["Spanish", "English"],
    credentials: 3,
    avgSession: 45,
    rate: 0.42,
    available: true,
    color: "from-rose-400 to-pink-500",
  },
  {
    id: 2,
    name: "Jean-Pierre Dubois",
    avatar: "JD",
    rating: 4.8,
    sessions: 187,
    languages: ["French", "English"],
    credentials: 2,
    avgSession: 45,
    rate: 0.38,
    available: true,
    color: "from-blue-400 to-indigo-500",
  },
  {
    id: 3,
    name: "Yuki Tanaka",
    avatar: "YT",
    rating: 5.0,
    sessions: 312,
    languages: ["Japanese", "English"],
    credentials: 5,
    avgSession: 45,
    rate: 0.55,
    available: true,
    color: "from-purple-400 to-pink-500",
  },
  {
    id: 4,
    name: "Hans Müller",
    avatar: "HM",
    rating: 4.7,
    sessions: 156,
    languages: ["German", "English"],
    credentials: 2,
    avgSession: 45,
    rate: 0.35,
    available: true,
    color: "from-amber-400 to-orange-500",
  },
  {
    id: 5,
    name: "Li Wei",
    avatar: "LW",
    rating: 4.9,
    sessions: 289,
    languages: ["Mandarin", "English"],
    credentials: 4,
    avgSession: 45,
    rate: 0.48,
    available: true,
    color: "from-red-400 to-rose-500",
  },
  {
    id: 6,
    name: "Ahmed Hassan",
    avatar: "AH",
    rating: 4.8,
    sessions: 201,
    languages: ["Arabic", "English"],
    credentials: 3,
    avgSession: 45,
    rate: 0.4,
    available: true,
    color: "from-emerald-400 to-green-500",
  },
];

const languageFilters = [
  "All",
  "Spanish",
  "French",
  "German",
  "Japanese",
  "Mandarin",
  "Arabic",
  "Italian",
  "Portuguese",
  "Korean",
];

// Helper component for buttons that require wallet connection
const ConnectWalletButton = ({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => {
  const account = useActiveAccount();
  const [showConnectModal, setShowConnectModal] = useState(false);

  const handleClick = () => {
    if (!account) {
      setShowConnectModal(true);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <>
      <button onClick={handleClick} className={className}>
        {children}
      </button>
      {showConnectModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowConnectModal(false)}
        >
          <div
            className="bg-gradient-to-br from-[#1A0B2E] to-[#2D1B4E] border border-white/20 rounded-3xl p-8 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h3>
            <p className="text-white/70 mb-6">You need to connect your wallet to access this feature.</p>
            <div className="[&_button]:!w-full [&_button]:!bg-gradient-to-r [&_button]:!from-amber-400 [&_button]:!to-orange-500 [&_button]:!text-gray-900 [&_button]:!font-bold [&_button]:!text-lg [&_button]:!px-8 [&_button]:!py-4 [&_button]:!rounded-xl">
              <ConnectButton client={client} wallets={wallets} chain={activeChain} autoConnect={true} />
            </div>
            <button
              onClick={() => setShowConnectModal(false)}
              className="w-full mt-4 px-6 py-3 text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const MeetTheTutorsSection = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [priceRange] = useState<[number, number]>([0, 1]);

  const filteredTutors = mockTutors.filter(tutor => {
    const languageMatch = selectedLanguage === "All" || tutor.languages.includes(selectedLanguage);
    const priceMatch = tutor.rate >= priceRange[0] && tutor.rate <= priceRange[1];
    return languageMatch && priceMatch;
  });

  return (
    <div className="relative py-24 overflow-hidden bg-gradient-to-b from-[#0F0520] to-[#1A0B2E]">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent" />
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-block px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
            <span className="text-sm font-semibold text-purple-300 tracking-wide">TUTORS</span>
          </div>
          <h2 className="text-5xl sm:text-6xl font-black text-white mb-6">
            Meet the
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
              Tutors
            </span>
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto font-light">
            Connect with experienced native speakers from around the world
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          {/* Language Filter Pills */}
          <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex items-center gap-2 text-white/60 text-sm font-medium flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span>Filters:</span>
            </div>
            {languageFilters.map(lang => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex-shrink-0 ${
                  selectedLanguage === lang
                    ? "bg-gradient-to-r from-amber-400 to-orange-500 text-gray-900 shadow-lg shadow-orange-500/30"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Price Range Info */}
          <div className="flex items-center gap-4 text-white/60 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Price Range: $0.30 - $0.60/min</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{filteredTutors.length} tutors available now</span>
            </div>
          </div>
        </motion.div>

        {/* Tutor Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutors.map((tutor, index) => (
            <motion.div
              key={tutor.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:bg-white/10 hover:border-white/20 transition-all"
            >
              {/* Available Badge */}
              {tutor.available && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                  <span className="text-xs font-semibold text-emerald-300">Available</span>
                </div>
              )}

              {/* Avatar & Info */}
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${tutor.color} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}
                >
                  <span className="text-white font-black text-xl">{tutor.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white mb-1 truncate">{tutor.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-amber-400">⭐</span>
                      <span className="text-white font-semibold">{tutor.rating}</span>
                    </div>
                    <span className="text-white/50 text-sm">({tutor.sessions} sessions)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tutor.languages.map(lang => (
                      <span key={lang} className="px-2 py-1 bg-white/10 rounded-lg text-xs font-medium text-white/80">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 text-sm text-white/60">
                <div className="flex items-center gap-1">
                  <span>🎓</span>
                  <span>{tutor.credentials} credentials</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>⏱️</span>
                  <span>Avg. {tutor.avgSession} min</span>
                </div>
              </div>

              {/* Rate & CTA */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div>
                  <div className="text-sm text-white/60 mb-1">Rate</div>
                  <div className="text-2xl font-black text-white">
                    ${tutor.rate}
                    <span className="text-sm font-normal text-white/60">/min</span>
                  </div>
                </div>
                <ConnectWalletButton className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-gray-900 rounded-xl font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40">
                  Connect
                </ConnectWalletButton>
              </div>

              {/* Hover Glow */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${tutor.color} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity pointer-events-none`}
              />
            </motion.div>
          ))}
        </div>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12"
        >
          <ConnectWalletButton className="px-8 py-4 bg-white/5 border-2 border-white/20 text-white rounded-xl font-semibold hover:bg-white/10 hover:border-white/30 transition-all">
            View All Tutors →
          </ConnectWalletButton>
        </motion.div>
      </div>
    </div>
  );
};

const HomeView = ({ onHowItWorksClick }: { onHowItWorksClick: () => void }) => {
  return (
    <>
      {/* Hero Section with Layered Backgrounds */}
      <div className="relative min-h-screen overflow-hidden">
        {/* Multi-layer Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D1B4E] via-[#1A0B2E] to-[#0F0520]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-500/15 via-transparent to-transparent" />

        {/* Animated Mesh Gradient Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-orange-400/30 to-pink-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/25 to-purple-600/25 rounded-full blur-3xl"
        />

        {/* Geometric Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left Content */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-10">
              {/* Eyebrow */}
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-medium text-white/90 tracking-wide">Live tutors online now</span>
              </motion.div>

              {/* Main Heading */}
              <motion.div variants={itemVariants} className="space-y-4">
                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white leading-[0.95] tracking-tight">
                  Speak.
                  <br />
                  <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
                    Learn.
                  </span>
                  <br />
                  Earn.
                </h1>
              </motion.div>

              {/* Subheading */}
              <motion.p
                variants={itemVariants}
                className="text-xl sm:text-2xl text-white/80 leading-relaxed max-w-xl font-light"
              >
                Real conversations with native speakers.
                <br />
                <span className="text-amber-300 font-medium">Pay per second.</span> No subscriptions. No BS.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <div className="[&_button]:!bg-gradient-to-r [&_button]:!from-amber-400 [&_button]:!to-orange-500 [&_button]:!text-gray-900 [&_button]:!font-bold [&_button]:!text-lg [&_button]:!px-8 [&_button]:!py-5 [&_button]:!rounded-2xl [&_button]:hover:!scale-105 [&_button]:!transition-all [&_button]:!shadow-2xl [&_button]:!shadow-orange-500/30 [&_button]:hover:!shadow-orange-500/50 [&_button]:!h-[68px] [&_button]:!flex [&_button]:!items-center [&_button]:!justify-center">
                  <ConnectButton
                    client={client}
                    wallets={wallets}
                    chain={activeChain}
                    autoConnect={true}
                    connectButton={{
                      label: "Start Learning Now →",
                    }}
                  />
                </div>

                <button
                  onClick={onHowItWorksClick}
                  className="h-[68px] px-8 py-5 rounded-2xl font-semibold text-lg text-white border-2 border-white/30 backdrop-blur-sm hover:bg-white/10 hover:border-white/50 transition-all flex items-center justify-center"
                >
                  How It Works
                </button>
              </motion.div>

              {/* Stats */}
              <motion.div variants={itemVariants} className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10">
                {[
                  { value: "2.8K+", label: "Tutors" },
                  { value: "45+", label: "Languages" },
                  { value: "$0.003", label: "Per Second" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                  >
                    <div className="text-3xl sm:text-4xl font-black text-white">{stat.value}</div>
                    <div className="text-sm text-white/60 font-medium mt-1">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Visual - Floating Language Cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative h-[600px] hidden lg:block"
            >
              {/* Central Glow */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 bg-gradient-to-br from-amber-400/40 to-orange-500/40 rounded-full blur-3xl" />
              </div>

              {/* Floating Language Cards */}
              {[
                { lang: "🇪🇸", name: "Spanish", color: "from-red-500 to-yellow-500", delay: 0, x: -120, y: -80 },
                { lang: "🇫🇷", name: "French", color: "from-blue-500 to-red-500", delay: 0.1, x: 100, y: -120 },
                { lang: "🇯🇵", name: "Japanese", color: "from-red-600 to-white", delay: 0.2, x: -140, y: 60 },
                { lang: "🇩🇪", name: "German", color: "from-black to-red-600", delay: 0.3, x: 120, y: 100 },
                { lang: "🇨🇳", name: "Chinese", color: "from-red-600 to-yellow-400", delay: 0.4, x: 0, y: -40 },
                { lang: "🇮🇹", name: "Italian", color: "from-green-600 to-red-600", delay: 0.5, x: -40, y: 140 },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, rotate: -180 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotate: 0,
                    y: [0, -10, 0],
                  }}
                  transition={{
                    opacity: { delay: 0.5 + item.delay, duration: 0.6 },
                    scale: { delay: 0.5 + item.delay, duration: 0.6 },
                    rotate: { delay: 0.5 + item.delay, duration: 0.8 },
                    y: { delay: 1.5, duration: 3, repeat: Infinity, ease: "easeInOut" },
                  }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="absolute top-1/2 left-1/2 cursor-pointer"
                  style={{
                    transform: `translate(calc(-50% + ${item.x}px), calc(-50% + ${item.y}px))`,
                  }}
                >
                  <div
                    className={`bg-gradient-to-br ${item.color} p-6 rounded-2xl shadow-2xl backdrop-blur-sm border border-white/20 min-w-[140px]`}
                  >
                    <div className="text-4xl mb-2">{item.lang}</div>
                    <div className="text-white font-bold text-lg">{item.name}</div>
                    <div className="text-white/70 text-sm mt-1">Available now</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/50 text-sm font-medium">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2"
          >
            <div className="w-1.5 h-1.5 bg-white/50 rounded-full" />
          </motion.div>
        </motion.div>
      </div>

      {/* Meet the Tutors Section */}
      <MeetTheTutorsSection />

      {/* Testimonials Section */}
      <TestimonialsSection />
    </>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const HowItWorksView = ({ onBackToHome }: { onBackToHome: () => void }) => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F0520] via-[#1A0B2E] to-[#0F0520]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />

      {/* Animated Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 100, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-block px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <span className="text-sm font-semibold text-cyan-300 tracking-wide">THE PROCESS</span>
          </div>
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight">How It Works</h1>
          <p className="text-xl sm:text-2xl text-white/70 max-w-3xl mx-auto font-light leading-relaxed">
            Four simple steps to start speaking with native speakers.
            <br />
            <span className="text-amber-300">No complexity. No barriers.</span>
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
          {[
            {
              num: "01",
              title: "Connect Wallet",
              desc: "Link your Web3 wallet for secure, instant payments",
              icon: "🔗",
              color: "from-cyan-400 to-blue-500",
              delay: 0.2,
            },
            {
              num: "02",
              title: "Find a Tutor",
              desc: "Match instantly with native speakers of your target language",
              icon: "🎯",
              color: "from-purple-400 to-pink-500",
              delay: 0.3,
            },
            {
              num: "03",
              title: "Start Learning",
              desc: "Jump on a video call and pay per second. No subscriptions.",
              icon: "💬",
              color: "from-amber-400 to-orange-500",
              delay: 0.4,
            },
            {
              num: "04",
              title: "Earn Teaching",
              desc: "Become a tutor and earn crypto sharing your native language",
              icon: "💰",
              color: "from-emerald-400 to-green-500",
              delay: 0.5,
            },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: step.delay, duration: 0.8 }}
              className="relative group"
            >
              {/* Card */}
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300 h-full">
                {/* Number Badge */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center">
                  <span className="text-white/60 font-black text-sm">{step.num}</span>
                </div>

                {/* Icon */}
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <span className="text-3xl">{step.icon}</span>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-white/70 leading-relaxed font-light">{step.desc}</p>

                {/* Hover Glow */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity blur-xl`}
                />
              </div>

              {/* Connecting Line (except last) */}
              {i < 3 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-white/20 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl p-12 mb-20"
        >
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-2xl opacity-50" />

          <div className="relative">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 text-center">Why Choose LangDAO?</h2>
            <p className="text-white/60 text-center mb-12 text-lg">The future of language learning is here</p>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: "⚡", title: "Instant Matching", desc: "Connect with tutors in seconds, not days" },
                { icon: "💸", title: "Pay Per Second", desc: "Only pay for the time you actually use" },
                { icon: "🌍", title: "Native Speakers", desc: "Learn from authentic native speakers worldwide" },
                { icon: "🔐", title: "Web3 Powered", desc: "Secure, decentralized, and transparent payments" },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.1, duration: 0.6 }}
                  className="flex items-start gap-4 p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                    <span className="text-2xl">{feature.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-white/70 font-light leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="flex flex-col items-center justify-center"
        >
          <div className="flex items-center justify-center [&_button]:!bg-gradient-to-r [&_button]:!from-amber-400 [&_button]:!to-orange-500 [&_button]:!text-gray-900 [&_button]:!font-bold [&_button]:!text-xl [&_button]:!px-12 [&_button]:!py-6 [&_button]:!rounded-2xl [&_button]:hover:!scale-105 [&_button]:!transition-all [&_button]:!shadow-2xl [&_button]:!shadow-orange-500/30 [&_button]:hover:!shadow-orange-500/50">
            <ConnectButton
              client={client}
              wallets={wallets}
              chain={activeChain}
              autoConnect={true}
              connectButton={{
                label: "Get Started Now →",
              }}
            />
          </div>
          <p className="text-white/50 mt-6 text-sm text-center">No credit card required • Connect wallet to start</p>
        </motion.div>
      </div>
    </div>
  );
};

const ConnectedDashboard = () => {
  const handleOnboardingComplete = () => {
    // After onboarding is complete, show the main dashboard
    // For now, we'll just show a success message
    console.log("Onboarding completed!");
  };

  return <OnboardingFlow onComplete={handleOnboardingComplete} />;
};

const HomeContent = () => {
  const { currentView, showHowItWorks, showHome } = usePageView();
  const account = useActiveAccount();
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasCheckedAccount, setHasCheckedAccount] = useState(false);

  // Wait a brief moment to determine account status before rendering
  // This prevents flicker from showing landing page before account loads
  useEffect(() => {
    // Mark that we've checked account state
    setHasCheckedAccount(true);

    // Give a small delay to allow account state to settle
    // This prevents the flicker from showing landing page then switching to dashboard
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 150); // 150ms should be enough for account state to initialize

    return () => clearTimeout(timer);
  }, []);

  // If account state changes after initial check, we can show content immediately
  useEffect(() => {
    if (hasCheckedAccount && account !== undefined) {
      // Account state is now determined, we can show content
      setIsInitializing(false);
    }
  }, [account, hasCheckedAccount]);

  // Show loading screen during initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <span className="text-2xl">🔍</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading...</h2>
          <p className="text-gray-600 dark:text-gray-300">Checking your connection...</p>
        </div>
      </div>
    );
  }

  // If wallet is connected, show dashboard
  if (account) {
    return <ConnectedDashboard />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {currentView === "home" ? (
          <HomeView onHowItWorksClick={showHowItWorks} />
        ) : (
          <HowItWorksView onBackToHome={showHome} />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

const Home: NextPage = () => {
  return <HomeContent />;
};

export default Home;
