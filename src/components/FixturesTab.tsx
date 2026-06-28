"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Game, Team, Stadium } from "@/lib/api";
import { parseScorers } from "@/lib/api";
import { formatMatchDateNPT, formatTimeNPT, isMatchToday, isMatchTomorrow } from "@/lib/date-utils";

interface FixturesTabProps {
  games: Game[];
  teams: Team[];
  stadiums: Stadium[];
  onTeamClick: (team: Team) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 20 } }
};

export default function FixturesTab({ games, teams, stadiums, onTeamClick }: FixturesTabProps) {
  const [filter, setFilter] = useState<"all" | "live" | "upcoming" | "finished">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const teamMap = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t])), [teams]);
  const stadiumMap = useMemo(() => Object.fromEntries(stadiums.map((s) => [s.id, s])), [stadiums]);

  // Stage labels mapping
  const getStageLabel = (type: string) => {
    const map: { [key: string]: string } = {
      group: "Group Stage",
      r32: "Round of 32",
      r16: "Round of 16",
      qf: "Quarter-finals",
      sf: "Semi-finals",
      final: "Final",
      third_place: "3rd Place Play-off",
    };
    return map[type] || type.toUpperCase();
  };

  // Get unique stages for dropdown
  const stages = useMemo(() => {
    const unique = new Set(games.map((g) => g.type));
    return ["all", ...Array.from(unique)];
  }, [games]);

  // Filter and search logic
  const filteredGames = useMemo(() => {
    return games
      .filter((g) => {
        // Status filter
        const isLive = g.time_elapsed !== "notstarted" && g.finished !== "TRUE";
        const isFinished = g.finished === "TRUE";
        const isUpcoming = g.time_elapsed === "notstarted";

        if (filter === "live" && !isLive) return false;
        if (filter === "finished" && !isFinished) return false;
        if (filter === "upcoming" && !isUpcoming) return false;

        // Stage filter
        if (selectedStage !== "all" && g.type !== selectedStage) return false;

        // Search query
        if (searchQuery.trim() !== "") {
          const query = searchQuery.toLowerCase();
          const homeName = (teamMap[g.home_team_id]?.name_en || g.home_team_label || g.home_team_name_en || "").toLowerCase();
          const awayName = (teamMap[g.away_team_id]?.name_en || g.away_team_label || g.away_team_name_en || "").toLowerCase();
          const stadiumName = (stadiumMap[g.stadium_id]?.name_en || "").toLowerCase();
          const cityName = (stadiumMap[g.stadium_id]?.city_en || "").toLowerCase();

          return (
            homeName.includes(query) ||
            awayName.includes(query) ||
            stadiumName.includes(query) ||
            cityName.includes(query) ||
            g.id.includes(query)
          );
        }

        return true;
      })
      .sort((a, b) => {
        // Sort: Live first, then upcoming (ascending date), then finished (descending date)
        const aLive = a.time_elapsed !== "notstarted" && a.finished !== "TRUE" ? 1 : 0;
        const bLive = b.time_elapsed !== "notstarted" && b.finished !== "TRUE" ? 1 : 0;
        if (aLive !== bLive) return bLive - aLive;

        const aFinished = a.finished === "TRUE" ? 1 : 0;
        const bFinished = b.finished === "TRUE" ? 1 : 0;
        if (aFinished !== bFinished) return aFinished - bFinished; // Unfinished first

        return new Date(a.local_date).getTime() - new Date(b.local_date).getTime();
      });
  }, [games, filter, selectedStage, searchQuery, teamMap, stadiumMap]);

  return (
    <div className="p-4 space-y-4">
      {/* Header section with logo */}
      <div className="flex items-center gap-3 bg-[#111827]/30 backdrop-blur-md rounded-2xl p-4 border border-white/5 shadow-xl">
        <div className="relative w-10 h-10 flex-shrink-0 rounded-full bg-neutral-950 border border-[#ff5e00]/40 overflow-hidden flex items-center justify-center shadow-[0_0_10px_rgba(255,94,0,0.3)]">
          <img src="/tiger.png" alt="logo" className="w-10 h-10 object-contain scale-110 select-none" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider gold-text leading-none">Fixtures & Schedule</h2>
          <p className="text-[8px] sm:text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">FIFA WORLD CUP 2026</p>
        </div>
      </div>

      {/* Search & Filter Header */}
      <div className="flex flex-col gap-4 bg-[#111827]/40 backdrop-blur-md rounded-2xl p-4 border border-white/5 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search team, stadium, city, or Match ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/5 hover:border-white/10 focus:border-[#ff5e00]/50 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 outline-none transition-colors"
            />
          </div>

          {/* Stage Dropdown */}
          <div className="relative shrink-0 min-w-[160px] z-30">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between bg-black/40 border border-white/5 hover:border-white/10 rounded-xl py-2.5 px-4 text-xs text-white transition-colors cursor-pointer text-left focus:border-[#ff5e00]/50 outline-none"
            >
              <span>{selectedStage === "all" ? "All Stages" : getStageLabel(selectedStage)}</span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 mt-2 bg-[#0d1526] border border-white/10 rounded-xl shadow-2xl z-20 py-1.5 overflow-hidden max-h-[250px] overflow-y-auto"
                  >
                    <button
                      onClick={() => {
                        setSelectedStage("all");
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors hover:bg-white/5 hover:text-yellow-400 ${
                        selectedStage === "all" ? "text-yellow-400 font-bold bg-white/5" : "text-gray-300"
                      }`}
                    >
                      All Stages
                    </button>
                    {stages
                      .filter((s) => s !== "all")
                      .map((stage) => (
                        <button
                          key={stage}
                          onClick={() => {
                            setSelectedStage(stage);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs transition-colors hover:bg-white/5 hover:text-yellow-400 ${
                            selectedStage === stage ? "text-yellow-400 font-bold bg-white/5" : "text-gray-300"
                          }`}
                        >
                          {getStageLabel(stage)}
                        </button>
                      ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {(["all", "live", "upcoming", "finished"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
                filter === t
                  ? "bg-yellow-400 border-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.25)]"
                  : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
              }`}
            >
              {t === "all" ? "All Fixtures" : t === "live" ? "🔴 Live" : t === "upcoming" ? "⏳ Upcoming" : "🏁 Finished"}
            </button>
          ))}
        </div>
      </div>

      {/* Fixtures List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {filteredGames.map((game) => {
            const homeTeam = teamMap[game.home_team_id];
            const awayTeam = teamMap[game.away_team_id];
            const stadium = stadiumMap[game.stadium_id];

            const finished = game.finished === "TRUE";
            const isLive = game.time_elapsed !== "notstarted" && !finished;
            const isPending = !isLive && !finished;

            const homeName = homeTeam?.name_en || game.home_team_label || game.home_team_name_en || "TBD";
            const awayName = awayTeam?.name_en || game.away_team_label || game.away_team_name_en || "TBD";

            const hs = parseInt(game.home_score) || 0;
            const as_ = parseInt(game.away_score) || 0;
            const homeWin = finished && hs > as_;
            const awayWin = finished && as_ > hs;

            const nptDate = formatMatchDateNPT(game.local_date, game.stadium_id);
            const timeNpt = formatTimeNPT(game.local_date, game.stadium_id);

            const homeScorersStr = parseScorers(game.home_scorers).map(s => s.replace(/['"]/g, "").trim()).join(", ");
            const awayScorersStr = parseScorers(game.away_scorers).map(s => s.replace(/['"]/g, "").trim()).join(", ");

            return (
              <motion.div
                layout
                variants={itemVariants}
                key={game.id}
                className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group shadow-md hover:shadow-lg
                  ${isLive 
                    ? "border-red-500/40 bg-gradient-to-br from-red-950/15 to-[#0d1526] shadow-[0_0_20px_rgba(239,68,68,0.05)]" 
                    : "border-white/5 bg-[#111827]/25 hover:border-white/10"
                  }
                `}
                style={{
                  background: isLive 
                    ? "linear-gradient(135deg, #1b0c0c 0%, #0d1526 100%)" 
                    : "linear-gradient(135deg, #111827/40 0%, #0d1526 100%)"
                }}
              >
                {/* Card Header */}
                <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 bg-black/30 border border-white/5 px-2.5 py-1 rounded-full">
                    Match {game.id} • {getStageLabel(game.type)} {game.group ? `• Group ${game.group}` : ""}
                  </span>
                  {isLive ? (
                    <span className="text-[10px] text-red-400 font-black flex items-center gap-1.5 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full live-pulse"></span>
                      LIVE {game.time_elapsed.replace(/live/i, "").trim()}
                    </span>
                  ) : finished ? (
                    <span className="text-[9px] text-yellow-400 font-extrabold uppercase tracking-wider bg-yellow-400/10 border border-yellow-400/20 px-2.5 py-0.5 rounded-full">
                      Full Time
                    </span>
                  ) : (
                    <span className="text-[9px] text-blue-400 font-extrabold uppercase tracking-wider bg-blue-400/10 border border-blue-400/20 px-2.5 py-0.5 rounded-full">
                      Upcoming
                    </span>
                  )}
                </div>

                {/* Scoreboard Row */}
                <div className="flex items-center justify-between gap-3 my-2">
                  {/* Home Team */}
                  <button 
                    disabled={!homeTeam}
                    onClick={() => homeTeam && onTeamClick(homeTeam)}
                    className="flex-1 flex items-center gap-2.5 min-w-0 text-left group/btn"
                  >
                    <div className={`w-8 h-6 rounded overflow-hidden shadow border border-white/10 shrink-0 bg-black/40 flex items-center justify-center transition-transform group-hover/btn:scale-105 ${homeWin ? "ring-1 ring-yellow-400" : ""}`}>
                      {homeTeam?.flag ? <img src={homeTeam.flag} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-800" />}
                    </div>
                    <span className={`text-xs sm:text-sm font-bold truncate group-hover/btn:text-yellow-400 transition-colors ${homeWin ? "text-white" : "text-gray-300"}`}>
                      {homeName}
                    </span>
                  </button>

                  {/* Score Box */}
                  <div className="flex items-center justify-center shrink-0 bg-black/30 px-3 py-1.5 rounded-xl border border-white/5 font-black text-sm min-w-[64px]">
                    {finished || isLive ? (
                      <span className="flex items-center gap-1.5 text-white">
                        <span className={homeWin ? "text-yellow-400" : ""}>{hs}</span>
                        <span className="text-gray-600">:</span>
                        <span className={awayWin ? "text-yellow-400" : ""}>{as_}</span>
                      </span>
                    ) : (
                      <span className="text-gray-500 uppercase tracking-widest text-[9px] font-black">
                        {timeNpt.replace(" NPT", "")}
                      </span>
                    )}
                  </div>

                  {/* Away Team */}
                  <button 
                    disabled={!awayTeam}
                    onClick={() => awayTeam && onTeamClick(awayTeam)}
                    className="flex-1 flex items-center justify-end gap-2.5 min-w-0 text-right group/btn"
                  >
                    <span className={`text-xs sm:text-sm font-bold truncate order-first group-hover/btn:text-yellow-400 transition-colors ${awayWin ? "text-white" : "text-gray-300"}`}>
                      {awayName}
                    </span>
                    <div className={`w-8 h-6 rounded overflow-hidden shadow border border-white/10 shrink-0 bg-black/40 flex items-center justify-center transition-transform group-hover/btn:scale-105 ${awayWin ? "ring-1 ring-yellow-400" : ""}`}>
                      {awayTeam?.flag ? <img src={awayTeam.flag} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-800" />}
                    </div>
                  </button>
                </div>

                {/* Scorers Inline Block (Squeezed & Clean) */}
                {(homeScorersStr || awayScorersStr) && (
                  <div className="mt-3 pt-2.5 border-t border-white/5 grid grid-cols-2 gap-3 text-[9px] text-gray-500">
                    <div className="truncate flex items-center gap-1">
                      {homeScorersStr && (
                        <>
                          <span className="text-yellow-500">⚽</span>
                          <span className="truncate" title={homeScorersStr}>{homeScorersStr}</span>
                        </>
                      )}
                    </div>
                    <div className="truncate flex items-center justify-end gap-1 text-right">
                      {awayScorersStr && (
                        <>
                          <span className="truncate" title={awayScorersStr}>{awayScorersStr}</span>
                          <span className="text-yellow-500">⚽</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Card Footer (Stadium & Date details) */}
                <div className="mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[9px] text-gray-500">
                  <span className="flex items-center gap-1 truncate max-w-full">
                    📍 {stadium ? `${stadium.name_en}, ${stadium.city_en}` : "TBD"}
                  </span>
                  <span className="font-semibold text-gray-400">
                    {nptDate}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredGames.length === 0 && (
        <div className="rounded-2xl border border-white/5 bg-[#111827]/10 p-12 flex flex-col items-center justify-center text-center">
          <span className="text-3xl mb-3">🔍</span>
          <h4 className="text-white font-bold text-sm mb-1">No fixtures found</h4>
          <p className="text-gray-500 text-xs max-w-xs">No matches match your current filters. Try refining your search query.</p>
        </div>
      )}
    </div>
  );
}
