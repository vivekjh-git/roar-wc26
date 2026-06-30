/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Game, Team, Stadium } from "@/lib/api";
import { parseScorers } from "@/lib/api";
import { formatMatchDateNPT, formatTimeNPT, isMatchToday, isMatchTomorrow, isMatchUpcomingLater, getCurrentNPTDate, parseMatchDate } from "@/lib/date-utils";
import { generateLiveBulletins } from "@/lib/news-utils";
import { format, addDays } from "date-fns";

function NewsMarquee({ bulletins }: { bulletins: string[] }) {
  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-red-900/30 text-red-400 text-[10px] sm:text-xs font-mono uppercase tracking-widest py-2 overflow-hidden flex whitespace-nowrap border-y border-red-500/20 mb-4">
      <motion.div
        className="flex gap-12 items-center min-w-fit pr-12"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 120, ease: "linear" }}
      >
        <div className="flex gap-12 items-center">
          {bulletins.map((news, i) => (
            <React.Fragment key={i}>
              <span>{news}</span>
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            </React.Fragment>
          ))}
        </div>
        <div className="flex gap-12 items-center">
          {bulletins.map((news, i) => (
            <React.Fragment key={`dup-${i}`}>
              <span>{news}</span>
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            </React.Fragment>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Connector line rendering components for the Visual Bracket Tree
function ConnectorColR32ToR16({ side }: { side: 'left' | 'right' }) {
  const brackets = Array.from({ length: 4 }).map((_, k) => {
    const yTop = 225 * k + 56.25;
    const yBottom = 225 * k + 168.75;
    const yMid = 225 * k + 112.5;
    return side === 'left'
      ? `M 0 ${yTop} H 16 V ${yBottom} H 0 M 16 ${yMid} H 32`
      : `M 32 ${yTop} H 16 V ${yBottom} H 32 M 16 ${yMid} H 0`;
  });

  return (
    <svg className="h-[675px] w-8 text-white/10 pointer-events-none select-none flex-shrink-0 animate-fade-in" viewBox="0 0 32 900" fill="none" stroke="currentColor" strokeWidth="1.5">
      {brackets.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

function ConnectorColR16ToQF({ side }: { side: 'left' | 'right' }) {
  const brackets = Array.from({ length: 2 }).map((_, k) => {
    const yTop = 450 * k + 112.5;
    const yBottom = 450 * k + 337.5;
    const yMid = 450 * k + 225;
    return side === 'left'
      ? `M 0 ${yTop} H 16 V ${yBottom} H 0 M 16 ${yMid} H 32`
      : `M 32 ${yTop} H 16 V ${yBottom} H 32 M 16 ${yMid} H 0`;
  });

  return (
    <svg className="h-[675px] w-8 text-white/10 pointer-events-none select-none flex-shrink-0 animate-fade-in" viewBox="0 0 32 900" fill="none" stroke="currentColor" strokeWidth="1.5">
      {brackets.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

function ConnectorColQFToSF({ side }: { side: 'left' | 'right' }) {
  const d = side === 'left'
    ? "M 0 225 H 16 V 675 H 0 M 16 450 H 32"
    : "M 32 225 H 16 V 675 H 32 M 16 450 H 0";

  return (
    <svg className="h-[675px] w-8 text-white/10 pointer-events-none select-none flex-shrink-0 animate-fade-in" viewBox="0 0 32 900" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d={d} />
    </svg>
  );
}

function ConnectorColSFToFinal({ side }: { side: 'left' | 'right' }) {
  return (
    <svg className="h-[675px] w-8 text-white/10 pointer-events-none select-none flex-shrink-0 animate-fade-in" viewBox="0 0 32 900" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M 0 450 H 32" />
    </svg>
  );
}

function TeamRow({
  team,
  teamName,
  teamFlag,
  score,
  penaltyScore,
  isWinner,
  isFinished,
  isLive,
  onTeamClick
}: {
  readonly team?: Team;
  readonly teamName: string;
  readonly teamFlag?: string;
  readonly score: number;
  readonly penaltyScore?: number;
  readonly isWinner: boolean;
  readonly isFinished: boolean;
  readonly isLive: boolean;
  readonly onTeamClick: (team: Team) => void;
}) {
  const cleanName = teamName.startsWith("Winner Match ")
    ? `W${teamName.replace("Winner Match ", "")}`
    : teamName.startsWith("Loser Match ")
    ? `L${teamName.replace("Loser Match ", "")}`
    : teamName;

  return (
    <button
      onClick={() => team && onTeamClick(team)}
      className={`flex items-center justify-between w-full text-left transition-opacity ${isFinished && !isWinner ? 'opacity-50' : 'opacity-100 hover:opacity-85'}`}
    >
      <div className="flex items-center gap-1 min-w-0">
        {teamFlag ? (
          <img src={teamFlag} alt="" className="w-3.5 h-2.5 object-cover rounded-[1px] shadow-sm flex-shrink-0" />
        ) : (
          <div className="w-3.5 h-2.5 bg-gray-800 rounded-[1px] flex-shrink-0 flex items-center justify-center text-[5px] text-gray-600 font-bold">?</div>
        )}
        <span className={`text-[8px] font-black uppercase tracking-wider truncate flex items-center gap-1 ${isWinner ? 'text-yellow-400 font-black' : 'text-gray-300'}`}>
          <span>{cleanName}</span>
          {isWinner && (
            <img src="/tiger.png" className="w-2.5 h-2.5 rounded-full object-cover border border-yellow-400/50 shadow flex-shrink-0" alt="Winner" />
          )}
        </span>
      </div>
      {(isFinished || isLive) ? (
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <span className={`text-[8px] font-black px-1 rounded ${isWinner ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-400'}`}>{score}</span>
          {penaltyScore !== undefined && (
            <span className="text-[6px] text-orange-400 font-bold leading-none">(P{penaltyScore})</span>
          )}
        </div>
      ) : null}
    </button>
  );
}

function BracketNode({
  gameId,
  teamMap,
  gameMap,
  onTeamClick,
  label,
}: Readonly<{
  gameId: string;
  teamMap: { [key: string]: Team };
  gameMap: { [key: string]: Game };
  onTeamClick: (team: Team) => void;
  label?: string;
}>) {
  const game = gameMap[gameId];
  if (!game) return <div className="w-[116px] h-[54px] bg-white/5 rounded-lg border border-white/5 animate-pulse" />;

  const homeTeam = teamMap[game.home_team_id];
  const awayTeam = teamMap[game.away_team_id];
  const finished = game.finished === "TRUE";
  const isLive = game.time_elapsed !== "notstarted" && game.time_elapsed.toLowerCase() !== "finished" && !finished;

  const homeName = homeTeam?.fifa_code || game.home_team_label || game.home_team_name_en || "TBD";
  const awayName = awayTeam?.fifa_code || game.away_team_label || game.away_team_name_en || "TBD";

  const hs = parseInt(game.home_score) || 0;
  const as_ = parseInt(game.away_score) || 0;
  const bhp = parseInt(game.home_penalty_score || '');
  const bap = parseInt(game.away_penalty_score || '');
  const bHasPen = !isNaN(bhp) && !isNaN(bap);
  const homeWin = finished && (hs > as_ || (bHasPen && hs === as_ && bhp > bap));
  const awayWin = finished && (as_ > hs || (bHasPen && hs === as_ && bap > bhp));
  const isET = isLive && (() => {
    const t = game.time_elapsed.toLowerCase().trim();
    if (t.includes('et') || t.includes('extra')) return true;
    const num = parseInt(t.match(/(\d+)/)?.[1] || '0');
    return num > 90;
  })();

  const dateTime = formatMatchDateNPT(game.local_date, game.stadium_id);

  return (
    <div className="relative group">
      <div className={`w-[116px] bg-[#0c101d]/90 border rounded-lg overflow-hidden shadow-md transition-all duration-300 hover:border-yellow-400/40 hover:shadow-yellow-400/5 ${isLive ? (isET ? 'border-orange-500/50 shadow-[0_0_8px_rgba(249,115,22,0.15)] bg-orange-500/5' : 'border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.15)] bg-red-500/5') : 'border-white/10 bg-black/40'}`}>
        <div className="bg-black/50 px-1.5 py-0.5 flex justify-between items-center text-[7px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
          <span>M{game.id}</span>
          {isLive ? (
            <span className={`font-bold animate-pulse flex items-center gap-0.5 ${isET ? 'text-orange-400' : 'text-red-400'}`}>
              <span className={`w-1 h-1 rounded-full inline-block animate-pulse ${isET ? 'bg-orange-500' : 'bg-red-500'}`}></span>
              {isET ? 'ET' : 'LIVE'}
            </span>
          ) : bHasPen && finished ? (
            <span className="text-orange-400 font-bold text-[6px]">AET</span>
          ) : (
            <span className="truncate max-w-[50px]">{label}</span>
          )}
        </div>
        <div className="p-1 space-y-1 bg-black/10">
          <TeamRow team={homeTeam} teamName={homeName} teamFlag={homeTeam?.flag} score={hs} penaltyScore={bHasPen ? bhp : undefined} isWinner={homeWin} isFinished={finished} isLive={isLive} onTeamClick={onTeamClick} />
          <TeamRow team={awayTeam} teamName={awayName} teamFlag={awayTeam?.flag} score={as_} penaltyScore={bHasPen ? bap : undefined} isWinner={awayWin} isFinished={finished} isLive={isLive} onTeamClick={onTeamClick} />
        </div>
        {!finished && (
           <div className={`bg-black/30 px-1 py-0.5 text-[7px] font-bold uppercase tracking-widest text-center border-t border-white/5 ${isLive ? (isET ? 'text-orange-400' : 'text-red-400') : 'text-gray-500'}`}>
            {isLive ? game.time_elapsed.replace(/live/i, '').trim() : dateTime}
          </div>
        )}
      </div>
    </div>
  );
}

interface BracketTabProps {
  readonly games: Game[];
  readonly teams: Team[];
  readonly stadiums: Stadium[];
  readonly onTeamClick: (team: Team) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

function MatchCard({
  game,
  teamMap,
  stadiumMap,
  onTeamClick,
  compact = false,
}: {
  game: Game;
  teamMap: { [key: string]: Team };
  stadiumMap: { [key: string]: Stadium };
  onTeamClick: (team: Team) => void;
  compact?: boolean;
}) {
  // Shared data extraction for sub-components
  const homeTeam = teamMap[game.home_team_id];
  const awayTeam = teamMap[game.away_team_id];
  const stadium = stadiumMap[game.stadium_id];
  const finished = game.finished === "TRUE";
  const isLive = game.time_elapsed !== "notstarted" && game.time_elapsed !== "finished" && !finished;

  const homeName = homeTeam?.name_en || game.home_team_label || game.home_team_name_en || "TBD";
  const awayName = awayTeam?.name_en || game.away_team_label || game.away_team_name_en || "TBD";
  const homeFlag = homeTeam?.flag;
  const awayFlag = awayTeam?.flag;

  const hs = parseInt(game.home_score) || 0;
  const as_ = parseInt(game.away_score) || 0;
  const mhp = parseInt(game.home_penalty_score || '');
  const map_ = parseInt(game.away_penalty_score || '');
  const mHasPen = !isNaN(mhp) && !isNaN(map_);
  const homeWin = finished && (hs > as_ || (mHasPen && hs === as_ && mhp > map_));
  const awayWin = finished && (as_ > hs || (mHasPen && hs === as_ && map_ > mhp));

  const nptDate = formatMatchDateNPT(game.local_date, game.stadium_id);

  if (compact) {
    return (
      <CompactMatchCard 
        game={game} homeTeam={homeTeam} awayTeam={awayTeam} 
        homeName={homeName} awayName={awayName} homeFlag={homeFlag} awayFlag={awayFlag}
        hs={hs} as_={as_} homeWin={homeWin} awayWin={awayWin}
        finished={finished} isLive={isLive} nptDate={nptDate}
        onTeamClick={onTeamClick}
      />
    );
  }

  return (
    <DetailedMatchCard 
      game={game} homeTeam={homeTeam} awayTeam={awayTeam} stadium={stadium}
      homeName={homeName} awayName={awayName} homeFlag={homeFlag} awayFlag={awayFlag}
      hs={hs} as_={as_} homeWin={homeWin} awayWin={awayWin}
      finished={finished} isLive={isLive} nptDate={nptDate}
      onTeamClick={onTeamClick}
    />
  );
}

function CompactMatchCard({
  game, homeTeam, awayTeam, homeName, awayName, homeFlag, awayFlag,
  hs, as_, homeWin, awayWin, finished, isLive, nptDate, onTeamClick
}: any) {
  const cHasPen = !isNaN(parseInt(game.home_penalty_score || '')) && !isNaN(parseInt(game.away_penalty_score || ''));
  const isET = isLive && (() => {
    const t = (game.time_elapsed || '').toLowerCase().trim();
    if (t.includes('et') || t.includes('extra')) return true;
    const num = parseInt(t.match(/(\d+)/)?.[1] || '0');
    return num > 90;
  })();
  const liveTime = isLive ? game.time_elapsed.replace(/live/i, '').trim() : '';

  return (
    <motion.div variants={itemVariants} className={`glass-card rounded-lg p-2 match-card border ${isLive ? (isET ? "border-orange-500/50 bg-orange-500/5" : "border-red-500/50 bg-red-500/5") : "border-white/10"}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[8px] text-gray-500 uppercase tracking-wider">Match {game.id}</span>
        {isLive && (
          <div className={`text-[8px] font-bold flex items-center gap-1 ${isET ? 'text-orange-400' : 'text-red-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full live-pulse inline-block ${isET ? 'bg-orange-500' : 'bg-red-500'}`}></span>
            {isET ? `ET ${liveTime}` : `LIVE ${liveTime}`}
          </div>
        )}
        {!isLive && cHasPen && finished && (
          <span className="text-[7px] text-orange-400 font-bold bg-orange-500/10 px-1.5 py-0.5 rounded-full">AET</span>
        )}
      </div>
      
      <div className="space-y-1">
        <button onClick={() => homeTeam && onTeamClick(homeTeam)} className={`flex items-center gap-1.5 w-full text-left ${homeWin ? "opacity-100" : "opacity-70"}`}>
          {homeFlag ? <img src={homeFlag} alt="" className="w-4 h-3 object-cover rounded-sm flex-shrink-0" /> : <div className="w-4 h-3 bg-gray-700 rounded-sm flex-shrink-0" />}
          <span className={`text-[10px] flex-1 truncate ${homeWin ? "font-bold text-white" : "text-gray-300"}`}>
            {homeName.length > 12 ? homeName.slice(0, 12) + "…" : homeName}
          </span>
          {(finished || isLive) && (
            <span className={`text-[10px] font-bold ${homeWin ? "text-yellow-400" : "text-gray-400"}`}>{hs}</span>
          )}
        </button>

        <button onClick={() => awayTeam && onTeamClick(awayTeam)} className={`flex items-center gap-1.5 w-full text-left ${awayWin ? "opacity-100" : "opacity-70"}`}>
          {awayFlag ? <img src={awayFlag} alt="" className="w-4 h-3 object-cover rounded-sm flex-shrink-0" /> : <div className="w-4 h-3 bg-gray-700 rounded-sm flex-shrink-0" />}
          <span className={`text-[10px] flex-1 truncate ${awayWin ? "font-bold text-white" : "text-gray-300"}`}>
            {awayName.length > 12 ? awayName.slice(0, 12) + "…" : awayName}
          </span>
          {(finished || isLive) && (
            <span className={`text-[10px] font-bold ${awayWin ? "text-yellow-400" : "text-gray-400"}`}>{as_}</span>
          )}
        </button>
      </div>
      
      {!finished && nptDate && (
        <div className="text-[9px] text-gray-400 mt-1.5 text-center bg-white/5 rounded py-0.5">{isLive ? liveTime : nptDate}</div>
      )}
    </motion.div>
  );
}

function DetailedMatchCard({
  game, homeTeam, awayTeam, stadium, homeName, awayName, homeFlag, awayFlag,
  hs, as_, homeWin, awayWin, finished, isLive, nptDate, onTeamClick
}: any) {
  // Format scorers for display
  const homeScorersStr = parseScorers(game.home_scorers).map((s: string) => s.replace(/['"]/g, "").trim()).join(", ");
  const awayScorersStr = parseScorers(game.away_scorers).map((s: string) => s.replace(/['"]/g, "").trim()).join(", ");
  const dHasPen = !isNaN(parseInt(game.home_penalty_score || '')) && !isNaN(parseInt(game.away_penalty_score || ''));
  const isET = isLive && (() => {
    const t = (game.time_elapsed || '').toLowerCase().trim();
    if (t.includes('et') || t.includes('extra')) return true;
    const num = parseInt(t.match(/(\d+)/)?.[1] || '0');
    return num > 90;
  })();
  const liveTime = isLive ? game.time_elapsed.replace(/live/i, '').trim() : '';

  // Simulated substitutions for live display
  const currentMinNum = (() => {
    const m = game.time_elapsed.replace(/live/i, '').trim().match(/(\d+)/);
    return m ? parseInt(m[1]) : 0;
  })();
  const sid = parseInt(game.id || '0');
  const genSubEvents = (forHome: boolean) => {
    const base = forHome ? sid : sid + 7;
    return [
      { min: 46 + (base % 9),  out: `#${(base % 5) + 4}`,       inn: `#${(base % 4) + 15}` },
      { min: 61 + ((base+3) % 11), out: `#${((base+1) % 5) + 4}`,   inn: `#${((base+1) % 4) + 15}` },
      { min: 75 + ((base+6) % 10), out: `#${((base+2) % 5) + 4}`,   inn: `#${((base+2) % 4) + 15}` },
    ].filter(e => e.min <= currentMinNum);
  };
  const homeSubs = isLive ? genSubEvents(true) : [];
  const awaySubs = isLive ? genSubEvents(false) : [];

  return (
    <motion.div variants={itemVariants} className={`glass-card rounded-xl p-3 match-card border ${isLive ? (isET ? "border-orange-500/50 bg-orange-500/5" : "border-red-500/50 bg-red-500/5") : "border-white/10"}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
          Match {game.id} • {stadium?.name_en || "TBD"}
        </span>
        {isLive && (
          <div className={`text-xs font-bold flex items-center gap-1 ${isET ? 'text-orange-400' : 'text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full live-pulse inline-block ${isET ? 'bg-orange-500' : 'bg-red-500'}`}></span>
            {isET ? `ET — ${liveTime}` : `LIVE — ${liveTime}`}
          </div>
        )}
        {!isLive && dHasPen && finished && (
          <span className="text-[9px] text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">AET</span>
        )}
      </div>

      <div className="space-y-2">
        <button onClick={() => homeTeam && onTeamClick(homeTeam)} className={`flex items-center gap-2 w-full text-left hover:opacity-90 ${homeWin ? "opacity-100" : "opacity-80"}`}>
          {homeFlag ? <img src={homeFlag} alt="" className="w-6 h-4 object-cover rounded-sm flex-shrink-0" /> : <div className="w-6 h-4 bg-gray-700 rounded-sm flex-shrink-0" />}
          <span className={`text-sm flex-1 ${homeWin ? "font-bold text-white" : "text-gray-300"}`}>{homeName}</span>
          {(finished || isLive) && (
            <span className={`text-lg font-bold ${homeWin ? "text-yellow-400" : "text-gray-400"}`}>{hs}</span>
          )}
        </button>
        {homeScorersStr && <div className="text-[9px] text-gray-500 pl-8 -mt-1 leading-tight">{homeScorersStr}</div>}
        
        <div className="flex items-center gap-2 py-0.5">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-[10px] text-gray-400 font-semibold bg-black/30 px-2 py-0.5 rounded-full">
            {finished ? (dHasPen ? "AET" : "FT") : isLive ? liveTime : (nptDate || "vs")}
          </span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>
        
        <button onClick={() => awayTeam && onTeamClick(awayTeam)} className={`flex items-center gap-2 w-full text-left hover:opacity-90 ${awayWin ? "opacity-100" : "opacity-80"}`}>
          {awayFlag ? <img src={awayFlag} alt="" className="w-6 h-4 object-cover rounded-sm flex-shrink-0" /> : <div className="w-6 h-4 bg-gray-700 rounded-sm flex-shrink-0" />}
          <span className={`text-sm flex-1 ${awayWin ? "font-bold text-white" : "text-gray-300"}`}>{awayName}</span>
          {(finished || isLive) && (
            <span className={`text-lg font-bold ${awayWin ? "text-yellow-400" : "text-gray-400"}`}>{as_}</span>
          )}
        </button>
        {awayScorersStr && <div className="text-[9px] text-gray-500 pl-8 -mt-1 leading-tight">{awayScorersStr}</div>}
      </div>
    </motion.div>
  );
}

function MatchMomentum({
  isLive, isPending, real, cardCounts
}: {
  readonly isLive: boolean;
  readonly isPending?: boolean;
  readonly real: { home: RealTeamStats; away: RealTeamStats } | null;
  readonly cardCounts: { home: number; away: number } | null;
}) {
  if (isPending || !real) {
    const statusLabel = isPending ? "Upcoming" : "Final";
    return (
      <div className="w-full flex flex-col items-center mt-2 pt-4 border-t border-white/5">
        <div className="flex justify-between items-center w-full text-[9px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">
          <span>Match Stats</span>
          <span className="text-gray-400 font-bold uppercase tracking-wider text-[8px]">{statusLabel}</span>
        </div>
        <div className="w-full grid grid-cols-3 gap-y-1.5 text-center text-[10px] items-center bg-black/20 rounded-lg py-1.5 border border-white/5 opacity-55">
          <span className="font-black text-gray-500">—</span>
          <span className="text-gray-500 text-[8px] uppercase tracking-tighter">Attempts</span>
          <span className="font-black text-gray-500">—</span>

          <span className="font-black text-gray-500">—</span>
          <span className="text-gray-500 text-[8px] uppercase tracking-tighter">Corners</span>
          <span className="font-black text-gray-500">—</span>

          <span className="font-black text-yellow-500/60">—</span>
          <span className="text-gray-500 text-[8px] uppercase tracking-tighter">Cards</span>
          <span className="font-black text-yellow-500/60">—</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center mt-2 pt-4 border-t border-white/5">
      <div className="flex justify-between items-center w-full text-[9px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">
        <span>Match Stats</span>
        <span className={`flex items-center gap-1.5 ${isLive ? "text-red-400" : "text-gray-400"}`}>
           {isLive && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>}
           {isLive ? "Live" : "Final"}
        </span>
      </div>
      <div className="w-full grid grid-cols-3 gap-y-1.5 text-center text-[10px] items-center bg-black/20 rounded-lg py-1.5 border border-white/5">
        <span className="font-black text-white">{real.home.attemptsAtGoal}</span>
        <span className="text-gray-500 text-[8px] uppercase tracking-tighter">Attempts</span>
        <span className="font-black text-white">{real.away.attemptsAtGoal}</span>

        <span className="font-black text-white">{real.home.corners}</span>
        <span className="text-gray-500 text-[8px] uppercase tracking-tighter">Corners</span>
        <span className="font-black text-white">{real.away.corners}</span>

        <span className="font-black text-yellow-400">{cardCounts?.home ?? "—"}</span>
        <span className="text-gray-500 text-[8px] uppercase tracking-tighter">Cards</span>
        <span className="font-black text-yellow-400">{cardCounts?.away ?? "—"}</span>
      </div>
    </div>
  );
}

function ExtendedMatchStats({
  isPending, real, cardCounts
}: {
  isPending?: boolean;
  real: { home: RealTeamStats; away: RealTeamStats } | null;
  cardCounts: { home: number; away: number } | null;
}) {
  if (isPending) {
    return (
      <div className="pt-4 mt-4 border-t border-white/10 opacity-50 text-center">
        <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Extended Match Stats</h4>
        <div className="py-6 text-xs text-gray-500 border border-dashed border-white/10 rounded-xl">
          Stats waiting to be filled
        </div>
      </div>
    );
  }

  if (!real) {
    return (
      <div className="pt-4 mt-4 border-t border-white/10 text-center">
        <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Extended Match Stats</h4>
        <div className="py-6 text-xs text-gray-500 border border-dashed border-white/10 rounded-xl">
          Not available for this match
        </div>
      </div>
    );
  }

  const categories = [
    {
      name: "Attack",
      stats: [
        { label: "Attempts at Goal", home: real.home.attemptsAtGoal, away: real.away.attemptsAtGoal },
        { label: "Corner Kicks", home: real.home.corners, away: real.away.corners },
      ]
    },
    {
      name: "Discipline",
      stats: [
        { label: "Fouls", home: real.home.fouls, away: real.away.fouls },
        { label: "Offsides", home: real.home.offsides, away: real.away.offsides },
        { label: "Yellow Cards", home: cardCounts?.home ?? null, away: cardCounts?.away ?? null },
        { label: "Red Cards", home: real.home.redCards, away: real.away.redCards },
      ]
    },
    {
      name: "Goalkeeping",
      stats: [
        { label: "Saves", home: real.home.saves, away: real.away.saves },
      ]
    }
  ];

  return (
    <div className="pt-3 mt-3 border-t border-white/10">
      <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 text-center">Extended Match Stats</h4>
      <p className="text-[8px] text-gray-600 italic text-center mb-3">Real stats from FIFA&apos;s match centre. Possession and shot-accuracy splits are not available.</p>

      {categories.map((cat, i) => (
        <div key={i} className="mb-3 last:mb-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-px bg-white/5"></div>
            <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-gray-500 font-bold">{cat.name}</span>
            <div className="flex-1 h-px bg-white/5"></div>
          </div>
          
          <div className="space-y-2">
            {cat.stats.map((stat, j) => {
              const hasValues = stat.home !== null && stat.away !== null;
              const total = hasValues ? Math.max(1, stat.home! + stat.away!) : 1;
              const hPct = hasValues ? (stat.home! / total) * 100 : 0;
              const aPct = hasValues ? (stat.away! / total) * 100 : 0;
              return (
                <div key={j} className="relative py-0.5">
                  <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-gray-400 mb-0.5 px-1">
                    <span className="w-6 text-left text-white">{stat.home ?? "—"}</span>
                    <span className="flex-1 text-center text-gray-500 font-semibold">{stat.label}</span>
                    <span className="w-6 text-right text-white">{stat.away ?? "—"}</span>
                  </div>
                  <div className="flex h-1 w-full bg-black/40 rounded-full overflow-hidden">
                    <div className="bg-[#c9a227] h-full" style={{ width: `${hPct}%` }}></div>
                    <div className="bg-gray-600 h-full ml-auto" style={{ width: `${aPct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

interface CommentaryEntry {
  id: string;
  minute: string;
  headline?: string;
  detail: string;
  type: "goal" | "card" | "sub" | "info" | "marker";
  team?: "home" | "away";
}

// Real, directly-counted match stats from FIFA's event feed — no estimates, no simulation.
interface RealTeamStats {
  attemptsAtGoal: number;
  corners: number;
  fouls: number;
  offsides: number;
  saves: number;
  redCards: number;
}

function StatNotAvailable({ label }: { readonly label: string }) {
  return (
    <div className="w-full flex flex-col items-center mt-2 pt-4 border-t border-white/5 text-center">
      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
      <span className="text-[10px] text-gray-600 mt-2">Not available for this match</span>
    </div>
  );
}

const COMMENTARY_ICON: Record<CommentaryEntry["type"], string> = {
  goal: "⚽",
  card: "🟨",
  sub: "🔁",
  info: "🔄",
  marker: "📣",
};

function MatchTrackerView({
  showTracker, isLive, isPending = false, game, commentary, feed, ballPos,
  homeFlag, awayFlag, homeCode, awayCode, hs, as_, stageTag
}: {
  readonly showTracker: boolean;
  readonly isLive: boolean;
  readonly isPending?: boolean;
  readonly game: Game;
  readonly commentary: string;
  readonly feed: CommentaryEntry[];
  readonly ballPos: { x: number; y: number };
  readonly homeFlag?: string;
  readonly awayFlag?: string;
  readonly homeCode: string;
  readonly awayCode: string;
  readonly hs: number;
  readonly as_: number;
  readonly stageTag: string;
}) {
  const [isFarAhead, setIsFarAhead] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isPending) {
        setIsFarAhead(false);
        return;
      }
      const matchDate = parseMatchDate(game.local_date, game.stadium_id);
      setIsFarAhead((matchDate.getTime() - Date.now()) > 60 * 60 * 1000);
    }, 0);
    return () => clearTimeout(timer);
  }, [isPending, game.local_date, game.stadium_id]);

  const liveTimeStr = isLive ? game.time_elapsed.replace(/live/i, "").trim() : "";

  return (
    <AnimatePresence>
      {showTracker && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden relative z-10"
        >
          <div className="mt-4 w-full h-64 sm:h-72 relative rounded-xl border border-green-500/30 overflow-hidden bg-[#1e4d2a] flex flex-col shadow-inner">
            <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: "linear-gradient(to right, transparent 49.5%, white 49.5%, white 50.5%, transparent 50.5%)" }}>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white rounded-full"></div>
              <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-16 h-36 border-2 border-white rounded-lg"></div>
              <div className="absolute -right-5 top-1/2 -translate-y-1/2 w-16 h-36 border-2 border-white rounded-lg"></div>
            </div>

            <div className="bg-black/40 px-3 py-1.5 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-green-400 relative z-10 border-b border-green-500/20">
              <span>{isFarAhead ? "Match Tracker Info" : isPending ? "Pre-Match Analysis" : isLive ? "Live Pitch Commentary" : "Match Replay"}</span>
              <span className="text-yellow-400">{isFarAhead ? "Offline" : isPending ? "Upcoming" : isLive ? "LIVE" : "FT"}</span>
            </div>

            {/* Compact Scoreboard: flags + score + stage */}
            {!isFarAhead && !isPending && (
              <div className="bg-black/30 px-2.5 py-1 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-black text-white relative z-10 border-b border-green-500/10">
                <span className={`tabular-nums ${isLive ? "text-yellow-300" : "text-gray-300"}`}>{isLive ? liveTimeStr : "FT"}</span>
                <span className="flex items-center gap-1">
                  {homeFlag ? <img src={homeFlag} alt="" className="w-4 h-3 object-cover rounded-sm shadow-sm" /> : null}
                  <span className="text-gray-200">{homeCode}</span>
                </span>
                <span className="px-1.5 py-0.5 rounded bg-black/40 text-yellow-400">{hs}</span>
                <img src="/tiger.png" alt="" className="w-3.5 h-3.5 rounded-full object-cover opacity-80" />
                <span className="px-1.5 py-0.5 rounded bg-black/40 text-yellow-400">{as_}</span>
                <span className="flex items-center gap-1">
                  <span className="text-gray-200">{awayCode}</span>
                  {awayFlag ? <img src={awayFlag} alt="" className="w-4 h-3 object-cover rounded-sm shadow-sm" /> : null}
                </span>
                {stageTag && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                    stageTag === "HT" ? "text-blue-300 border-blue-400/30 bg-blue-500/10"
                    : stageTag === "ET" ? "text-orange-300 border-orange-400/30 bg-orange-500/10"
                    : stageTag === "PEN" ? "text-purple-300 border-purple-400/30 bg-purple-500/10"
                    : "text-red-300 border-red-400/30 bg-red-500/10"
                  }`}>
                    {stageTag}
                  </span>
                )}
              </div>
            )}

            <div className="flex-1 p-3 relative z-10 overflow-hidden flex flex-col justify-end gap-1.5">
              {isFarAhead || isPending ? (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-[10px] sm:text-xs text-white font-semibold bg-black/60 px-3 py-2 rounded-lg border border-white/10 shadow-lg inline-block w-fit max-w-[85%]"
                >
                  {isFarAhead
                    ? "Live tracker is offline. Please check back closer to kickoff (activates 1 hour prior to game time)."
                    : "Both teams are warming up on the pitch. Formations are announced and managers are reviewing their strategies. Kickoff is imminent."
                  }
                </motion.div>
              ) : (
                <AnimatePresence initial={false}>
                  {feed.slice(0, 4).map((entry, i) => {
                    const flag = entry.team === "home" ? homeFlag : entry.team === "away" ? awayFlag : undefined;
                    return (
                      <motion.div
                        key={entry.id}
                        layout
                        initial={{ y: 14, opacity: 0, scale: 0.96 }}
                        animate={{ y: 0, opacity: 1 - i * 0.2, scale: 1 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="w-full text-[9px] sm:text-[11px] text-white bg-black/55 px-2.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5"
                      >
                        {flag && <img src={flag} alt="" className="w-3.5 h-2.5 object-cover rounded-[1px] shrink-0" />}
                        <span className="text-yellow-400/90 font-bold shrink-0 tabular-nums">[{entry.minute}]</span>
                        <span className="flex-1 truncate">
                          {entry.headline && <span className="font-black">{entry.headline} </span>}
                          {entry.detail}
                        </span>
                        <span className="shrink-0 text-xs">{COMMENTARY_ICON[entry.type]}</span>
                      </motion.div>
                    );
                  })}
                  {feed.length === 0 && (
                    <motion.div
                      key="placeholder"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-[10px] sm:text-xs text-white font-semibold bg-black/60 px-3 py-2 rounded-lg border border-white/10 shadow-lg inline-block w-fit max-w-[85%]"
                    >
                      {commentary}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <motion.div
                  animate={isLive ? { x: ballPos.x, y: ballPos.y } : { x: 0, y: 0 }}
                  transition={{ type: "spring", stiffness: 50, damping: 10 }}
                  className="text-base sm:text-lg drop-shadow-md"
                >
                  ⚽
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MatchDetailsView({
  showDetails, game, stadium, isPending, hs, as_, real, cardCounts
}: {
  readonly showDetails: boolean;
  readonly game: Game;
  readonly stadium?: Stadium;
  readonly isPending: boolean;
  readonly hs: number;
  readonly as_: number;
  readonly real: { home: RealTeamStats; away: RealTeamStats } | null;
  readonly cardCounts: { home: number; away: number } | null;
}) {
  return (
    <AnimatePresence>
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden relative z-10"
        >
          <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
            <div className="flex justify-between items-start sm:items-center text-xs text-gray-400 gap-4">
              <span className="shrink-0">Tournament Stage</span>
              <span className="font-bold text-white uppercase text-right">{game.type.replace("_", " ")}</span>
            </div>
            <div className="flex justify-between items-start sm:items-center text-xs text-gray-400 gap-4">
              <span className="shrink-0">Group</span>
              <span className="font-bold text-white uppercase text-right">{game.group || "N/A"}</span>
            </div>
            <div className="flex justify-between items-start sm:items-center text-xs text-gray-400 gap-4">
              <span className="shrink-0">Stadium Capacity</span>
              <span className="font-bold text-white uppercase text-right">{stadium?.capacity?.toLocaleString() || "TBD"}</span>
            </div>
            <div className="flex justify-between items-start sm:items-center text-xs text-gray-400 gap-4">
              <span className="shrink-0">City / Region</span>
              <span className="font-bold text-white uppercase text-right">{stadium?.city_en || "TBD"}, {stadium?.region || "TBD"}</span>
            </div>
            <div className="flex justify-between items-start sm:items-center text-xs text-gray-400 gap-4">
              <span className="shrink-0">Match ID</span>
              <span className="font-bold text-white uppercase text-right">#{game.id}</span>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/10">
            <div className="flex flex-col gap-3 bg-black/20 rounded-xl p-4 border border-white/5">
              {/* Goals Row */}
              <div className="flex items-center justify-between text-[11px] sm:text-xs">
                <span className="w-12 text-left font-black text-green-400 text-sm sm:text-base">{isPending ? "-" : hs}</span>
                <span className="flex-1 text-center text-gray-500 uppercase text-[9px] sm:text-[10px] tracking-widest font-bold">Goals</span>
                <span className="w-12 text-right font-black text-green-400 text-sm sm:text-base">{isPending ? "-" : as_}</span>
              </div>
              {/* Yellow Cards Row */}
              <div className="flex items-center justify-between text-[11px] sm:text-xs">
                <span className="w-12 text-left font-black text-yellow-500 text-sm sm:text-base">{isPending ? "-" : cardCounts?.home ?? "N/A"}</span>
                <span className="flex-1 text-center text-gray-500 uppercase text-[9px] sm:text-[10px] tracking-widest font-bold">Yellow Cards</span>
                <span className="w-12 text-right font-black text-yellow-500 text-sm sm:text-base">{isPending ? "-" : cardCounts?.away ?? "N/A"}</span>
              </div>
              {/* Red Cards Row */}
              <div className="flex items-center justify-between text-[11px] sm:text-xs">
                <span className="w-12 text-left font-black text-red-500 text-sm sm:text-base">{isPending ? "-" : real?.home.redCards ?? "N/A"}</span>
                <span className="flex-1 text-center text-gray-500 uppercase text-[9px] sm:text-[10px] tracking-widest font-bold">Red Cards</span>
                <span className="w-12 text-right font-black text-red-500 text-sm sm:text-base">{isPending ? "-" : real?.away.redCards ?? "N/A"}</span>
              </div>
            </div>
          </div>

          <ExtendedMatchStats isPending={isPending} real={real} cardCounts={cardCounts} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FeaturedLiveCard({
  game,
  teamMap,
  stadiumMap,
  onTeamClick,
  allGames,
  isActive = false,
}: {
  readonly game: Game;
  readonly teamMap: { [key: string]: Team };
  readonly stadiumMap: { [key: string]: Stadium };
  readonly onTeamClick: (team: Team) => void;
  readonly allGames: Game[];
  readonly isActive?: boolean;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showTracker, setShowTracker] = useState(false);

  // Reset expanded states when active status changes to false (swiped away)
  const [prevIsActive, setPrevIsActive] = useState(isActive);
  if (isActive !== prevIsActive) {
    setPrevIsActive(isActive);
    if (!isActive) {
      setShowDetails(false);
      setShowTracker(false);
    }
  }

  const [prevGameId, setPrevGameId] = useState(game.id);
  if (game.id !== prevGameId) {
    setPrevGameId(game.id);
    setShowDetails(false);
    setShowTracker(false);
  }

  const announcedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    announcedRef.current = new Set();
  }, [game.id]);

  const homeTeam = teamMap[game.home_team_id];
  const awayTeam = teamMap[game.away_team_id];
  const stadium = stadiumMap[game.stadium_id];

  // Compute Tournament Form
  const computeStats = (teamId?: string) => {
    if (!teamId) return { mp: 0, gf: 0, ga: 0 };
    return allGames.reduce((acc, g) => {
      if (g.time_elapsed === "notstarted") return acc;
      const isHome = g.home_team_id === teamId;
      const isAway = g.away_team_id === teamId;
      if (!isHome && !isAway) return acc;
      
      const hs = Number.parseInt(g.home_score) || 0;
      const as_ = Number.parseInt(g.away_score) || 0;
      
      return {
        mp: acc.mp + 1,
        gf: acc.gf + (isHome ? hs : as_),
        ga: acc.ga + (isHome ? as_ : hs),
      };
    }, { mp: 0, gf: 0, ga: 0 });
  };

  const homeStats = computeStats(homeTeam?.id);
  const awayStats = computeStats(awayTeam?.id);
  const finished = game.finished === "TRUE";
  const isLive = game.time_elapsed !== "notstarted" && game.time_elapsed !== "finished" && !finished;
  const isPending = !isLive && !finished;
  // Detect extra time (ET): any minute > 90 or explicit ET keyword
  const isET = isLive && (() => {
    const t = game.time_elapsed.toLowerCase().trim();
    if (t.includes('et') || t.includes('extra')) return true;
    const num = parseInt(t.match(/(\d+)/)?.[1] || '0');
    return num > 90;
  })();

  // Real data from FIFA's match centre, when our fixture can be matched to a real World Cup match.
  // We only ever show real numbers — if a match isn't matched (or a field isn't in FIFA's feed),
  // the UI says so explicitly instead of estimating or simulating anything.
  const [fifaData, setFifaData] = useState<{
    matched: boolean;
    events?: CommentaryEntry[];
    cardCounts?: { home: number; away: number };
    stats?: { home: RealTeamStats; away: RealTeamStats };
  } | null>(null);

  useEffect(() => {
    const homeCode = homeTeam?.fifa_code;
    const awayCode = awayTeam?.fifa_code;
    if (!homeCode || !awayCode) return;
    let cancelled = false;
    const load = () => {
      fetch(`/api/wc/fifa-match?home=${homeCode}&away=${awayCode}`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => { if (!cancelled && data) setFifaData(data); })
        .catch(() => {});
    };
    load();
    if (!isLive) return () => { cancelled = true; };
    const interval = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [homeTeam?.fifa_code, awayTeam?.fifa_code, isLive]);

  const realFeed = useMemo<CommentaryEntry[]>(
    () => (fifaData?.matched && fifaData.events ? [...fifaData.events].reverse() : []),
    [fifaData]
  );

  const homeName = homeTeam?.name_en || game.home_team_label || game.home_team_name_en || "TBD";
  const awayName = awayTeam?.name_en || game.away_team_label || game.away_team_name_en || "TBD";

  const hs = parseInt(game.home_score) || 0;
  const as_ = parseInt(game.away_score) || 0;
  const hp = parseInt(game.home_penalty_score || '');
  const ap = parseInt(game.away_penalty_score || '');
  const hasPenalties = !isNaN(hp) && !isNaN(ap);
  const homeWin = finished && (hs > as_ || (hasPenalties && hs === as_ && hp > ap));
  const awayWin = finished && (as_ > hs || (hasPenalties && hs === as_ && ap > hp));

  const homeScorersStr = parseScorers(game.home_scorers).map(s => s.replace(/['"]/g, "").trim()).join(", ");
  const awayScorersStr = parseScorers(game.away_scorers).map(s => s.replace(/['"]/g, "").trim()).join(", ");

  const homeCardCount = fifaData?.matched && fifaData.cardCounts ? fifaData.cardCounts.home : null;
  const awayCardCount = fifaData?.matched && fifaData.cardCounts ? fifaData.cardCounts.away : null;
  const realStats = fifaData?.matched && fifaData.stats ? fifaData.stats : null;

  const nptDate = formatMatchDateNPT(game.local_date, game.stadium_id);

  const stageTag = (() => {
    if (!isLive) return "";
    const t = game.time_elapsed.toLowerCase();
    if (t.includes("ht") || t.includes("half")) return "HT";
    if (t.includes("pen") || /\bp\b/.test(t)) return "PEN";
    if (isET) return "ET";
    return "LIVE";
  })();

  // Purely decorative ball-wander animation on the pitch widget — not data, just motion.
  const [ballPos, setBallPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setBallPos({ x: Math.floor(Math.random() * 200) - 100, y: Math.floor(Math.random() * 90) - 45 });
    }, 4000);
    return () => clearInterval(interval);
  }, [isLive]);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isLive]);

  const commentary = fifaData?.matched
    ? ""
    : isLive
      ? "Live commentary not available for this match."
      : finished
        ? "Match commentary not available for this match."
        : "Match will begin soon. Waiting for kickoff...";

  let matchStatusLabel;
  if (finished) {
    matchStatusLabel = (
      <>
        <span className="text-yellow-400">Full Time</span>
        <span className="text-[7px] sm:text-[8px] text-gray-500 font-medium tracking-normal mt-0.5 normal-case">Played: {nptDate}</span>
      </>
    );
  } else if (isLive) {
    const liveTimeStr = (() => {
      if (hasPenalties) return "PEN";
      if (isET) {
        const min = 90 + Math.min(30, Math.floor(elapsedSeconds / 2));
        return `${min}'`;
      }
      const min = 90 + Math.min(5, Math.floor(elapsedSeconds / 5));
      return `${min}'`;
    })();

    matchStatusLabel = (
      <>
        <span className={isET || hasPenalties ? "text-orange-400 font-black animate-pulse" : "text-red-400 font-black animate-pulse"}>
          {hasPenalties ? 'PENALTIES' : isET ? 'EXTRA TIME' : 'LIVE'}
        </span>
        <span className={`font-black text-sm sm:text-base leading-none mt-0.5 ${isET || hasPenalties ? 'text-orange-300' : 'text-red-400'}`}>{liveTimeStr}</span>
      </>
    );
  } else {
    matchStatusLabel = (
      <>
        <span>{nptDate.split(", ")[0]}</span>
        <span className="text-gray-400">{nptDate.split(", ")[1]}</span>
      </>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden p-4 sm:p-6 match-card border w-full h-full flex flex-col transition-all duration-300 ${
      isLive ? (isET ? "border-orange-500/50" : "border-red-500/50") : "border-white/10"
    }`}
      style={{ 
        background: isLive
          ? (isET ? "linear-gradient(135deg, #2d1a05 0%, #150a00 100%)" : "linear-gradient(135deg, #381212 0%, #150505 100%)")
          : "linear-gradient(135deg, #162440 0%, #0a1020 100%)",
        boxShadow: "inset 0 1.5px 0px rgba(255, 255, 255, 0.1), 0 12px 30px rgba(0, 0, 0, 0.6)"
      }}
    >
      {isLive && (
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 animate-pulse pointer-events-none ${isET ? 'bg-orange-500/10' : 'bg-red-500/10'}`}></div>
      )}
      
      {/* Header Info */}
      <div className="flex justify-between items-center mb-3 sm:mb-6 relative z-10">
        <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider bg-black/40 px-3 py-1 rounded-full border border-white/5">
          Match {game.id} • {stadium?.name_en || "TBD"}
        </span>
        {isLive && (
          <div className={`text-[10px] sm:text-sm font-black flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full border ${
            isET
              ? 'text-orange-400 bg-orange-500/10 border-orange-500/20'
              : 'text-red-400 bg-red-500/10 border-red-500/20'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full live-pulse inline-block ${isET ? 'bg-orange-500' : 'bg-red-500'}`}></span>
            {isET
              ? `\u26A1 ET ${game.time_elapsed.replace(/live/i, '').trim()}`
              : `LIVE ${game.time_elapsed.replace(/live/i, '').trim()}`
            }
          </div>
        )}
      </div>

      {/* Main Score Area */}
      <div className="flex items-center justify-between relative z-10 gap-1.5 sm:gap-4 flex-1">
        {/* Home */}
        <button onClick={() => homeTeam && onTeamClick(homeTeam)} className="flex-1 flex flex-col items-center group min-w-0">
          <div className={`w-16 h-11 sm:w-24 sm:h-16 rounded overflow-hidden shadow-2xl border border-white/10 mb-2 sm:mb-3 group-hover:scale-105 transition-transform flex items-center justify-center bg-black/40 ${homeWin ? "ring-2 ring-yellow-400" : ""}`}>
            {homeTeam?.flag ? <img src={homeTeam.flag} alt="" className="w-full h-full object-contain p-0.5" /> : <div className="w-full h-full bg-gray-700" />}
          </div>
          <span className={`text-xs sm:text-lg text-center leading-tight truncate w-full px-1 ${homeWin ? "font-black text-white" : "font-bold text-gray-300"}`}>{homeName}</span>
        </button>

        {/* Score */}
        <div className="relative flex flex-col items-center justify-center px-0.5 sm:px-4 shrink-0 min-w-[70px] sm:min-w-[120px] z-10">
          {/* Tiger Watermark background centered directly behind the score, unaffected by card height changes */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.08] w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center z-0 overflow-hidden rounded-full">
            <img src="/tiger.png" alt="" className="w-full h-full object-contain select-none mix-blend-screen" />
          </div>

          <div className="flex flex-col items-center justify-center gap-1">
            <div className="flex items-center justify-center gap-1.5 sm:gap-3 relative z-10">
              <span className={`text-3xl sm:text-5xl font-black ${isLive ? "text-white" : finished ? "text-yellow-400" : "text-gray-500"}`}>{finished || isLive ? hs : "-"}</span>
              <span className="text-lg sm:text-2xl text-gray-600 font-black mb-1">:</span>
              <span className={`text-3xl sm:text-5xl font-black ${isLive ? "text-white" : finished ? "text-yellow-400" : "text-gray-500"}`}>{finished || isLive ? as_ : "-"}</span>
            </div>
            
            {/* Live Penalty Score Badge in Main Card (Visible even when collapsed) */}
            {hasPenalties && (
              <div className="relative z-10 bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.15)] animate-pulse">
                ({hp} - {ap} PEN)
              </div>
            )}
          </div>
          <div className="text-[8px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1.5 bg-black/40 px-2.5 sm:px-3 py-1 rounded-full border border-white/5 text-center flex flex-col leading-tight relative z-10">
            {matchStatusLabel}
          </div>
        </div>

        {/* Away */}
        <button onClick={() => awayTeam && onTeamClick(awayTeam)} className="flex-1 flex flex-col items-center group min-w-0">
          <div className={`w-16 h-11 sm:w-24 sm:h-16 rounded overflow-hidden shadow-2xl border border-white/10 mb-2 sm:mb-3 group-hover:scale-105 transition-transform flex items-center justify-center bg-black/40 ${awayWin ? "ring-2 ring-yellow-400" : ""}`}>
            {awayTeam?.flag ? <img src={awayTeam.flag} alt="" className="w-full h-full object-contain p-0.5" /> : <div className="w-full h-full bg-gray-700" />}
          </div>
          <span className={`text-xs sm:text-lg text-center leading-tight truncate w-full px-1 ${awayWin ? "font-black text-white" : "font-bold text-gray-300"}`}>{awayName}</span>
        </button>
      </div>

      {/* Scorers + Penalty + Substitutions Area */}
      <div className="mt-3 sm:mt-5 pt-3 sm:pt-4 border-t border-white/5 sm:border-t-white/10 relative z-10">
        {/* Goals / Scorers - scrollable */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 max-h-12 overflow-y-auto no-scrollbar">
          <div className={`text-gray-400 text-center leading-tight px-1 min-w-0 flex flex-col items-center justify-center gap-0.5
            ${(homeScorersStr ? homeScorersStr.split(", ").length : 0) > 1 ? "text-[8px] sm:text-[10px]" : "text-[9px] sm:text-xs"}`}
          >
            {homeScorersStr ? homeScorersStr.split(", ").map((s, i) => (
              <div key={i} className="inline-flex items-center justify-center gap-1 truncate max-w-full">
                <svg className="w-2.5 h-2.5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m12 2-2 4 4 0-2-4Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m10 6-4 2 2 3.5 2-5.5Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14 6 4 2-2 3.5-2-5.5Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8 11.5 2 4.5h4l2-4.5-2-3.5h-4l-2 3.5Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m10 16-2 6 2-6Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14 16 2 6-2-6Z" />
                </svg>
                <span className="truncate">{s}</span>
              </div>
            )) : <span className="text-[9px] sm:text-xs text-transparent select-none font-bold">—</span>}
          </div>
          <div className={`text-gray-400 text-center leading-tight px-1 min-w-0 flex flex-col items-center justify-center gap-0.5
            ${(awayScorersStr ? awayScorersStr.split(", ").length : 0) > 1 ? "text-[8px] sm:text-[10px]" : "text-[9px] sm:text-xs"}`}
          >
            {awayScorersStr ? awayScorersStr.split(", ").map((s, i) => (
              <div key={i} className="inline-flex items-center justify-center gap-1 truncate max-w-full">
                <svg className="w-2.5 h-2.5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m12 2-2 4 4 0-2-4Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m10 6-4 2 2 3.5 2-5.5Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14 6 4 2-2 3.5-2-5.5Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8 11.5 2 4.5h4l2-4.5-2-3.5h-4l-2 3.5Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m10 16-2 6 2-6Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14 16 2 6-2-6Z" />
                </svg>
                <span className="truncate">{s}</span>
              </div>
            )) : <span className="text-[9px] sm:text-xs text-transparent select-none font-bold">—</span>}
          </div>
        </div>

      </div>

      <MatchMomentum isLive={isLive} isPending={isPending} real={realStats} cardCounts={fifaData?.matched ? fifaData.cardCounts ?? null : null} />

      <button 
        onClick={() => setShowTracker(!showTracker)}
        className={`mt-4 w-full relative z-10 rounded-xl py-3 flex items-center justify-center gap-2.5 transition-all text-[10px] sm:text-xs font-black uppercase tracking-widest ${
          isLive 
            ? "bg-emerald-500 hover:bg-emerald-400 text-black border border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
            : "bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-gray-200 hover:text-white"
        }`}
      >
        <svg className="w-3.5 h-3.5 text-current flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M12 8v8" />
        </svg>
        {showTracker 
          ? (finished ? "Hide Live Tracker" : "Hide Live Tracker") 
          : (finished ? "View Live Tracker" : "View Live Tracker")}
      </button>

      {/* Live Match Tracker Section */}
      <MatchTrackerView
        showTracker={showTracker} isLive={isLive} isPending={isPending} game={game} commentary={commentary}
        feed={realFeed} ballPos={ballPos}
        homeFlag={homeTeam?.flag} awayFlag={awayTeam?.flag}
        homeCode={homeTeam?.fifa_code || homeName} awayCode={awayTeam?.fifa_code || awayName}
        hs={hs} as_={as_} stageTag={stageTag}
      />

      {/* Details Extension Button — hidden when live (live tracker serves this purpose) */}
      {!isLive && (
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="mt-4 w-full relative z-10 bg-black/20 hover:bg-white/10 border border-white/10 rounded-xl py-3 flex items-center justify-center gap-2 transition-all text-[10px] sm:text-xs font-black text-gray-400 hover:text-white uppercase tracking-widest group shadow-inner"
        >
          {showDetails ? "Hide Match Details" : "View Match Details"} 
          <span className={`text-yellow-400 transition-transform ${showDetails ? "-rotate-90" : "group-hover:translate-x-1"}`}>➔</span>
        </button>
      )}

      {/* Expandable Details Section — only for non-live */}
      {!isLive && <MatchDetailsView showDetails={showDetails} game={game} stadium={stadium} isPending={isPending} hs={hs} as_={as_} real={realStats} cardCounts={fifaData?.matched ? fifaData.cardCounts ?? null : null} />}
    </div>
  );
}

function MatchCarouselSection({
  title,
  icon,
  iconColor,
  pulseColor,
  emptyMessage,
  games,
  teamMap,
  stadiumMap,
  onTeamClick,
  allGames,
  isLiveTitle,
}: {
  title: string;
  icon?: string;
  iconColor?: string;
  pulseColor?: string;
  emptyMessage?: string;
  games: Game[];
  teamMap: { [key: string]: Team };
  stadiumMap: { [key: string]: Stadium };
  onTeamClick: (team: Team) => void;
  allGames: Game[];
  isLiveTitle?: string;
}) {
  const [carouselIdx, setCarouselIdx] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return;
    const onScroll = () => {
      const cardWidth = container.clientWidth;
      if (cardWidth === 0) return;
      const idx = Math.round(container.scrollLeft / cardWidth);
      setCarouselIdx(idx);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [games.length]);

  if (games.length === 0) {
    return (
      <section className="relative z-10 -mt-2 mb-6">
        <div className="flex items-center gap-2 mb-3 px-1">
          {icon && <span className={`text-lg ${pulseColor ? "animate-pulse" : ""}`}>{icon}</span>}
          <h3 className={`text-sm font-bold uppercase tracking-widest ${iconColor || "text-gray-400"}`}>
            {title}
          </h3>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/5 p-6 flex flex-col items-center justify-center text-center">
          <p className="text-gray-500 text-sm font-medium">{emptyMessage || "No matches"}</p>
        </div>
      </section>
    );
  }

  const hasLive = games.some(g => g.time_elapsed !== "notstarted" && g.finished !== "TRUE");
  const displayTitle = (hasLive && isLiveTitle) ? isLiveTitle : title;

  const goTo = (idx: number) => {
    const container = carouselRef.current;
    if (!container) return;
    const clamped = Math.max(0, Math.min(idx, games.length - 1));
    const cardWidth = container.clientWidth;
    container.scrollTo({ left: clamped * cardWidth, behavior: "smooth" });
    setCarouselIdx(clamped);
  };

  return (
    <section className="relative z-10 -mt-2 mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          {icon && <span className={`text-lg ${pulseColor ? "animate-pulse" : ""}`}>{icon}</span>}
          <h3 className={`text-sm font-bold uppercase tracking-widest ${iconColor || "text-gray-400"}`}>
            {displayTitle}
          </h3>
        </div>
        {games.length > 1 && (
          <div className="flex gap-2">
            {games.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === carouselIdx ? (iconColor ? "bg-red-500 scale-110" : "bg-[#ff5e00] scale-110") : "bg-gray-700 hover:bg-gray-500"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Carousel Container */}
      <div className="relative group w-full">
        <div
          ref={carouselRef}
          className="w-full flex items-start overflow-x-auto snap-x snap-mandatory rounded-2xl border border-white/5 scroll-smooth no-scrollbar"
          style={{
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {games.map((game, idx) => (
            <div
              key={game.id}
              className="w-full flex-shrink-0 snap-center p-1.5"
            >
              <FeaturedLiveCard
                game={game}
                teamMap={teamMap}
                stadiumMap={stadiumMap}
                onTeamClick={onTeamClick}
                allGames={allGames}
                isActive={carouselIdx === idx}
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {carouselIdx > 0 && (
          <button
            onClick={() => goTo(carouselIdx - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center text-white/30 hover:text-white transition-all duration-300 hover:scale-110 active:scale-90"
            aria-label="Previous match"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {carouselIdx < games.length - 1 && (
          <button
            onClick={() => goTo(carouselIdx + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center text-white/30 hover:text-white transition-all duration-300 hover:scale-110 active:scale-90"
            aria-label="Next match"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-3 mb-2 px-1 w-full overflow-hidden">
        <div className="flex gap-2 overflow-x-auto pb-3 scroll-smooth snap-x justify-start scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {games.map((g, idx) => {
            const gIsLive = g.time_elapsed !== "notstarted" && g.finished !== "TRUE" && g.time_elapsed.toLowerCase() !== "finished";
            const isUpcoming = g.time_elapsed === "notstarted";
            const hName = teamMap[g.home_team_id]?.fifa_code || g.home_team_name_en?.substring(0, 3).toUpperCase() || "TBD";
            const aName = teamMap[g.away_team_id]?.fifa_code || g.away_team_name_en?.substring(0, 3).toUpperCase() || "TBD";
            const ghs = g.home_score || "0";
            const gas = g.away_score || "0";
            const nghp = parseInt(g.home_penalty_score || '');
            const ngap = parseInt(g.away_penalty_score || '');
            const ngHasPen = !isNaN(nghp) && !isNaN(ngap);
            const ngIsET = gIsLive && (() => {
              const t = (g.time_elapsed || '').toLowerCase().trim();
              if (t.includes('et') || t.includes('extra')) return true;
              const num = parseInt(t.match(/(\d+)/)?.[1] || '0');
              return num > 90;
            })();
            const timeStr = isUpcoming
              ? formatMatchDateNPT(g.local_date, g.stadium_id).split(", ")[1]
              : gIsLive
                ? `${ngIsET ? '\u26A1ET' : 'LIVE'} ${g.time_elapsed.replace(/live/i, "").trim()}`
                : (ngHasPen ? "AET" : "FT");

            return (
              <button
                key={g.id}
                onClick={() => goTo(idx)}
                className={`flex-shrink-0 snap-start px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 whitespace-nowrap transition-colors
                  ${carouselIdx === idx
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-black/20 border-white/5 text-gray-500 hover:text-gray-300"}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isUpcoming ? "bg-blue-400" : ngIsET ? "bg-orange-500 animate-pulse" : gIsLive ? "bg-red-500 animate-pulse" : "bg-gray-400"
                }`} />
                <span>
                  {hName} {isUpcoming ? "vs" : `${ghs}-${gas}${ngHasPen ? ` (P:${nghp}-${ngap})` : ''}`} {aName}
                </span>
                <span className="text-gray-600">|</span>
                <span className={ngIsET ? "text-orange-400" : gIsLive ? "text-red-400" : ngHasPen ? "text-orange-400" : ""}>{timeStr}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function BracketTab({ games, teams, stadiums, onTeamClick }: BracketTabProps) {
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'upcoming'>('today');
  const [viewType, setViewType] = useState<'tree' | 'fall'>('tree');
  const [startRound, setStartRound] = useState<'r32' | 'r16' | 'qf' | 'sf'>('r32');
  const treeContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBracketSection = (section: 'left' | 'center' | 'right') => {
    const el = treeContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (section === 'left') {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (section === 'center') {
      el.scrollTo({ left: maxScroll / 2, behavior: 'smooth' });
    } else {
      el.scrollTo({ left: maxScroll, behavior: 'smooth' });
    }
  };
  // fallFilter: which round to start from in FALL (schedule) view
  const [fallFilter, setFallFilter] = useState<'all' | 'r32' | 'r16' | 'qf' | 'sf' | 'final'>('all');
  const teamMap = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t])), [teams]);
  const stadiumMap = useMemo(() => Object.fromEntries((stadiums || []).map((s) => [s.id, s])), [stadiums]);
  const gameMap = useMemo(() => Object.fromEntries(games.map(g => [g.id, g])), [games]);

  const nptToday = getCurrentNPTDate();
  const todayStr = format(nptToday, "MMM d");
  const tomorrowStr = format(addDays(nptToday, 1), "MMM d");

  const sortGames = (a: Game, b: Game) => {
    const aLive = a.time_elapsed !== "notstarted" && a.finished !== "TRUE" ? 1 : 0;
    const bLive = b.time_elapsed !== "notstarted" && b.finished !== "TRUE" ? 1 : 0;
    if (aLive !== bLive) return bLive - aLive;
    
    const aUpcoming = a.time_elapsed === "notstarted" ? 1 : 0;
    const bUpcoming = b.time_elapsed === "notstarted" ? 1 : 0;
    if (aUpcoming !== bUpcoming) return bUpcoming - aUpcoming;
    
    if (aUpcoming) {
      // Upcoming matches: soonest first (ascending)
      return new Date(a.local_date).getTime() - new Date(b.local_date).getTime();
    } else {
      // Live or finished matches: most recent/latest first (descending)
      return new Date(b.local_date).getTime() - new Date(a.local_date).getTime();
    }
  };

  const todayGames = useMemo(() => {
    return games.filter(g => isMatchToday(g.local_date, g.stadium_id)).sort(sortGames);
  }, [games]);

  const tomorrowGames = useMemo(() => {
    return games.filter(g => isMatchTomorrow(g.local_date, g.stadium_id)).sort(sortGames);
  }, [games]);

  const upcomingGames = useMemo(() => {
    // Return up to 4 upcoming matches strictly after tomorrow
    return games
      .filter(g => isMatchUpcomingLater(g.local_date, g.stadium_id))
      .sort((a, b) => new Date(a.local_date).getTime() - new Date(b.local_date).getTime())
      .slice(0, 4);
  }, [games]);

  const byType = useMemo(() => {
    const r32 = games.filter((g) => g.type === "r32").sort((a, b) => parseInt(a.id) - parseInt(b.id));
    const r16 = games.filter((g) => g.type === "r16").sort((a, b) => parseInt(a.id) - parseInt(b.id));
    const qf = games.filter((g) => g.type === "qf").sort((a, b) => parseInt(a.id) - parseInt(b.id));
    const sf = games.filter((g) => g.type === "sf").sort((a, b) => parseInt(a.id) - parseInt(b.id));
    const final = games.filter((g) => g.type === "final");
    const third = games.filter((g) => g.type === "third_place");
    return { r32, r16, qf, sf, final, third };
  }, [games]);

  const stages = [
    { key: "r32", label: "Round of 32", games: byType.r32 },
    { key: "r16", label: "Round of 16", games: byType.r16 },
    { key: "qf", label: "Quarter-finals", games: byType.qf },
    { key: "sf", label: "Semi-finals", games: byType.sf },
    { key: "final", label: "🏆 Final", games: byType.final },
    { key: "third", label: "3rd Place", games: byType.third },
  ].filter((s) => s.games.length > 0);

  const [externalNews, setExternalNews] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.news)) {
          setExternalNews(data.news.map((n: string) => `🗞️ NEWS: ${n}`));
        }
      })
      .catch(() => {});
  }, []);

  const newsBulletins = useMemo(() => {
    const local = generateLiveBulletins(games, teams);
    // Interleave local stats with real world cup news
    return externalNews.length > 0 ? [...local, ...externalNews] : local;
  }, [games, teams, externalNews]);

  const getMinWidthClass = () => {
    switch (startRound) {
      case 'r32': return 'min-w-[1150px]';
      case 'r16': return 'min-w-[900px]';
      case 'qf': return 'min-w-[650px]';
      case 'sf': return 'min-w-[400px]';
      default: return 'min-w-[1150px]';
    }
  };

  // Stages filtered by fallFilter
  const filteredStages = useMemo(() => {
    const order = ['r32', 'r16', 'qf', 'sf', 'final', 'third'];
    const filterOrder = ['r32', 'r16', 'qf', 'sf', 'final'];
    const startIdx = fallFilter === 'all' ? 0 : filterOrder.indexOf(fallFilter);
    const startKey = fallFilter === 'all' ? null : filterOrder[startIdx];
    // Include all stages from the selected key onwards (final always includes third)
    return stages.filter(s => {
      if (fallFilter === 'all') return true;
      const sIdx = order.indexOf(s.key);
      const fIdx = order.indexOf(fallFilter === 'final' ? 'final' : fallFilter);
      return sIdx >= fIdx;
    });
  }, [stages, fallFilter]);

  return (
    <div className="p-4 space-y-6">
      {/* 1. News Marquee */}
      <NewsMarquee bulletins={newsBulletins} />

      {/* 2. Today / Tomorrow / Upcoming tab bar */}
      <div className="flex p-1 bg-black/40 rounded-xl border border-white/10 max-w-sm mx-auto shadow-inner">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 rounded-lg text-center transition-all ${activeTab === 'today' ? 'bg-white/10 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-black uppercase tracking-widest">
            <span className={activeTab === 'today' ? 'text-red-500 animate-pulse' : 'text-gray-500'}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
            </span>
            {todayStr}
          </div>
          <span className="text-[8px] uppercase tracking-widest opacity-70">Today</span>
        </button>
        <button
          onClick={() => setActiveTab('tomorrow')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 rounded-lg text-center transition-all ${activeTab === 'tomorrow' ? 'bg-white/10 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-black uppercase tracking-widest">
            <span className="text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </span>
            {tomorrowStr}
          </div>
          <span className="text-[8px] uppercase tracking-widest opacity-70">Tomorrow</span>
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 rounded-lg text-center transition-all ${activeTab === 'upcoming' ? 'bg-white/10 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-black uppercase tracking-widest mt-1">
            <span className="text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </span>
            UPC
          </div>
          <span className="text-[8px] uppercase tracking-widest opacity-0 select-none">Upcoming</span>
        </button>
      </div>

      {/* 3. Carousel content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'today' && (
            <MatchCarouselSection
              title="Today's Matches"
              isLiveTitle="Live Now & Today"
              icon="🔴"
              iconColor="text-red-500"
              pulseColor="text-red-500"
              emptyMessage="No matches today"
              games={todayGames}
              teamMap={teamMap}
              stadiumMap={stadiumMap}
              onTeamClick={onTeamClick}
              allGames={games}
            />
          )}
          {activeTab === 'tomorrow' && (
            <MatchCarouselSection
              title="Tomorrow's Matches"
              icon="📅"
              iconColor="text-blue-400"
              emptyMessage="No matches tomorrow"
              games={tomorrowGames}
              teamMap={teamMap}
              stadiumMap={stadiumMap}
              onTeamClick={onTeamClick}
              allGames={games}
            />
          )}
          {activeTab === 'upcoming' && (
            <MatchCarouselSection
              title="Upcoming Matches"
              icon="⏳"
              iconColor="text-[#ff5e00]"
              emptyMessage="No upcoming matches"
              games={upcomingGames}
              teamMap={teamMap}
              stadiumMap={stadiumMap}
              onTeamClick={onTeamClick}
              allGames={games}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* 4. Stats Banner — always visible */}
      <div
        className="relative rounded-2xl overflow-hidden py-5 px-5 shadow-lg border border-white/5"
        style={{ 
          background: "linear-gradient(135deg, #111a30 0%, #060a14 100%)",
          boxShadow: "inset 0 1.5px 0px rgba(255, 255, 255, 0.1), 0 12px 30px rgba(0, 0, 0, 0.6)"
        }}
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: "url(/wc-hero.jpg)", backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-12 h-12 flex items-center justify-center bg-black/20 rounded-xl p-1 border border-white/5 shadow-inner">
              <img src="/fifaworldcup_logo.svg" alt="FIFA Cup" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black gold-text leading-tight tracking-wide">FIFA WORLD CUP 2026</h2>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Nepal Standard Time (NPT)</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <div className="bg-black/40 backdrop-blur rounded-xl p-2 sm:p-2.5 min-w-[72px] sm:min-w-[80px] text-center border border-white/5 flex flex-col items-center justify-center shadow-inner">
              <svg className="w-4 h-4 text-yellow-500/90 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-yellow-400 font-black text-base leading-none">{games.filter((g) => g.finished === "TRUE").length}</div>
              <div className="text-gray-500 text-[8px] font-black uppercase tracking-wider mt-1">Played</div>
            </div>
            <div className="bg-black/40 backdrop-blur rounded-xl p-2 sm:p-2.5 min-w-[72px] sm:min-w-[80px] text-center border border-white/5 flex flex-col items-center justify-center shadow-inner">
              <svg className="w-4 h-4 text-blue-400/90 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-blue-400 font-black text-base leading-none">{games.filter((g) => g.finished !== "TRUE").length}</div>
              <div className="text-gray-500 text-[8px] font-black uppercase tracking-wider mt-1">Rem</div>
            </div>
            <div className="bg-black/40 backdrop-blur rounded-xl p-2 sm:p-2.5 min-w-[72px] sm:min-w-[80px] text-center border border-white/5 flex flex-col items-center justify-center shadow-inner">
              <svg className="w-4 h-4 text-orange-500/90 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m12 2-2 4 4 0-2-4Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m10 6-4 2 2 3.5 2-5.5Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m14 6 4 2-2 3.5-2-5.5Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m8 11.5 2 4.5h4l2-4.5-2-3.5h-4l-2 3.5Z" />
              </svg>
              <div className="text-orange-500 font-black text-base leading-none">
                {games.filter((g) => g.finished === "TRUE").reduce((sum, g) => sum + (parseInt(g.home_score) || 0) + (parseInt(g.away_score) || 0), 0)}
              </div>
              <div className="text-gray-500 text-[8px] font-black uppercase tracking-wider mt-1">Goals</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. TREE / FALL toggle + round filter — below stats banner */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {/* View toggle */}
        <div className="flex p-1 bg-black/40 rounded-xl border border-white/10 shadow-inner">
          <button
            onClick={() => setViewType('tree')}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-200 ${
              viewType === 'tree'
                ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-400/10 text-yellow-400 border border-yellow-400/20 shadow'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-6"/><path d="M12 8v8"/><path d="M12 8A4 4 0 0 0 8 4h0a4 4 0 0 0-4 4v0a4 4 0 0 0 4 4h4"/><path d="M12 8a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4h-4"/></svg>
            Tree
          </button>
          <button
            onClick={() => setViewType('fall')}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-200 ${
              viewType === 'fall'
                ? 'bg-gradient-to-r from-orange-500/20 to-red-500/10 text-orange-400 border border-orange-400/20 shadow'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
            Fall
          </button>
        </div>

        {/* Round filter pills — always visible, applies to both views */}
        <div className="flex items-center gap-1.5 bg-black/30 border border-white/5 rounded-xl px-2 py-1.5 shadow-inner">
          {([
            { key: 'all',   label: 'All' },
            { key: 'r32',   label: 'R32' },
            { key: 'r16',   label: 'R16' },
            { key: 'qf',    label: 'QF' },
            { key: 'sf',    label: 'SF' },
            { key: 'final', label: 'Final' },
          ] as const).map((r) => (
            <button
              key={r.key}
              onClick={() => {
                setFallFilter(r.key);
                // Also sync startRound for tree view
                if (r.key !== 'all' && r.key !== 'final') setStartRound(r.key);
              }}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-150 ${
                fallFilter === r.key
                  ? 'bg-white/10 text-white shadow'
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6. TREE / FALL content */}
      <AnimatePresence mode="wait">
        {viewType === 'tree' ? (
          <motion.div
            key="tree-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {/* Logo + title */}
            <div className="flex flex-col items-center justify-center mb-4 text-center">
              <img src="/fifaworldcup_logo.svg" className="w-16 h-auto object-contain mb-2 select-none filter drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]" alt="FIFA World Cup 2026 Logo" />
              <h2 className="text-xl font-black tracking-tight text-white uppercase gold-text">2026 Knockout Bracket</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">NPT — Nepal Standard Time</p>
            </div>

            {/* Navigation Switcher */}
            <div className="flex justify-center mb-4 px-2">
              <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 shadow-inner gap-1.5 w-full max-w-sm justify-between">
                <button
                  onClick={() => scrollToBracketSection('left')}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider text-gray-300 hover:text-white bg-white/5 active:bg-white/10 transition-all border border-white/5 cursor-pointer"
                >
                  ◀ Left Bracket
                </button>
                <button
                  onClick={() => scrollToBracketSection('center')}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider text-yellow-400 hover:text-yellow-300 bg-yellow-400/10 active:bg-yellow-400/20 transition-all border border-yellow-400/10 cursor-pointer"
                >
                  🏆 Finals
                </button>
                <button
                  onClick={() => scrollToBracketSection('right')}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider text-gray-300 hover:text-white bg-white/5 active:bg-white/10 transition-all border border-white/5 cursor-pointer"
                >
                  Right Bracket ▶
                </button>
              </div>
            </div>

            {/* Scrollable tree */}
            <div ref={treeContainerRef} className="w-full overflow-x-auto rounded-2xl border border-white/5 bg-[#080d19]/50 backdrop-blur-md p-4 shadow-2xl select-none scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className={`flex gap-0 items-center w-max mx-auto px-4 py-4 h-[675px] ${getMinWidthClass()}`}>
                {startRound === 'r32' && (
                  <>
                    <div className="flex flex-col justify-around h-full animate-fade-in">
                      <BracketNode gameId="74" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R32" />
                      <BracketNode gameId="77" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R32" />
                      <BracketNode gameId="73" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R32" />
                      <BracketNode gameId="75" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R32" />
                      <BracketNode gameId="83" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R32" />
                      <BracketNode gameId="84" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R32" />
                      <BracketNode gameId="81" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R32" />
                      <BracketNode gameId="82" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R32" />
                    </div>
                    <ConnectorColR32ToR16 side="left" />
                  </>
                )}
                {(startRound === 'r32' || startRound === 'r16') && (
                  <>
                    <div className="flex flex-col justify-around h-full animate-fade-in">
                      <BracketNode gameId="89" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R16" />
                      <BracketNode gameId="90" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R16" />
                      <BracketNode gameId="93" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R16" />
                      <BracketNode gameId="94" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R16" />
                    </div>
                    <ConnectorColR16ToQF side="left" />
                  </>
                )}
                {(startRound === 'r32' || startRound === 'r16' || startRound === 'qf') && (
                  <>
                    <div className="flex flex-col justify-around h-full animate-fade-in">
                      <BracketNode gameId="97" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="QF" />
                      <BracketNode gameId="98" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="QF" />
                    </div>
                    <ConnectorColQFToSF side="left" />
                  </>
                )}
                <div className="flex flex-col justify-around h-full animate-fade-in">
                  <BracketNode gameId="101" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="SF" />
                </div>
                <ConnectorColSFToFinal side="left" />

                {/* Center: logo + Final + 3rd */}
                <div className="flex flex-col items-center justify-center gap-6 h-full w-[180px] relative animate-fade-in">
                  <div className="text-center space-y-2">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-yellow-400">The Final</div>
                    <BracketNode gameId="104" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="🏆 Final" />
                  </div>
                  <div className="relative flex flex-col items-center">
                    <div className="absolute inset-0 bg-[#ff5e00]/15 blur-2xl rounded-full -z-10 animate-pulse" />
                    <img
                      src="/tiger.png"
                      className="w-14 h-14 rounded-full object-cover border-2 border-yellow-400 shadow-2xl drop-shadow-[0_0_15px_rgba(250,204,21,0.35)] select-none animate-bounce-slow"
                      alt="Roar WC26"
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">3rd Place</div>
                    <BracketNode gameId="103" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="3rd" />
                  </div>
                </div>

                <ConnectorColSFToFinal side="right" />
                <div className="flex flex-col justify-around h-full animate-fade-in">
                  <BracketNode gameId="102" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="SF" />
                </div>
                {(startRound === 'r32' || startRound === 'r16' || startRound === 'qf') && (
                  <>
                    <ConnectorColQFToSF side="right" />
                    <div className="flex flex-col justify-around h-full animate-fade-in">
                      <BracketNode gameId="99" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="QF" />
                      <BracketNode gameId="100" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="QF" />
                    </div>
                  </>
                )}
                {(startRound === 'r32' || startRound === 'r16') && (
                  <>
                    <ConnectorColR16ToQF side="right" />
                    <div className="flex flex-col justify-around h-full animate-fade-in">
                      <BracketNode gameId="91" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R16" />
                      <BracketNode gameId="92" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R16" />
                      <BracketNode gameId="95" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R16" />
                      <BracketNode gameId="96" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R16" />
                    </div>
                  </>
                )}
                {startRound === 'r32' && (
                  <>
                    <ConnectorColR32ToR16 side="right" />
                    <div className="flex flex-col justify-around h-full animate-fade-in">
                      <BracketNode gameId="76" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R32" />
                      <BracketNode gameId="78" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R32" />
                      <BracketNode gameId="79" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R32" />
                      <BracketNode gameId="80" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R32" />
                      <BracketNode gameId="86" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R32" />
                      <BracketNode gameId="88" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R32" />
                      <BracketNode gameId="85" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R32" />
                      <BracketNode gameId="87" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="R32" />
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* FALL — colour-coded schedule with round filter */
          <motion.div
            key="fall-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            {filteredStages.map((stage) => {
              const stageColors: Record<string, { accent: string; glow: string; badge: string }> = {
                r32:   { accent: 'text-gray-400',    glow: 'from-gray-800/50',    badge: 'bg-gray-700/60 text-gray-300 border border-gray-600/30' },
                r16:   { accent: 'text-blue-400',    glow: 'from-blue-900/40',    badge: 'bg-blue-900/60 text-blue-300 border border-blue-700/30' },
                qf:    { accent: 'text-cyan-400',  glow: 'from-cyan-900/40',  badge: 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/30' },
                sf:    { accent: 'text-orange-400',  glow: 'from-orange-900/40',  badge: 'bg-orange-900/60 text-orange-300 border border-orange-700/30' },
                final: { accent: 'text-yellow-400',  glow: 'from-yellow-900/50',  badge: 'bg-yellow-900/60 text-yellow-300 border border-yellow-600/30' },
                third: { accent: 'text-emerald-400', glow: 'from-emerald-900/40', badge: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/30' },
              };
              const c = stageColors[stage.key] ?? stageColors.r32;
              return (
                <section key={stage.key}>
                  <div className={`flex items-center gap-3 mb-4 rounded-xl px-4 py-2.5 bg-gradient-to-r ${c.glow} to-transparent border border-white/5`}>
                    <h3 className={`text-sm font-black uppercase tracking-wider ${c.accent}`}>{stage.label}</h3>
                    <div className="flex-1 h-px bg-white/5" />
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
                      {stage.games.length} matches
                    </span>
                  </div>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    viewport={{ once: true }}
                    className={
                      stage.key === 'final'
                        ? 'grid grid-cols-1 max-w-sm mx-auto gap-3'
                        : stage.key === 'sf' || stage.key === 'third'
                        ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
                        : stage.key === 'qf'
                        ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
                        : 'grid grid-cols-2 sm:grid-cols-4 gap-2'
                    }
                  >
                    {stage.games.map((game) => (
                      <MatchCard
                        key={game.id}
                        game={game}
                        teamMap={teamMap}
                        stadiumMap={stadiumMap}
                        onTeamClick={onTeamClick}
                        compact={stage.key === 'r32' || stage.key === 'r16'}
                      />
                    ))}
                  </motion.div>
                </section>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
