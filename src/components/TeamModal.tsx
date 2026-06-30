"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Team, Game, Group, Stadium } from "@/lib/api";
import { parseScorers } from "@/lib/api";
import { formatMatchDateNPT, formatTimeNPT } from "@/lib/date-utils";

interface TeamModalProps {
  team: Team | null;
  games: Game[];
  groups: Group[];
  stadiums: Stadium[];
  teamMap: { [key: string]: Team };
  onClose: () => void;
}

// From the round of 32 onward a level scoreline is decided on penalties — once penalty scores
// are present, they determine the result instead of treating it as a draw.
function getMatchResult(g: Game, teamId: string): "W" | "D" | "L" | null {
  if (g.finished !== "TRUE") return null;
  const isHome = g.home_team_id === teamId;
  const gf = parseInt(isHome ? g.home_score : g.away_score) || 0;
  const ga = parseInt(isHome ? g.away_score : g.home_score) || 0;
  if (gf !== ga) return gf > ga ? "W" : "L";
  const hp = parseInt(g.home_penalty_score || "");
  const ap = parseInt(g.away_penalty_score || "");
  if (!isNaN(hp) && !isNaN(ap)) {
    const teamPen = isHome ? hp : ap;
    const oppPen = isHome ? ap : hp;
    if (teamPen !== oppPen) return teamPen > oppPen ? "W" : "L";
  }
  return "D";
}

function StatBox({ label, value, sub, delay }: { label: string; value: string | number; sub?: string; delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 200, damping: 20 }}
      className="bg-[#1a2744]/45 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 text-center border border-white/5 relative overflow-hidden group shadow-md hover:border-yellow-400/20 transition-all flex flex-col justify-center min-h-[76px] sm:min-h-[84px]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 via-transparent to-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="text-lg sm:text-2xl font-black text-white tracking-tight leading-none mb-1 relative z-10">{value}</div>
      <div className="text-[8px] sm:text-[10px] text-gray-400 font-extrabold uppercase tracking-wider leading-tight relative z-10">{label}</div>
      {sub && <div className="text-[7px] sm:text-[9px] text-gray-500 font-bold mt-1.5 leading-none relative z-10">{sub}</div>}
    </motion.div>
  );
}

