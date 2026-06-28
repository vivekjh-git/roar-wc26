"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Game } from "@/lib/api";
import CountdownWidget from "./CountdownWidget";
import { formatTimeNPT } from "@/lib/date-utils";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
  games?: Game[];
}

const tabs = [
  { id: "bracket", label: "Bracket" },
  { id: "groups", label: "Groups" },
  { id: "scorers", label: "Scorers" },
  { id: "records", label: "Records" },
  { id: "popularity", label: "Buzz" },
];

export default function Header({ activeTab, onTabChange, onRefresh, loading, games }: HeaderProps) {
  const [nptTime, setNptTime] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const nowStr = new Date().toLocaleTimeString("en-US", {
        timeZone: "Asia/Kathmandu",
        hour: "numeric",
        minute: "2-digit",
      });
      setNptTime(nowStr);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000); // 10s updates are plenty for minutes
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#0a0f1e]/80 backdrop-blur-xl border-b border-yellow-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 sm:px-4">
        {/* Brand Section */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative w-9 h-9 flex-shrink-0 rounded-full bg-neutral-950 border border-[#ff5e00]/40 overflow-hidden flex items-center justify-center shadow-[0_0_8px_rgba(255,94,0,0.35)]">
            <img src="/tiger.png" alt="logo" className="w-10 h-10 object-contain scale-110 select-none" />
            {loading && (
              <span className="absolute inset-0 border border-[#ff5e00] border-t-transparent rounded-full animate-spin z-10" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-xs sm:text-sm font-black gold-text leading-tight tracking-wide whitespace-nowrap flex-shrink-0">FIFA WORLD CUP 2026</h1>
            <p className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5 whitespace-nowrap flex-shrink-0">USA · Canada · Mexico</p>
          </div>
        </div>
        
        {/* Controls Section */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {games && games.length > 0 && (
            <div className="hidden md:block">
              <CountdownWidget games={games} />
            </div>
          )}
          
          <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 shadow-inner flex-shrink-0">
            <svg className="w-3 h-3 text-[#ff5e00] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[9px] sm:text-[10px] font-black text-gray-300 tabular-nums tracking-wider uppercase">{nptTime}</span>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/5 shadow-inner text-gray-400 hover:text-white flex-shrink-0 ${loading ? "opacity-50" : ""}`}
              title="Refresh data"
            >
              <span className={`text-xs sm:text-sm ${loading ? "animate-spin inline-block" : ""}`}>
                {loading ? "⟳" : "↺"}
              </span>
            </button>
          )}

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/5 shadow-inner text-gray-400 hover:text-[#ff5e00] flex-shrink-0"
            title="Toggle Menu"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs (Hidden on Mobile, shown on Desktop) */}
      <nav className="hidden sm:flex overflow-x-auto scrollbar-hide cyber-nav">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 min-w-[72px] py-3.5 text-xs font-bold transition-all whitespace-nowrap px-3 relative cyber-tab flex items-center justify-center gap-1.5
                ${isActive ? "cyber-tab-active" : "text-gray-400 hover:text-[#ff5e00]"}
              `}
            >
              {/* Flat SVG Icon */}
              {tab.id === "bracket" && (
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0V3.75m-9 15V3.75m9 0A3.75 3.75 0 0012 0a3.75 3.75 0 00-3.75 3.75" />
                </svg>
              )}
              {tab.id === "groups" && (
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              )}
              {tab.id === "scorers" && (
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M2 12h20M12 12l4.5-4.5M12 12l-4.5 4.5M12 12l4.5 4.5M12 12l-4.5-4.5" />
                </svg>
              )}
              {tab.id === "records" && (
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
              )}
              {tab.id === "popularity" && (
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                </svg>
              )}
              
              <span className="relative z-10">{tab.label}</span>
              
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="cyber-tab-indicator"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>
      {/* Mobile Dropdown Drawer Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden border-t border-white/10 bg-[#05050c]/98 backdrop-blur-2xl absolute top-full left-0 right-0 z-40 shadow-2xl flex flex-col divide-y divide-white/5 overflow-hidden"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setMenuOpen(false);
                  }}
                  className={`w-full py-4 px-6 text-sm font-bold flex items-center gap-3 transition-colors ${
                    isActive ? "text-[#ff5e00] bg-[#ff5e00]/5" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {/* Flat SVG Icon */}
                  {tab.id === "bracket" && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0V3.75m-9 15V3.75m9 0A3.75 3.75 0 0012 0a3.75 3.75 0 00-3.75 3.75" />
                    </svg>
                  )}
                  {tab.id === "groups" && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                  )}
                  {tab.id === "scorers" && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M2 12h20M12 12l4.5-4.5M12 12l-4.5 4.5M12 12l4.5 4.5M12 12l-4.5-4.5" />
                    </svg>
                  )}
                  {tab.id === "records" && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                    </svg>
                  )}
                  {tab.id === "popularity" && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                    </svg>
                  )}
                  <span className="uppercase tracking-widest text-xs font-black">{tab.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
