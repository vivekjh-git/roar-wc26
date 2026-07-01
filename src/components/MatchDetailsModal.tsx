"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Game, Team, Stadium } from "@/lib/api";
import { formatMatchDateNPT } from "@/lib/date-utils";
import HeadToHeadPanel from "./HeadToHeadPanel";

interface MatchDetailsModalProps {
  game: Game;
  teamMap: { [key: string]: Team };
  stadiumMap: { [key: string]: Stadium };
  onClose: () => void;
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

            <HeadToHeadPanel homeName={homeName} awayName={awayName} homeFifa={homeFifa} awayFifa={awayFifa} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
