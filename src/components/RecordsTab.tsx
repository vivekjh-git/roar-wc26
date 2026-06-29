"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { HistoricalRecord, RecordStatus, RecordCategory } from "@/lib/records-data";
import { RECORD_CATEGORIES } from "@/lib/records-data";

interface RecordsTabProps {
  records: (HistoricalRecord & { status: RecordStatus })[];
}

function CategoryIcon({ category, className = "w-4 h-4" }: { category: string; className?: string }) {
  if (category === "Goals") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M12 8v8" />
      </svg>
    );
  }
  if (category === "Tournament") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    );
  }
  if (category === "Individual") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  }
  // Default / Team
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

export default function RecordsTab({ records }: RecordsTabProps) {
  const [activeCategory, setActiveCategory] = useState<RecordCategory | "All">("All");

  const filteredRecords = useMemo(() => {
    if (activeCategory === "All") return records;
    return records.filter((r) => r.category === activeCategory);
  }, [records, activeCategory]);

  const brokenCount = records.filter(r => r.status.isBeaten).length;
  const nearingCount = records.filter(r => r.status.isNearing).length;

  return (
    <div className="p-4 space-y-4">
      {/* Overview Counters */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-4 border border-green-500/30 flex flex-col items-center justify-center relative overflow-hidden bg-green-500/5">
          <div className="absolute -right-4 -top-4 opacity-[0.03] text-green-400">
            <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div className="text-3xl font-black text-green-400 mb-1">{brokenCount}</div>
          <div className="text-[10px] font-bold text-green-500/80 uppercase tracking-widest">Records Broken</div>
        </div>
        <div className="glass-card rounded-xl p-4 border border-orange-500/30 flex flex-col items-center justify-center relative overflow-hidden bg-orange-500/5">
          <div className="absolute -left-4 -top-4 opacity-[0.03] text-orange-400">
            <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <motion.div 
            className="text-3xl font-black text-orange-400 mb-1"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            {nearingCount}
          </motion.div>
          <div className="text-[10px] font-bold text-orange-500/80 uppercase tracking-widest">Records Nearing</div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide snap-x px-0.5">
        {RECORD_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap snap-start transition-all border ${
              activeCategory === cat 
                ? "bg-[#ff5e00]/10 text-orange-300 border-[#ff5e00] shadow-[0_0_12px_rgba(255,94,0,0.4)]" 
                : "bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Record Cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredRecords.map((record, i) => (
            <RecordCard key={record.id} record={record} idx={i} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function RecordCard({ record, idx }: { record: HistoricalRecord & { status: RecordStatus }, idx: number }) {
  const isBroken = record.status.isBeaten;
  const isNearing = record.status.isNearing && !isBroken;
  const isStanding = !isBroken && !isNearing;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: Math.min(idx * 0.05, 0.5) }}
      className={`relative overflow-hidden rounded-xl p-5 border shadow-xl ${
        isBroken ? "border-green-500/20 bg-[#151b2b]" :
        isNearing ? "border-orange-500/20 bg-[#151b2b]" :
        "border-white/5 bg-[#151b2b]"
      }`}
    >
      {/* Decorative Dots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute top-2 left-4 w-1.5 h-1.5 rounded-full bg-green-500 blur-[1px]"></div>
        <div className="absolute top-6 left-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 blur-[1px]"></div>
        <div className="absolute top-4 right-1/4 w-2 h-2 rounded-full bg-purple-500 blur-[1px]"></div>
        <div className="absolute top-12 left-1/4 w-1.5 h-1.5 rounded-full bg-yellow-500/50 blur-[1px]"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="flex items-start gap-3">
            <div className="bg-white/10 rounded p-1.5 shadow-sm text-gray-300 shrink-0">
              <CategoryIcon category={record.category} className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base leading-tight">{record.title}</h3>
          </div>
          
          <div className="flex flex-col items-center shrink-0 pt-0.5">
            {isBroken && (
              <>
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-[0_0_8px_rgba(34,197,94,0.6)]">
                  ✓
                </div>
                <span className="bg-green-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-[0_0_12px_rgba(34,197,94,0.8)] tracking-widest mt-1">
                  BROKEN
                </span>
              </>
            )}
            {isNearing && (
              <>
                <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-[10px] shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-[0_0_12px_rgba(249,115,22,0.8)] tracking-widest mt-1 animate-pulse">
                  NEARING
                </span>
              </>
            )}
            {isStanding && (
              <>
                <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center text-gray-300 text-[10px] flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="bg-gray-600 text-gray-300 text-[8px] font-black px-1.5 py-0.5 rounded tracking-widest mt-1">
                  STANDING
                </span>
              </>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-5 leading-relaxed pr-4">
          {record.description}
        </p>

        {/* Data Compare Box */}
        <div className="bg-[#1e293b] rounded-xl p-4 shadow-inner border border-white/5 space-y-4">
          {/* Historical Holder */}
          <div>
            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">Historical Record</div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded border border-white/5 uppercase tracking-wider text-gray-300">{record.holderFlag || "FLAG"}</span>
              <div>
                <div className="font-bold text-white text-sm">{record.holder}</div>
                <div className="text-gray-400 text-xs">{record.value} {record.unit} {record.year ? `(${record.year})` : ""}</div>
              </div>
            </div>
          </div>

          {/* 2026 Live Status */}
          <div>
            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">2026 Live Status</div>
            <div className={`font-bold text-[13px] ${isBroken ? "text-green-400" : isNearing ? "text-orange-400" : "text-blue-400"}`}>
              {record.status.current}
            </div>
            
            {/* Progress Bar */}
            {!isBroken && record.status.progress > 0 && (
              <div className="mt-2.5 h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${record.status.progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${isNearing ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"}`}
                />
              </div>
            )}
          </div>
        </div>

        {/* Fun Fact Expandable */}
        {record.funFact && (
          <div className="mt-3 text-[11px] text-gray-400 italic bg-white/5 p-3 rounded-lg border border-white/5 flex items-start gap-2 shadow-sm">
            <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="leading-relaxed">{record.funFact}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

