"use client";

import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { client } from "../client";
import { activeChain } from "../lib/chains";
import { wallets } from "../wallets";
import { SwitchTheme } from "./SwitchTheme";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { Bars3Icon, BellIcon } from "@heroicons/react/24/outline";
// import { ConnectionStatus } from "./socket/ConnectionStatus";
// import { SocketNotifications } from "./socket/SocketNotifications";
import { useOutsideClick } from "~~/hooks/scaffold-eth";
import { usePageView } from "~~/hooks/usePageView";

type HeaderMenuLink = {
  label: string;
  href: string;
};

const connectedMenuLinks: HeaderMenuLink[] = [
  {
    label: "Dashboard",
    href: "/",
  },
  {
    label: "Find Tutor",
    href: "/find-tutor",
  },
  {
    label: "Tutor Mode",
    href: "/tutor",
  },
  {
    label: "My Sessions",
    href: "/sessions",
  },
  {
    label: "Schedule",
    href: "/schedule",
  },
];

const disconnectedMenuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "How it Works",
    href: "/",
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();
  const account = useActiveAccount();
  const { currentView, showHowItWorks, showHome } = usePageView();

  const handleHowItWorksClick = (e: React.MouseEvent) => {
    e.preventDefault();
    showHowItWorks();
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    showHome();
  };

  if (account) {
    // Connected state - show regular navigation
    return (
      <>
        {connectedMenuLinks.map(({ label, href }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`${
                isActive
                  ? "text-white bg-white/10 font-semibold shadow-sm"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              } px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap`}
            >
              {label}
            </Link>
          );
        })}
      </>
    );
  }

  // Disconnected state - show custom navigation
  return (
    <>
      <button
        onClick={handleHomeClick}
        className={`${
          currentView === "home"
            ? "text-white bg-white/10 font-semibold shadow-sm"
            : "text-white/70 hover:text-white hover:bg-white/5"
        } px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap`}
      >
        Home
      </button>
      <button
        onClick={handleHowItWorksClick}
        className={`${
          currentView === "how-it-works"
            ? "text-white bg-white/10 font-semibold shadow-sm"
            : "text-white/70 hover:text-white hover:bg-white/5"
        } px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap`}
      >
        How it Works
      </button>
    </>
  );
};

