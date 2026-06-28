"use client";

import { motion } from "framer-motion";
import type { PopularityEntry } from "@/lib/api";

interface PopularityTabProps {
  popularity: PopularityEntry[];
}

const CONFED_COLORS: { [key: string]: string } = {
  // CONMEBOL
  Argentina: "bg-sky-500",
  Brazil: "bg-green-500",
  Uruguay: "bg-sky-600",
  Ecuador: "bg-yellow-500",
  Paraguay: "bg-red-600",
  // UEFA
  France: "bg-blue-700",
  Germany: "bg-gray-700",
  Spain: "bg-red-700",
  Netherlands: "bg-orange-600",
  Belgium: "bg-red-600",
  England: "bg-red-500",
  Portugal: "bg-green-700",
  Switzerland: "bg-red-500",
  // Default
  default: "bg-purple-600",
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function PopularityTab({ popularity }: PopularityTabProps) {
  const maxScore = popularity[0]?.score || 1;

  const getColor = (name: string) => CONFED_COLORS[name] || CONFED_COLORS.default;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="glass-card rounded-xl p-5 border border-yellow-400/20 bg-gradient-to-br from-yellow-500/10 to-transparent">
        <h2 className="text-sm font-bold text-yellow-400 mb-2 flex items-center gap-2">
          <span>🔥</span> Tournament Buzz Index
        </h2>
        <p className="text-xs text-gray-300 leading-relaxed mb-4">
          The Buzz Index ranks teams based on their entertainment value and activity in the tournament.
        </p>
        
        {/* Rating Calculation Explanation */}
        <div className="bg-black/40 rounded-lg p-3 border border-white/5">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">How ratings are calculated</div>
          <div className="flex items-center justify-between text-xs font-black">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              <span className="text-green-400">Goals Scored</span>
              <span className="text-white bg-white/10 px-1.5 py-0.5 rounded">× 3 pts</span>
            </div>
            <div className="text-gray-500 text-lg leading-none">+</div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-blue-400">Matches Played</span>
              <span className="text-white bg-white/10 px-1.5 py-0.5 rounded">× 1 pt</span>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Top 3 podium */}
      {popularity.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-6 items-end h-48 px-2">
          {/* 2nd */}
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "70%", opacity: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
            className="glass-card rounded-t-xl border-t border-l border-r border-gray-400/50 bg-gray-500/10 p-2 flex flex-col items-center justify-start relative pt-8"
          >
            <div className="absolute -top-6">
              {popularity[1]?.flag ? (
                <img src={popularity[1].flag} alt="" className="w-10 h-7 object-cover rounded shadow-lg border border-white/20" />
              ) : null}
            </div>
            <div className="text-2xl font-black text-gray-400 drop-shadow-md">🥈</div>
            <div className="text-[10px] font-bold text-gray-300 truncate w-full text-center mt-1">{popularity[1]?.teamName}</div>
            <div className="text-[9px] text-gray-500 mt-auto">{popularity[1]?.goalsFor} G</div>
          </motion.div>

          {/* 1st */}
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "100%", opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="glass-card rounded-t-xl border-t border-l border-r border-yellow-400/80 bg-yellow-400/10 p-2 flex flex-col items-center justify-start relative pt-10"
          >
            <div className="absolute -top-8 z-10 text-3xl animate-bounce-slow drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">👑</div>
            <div className="absolute -top-3">
              {popularity[0]?.flag ? (
                <img src={popularity[0].flag} alt="" className="w-12 h-8 object-cover rounded shadow-[0_0_15px_rgba(250,204,21,0.4)] border border-yellow-400/50" />
              ) : null}
            </div>
            <div className="text-3xl font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)] mt-2">🥇</div>
            <div className="text-xs font-bold text-yellow-400 truncate w-full text-center mt-1">{popularity[0]?.teamName}</div>
            <div className="text-[10px] font-bold text-yellow-500 mt-auto bg-black/30 px-2 py-0.5 rounded-full">{popularity[0]?.goalsFor} G</div>
          </motion.div>

          {/* 3rd */}
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "60%", opacity: 1 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
            className="glass-card rounded-t-xl border-t border-l border-r border-amber-700/50 bg-amber-900/10 p-2 flex flex-col items-center justify-start relative pt-8"
          >
            <div className="absolute -top-6">
              {popularity[2]?.flag ? (
                <img src={popularity[2].flag} alt="" className="w-10 h-7 object-cover rounded shadow-lg border border-white/20" />
              ) : null}
            </div>
            <div className="text-xl font-black text-amber-600 drop-shadow-md">🥉</div>
            <div className="text-[10px] font-bold text-amber-500 truncate w-full text-center mt-1">{popularity[2]?.teamName}</div>
            <div className="text-[9px] text-gray-500 mt-auto">{popularity[2]?.goalsFor} G</div>
          </motion.div>
        </div>
      )}

      {/* Full ranking */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {popularity.map((entry, idx) => (
          <motion.div
            variants={itemVariants}
            key={entry.teamId}
            className={`glass-card rounded-xl p-3 border transition-all hover:bg-white/5
              ${idx === 0 ? "border-yellow-400/40 bg-yellow-400/5 shadow-[0_0_15px_rgba(250,204,21,0.1)]" : "border-white/5"}
            `}
          >
            <div className="flex items-center gap-3">
              {/* Rank */}
              <div className="w-7 text-center flex-shrink-0">
                {idx < 3 ? (
                  <span className="text-base">{["🥇", "🥈", "🥉"][idx]}</span>
                ) : (
                  <span className="text-xs font-bold text-gray-500">#{idx + 1}</span>
                )}
              </div>

              {/* Flag */}
              {entry.flag ? (
                <img src={entry.flag} alt={entry.teamName} className="w-10 h-7 object-cover rounded shadow-[0_0_4px_rgba(0,0,0,0.5)] flex-shrink-0" />
              ) : (
                <div className="w-10 h-7 bg-gray-700 rounded shadow flex-shrink-0" />
              )}

              {/* Name */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-white truncate group-hover:text-yellow-400 transition-colors">{entry.teamName}</div>
                <div className="text-[10px] text-gray-500">
                  {entry.played} MP · {entry.goalsFor} GF · {entry.goalsAgainst} GA
                </div>
              </div>

              {/* Score */}
              <div className="text-right flex-shrink-0 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
                <div className={`text-sm font-black ${idx === 0 ? "text-yellow-400" : "text-white"}`}>{entry.score}</div>
                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest -mt-1">pts</div>
              </div>
            </div>

            {/* Buzz stacked bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[9px] font-bold text-gray-500 mb-1 px-1">
                <span>Score Breakdown</span>
                <span>{entry.score} pts total</span>
              </div>
              <div className="h-1.5 flex bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((entry.goalsFor * 3) / maxScore) * 100}%` }}
                  transition={{ duration: 1, delay: 0.5 + idx * 0.05 }}
                  className="h-full bg-green-500 border-r border-black/50"
                  title={`${entry.goalsFor * 3} pts from goals`}
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(entry.played / maxScore) * 100}%` }}
                  transition={{ duration: 1, delay: 0.7 + idx * 0.05 }}
                  className="h-full bg-blue-500"
                  title={`${entry.played} pts from matches`}
                />
              </div>
            </div>

            {/* Mini stats */}
            <div className="mt-2.5 flex gap-3 text-[10px] font-semibold bg-white/5 px-2 py-1 rounded">
              <span className="text-green-400 flex items-center gap-1"><span>⚽</span> {entry.goalsFor} GF</span>
              <span className="text-red-400 flex items-center gap-1"><span>🥅</span> {entry.goalsAgainst} GA</span>
              <span className="text-blue-400 flex items-center gap-1 ml-auto">
                {entry.goalsFor > entry.goalsAgainst ? "📈 POS" : entry.goalsFor < entry.goalsAgainst ? "📉 NEG" : "➡️ EVEN"} GD
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Detailed Explanation */}
      <div className="glass-card rounded-xl p-4 border border-white/10 text-xs text-gray-400 bg-black/40 leading-relaxed">
        <p>
          <span className="text-yellow-400 font-bold uppercase tracking-wider block mb-1">Why this matters</span>
          Teams that score heavily and go deep into the tournament accumulate the most Buzz. The green portion of the graph represents their attacking prowess (goals), while the blue portion represents their tournament longevity (matches played).
        </p>
      </div>
    </div>
  );
}
