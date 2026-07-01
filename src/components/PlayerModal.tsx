"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Team, Game } from "@/lib/api";
import { parseScorers, normalizePlayerAlias } from "@/lib/api";
import { formatMatchDateNPT } from "@/lib/date-utils";
import CachedPlayerImage from "./CachedPlayerImage";
import { getPlayerFifaRating } from "@/lib/player-ratings";


interface PlayerModalProps {
  playerName: string;
  teamId: string;
  games: Game[];
  teams: Team[];
  onClose: () => void;
}

interface MatchScoredInfo {
  game: Game;
  opponentName: string;
  opponentFlag: string;
  isHome: boolean;
  minutes: string[];
  goalsCount: number;
}

export default function PlayerModal({ playerName: rawPlayerName, teamId, games, teams, onClose }: PlayerModalProps) {
  // Normalize abbreviated FIFA names (e.g. "K. Mbappé") to full names ("Kylian Mbappé")
  const playerName = normalizePlayerAlias(rawPlayerName);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const playerTeam = teams.find((t) => t.id === teamId);
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));

  // Find all games where player's team played
  const teamGames = games
    .filter((g) => g.home_team_id === teamId || g.away_team_id === teamId)
    .sort((a, b) => parseInt(a.id) - parseInt(b.id));

  const finishedTeamGames = teamGames.filter((g) => g.finished === "TRUE");

  // Find all matches where the player scored and the minutes
  const matchesScoredIn: MatchScoredInfo[] = [];
  let totalGoals = 0;
  let penaltyGoals = 0;

  for (const g of finishedTeamGames) {
    const isHome = g.home_team_id === teamId;
    const rawScorers = isHome ? g.home_scorers : g.away_scorers;
    const parsed = parseScorers(rawScorers);
    
    const minutes: string[] = [];
    let goalsCount = 0;

    for (const s of parsed) {
      if (s.toLowerCase().includes("(og)")) continue;
      
      const normalizedScorer = extractNameForCompare(s);
      
      if (normalizedScorer.toLowerCase() === playerName.toLowerCase()) {
        goalsCount++;
        totalGoals++;
        
        // Extract minute
        const minMatch = s.match(/(\d+)\+?\d*'/);
        const minute = minMatch ? `${minMatch[1]}'` : "Goal";
        const isPen = s.toLowerCase().includes("(p)");
        
        if (isPen) {
          penaltyGoals++;
          minutes.push(`${minute} (P)`);
        } else {
          minutes.push(minute);
        }
      }
    }

    if (goalsCount > 0) {
      const oppId = isHome ? g.away_team_id : g.home_team_id;
      const oppTeam = teamMap[oppId];
      matchesScoredIn.push({
        game: g,
        opponentName: oppTeam?.name_en || (isHome ? g.away_team_name_en : g.home_team_name_en) || "TBD",
        opponentFlag: oppTeam?.flag || "",
        isHome,
        minutes,
        goalsCount,
      });
    }
  }

  // Helper: extract & normalize scorer string to a full player name using shared alias map
  function extractNameForCompare(scorerStr: string): string {
    const nameMatch = scorerStr.match(/^(.+?)\s+\d+/);
    const name = nameMatch ? nameMatch[1].trim() : scorerStr.trim();
    return normalizePlayerAlias(name);
  }

  // Key Contributor Score: (goals - penalties) * 3 + penalties * 2
  const scorePoints = (totalGoals - penaltyGoals) * 3 + penaltyGoals * 2;
  // Goals ratio based on player's team matches played
  const matchesCount = finishedTeamGames.length;
  const goalsRatio = matchesCount > 0 ? (totalGoals / matchesCount).toFixed(2) : "0.00";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        ref={overlayRef}
        className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose();
        }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

        {/* Modal Window */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 w-full sm:w-[500px] max-h-[85vh] bg-[#0d1526] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        >
          {/* Header Area */}
          <div
            className="relative px-5 pt-6 pb-4 shrink-0"
            style={{ background: `linear-gradient(135deg, #1b2640 0%, #0d1526 100%)` }}
          >
            {/* Background flag blur */}
            {playerTeam?.flag && (
              <div
                className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none"
                style={{
                  backgroundImage: `url(${playerTeam.flag})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "blur(20px)",
                }}
              />
            )}

            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-gray-400 hover:text-white z-20"
            >
              ✕
            </button>

            <div className="flex items-center gap-4 relative z-10">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                <CachedPlayerImage
                  playerName={playerName}
                  className="w-full h-full rounded-full object-cover bg-black/40 border border-yellow-500/30 shadow-[0_0_15px_rgba(255,94,0,0.15)]"
                />
                {playerTeam?.flag && (
                  <img
                    src={playerTeam.flag}
                    alt={playerTeam.name_en}
                    className="absolute -bottom-1 -right-1 w-6 h-4.5 object-cover rounded shadow-md border border-black/40"
                  />
                )}
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-widest text-[#ff5e00] font-black">
                  Player Statistics
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mt-0.5">
                  {playerName}
                </h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-gray-400 font-bold bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                    {playerTeam?.name_en || "France"}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                    {playerTeam?.fifa_code || "FRA"}
                  </span>
                  <span className="text-[10px] text-yellow-400/90 font-bold bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded uppercase tracking-wider">
                    Group {playerTeam?.groups || "I"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-2.5 mt-6 relative z-10">
              <div className="bg-[#131b30]/65 border border-white/5 rounded-xl py-2 px-1 text-center shadow-sm">
                <div className="text-lg sm:text-xl font-extrabold text-white">{totalGoals}</div>
                <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                  Goals {penaltyGoals > 0 && `(${penaltyGoals} Pen)`}
                </div>
              </div>
              <div className="bg-[#131b30]/65 border border-white/5 rounded-xl py-2 px-1 text-center shadow-sm">
                <div className="text-lg sm:text-xl font-extrabold text-cyan-400">{scorePoints}</div>
                <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                  Contributor Points
                </div>
              </div>
              <div className="bg-[#131b30]/65 border border-white/5 rounded-xl py-2 px-1 text-center shadow-sm">
                <div className="text-lg sm:text-xl font-extrabold text-green-400">{goalsRatio}</div>
                <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                  Goals / Game
                </div>
              </div>
            </div>

            {/* FIFA rating — shown only when we have a verified EA FC rating (no invented numbers) */}
            {getPlayerFifaRating(playerName) != null && (
              <div className="grid grid-cols-1 gap-3 mt-3 relative z-10">
                <div className="bg-[#131b30]/65 border border-yellow-500/20 rounded-xl p-3 flex items-center justify-between shadow-sm">
                  <div className="text-left">
                    <div className="text-[8px] text-yellow-400 font-extrabold uppercase tracking-wider">FIFA Rating</div>
                    <div className="text-xl font-black text-white mt-0.5">{getPlayerFifaRating(playerName)}</div>
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-yellow-500/30 flex items-center justify-center text-[9px] font-black text-yellow-400 bg-yellow-500/5 select-none shadow-[0_0_8px_rgba(234,179,8,0.2)] shrink-0">
                    FIFA
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Scrollable Stats Details */}
          <div className="overflow-y-auto flex-1 p-4 space-y-5 pb-safe-bottom">
            {/* Matches Scored In Timeline */}
            <div>
              <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-4 h-px bg-gray-600"></span> ⚽ Goals Timeline <span className="flex-1 h-px bg-gray-800"></span>
              </h3>

              {matchesScoredIn.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs">
                  No matches scored in this tournament.
                </div>
              ) : (
                <div className="space-y-2">
                  {matchesScoredIn.map(({ game, opponentName, opponentFlag, isHome, minutes, goalsCount }) => {
                    const finished = game.finished === "TRUE";
                    const formattedDate = formatMatchDateNPT(game.local_date, game.stadium_id);
                    
                    const scoreStr = isHome 
                      ? `${game.home_score} - ${game.away_score}` 
                      : `${game.away_score} - ${game.home_score}`;
                    
                    const matchResult = finished 
                      ? (parseInt(isHome ? game.home_score : game.away_score) > parseInt(isHome ? game.away_score : game.home_score) ? "W" : 
                         parseInt(isHome ? game.home_score : game.away_score) === parseInt(isHome ? game.away_score : game.home_score) ? "D" : "L") 
                      : null;
                    
                    const resultColors = { 
                      W: "bg-green-500/10 text-green-400 border border-green-500/20", 
                      D: "bg-gray-500/10 text-gray-400 border border-gray-500/20", 
                      L: "bg-red-500/10 text-red-400 border border-red-500/20" 
                    };

                    return (
                      <div
                        key={game.id}
                        className="bg-white/3 border border-white/5 hover:border-white/10 rounded-xl p-3 flex flex-col transition-all duration-300"
                      >
                        <div className="flex items-center justify-between text-[8px] sm:text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-2">
                          <span>
                            {game.type === "group" ? "Group Stage" : game.type.toUpperCase()}
                          </span>
                          <span>{formattedDate}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            {opponentFlag ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={opponentFlag}
                                  alt={opponentName}
                                  className="w-5 h-4 object-cover rounded-sm border border-white/10 flex-shrink-0"
                                />
                              </>
                            ) : (
                              <div className="w-5 h-4 bg-white/10 rounded-sm flex-shrink-0" />
                            )}
                            <span className="text-sm font-bold text-white truncate">
                              {isHome ? "vs " : "@ "}{opponentName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {finished && (
                              <span className="text-xs font-black text-gray-300 bg-black/40 px-2 py-0.5 rounded">
                                {scoreStr}
                              </span>
                            )}
                            {matchResult && (
                              <span className={`text-[9px] font-black w-5 h-5 flex items-center justify-center rounded ${resultColors[matchResult]}`}>
                                {matchResult}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Goal Markers */}
                        <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-wrap items-center gap-1.5">
                          <span className="text-[9px] text-gray-400 font-extrabold uppercase mr-1">
                            Scored at:
                          </span>
                          {minutes.map((min, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-bold bg-yellow-400/15 text-yellow-400 border border-yellow-400/20 px-2 py-0.5 rounded-full"
                            >
                              ⚽ {min}
                            </span>
                          ))}
                          {goalsCount > 1 && (
                            <span className="text-[8px] bg-amber-500/20 text-amber-400 font-black uppercase px-2 py-0.5 rounded-full ml-auto">
                              {goalsCount} Goals Game
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Campaign Summary */}
            <div className="bg-white/3 border border-white/5 rounded-xl p-3.5">
              <h4 className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest mb-2.5">
                🏟️ Campaign Context
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                {playerName} has represented <strong>{playerTeam?.name_en}</strong> in <strong>{matchesCount}</strong> tournament appearances. The team has scored a total of <strong>{finishedTeamGames.reduce((acc, g) => acc + parseInt(g.home_team_id === teamId ? g.home_score : g.away_score || "0"), 0)}</strong> goals so far, with {playerName} accounting for <strong>{((totalGoals / Math.max(1, finishedTeamGames.reduce((acc, g) => acc + parseInt(g.home_team_id === teamId ? g.home_score : g.away_score || "0"), 0))) * 100).toFixed(0)}%</strong> of their offensive output.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