const MobileMenuLinks = ({ onLinkClick }: { onLinkClick: () => void }) => {
  const pathname = usePathname();
  const account = useActiveAccount();
  const { currentView, showHowItWorks, showHome } = usePageView();

  const handleHowItWorksClick = (e: React.MouseEvent) => {
    e.preventDefault();
    showHowItWorks();
    onLinkClick();
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    showHome();
    onLinkClick();
  };

  if (account) {
    // Connected state - show regular navigation
    return (
      <>
        {connectedMenuLinks.map(({ label, href }) => {
          const isActive = pathname === href;
          return (
            <li key={href} className="mb-1 last:mb-0">
              <Link
                href={href}
                className={`${
                  isActive
                    ? "text-white bg-white/10 font-semibold"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                } block px-4 py-2.5 rounded-xl transition-all text-sm`}
                onClick={onLinkClick}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </>
    );
  }

  // Disconnected state - show custom navigation
  return (
    <>
      <li className="mb-1 last:mb-0">
        <button
          onClick={handleHomeClick}
          className={`${
            currentView === "home"
              ? "text-white bg-white/10 font-semibold"
              : "text-white/70 hover:text-white hover:bg-white/5"
          } block w-full text-left px-4 py-2.5 rounded-xl transition-all text-sm`}
        >
          Home
        </button>
      </li>
      <li className="mb-1 last:mb-0">
        <button
          onClick={handleHowItWorksClick}
          className={`${
            currentView === "how-it-works"
              ? "text-white bg-white/10 font-semibold"
              : "text-white/70 hover:text-white hover:bg-white/5"
          } block w-full text-left px-4 py-2.5 rounded-xl transition-all text-sm`}
        >
          How it Works
        </button>
      </li>
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const burgerMenuRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 80, right: 0 });
  const account = useActiveAccount();
  const { showHome } = usePageView();

  useOutsideClick(burgerMenuRef, () => {
    setIsMenuOpen(false);
  });

  useEffect(() => {
    if (isMenuOpen && burgerMenuRef.current) {
      const rect = burgerMenuRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 12,
        right: window.innerWidth - rect.right
      });
    }
  }, [isMenuOpen]);

  const handleLogoClick = (e: React.MouseEvent) => {
    if (!account) {
      e.preventDefault();
      showHome();
    }
  };

  const toggleMenu = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsMenuOpen((prev) => {
      console.log("Menu toggle:", !prev);
      return !prev;
    });
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="relative bg-gradient-to-r from-[#1A0B2E] via-[#2D1B4E] to-[#1A0B2E] border-b border-white/10 backdrop-blur-xl" style={{ overflow: 'visible' }}>
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12" style={{ overflow: 'visible' }}>
        <div className="flex justify-between items-center h-20" style={{ overflow: 'visible' }}>
          {/* Logo and Navigation */}
          <div className="flex items-center gap-8 xl:gap-12">
            <Link href="/" onClick={handleLogoClick} className="flex items-center gap-3 group flex-shrink-0">
              <div className="relative w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all group-hover:scale-105">
                <span className="text-white font-black text-lg">L</span>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl" />
              </div>
              <span className="font-black text-2xl text-white tracking-tight">LangDAO</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-2">
              <HeaderMenuLinks />
            </nav>
          </div>

          {/* Right side - Theme, Notifications, Connect Button and Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-3" style={{ overflow: 'visible' }}>
            <div className="hidden md:block">
              <SwitchTheme />
            </div>

            {account && (
              <button className="relative p-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-rose-400 ring-2 ring-[#1A0B2E]"></span>
              </button>
            )}

            <div className="[&_button]:!bg-gradient-to-r [&_button]:!from-amber-400 [&_button]:!to-orange-500 [&_button]:!text-gray-900 [&_button]:!font-bold [&_button]:!px-5 [&_button]:sm:!px-6 [&_button]:!py-2.5 [&_button]:!rounded-xl [&_button]:hover:!scale-105 [&_button]:!transition-all [&_button]:!shadow-lg [&_button]:!shadow-amber-500/20 [&_button]:!text-sm [&_button]:sm:!text-base">
              <ConnectButton client={client} wallets={wallets} chain={activeChain} autoConnect={true} />
            </div>

            {/* Mobile menu button */}
            <div className="relative lg:hidden" ref={burgerMenuRef} style={{ zIndex: 1000, overflow: 'visible' }}>
              <button
                type="button"
                onClick={toggleMenu}
                className="btn btn-ghost text-white hover:bg-white/10 active:bg-white/20 cursor-pointer p-2.5 relative"
                style={{ zIndex: 1001 }}
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
              >
                <Bars3Icon className="h-6 w-6 pointer-events-none" />
              </button>
              {isMenuOpen &&
                typeof window !== "undefined" &&
                createPortal(
                  <>
                    {/* Backdrop - click outside to close */}
                    <div
                      className="fixed inset-0"
                      style={{ zIndex: 9999 }}
                      onClick={closeMenu}
                    />
                    {/* Menu dropdown */}
                    <ul
                      className="fixed py-2 px-1 shadow-2xl bg-[#1A0B2E] border border-white/10 rounded-2xl w-56 backdrop-blur-xl min-w-[14rem]"
                      style={{
                        zIndex: 10000,
                        top: `${menuPosition.top}px`,
                        right: `${menuPosition.right}px`,
                      }}
                    >
                      <MobileMenuLinks onLinkClick={closeMenu} />
                    </ul>
                  </>,
                  document.body
                )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
