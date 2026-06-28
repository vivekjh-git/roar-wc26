"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Group, Team, Game } from "@/lib/api";

interface GroupsTabProps {
  groups: Group[];
  teams: Team[];
  games: Game[];
  onTeamClick: (team: Team) => void;
}

const GROUP_COLORS = [
  "from-red-600/20 to-red-800/10 border-red-500/30",
  "from-orange-600/20 to-orange-800/10 border-orange-500/30",
  "from-yellow-600/20 to-yellow-800/10 border-yellow-500/30",
  "from-green-600/20 to-green-800/10 border-green-500/30",
  "from-teal-600/20 to-teal-800/10 border-teal-500/30",
  "from-blue-600/20 to-blue-800/10 border-blue-500/30",
  "from-purple-600/20 to-purple-800/10 border-purple-500/30",
  "from-pink-600/20 to-pink-800/10 border-pink-500/30",
  "from-cyan-600/20 to-cyan-800/10 border-cyan-500/30",
  "from-lime-600/20 to-lime-800/10 border-lime-500/30",
  "from-amber-600/20 to-amber-800/10 border-amber-500/30",
  "from-slate-600/20 to-slate-800/10 border-slate-500/30",
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function GroupsTab({ groups, teams, games, onTeamClick }: GroupsTabProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "compact">("cards");

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));

  const groupGames = (groupName: string) =>
    games.filter((g) => g.group === groupName && g.type === "group");

  const sortedGroups = [...groups].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="p-4 space-y-4">
      {/* Controls row */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        {/* Group selector pills */}
        <div className="flex overflow-x-auto gap-2 pb-2 sm:pb-0 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 w-full sm:w-auto snap-x">
          <button
            onClick={() => setSelectedGroup(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap snap-start transition-colors ${
              selectedGroup === null
                ? "bg-yellow-400 text-black"
                : "bg-white/5 text-gray-400 border border-white/10"
            }`}
          >
            All Groups
          </button>
          {sortedGroups.map((g) => (
            <button
              key={g.name}
              onClick={() => setSelectedGroup(selectedGroup === g.name ? null : g.name)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap snap-start transition-colors ${
                selectedGroup === g.name
                  ? "bg-yellow-400 text-black"
                  : "bg-white/5 text-gray-400 border border-white/10"
              }`}
            >
              Group {g.name}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
          <button
            onClick={() => setViewMode("cards")}
            className={`p-1.5 rounded text-xs transition-colors ${viewMode === "cards" ? "bg-white/20 text-white" : "text-gray-500"}`}
            title="Grid View"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </button>
          <button
            onClick={() => setViewMode("compact")}
            className={`p-1.5 rounded text-xs transition-colors ${viewMode === "compact" ? "bg-white/20 text-white" : "text-gray-500"}`}
            title="List View"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          </button>
        </div>
      </div>

      {/* Groups grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className={`grid ${viewMode === "cards" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "grid-cols-1 gap-2 max-w-3xl mx-auto"}`}
      >
        <AnimatePresence mode="popLayout">
          {sortedGroups
            .filter((g) => !selectedGroup || g.name === selectedGroup)
            .map((group, idx) => {
              const sorted = [...group.teams].sort(
                (a, b) =>
                  parseInt(b.pts) - parseInt(a.pts) ||
                  parseInt(b.gd) - parseInt(a.gd) ||
                  parseInt(b.gf) - parseInt(a.gf)
              );
              const gGames = groupGames(group.name);
              const colorClass = GROUP_COLORS[idx % GROUP_COLORS.length];

              if (viewMode === "compact") {
                return (
                  <motion.div layout variants={itemVariants} key={group.name} className="glass-card rounded-lg border border-white/5 p-2 flex flex-col md:flex-row md:items-center gap-3">
                    <div className="w-16 flex-shrink-0 flex items-center justify-center border-r border-white/10">
                      <span className="font-bold text-yellow-400 text-lg">{group.name}</span>
                    </div>
                    <div className="flex-1 overflow-x-auto scrollbar-hide">
                      <div className="flex gap-2 min-w-max">
                        {sorted.map((row, pos) => {
                          const team = teamMap[row.team_id];
                          if (!team) return null;
                          return (
                            <button
                              key={row.team_id}
                              onClick={() => onTeamClick(team)}
                              className={`flex items-center gap-2 px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors border-l-2 ${pos < 2 ? "border-green-500" : pos === 2 ? "border-yellow-500" : "border-transparent"}`}
                            >
                              <span className="text-xs font-bold text-white w-3">{pos + 1}</span>
                              <img src={team.flag} alt="" className="w-4 h-3 object-cover rounded-sm" />
                              <span className="text-[10px] font-bold text-gray-300">{team.fifa_code}</span>
                              <span className="text-[10px] font-black text-yellow-400 ml-1">{row.pts}p</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  layout
                  variants={itemVariants}
                  key={group.name}
                  className={`rounded-xl border bg-gradient-to-br ${colorClass} overflow-hidden shadow-lg`}
                >
                  {/* Group header */}
                  <div className="px-4 py-3 flex items-center justify-between bg-black/20 backdrop-blur border-b border-white/5">
                    <h3 className="font-bold text-yellow-400 text-sm tracking-widest">GROUP {group.name}</h3>
                    <span className="text-[10px] font-bold text-gray-400 bg-black/40 px-2 py-0.5 rounded-full">{gGames.filter((g) => g.finished === "TRUE").length}/{gGames.length} played</span>
                  </div>

                  {/* Standings table */}
                  <div className="px-2 pb-2 pt-2">
                    {/* Headers (Expanded with GF/GA/GD) */}
                    <div className="grid grid-cols-[1fr_1.5rem_1.5rem_1.5rem_1.5rem_1.5rem_1.5rem_2rem] gap-0 text-[9px] font-bold text-gray-400 px-1 py-1 uppercase tracking-wider">
                      <span>Team</span>
                      <span className="text-center">MP</span>
                      <span className="text-center">W</span>
                      <span className="text-center">D</span>
                      <span className="text-center">L</span>
                      <span className="text-center text-green-400/70">GF</span>
                      <span className="text-center text-red-400/70">GA</span>
                      <span className="text-center font-black text-yellow-400/80">PTS</span>
                    </div>

                    {sorted.map((row, pos) => {
                      const team = teamMap[row.team_id];
                      if (!team) return null;
                      const isQualified = pos < 2;
                      const isThird = pos === 2;

                      return (
                        <button
                          key={row.team_id}
                          onClick={() => onTeamClick(team)}
                          className={`w-full grid grid-cols-[1fr_1.5rem_1.5rem_1.5rem_1.5rem_1.5rem_1.5rem_2rem] gap-0 px-1 py-1.5 rounded-lg mb-0.5
                            text-left hover:bg-white/10 transition-all group
                            ${isQualified ? "bg-green-500/10 border-l-[3px] border-green-500" : ""}
                            ${isThird ? "bg-yellow-500/10 border-l-[3px] border-yellow-500" : ""}
                            ${pos === 3 ? "border-l-[3px] border-transparent" : ""}
                          `}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-1">
                            <span className={`text-[10px] font-bold w-2 ${isQualified ? 'text-green-400' : isThird ? 'text-yellow-400' : 'text-gray-600'}`}>{pos + 1}</span>
                            <img
                              src={team.flag}
                              alt={team.name_en}
                              className="w-5 h-3.5 object-cover rounded shadow-[0_0_2px_rgba(0,0,0,0.5)] flex-shrink-0"
                            />
                            <span className="text-xs font-semibold text-white truncate group-hover:text-yellow-400 transition-colors">
                              {team.name_en}
                            </span>
                          </div>
                          <span className="text-center text-[10px] text-gray-400 my-auto">{row.mp}</span>
                          <span className="text-center text-[10px] text-white font-medium my-auto">{row.w}</span>
                          <span className="text-center text-[10px] text-gray-400 my-auto">{row.d}</span>
                          <span className="text-center text-[10px] text-gray-500 my-auto">{row.l}</span>
                          <span className="text-center text-[10px] text-green-400/80 my-auto">{row.gf}</span>
                          <span className="text-center text-[10px] text-red-400/80 my-auto">{row.ga}</span>
                          <span className="text-center text-xs font-black text-yellow-400 my-auto">{row.pts}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* GD Footer */}
                  <div className="px-4 py-2 border-t border-white/5 flex gap-2 text-[9px] font-bold text-gray-500 uppercase tracking-wider items-center justify-between">
                    <div className="flex gap-2">
                      {sorted.slice(0, 2).map((row) => {
                        const t = teamMap[row.team_id];
                        return t ? <span key={row.team_id} className="text-green-400">{t.fifa_code} ✓</span> : null;
                      })}
                    </div>
                    <div>
                      {sorted.map(r => r.gd).join(" · ")} <span className="text-gray-600">(GD)</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
        </AnimatePresence>
      </motion.div>

      {/* Legend */}
      <div className="flex justify-center gap-6 text-[10px] font-bold uppercase tracking-wider text-gray-500 pt-4 pb-2 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded bg-green-500"></div>
          <span>Qualified (Top 2)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded bg-yellow-500"></div>
          <span>Best 3rd Place</span>
        </div>
      </div>
    </div>
  );
}
