import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { client } from "../client";
import { activeChain } from "../lib/chains";
import { wallets } from "../wallets";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { hardhat } from "viem/chains";
import { CurrencyDollarIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { HeartIcon } from "@heroicons/react/24/outline";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { BuidlGuidlLogo } from "~~/components/assets/BuidlGuidlLogo";
import { Faucet, MockTokenFaucet } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useGlobalState } from "~~/services/store/store";

// Wallet-gated link component
const WalletGatedLink = ({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const account = useActiveAccount();
  const router = useRouter();
  const [showConnectModal, setShowConnectModal] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!account) {
      setShowConnectModal(true);
    } else {
      router.push(href);
    }
  };

  return (
    <>
      <a href={href} onClick={handleClick} className={className}>
        {children}
      </a>
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

/**
 * Site footer
 */
export const Footer = () => {
  const nativeCurrencyPrice = useGlobalState(state => state.nativeCurrency.price);
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <>
      {/* Dev Tools - Fixed Bottom Left */}
      {isLocalNetwork && (
        <div className="fixed flex flex-col md:flex-row gap-2 z-10 p-4 bottom-0 left-0 pointer-events-none">
          <div className="flex flex-col md:flex-row gap-2 pointer-events-auto">
            {nativeCurrencyPrice > 0 && (
              <div className="px-4 py-2 bg-gradient-to-r from-[#1A0B2E] to-[#2D1B4E] border border-white/10 rounded-xl text-white text-sm font-semibold backdrop-blur-xl shadow-lg flex items-center gap-2">
                <CurrencyDollarIcon className="h-4 w-4 text-amber-400" />
                <span>${nativeCurrencyPrice.toFixed(2)}</span>
              </div>
            )}
            <Faucet />
            <MockTokenFaucet />
            <Link
              href="/blockexplorer"
              className="px-4 py-2 bg-gradient-to-r from-[#1A0B2E] to-[#2D1B4E] border border-white/10 rounded-xl text-white text-sm font-semibold backdrop-blur-xl shadow-lg hover:border-white/20 transition-all flex items-center gap-2"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              <span>Block Explorer</span>
            </Link>
          </div>
        </div>
      )}

      {/* Main Footer */}
      <footer className="relative bg-gradient-to-b from-[#0F0520] to-[#1A0B2E] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-lg">L</span>
                </div>
                <span className="font-black text-2xl text-white">LangDAO</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                Learn languages through instant video calls with native speakers. Pay per second.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-white font-bold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <WalletGatedLink
                    href="/find-tutor"
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    Find Tutors
                  </WalletGatedLink>
                </li>
                <li>
                  <WalletGatedLink href="/tutor" className="text-white/60 hover:text-white text-sm transition-colors">
                    Become a Tutor
                  </WalletGatedLink>
                </li>
                <li>
                  <WalletGatedLink
                    href="/dashboard"
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    Dashboard
                  </WalletGatedLink>
                </li>
                <li>
                  <WalletGatedLink
                    href="/sessions"
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    My Sessions
                  </WalletGatedLink>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-white font-bold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-white/60 hover:text-white text-sm transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/60 hover:text-white text-sm transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/60 hover:text-white text-sm transition-colors">
                    Community
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/60 hover:text-white text-sm transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-bold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-white/60 hover:text-white text-sm transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/60 hover:text-white text-sm transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/60 hover:text-white text-sm transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/50 text-sm">© 2025 LangDAO. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-white/50 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-white/50 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a href="#" className="text-white/50 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};