export default function TeamModal({ team, games, groups, stadiums, teamMap, onClose }: TeamModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (team) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [team]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!team) return null;

  const teamGames = games
    .filter(
      (g) =>
        g.home_team_id === team.id ||
        g.away_team_id === team.id
    )
    .sort((a, b) => parseInt(a.id) - parseInt(b.id));

  const finishedGames = teamGames.filter((g) => g.finished === "TRUE");
  const upcomingGames = teamGames.filter((g) => g.finished !== "TRUE" && g.time_elapsed === "notstarted");

  let goalsFor = 0, goalsAgainst = 0, wins = 0, draws = 0, losses = 0;
  for (const g of finishedGames) {
    const isHome = g.home_team_id === team.id;
    const gf = parseInt(isHome ? g.home_score : g.away_score) || 0;
    const ga = parseInt(isHome ? g.away_score : g.home_score) || 0;
    goalsFor += gf;
    goalsAgainst += ga;
    const result = getMatchResult(g, team.id);
    if (result === "W") wins++;
    else if (result === "D") draws++;
    else losses++;
  }

  const groupData = groups.find((g) => g.name === team.groups);
  const teamStanding = groupData?.teams
    .slice()
    .sort((a, b) => parseInt(b.pts) - parseInt(a.pts) || parseInt(b.gd) - parseInt(a.gd))
    .findIndex((t) => t.team_id === team.id);

  const stadiumMap = Object.fromEntries(stadiums.map((s) => [s.id, s]));

  // A team is out once every game we know about for them is finished and none remain scheduled
  // (the bracket pre-creates each round's fixture once a team is confirmed into it).
  const hasFutureOrLiveGame = teamGames.some((g) => g.finished !== "TRUE");
  const isDisqualified = finishedGames.length > 0 && !hasFutureOrLiveGame;
  const statusGame = hasFutureOrLiveGame
    ? teamGames.find((g) => g.finished !== "TRUE")
    : finishedGames[finishedGames.length - 1];

  // Compute team's scorers
  const scorerCounts: { [name: string]: number } = {};
  for (const g of finishedGames) {
    const isHome = g.home_team_id === team.id;
    const raw = isHome ? g.home_scorers : g.away_scorers;
    const parsed = parseScorers(raw);
    for (const s of parsed) {
      if (s.includes("(og)")) continue;
      const nameMatch = s.match(/^(.+?)\s+\d+/);
      const name = nameMatch ? nameMatch[1].trim() : s.trim();
      if (name) scorerCounts[name] = (scorerCounts[name] || 0) + 1;
    }
  }
  const teamScorers = Object.entries(scorerCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const getStageLabel = (type: string) => {
    const map: { [key: string]: string } = {
      group: "Group Stage",
      r32: "Round of 32",
      r16: "Round of 16",
      qf: "Quarter-final",
      sf: "Semi-final",
      final: "Final",
      third_place: "3rd Place Play-off",
    };
    return map[type] || type.toUpperCase();
  };

  const statusRoundLabel = statusGame ? getStageLabel(statusGame.type) : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        ref={overlayRef}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose();
        }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 w-full sm:w-[520px] max-h-[90vh] sm:max-h-[85vh] bg-[#0d1526] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div
            className="relative px-5 pt-6 pb-4 overflow-hidden shrink-0"
            style={{ background: `linear-gradient(135deg, #1a2744 0%, #0d1526 100%)` }}
          >
            {/* Background flag blur */}
            {team.flag && (
              <div 
                className="absolute inset-0 opacity-10 mix-blend-overlay"
                style={{ backgroundImage: `url(${team.flag})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(20px)' }}
              />
            )}
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-gray-400 hover:text-white z-20"
            >
              ✕
            </button>

            <div className="flex items-center gap-4 relative z-10">
              {team.flag && (
                <motion.img
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring" }}
                  src={team.flag}
                  alt={team.name_en}
                  className="w-16 h-12 object-cover rounded-lg shadow-lg border border-white/10"
                />
              )}
              <div>
                <h2 className="text-xl font-black text-white">{team.name_en}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 rounded-full px-2 py-0.5 font-bold uppercase tracking-wider">
                    GROUP {team.groups}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold bg-white/5 px-2 py-0.5 rounded border border-white/5">{team.fifa_code}</span>
                  {teamStanding !== undefined && teamStanding >= 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      teamStanding < 2 ? "text-green-400 bg-green-400/10 border-green-400/20" :
                      teamStanding === 2 ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" :
                      "text-gray-400 bg-gray-400/10 border-gray-400/20"
                    }`}>
                      #{teamStanding + 1} in group
                    </span>
                  )}
                  {isDisqualified ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-red-400 bg-red-400/10 border-red-400/30 uppercase tracking-wider">
                      Disqualified{statusRoundLabel ? ` — ${statusRoundLabel}` : ""}
                    </span>
                  ) : statusRoundLabel && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-blue-400 bg-blue-400/10 border-blue-400/20 uppercase tracking-wider">
                      {statusRoundLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3 mt-6 relative z-10">
              <StatBox label="Played" value={finishedGames.length} delay={0.1} />
              <StatBox label="Wins" value={wins} delay={0.15} />
              <StatBox label="Goals" value={goalsFor} sub={`Conceded: ${goalsAgainst}`} delay={0.2} />
              <StatBox label="Points" value={wins * 3 + draws} delay={0.25} />
            </div>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 p-4 space-y-6 pb-safe-bottom">
            {/* Form */}
            {finishedGames.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-4 h-px bg-gray-600"></span> Recent Form <span className="flex-1 h-px bg-gray-800"></span>
                </h3>
                <div className="flex gap-2">
                  {finishedGames.slice(-5).map((g) => {
                    const result = getMatchResult(g, team.id) ?? "D";
                    const colors = {
                      W: "bg-green-500/20 text-green-400 border-green-500/30", 
                      D: "bg-gray-500/20 text-gray-400 border-gray-500/30", 
                      L: "bg-red-500/20 text-red-400 border-red-500/30" 
                    };
                    return (
                      <div
                        key={g.id}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs ${colors[result]}`}
                        title={`${g.home_team_name_en} ${g.home_score}-${g.away_score} ${g.away_team_name_en}`}
                      >
                        {result}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Top scorers */}
            {teamScorers.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-gray-600"></span> ⚽ Key Scorers <span className="flex-1 h-px bg-gray-800"></span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {teamScorers.map(([name, goals]) => (
                    <div key={name} className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-xl px-3 py-2.5 hover:bg-white/8 transition-all duration-300">
                      <span className="text-xs sm:text-sm font-bold text-white flex-1 truncate">{name}</span>
                      <div className="flex items-center gap-1.5 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
                        <span className="text-yellow-400 font-extrabold text-xs">{goals}</span>
                        <span className="text-[8px] text-yellow-400/70 font-black uppercase">Goal{goals > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Fixtures */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="w-4 h-px bg-gray-600"></span> 📅 All Fixtures (NPT) <span className="flex-1 h-px bg-gray-800"></span>
              </h3>
              <div className="space-y-2">
                {teamGames.map((g) => {
                  const isHome = g.home_team_id === team.id;
                  const opponent = teamMap[isHome ? g.away_team_id : g.home_team_id];
                  const oppName = opponent?.name_en || (isHome ? g.away_team_name_en : g.home_team_name_en) || "TBD";
                  const oppFlag = opponent?.flag;
                  const finished = g.finished === "TRUE";
                  const gf = parseInt(isHome ? g.home_score : g.away_score) || 0;
                  const ga = parseInt(isHome ? g.away_score : g.home_score) || 0;
                  const result = finished ? (gf > ga ? "W" : gf === ga ? "D" : "L") : null;
                  const resultColors = { W: "text-green-400", D: "text-gray-400", L: "text-red-400" };
                  const stadium = stadiumMap[g.stadium_id];
                  const isLive = g.time_elapsed !== "notstarted" && !finished;

                  const dateStrNpt = formatMatchDateNPT(g.local_date, g.stadium_id) || "TBD";
                  const timeNpt = formatTimeNPT(g.local_date, g.stadium_id);

                  return (
                    <div
                      key={g.id}
                      className={`rounded-xl p-3 border transition-all
                        ${isLive ? "border-red-500/40 bg-red-500/5" : "border-white/5 bg-white/3"}
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{getStageLabel(g.type)}</span>
                        {isLive && (
                          <span className="text-[9px] text-red-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full live-pulse inline-block"></span>
                            LIVE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Opponent */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-[10px] text-gray-500">{isHome ? "vs" : "@"}</span>
                          {oppFlag ? <img src={oppFlag} alt="" className="w-5 h-4 object-cover rounded-sm border border-white/10" /> : <div className="w-5 h-4 bg-white/10 rounded-sm"></div>}
                          <span className="text-sm font-bold text-white truncate">{oppName}</span>
                        </div>

                        {/* Score / date */}
                        {finished ? (
                          <div className="text-right flex-shrink-0 bg-black/40 px-2 py-1 rounded-lg border border-white/5">
                            <span className={`text-lg font-black ${result ? resultColors[result] : ""}`}>
                              {gf} – {ga}
                            </span>
                            <span className={`ml-1.5 text-[10px] font-bold ${result ? resultColors[result] : ""}`}>
                              {result}
                            </span>
                          </div>
                        ) : (
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-bold text-white">{timeNpt}</div>
                            <div className="text-[9px] text-gray-500">{dateStrNpt}</div>
                          </div>
                        )}
                      </div>

                      {stadium && (
                        <div className="mt-2 text-[9px] text-gray-500 flex items-center gap-1">
                          📍 {stadium.name_en}, {stadium.city_en}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
