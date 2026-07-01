"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Game, Team, Stadium } from "@/lib/api";
import { formatMatchDateNPT } from "@/lib/date-utils";

interface MatchDetailsModalProps {
  game: Game;
  teamMap: { [key: string]: Team };
  stadiumMap: { [key: string]: Stadium };
  onClose: () => void;
}

interface HeadToHeadMeeting {
  year: number;
  round: string;
  homeGoals: number;
  awayGoals: number;
  penaltyWinner: "home" | "away" | null;
}

interface HeadToHeadData {
  matched: boolean;
  totalMeetings: number;
  homeWins: number;
  awayWins: number;
  draws: number;
  meetings: HeadToHeadMeeting[];
}

function h2hSummary(homeName: string, awayName: string, h: HeadToHeadData): string {
  const { totalMeetings, homeWins, awayWins, draws } = h;
  if (totalMeetings === 0) return `First-ever World Cup meeting between ${homeName} and ${awayName}.`;
  const record = `${homeWins}-${draws}-${awayWins}`;
  const times = `${totalMeetings} World Cup meeting${totalMeetings > 1 ? "s" : ""}`;
  if (homeWins > awayWins) return `${homeName} lead ${record} across ${times}.`;
  if (awayWins > homeWins) return `${awayName} lead ${record} across ${times}.`;
  return `Level at ${record} across ${times}.`;
}

export default function MatchDetailsModal({ game, teamMap, stadiumMap, onClose }: Readonly<MatchDetailsModalProps>) {
  const homeTeam = teamMap[game.home_team_id];
  const awayTeam = teamMap[game.away_team_id];
  const stadium = stadiumMap[game.stadium_id];

  const homeName = homeTeam?.name_en || game.home_team_name_en || "TBD";
  const awayName = awayTeam?.name_en || game.away_team_name_en || "TBD";
  const homeFifa = homeTeam?.fifa_code || "TBD";
  const awayFifa = awayTeam?.fifa_code || "TBD";

  const dateTime = formatMatchDateNPT(game.local_date, game.stadium_id);

  // Keyed by team pair so a still-loading result never gets attributed to the wrong matchup —
  // every setState call lives inside the fetch callback, not synchronously in the effect body.
  const h2hKey = `${homeName}|${awayName}`;
  const [h2hResult, setH2hResult] = useState<{ key: string; data: HeadToHeadData | null; failed: boolean } | null>(null);

  useEffect(() => {
    if (homeName === "TBD" || awayName === "TBD") return;
    let cancelled = false;
    fetch(`/api/wc/h2h?home=${encodeURIComponent(homeName)}&away=${encodeURIComponent(awayName)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.matched) setH2hResult({ key: h2hKey, data, failed: false });
        else setH2hResult({ key: h2hKey, data: null, failed: true });
      })
      .catch(() => {
        if (!cancelled) setH2hResult({ key: h2hKey, data: null, failed: true });
      });
    return () => { cancelled = true; };
  }, [h2hKey, homeName, awayName]);

  const h2hLoading = h2hResult?.key !== h2hKey;
  const h2h = h2hLoading ? null : h2hResult?.data ?? null;
  const h2hFailed = h2hLoading ? false : (h2hResult?.failed ?? false);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-[#0c101d]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative glass-card"
        >
          {/* Header */}
          <div className="bg-black/40 px-4 py-3 flex justify-between items-center border-b border-white/5">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Match Details</span>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
              ✕
            </button>
          </div>

          <div className="p-5 space-y-6">
            {/* Teams */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center flex-1 gap-2">
                <div className="w-16 h-12 bg-black/50 rounded shadow-md border border-white/10 flex items-center justify-center overflow-hidden">
                  {homeTeam?.flag ? (
                    <img src={homeTeam.flag} alt={homeName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-600 font-bold">?</span>
                  )}
                </div>
                <div className="text-center">
                  <div className="font-black text-white text-sm uppercase tracking-wide">{homeFifa}</div>
                  <div className="text-[10px] text-gray-400 truncate w-full max-w-[80px]">{homeName}</div>
                </div>
              </div>
              
              <div className="flex-shrink-0 px-4 text-center">
                <div className="text-xs font-bold text-gray-500 mb-1">VS</div>
                <div className="text-2xl font-black text-white">
                  {game.finished === "TRUE" ? (
                    <span className="text-green-400">{game.home_score} - {game.away_score}</span>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center flex-1 gap-2">
                <div className="w-16 h-12 bg-black/50 rounded shadow-md border border-white/10 flex items-center justify-center overflow-hidden">
                  {awayTeam?.flag ? (
                    <img src={awayTeam.flag} alt={awayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-600 font-bold">?</span>
                  )}
                </div>
                <div className="text-center">
                  <div className="font-black text-white text-sm uppercase tracking-wide">{awayFifa}</div>
                  <div className="text-[10px] text-gray-400 truncate w-full max-w-[80px]">{awayName}</div>
                </div>
              </div>
            </div>

            {/* Match Info */}
            <div className="bg-white/5 rounded-xl p-3 space-y-2.5 border border-white/5 text-[11px] sm:text-xs">
              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-400">Match Number</span>
                <span className="text-white font-bold text-right">M{game.id}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-400">Kickoff (NPT)</span>
                <span className="text-white font-bold text-right">{dateTime}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-400">Stadium</span>
                <span className="text-white font-bold text-right truncate max-w-[140px] sm:max-w-[180px]">{stadium?.name_en || game.stadium_id}</span>
              </div>
            </div>

            {/* Previous Encounters — real FIFA World Cup history (1930-2022), or an honest empty/loading state */}
            <div className="bg-black/30 rounded-xl p-3 border border-white/5 text-center shadow-inner">
              <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1.5">Previous World Cup Encounters</div>

              {h2hLoading && (
                <p className="text-[10px] text-gray-500 leading-relaxed py-1">Loading history…</p>
              )}

              {!h2hLoading && h2hFailed && (
                <p className="text-[10px] text-gray-500 leading-relaxed py-1">History not available</p>
              )}

              {!h2hLoading && !h2hFailed && h2h && (
                <>
                  <div className="flex justify-between items-center mb-2 px-6">
                    <div className="text-base font-black text-white">{h2h.homeWins}</div>
                    <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">
                      {h2h.draws} Draw{h2h.draws === 1 ? "" : "s"}
                    </div>
                    <div className="text-base font-black text-white">{h2h.awayWins}</div>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    {h2hSummary(homeName, awayName, h2h)}
                  </p>
                  {h2h.meetings.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                      {h2h.meetings.slice(-3).reverse().map((m) => (
                        <div key={`${m.year}-${m.round}`} className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-500">{m.year} · {m.round}</span>
                          <span className="text-gray-300 font-bold">
                            {m.homeGoals}-{m.awayGoals}
                            {m.penaltyWinner && (
                              <span className="text-gray-500 font-normal"> (pens: {m.penaltyWinner === "home" ? homeFifa : awayFifa})</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
