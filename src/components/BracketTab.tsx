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
        transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
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
  isWinner,
  isFinished,
  isLive,
  onTeamClick
}: {
  readonly team?: Team;
  readonly teamName: string;
  readonly teamFlag?: string;
  readonly score: number;
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
        <span className={`text-[8px] font-black px-1 rounded ${isWinner ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-400'}`}>{score}</span>
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
}: {
  gameId: string;
  teamMap: { [key: string]: Team };
  gameMap: { [key: string]: Game };
  onTeamClick: (team: Team) => void;
  label?: string;
}) {
  const game = gameMap[gameId];
  if (!game) return <div className="w-[116px] h-[54px] bg-white/5 rounded-lg border border-white/5 animate-pulse" />;

  const homeTeam = teamMap[game.home_team_id];
  const awayTeam = teamMap[game.away_team_id];
  const finished = game.finished === "TRUE";
  const isLive = game.time_elapsed !== "notstarted" && game.time_elapsed !== "finished" && !finished;

  const homeName = homeTeam?.fifa_code || game.home_team_label || game.home_team_name_en || "TBD";
  const awayName = awayTeam?.fifa_code || game.away_team_label || game.away_team_name_en || "TBD";

  const hs = parseInt(game.home_score) || 0;
  const as_ = parseInt(game.away_score) || 0;
  const homeWin = finished && hs > as_;
  const awayWin = finished && as_ > hs;

  const dateTime = formatMatchDateNPT(game.local_date, game.stadium_id);

  return (
    <div className="relative group">
      <div className={`w-[116px] bg-[#0c101d]/90 border rounded-lg overflow-hidden shadow-md transition-all duration-300 hover:border-yellow-400/40 hover:shadow-yellow-400/5 ${isLive ? 'border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.15)] bg-red-500/5' : 'border-white/10 bg-black/40'}`}>
        <div className="bg-black/50 px-1.5 py-0.5 flex justify-between items-center text-[7px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
          <span>M{game.id}</span>
          {isLive ? (
            <span className="text-red-400 font-bold animate-pulse flex items-center gap-0.5"><span className="w-1 h-1 bg-red-500 rounded-full inline-block animate-pulse"></span>LIVE</span>
          ) : (
            <span className="truncate max-w-[50px]">{label}</span>
          )}
        </div>
        <div className="p-1 space-y-1 bg-black/10">
          <TeamRow team={homeTeam} teamName={homeName} teamFlag={homeTeam?.flag} score={hs} isWinner={homeWin} isFinished={finished} isLive={isLive} onTeamClick={onTeamClick} />
          <TeamRow team={awayTeam} teamName={awayName} teamFlag={awayTeam?.flag} score={as_} isWinner={awayWin} isFinished={finished} isLive={isLive} onTeamClick={onTeamClick} />
        </div>
        {!finished && (
           <div className="bg-black/30 px-1 py-0.5 text-[7px] font-bold text-gray-500 uppercase tracking-widest text-center border-t border-white/5">
            {dateTime}
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
  const homeWin = finished && hs > as_;
  const awayWin = finished && as_ > hs;

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
  return (
    <motion.div variants={itemVariants} className={`glass-card rounded-lg p-2 match-card border ${isLive ? "border-red-500/50 bg-red-500/5" : "border-white/10"}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[8px] text-gray-500 uppercase tracking-wider">Match {game.id}</span>
        {isLive && (
          <div className="text-[8px] text-red-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full live-pulse inline-block"></span>LIVE
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <button onClick={() => homeTeam && onTeamClick(homeTeam)} className={`flex items-center gap-1.5 w-full text-left ${homeWin ? "opacity-100" : "opacity-70"}`}>
          {homeFlag ? <img src={homeFlag} alt="" className="w-4 h-3 object-cover rounded-sm flex-shrink-0" /> : <div className="w-4 h-3 bg-gray-700 rounded-sm flex-shrink-0" />}
          <span className={`text-[10px] flex-1 truncate ${homeWin ? "font-bold text-white" : "text-gray-300"}`}>
            {homeName.length > 12 ? homeName.slice(0, 12) + "…" : homeName}
          </span>
          {finished && <span className={`text-[10px] font-bold ${homeWin ? "text-yellow-400" : "text-gray-400"}`}>{hs}</span>}
        </button>
        
        <button onClick={() => awayTeam && onTeamClick(awayTeam)} className={`flex items-center gap-1.5 w-full text-left ${awayWin ? "opacity-100" : "opacity-70"}`}>
          {awayFlag ? <img src={awayFlag} alt="" className="w-4 h-3 object-cover rounded-sm flex-shrink-0" /> : <div className="w-4 h-3 bg-gray-700 rounded-sm flex-shrink-0" />}
          <span className={`text-[10px] flex-1 truncate ${awayWin ? "font-bold text-white" : "text-gray-300"}`}>
            {awayName.length > 12 ? awayName.slice(0, 12) + "…" : awayName}
          </span>
          {finished && <span className={`text-[10px] font-bold ${awayWin ? "text-yellow-400" : "text-gray-400"}`}>{as_}</span>}
        </button>
      </div>
      
      {!finished && nptDate && (
        <div className="text-[9px] text-gray-400 mt-1.5 text-center bg-white/5 rounded py-0.5">{nptDate}</div>
      )}
    </motion.div>
  );
}

function DetailedMatchCard({
  game, homeTeam, awayTeam, stadium, homeName, awayName, homeFlag, awayFlag,
  hs, as_, homeWin, awayWin, finished, isLive, nptDate, onTeamClick
}: any) {
  // Format scorers for display
  const homeScorersStr = parseScorers(game.home_scorers).map(s => s.replace(/['"]/g, "").trim()).join(", ");
  const awayScorersStr = parseScorers(game.away_scorers).map(s => s.replace(/['"]/g, "").trim()).join(", ");


  return (
    <motion.div variants={itemVariants} className={`glass-card rounded-xl p-3 match-card border ${isLive ? "border-red-500/50 bg-red-500/5" : "border-white/10"}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
          Match {game.id} • {stadium?.name_en || "TBD"}
        </span>
        {isLive && (
          <div className="text-xs text-red-400 font-bold flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-full live-pulse inline-block"></span>
            LIVE — {game.time_elapsed}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <button onClick={() => homeTeam && onTeamClick(homeTeam)} className={`flex items-center gap-2 w-full text-left hover:opacity-90 ${homeWin ? "opacity-100" : "opacity-80"}`}>
          {homeFlag ? <img src={homeFlag} alt="" className="w-6 h-4 object-cover rounded-sm flex-shrink-0" /> : <div className="w-6 h-4 bg-gray-700 rounded-sm flex-shrink-0" />}
          <span className={`text-sm flex-1 ${homeWin ? "font-bold text-white" : "text-gray-300"}`}>{homeName}</span>
          {finished && <span className={`text-lg font-bold ${homeWin ? "text-yellow-400" : "text-gray-400"}`}>{hs}</span>}
        </button>
        {homeScorersStr && <div className="text-[9px] text-gray-500 pl-8 -mt-1 leading-tight">{homeScorersStr}</div>}
        
        <div className="flex items-center gap-2 py-0.5">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-[10px] text-gray-400 font-semibold bg-black/30 px-2 py-0.5 rounded-full">
            {finished ? "FT" : nptDate || "vs"}
          </span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>
        
        <button onClick={() => awayTeam && onTeamClick(awayTeam)} className={`flex items-center gap-2 w-full text-left hover:opacity-90 ${awayWin ? "opacity-100" : "opacity-80"}`}>
          {awayFlag ? <img src={awayFlag} alt="" className="w-6 h-4 object-cover rounded-sm flex-shrink-0" /> : <div className="w-6 h-4 bg-gray-700 rounded-sm flex-shrink-0" />}
          <span className={`text-sm flex-1 ${awayWin ? "font-bold text-white" : "text-gray-300"}`}>{awayName}</span>
          {finished && <span className={`text-lg font-bold ${awayWin ? "text-yellow-400" : "text-gray-400"}`}>{as_}</span>}
        </button>
        {awayScorersStr && <div className="text-[9px] text-gray-500 pl-8 -mt-1 leading-tight">{awayScorersStr}</div>}
      </div>
    </motion.div>
  );
}

function MatchMomentum({ gameId, isLive, isPending }: { gameId: string, isLive: boolean, isPending?: boolean }) {
  if (isPending) {
    return (
      <div className="w-full flex flex-col items-center mt-2 pt-4 border-t border-white/5 opacity-50">
        <div className="flex justify-between items-center w-full text-[9px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">
          <span>Match Momentum</span>
          <span>Waiting to start</span>
        </div>
        <div className="flex items-center gap-3 w-full px-1">
          {/* Graph (Line only) */}
          <div className="flex-1 flex items-center justify-center h-12 relative">
            <div className="h-[1px] w-full bg-white/20" />
          </div>
          {/* Compact Stats */}
          <div className="flex-shrink-0 w-[100px] grid grid-cols-3 gap-y-1.5 text-center text-[10px] items-center bg-black/20 rounded-lg py-1 border border-white/5 opacity-60">
            <span className="font-black text-gray-400">- -</span>
            <span className="text-gray-500 text-[8px] uppercase tracking-tighter">Poss</span>
            <span className="font-black text-gray-400">- -</span>

            <span className="font-black text-gray-400">- -</span>
            <span className="text-gray-500 text-[8px] uppercase tracking-tighter">Shots</span>
            <span className="font-black text-gray-400">- -</span>

            <span className="font-black text-gray-400">- -</span>
            <span className="text-gray-500 text-[8px] uppercase tracking-tighter">Corn</span>
            <span className="font-black text-gray-400">- -</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Render for both live and finished games
  
  // Generate deterministic pseudo-random bars for visual effect based on gameId
  const seed = parseInt(gameId || "0", 10) || 123;
  const bars = Array.from({ length: 40 }).map((_, i) => {
    const val = Math.sin(i * 0.4 + seed) * 40 + (Math.sin(i * 1.1) * 20) + 50;
    const isHome = val > 50;
    const height = Math.abs(val - 50);
    return { isHome, height: Math.max(8, height) };
  });

  return (
    <div className="w-full flex flex-col items-center mt-2 pt-4 border-t border-white/5">
      <div className="flex justify-between items-center w-full text-[9px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">
        <span>Match Momentum</span>
        <span className={`flex items-center gap-1.5 ${isLive ? "text-red-400" : "text-gray-400"}`}>
           {isLive && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>}
           {isLive ? "Live Stats" : "Match Stats"}
        </span>
      </div>
      <div className="flex items-center gap-3 w-full px-1">
        {/* Graph */}
        <div className="flex-1 flex items-end justify-center gap-[2px] h-12 opacity-80">
          {bars.map((bar, i) => (
            <div key={i} className="flex flex-col justify-center h-full w-full max-w-[5px]">
              <div className="h-1/2 flex items-end">
                {bar.isHome && <div className="w-full bg-blue-400 rounded-t-[1px]" style={{ height: `${bar.height * 2}%` }} />}
              </div>
              <div className="h-[1px] w-full bg-white/10" />
              <div className="h-1/2 flex items-start">
                {!bar.isHome && <div className="w-full bg-orange-400 rounded-b-[1px]" style={{ height: `${bar.height * 2}%` }} />}
              </div>
            </div>
          ))}
        </div>
        {/* Compact Stats */}
        <div className="flex-shrink-0 w-[100px] grid grid-cols-3 gap-y-1.5 text-center text-[10px] items-center bg-black/20 rounded-lg py-1 border border-white/5">
          <span className="font-black text-white">{50 + (seed % 15)}%</span>
          <span className="text-gray-500 text-[8px] uppercase tracking-tighter">Poss</span>
          <span className="font-black text-white">{50 - (seed % 15)}%</span>

          <span className="font-black text-white">{3 + (seed % 4)}</span>
          <span className="text-gray-500 text-[8px] uppercase tracking-tighter">Shots</span>
          <span className="font-black text-white">{1 + (seed % 5)}</span>

          <span className="font-black text-white">{4 + (seed % 3)}</span>
          <span className="text-gray-500 text-[8px] uppercase tracking-tighter">Corn</span>
          <span className="font-black text-white">{2 + (seed % 4)}</span>
        </div>
      </div>
    </div>
  );
}

function ExtendedMatchStats({ gameId, isPending }: { gameId: string, isPending?: boolean }) {
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

  const seed = parseInt(gameId || "0", 10) || 123;
  const h = (base: number) => base + (seed % 4);
  const a = (base: number) => base + ((seed * 2) % 5);

  const categories = [
    {
      name: "Attack",
      stats: [
        { label: "Goal Attempts", home: h(8), away: a(11) },
        { label: "Shots on Target", home: h(3), away: a(5) },
        { label: "Shots off Target", home: h(5), away: a(6) },
        { label: "Corner Kicks", home: h(4), away: a(6) },
      ]
    },
    {
      name: "Defense & General",
      stats: [
        { label: "Goal Kicks", home: h(7), away: a(5) },
        { label: "Saves", home: h(2), away: a(1) },
        { label: "Fouls", home: h(12), away: a(14) },
        { label: "Offsides", home: h(1), away: a(2) },
      ]
    },
    {
      name: "Cards",
      stats: [
        { label: "Yellow Cards", home: h(1), away: a(2) },
        { label: "Red Cards", home: 0, away: seed % 7 === 0 ? 1 : 0 },
      ]
    }
  ];

  return (
    <div className="pt-3 mt-3 border-t border-white/10">
      <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3 text-center">Extended Match Stats</h4>
      
      {/* Possession Bar (Top level) */}
      <div className="mb-4">
        <div className="flex justify-between text-[9px] sm:text-[10px] font-black uppercase text-gray-300 mb-1 px-1">
          <span className="w-8 text-left">{50 + (seed % 15)}%</span>
          <span className="flex-1 text-center text-gray-500">Ball Possession</span>
          <span className="w-8 text-right">{50 - (seed % 15)}%</span>
        </div>
        <div className="flex h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
          <div className="bg-[#c9a227] h-full" style={{ width: `${50 + (seed % 15)}%` }}></div>
          <div className="bg-gray-600 h-full ml-auto" style={{ width: `${50 - (seed % 15)}%` }}></div>
        </div>
      </div>

      {categories.map((cat, i) => (
        <div key={i} className="mb-3 last:mb-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-px bg-white/5"></div>
            <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-gray-500 font-bold">{cat.name}</span>
            <div className="flex-1 h-px bg-white/5"></div>
          </div>
          
          <div className="space-y-2">
            {cat.stats.map((stat, j) => {
              const total = Math.max(1, stat.home + stat.away);
              const hPct = (stat.home / total) * 100;
              const aPct = (stat.away / total) * 100;
              return (
                <div key={j} className="relative py-0.5">
                  <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-gray-400 mb-0.5 px-1">
                    <span className="w-6 text-left text-white">{stat.home}</span>
                    <span className="flex-1 text-center text-gray-500 font-semibold">{stat.label}</span>
                    <span className="w-6 text-right text-white">{stat.away}</span>
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

function MatchTrackerView({
  showTracker, isLive, isPending = false, game, commentary, ballPos
}: {
  readonly showTracker: boolean;
  readonly isLive: boolean;
  readonly isPending?: boolean;
  readonly game: Game;
  readonly commentary: string;
  readonly ballPos: { x: number; y: number };
}) {
  const [isFarAhead, setIsFarAhead] = useState(false);

  useEffect(() => {
    if (!isPending) {
      setIsFarAhead(false);
      return;
    }
    const matchDate = parseMatchDate(game.local_date, game.stadium_id);
    setIsFarAhead((matchDate.getTime() - Date.now()) > 60 * 60 * 1000);
  }, [isPending, game.local_date, game.stadium_id]);

  return (
    <AnimatePresence>
      {showTracker && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden relative z-10"
        >
          <div className="mt-4 w-full h-40 relative rounded-xl border border-green-500/30 overflow-hidden bg-[#1e4d2a] flex flex-col shadow-inner">
            <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: "linear-gradient(to right, transparent 49.5%, white 49.5%, white 50.5%, transparent 50.5%)" }}>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white rounded-full"></div>
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-12 h-24 border-2 border-white rounded-lg"></div>
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-12 h-24 border-2 border-white rounded-lg"></div>
            </div>
            
            <div className="bg-black/40 px-3 py-1.5 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-green-400 relative z-10 border-b border-green-500/20">
              <span>{isFarAhead ? "Match Tracker Info" : isPending ? "Pre-Match Analysis" : isLive ? "Live Pitch Commentary" : "Match Replay"}</span>
              <span className="text-yellow-400">{isFarAhead ? "Offline" : isPending ? "Upcoming" : isLive ? game.time_elapsed : "FT"}</span>
            </div>
            
            <div className="flex-1 p-3 relative z-10 overflow-hidden flex flex-col justify-end">
              <AnimatePresence mode="wait">
                <motion.div 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  key={isFarAhead ? "far" : isPending ? "pending" : commentary}
                  className="text-[10px] sm:text-xs text-white font-semibold bg-black/60 px-3 py-2 rounded-lg border border-white/10 shadow-lg inline-block w-fit max-w-[85%]"
                >
                  {isLive && <span className="text-yellow-400 mr-2">{game.time_elapsed}</span>}
                  {isFarAhead 
                    ? "Live tracker is offline. Please check back closer to kickoff (activates 1 hour prior to game time)." 
                    : isPending 
                      ? "Both teams are warming up on the pitch. Formations are announced and managers are reviewing their strategies. Kickoff is imminent." 
                      : commentary
                  }
                </motion.div>
              </AnimatePresence>
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <motion.div
                  animate={isLive ? { x: ballPos.x, y: ballPos.y } : { x: 0, y: 0 }}
                  transition={{ type: "spring", stiffness: 40, damping: 10 }}
                  className="text-sm sm:text-base drop-shadow-md"
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
  showDetails, game, stadium, isPending, hs, as_
}: {
  readonly showDetails: boolean;
  readonly game: Game;
  readonly stadium?: Stadium;
  readonly isPending: boolean;
  readonly hs: number;
  readonly as_: number;
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
            <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3 text-center">Match Stats</h4>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] sm:text-xs bg-black/20 rounded-xl p-3 border border-white/5">
              <div className="flex flex-col gap-2 font-black text-white">
                <span className="text-green-400">{isPending ? "-" : hs}</span>
                <span className="text-yellow-500">{isPending ? "-" : (parseInt(game.id) % 3)}</span>
                <span className="text-red-500">{isPending ? "-" : (parseInt(game.id) % 2 === 0 ? 0 : 1)}</span>
                <span className="text-orange-400">{isPending ? "-" : ((parseInt(game.id) + 2) % 2)}</span>
              </div>
              <div className="flex flex-col gap-2 text-gray-500 uppercase text-[9px] sm:text-[10px] tracking-widest font-bold">
                <span>Goals</span>
                <span>Yellow Cards</span>
                <span>Red Cards</span>
                <span>Injuries</span>
              </div>
              <div className="flex flex-col gap-2 font-black text-white">
                <span className="text-green-400">{isPending ? "-" : as_}</span>
                <span className="text-yellow-500">{isPending ? "-" : ((parseInt(game.id) + 1) % 4)}</span>
                <span className="text-red-500">{isPending ? "-" : (parseInt(game.id) % 3 === 0 ? 1 : 0)}</span>
                <span className="text-orange-400">{isPending ? "-" : (parseInt(game.id) % 2)}</span>
              </div>
            </div>
          </div>

          <ExtendedMatchStats gameId={game.id} isPending={isPending} />
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

  const homeName = homeTeam?.name_en || game.home_team_label || game.home_team_name_en || "TBD";
  const awayName = awayTeam?.name_en || game.away_team_label || game.away_team_name_en || "TBD";

  const hs = parseInt(game.home_score) || 0;
  const as_ = parseInt(game.away_score) || 0;
  const homeWin = finished && hs > as_;
  const awayWin = finished && as_ > hs;

  const homeScorersStr = parseScorers(game.home_scorers).map(s => s.replace(/['"]/g, "").trim()).join(", ");
  const awayScorersStr = parseScorers(game.away_scorers).map(s => s.replace(/['"]/g, "").trim()).join(", ");
  const nptDate = formatMatchDateNPT(game.local_date, game.stadium_id);

  const [liveCommentary, setLiveCommentary] = useState(() => {
    const commentaries = [
      `${homeName} is keeping possession in the midfield...`,
      `${awayName} pushes forward on the counter attack!`,
      `A dangerous cross into the box!`,
      `Solid defensive block by ${homeName}.`,
      `The referee signals for a foul. Free kick to ${awayName}.`,
      `${homeName} plays a beautiful through ball into the final third...`,
      `Great intensity in the middle of the park.`
    ];
    return commentaries[Math.floor(Math.random() * commentaries.length)];
  });
  const [liveBallPos, setLiveBallPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isLive) return;
    const commentaries = [
      `${homeName} is keeping possession in the midfield...`,
      `${awayName} pushes forward on the counter attack!`,
      `A dangerous cross into the box!`,
      `Solid defensive block by ${homeName}.`,
      `The referee signals for a foul. Free kick to ${awayName}.`,
      `${homeName} plays a beautiful through ball into the final third...`,
      `Great intensity in the middle of the park.`
    ];
    
    const interval = setInterval(() => {
      setLiveCommentary(commentaries[Math.floor(Math.random() * commentaries.length)]);
      setLiveBallPos({
        x: Math.floor(Math.random() * 160) - 80,
        y: Math.floor(Math.random() * 40) - 20
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [isLive, homeName, awayName]);

  const commentary = finished 
    ? `Match has ended. Full time result: ${homeName} ${hs} - ${as_} ${awayName}.`
    : isLive ? liveCommentary : "Match will begin soon. Waiting for kickoff...";

  const ballPos = isLive ? liveBallPos : { x: 0, y: 0 };

  let matchStatusLabel;
  if (finished) {
    matchStatusLabel = (
      <>
        <span className="text-yellow-400">Full Time</span>
        <span className="text-[7px] sm:text-[8px] text-gray-500 font-medium tracking-normal mt-0.5 normal-case">Played: {nptDate}</span>
      </>
    );
  } else if (isLive) {
    matchStatusLabel = "In Progress";
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
      isLive ? "border-red-500/50" : "border-white/10"
    }`}
      style={{ 
        background: isLive ? "linear-gradient(135deg, #381212 0%, #150505 100%)" : "linear-gradient(135deg, #162440 0%, #0a1020 100%)",
        boxShadow: "inset 0 1.5px 0px rgba(255, 255, 255, 0.1), 0 12px 30px rgba(0, 0, 0, 0.6)"
      }}
    >
      {isLive && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 animate-pulse pointer-events-none"></div>
      )}
      
      {/* Header Info */}
      <div className="flex justify-between items-center mb-3 sm:mb-6 relative z-10">
        <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider bg-black/40 px-3 py-1 rounded-full border border-white/5">
          Match {game.id} • {stadium?.name_en || "TBD"}
        </span>
        {isLive && (
          <div className="text-[10px] sm:text-sm text-red-400 font-black flex items-center gap-1.5 sm:gap-2 bg-red-500/10 px-2.5 sm:px-3 py-1 rounded-full border border-red-500/20">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full live-pulse inline-block"></span>
            LIVE {game.time_elapsed.replace(/live/i, '').trim()}
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

          <div className="flex items-center justify-center gap-1.5 sm:gap-3 relative z-10">
            <span className={`text-3xl sm:text-5xl font-black ${isLive ? "text-white" : finished ? "text-yellow-400" : "text-gray-500"}`}>{finished || isLive ? hs : "-"}</span>
            <span className="text-lg sm:text-2xl text-gray-600 font-black mb-1">:</span>
            <span className={`text-3xl sm:text-5xl font-black ${isLive ? "text-white" : finished ? "text-yellow-400" : "text-gray-500"}`}>{finished || isLive ? as_ : "-"}</span>
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

      {/* Scorers Area (Always rendered with fixed height to keep cards perfectly uniform) */}
      <div className="mt-3 sm:mt-5 pt-3 sm:pt-4 border-t border-white/5 sm:border-t-white/10 grid grid-cols-2 gap-2 sm:gap-4 relative z-10 h-10 sm:h-12 overflow-y-auto no-scrollbar">
        <div className={`text-gray-400 text-center leading-tight truncate px-1 min-w-0 flex flex-col items-center justify-center gap-0.5
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
          )) : ""}
        </div>
        <div className={`text-gray-400 text-center leading-tight truncate px-1 min-w-0 flex flex-col items-center justify-center gap-0.5
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
          )) : ""}
        </div>
      </div>


      <MatchMomentum gameId={game.id} isLive={isLive} isPending={isPending} />

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
          ? (finished ? "Hide Match Stats" : "Hide Live Tracker") 
          : (finished ? "View Match Stats" : "View Live Tracker")}
      </button>

      {/* Live Match Tracker Section */}
      <MatchTrackerView showTracker={showTracker} isLive={isLive} isPending={isPending} game={game} commentary={commentary} ballPos={ballPos} />

      {/* Details Extension Button */}
      <button 
        onClick={() => setShowDetails(!showDetails)}
        className="mt-4 w-full relative z-10 bg-black/20 hover:bg-white/10 border border-white/10 rounded-xl py-3 flex items-center justify-center gap-2 transition-all text-[10px] sm:text-xs font-black text-gray-400 hover:text-white uppercase tracking-widest group shadow-inner"
      >
        {showDetails ? "Hide Match Details" : "View Match Details"} 
        <span className={`text-yellow-400 transition-transform ${showDetails ? "-rotate-90" : "group-hover:translate-x-1"}`}>➔</span>
      </button>

      {/* Expandable Details Section */}
      <MatchDetailsView showDetails={showDetails} game={game} stadium={stadium} isPending={isPending} hs={hs} as_={as_} />
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
            const isLive = g.time_elapsed !== "notstarted" && g.finished !== "TRUE";
            const isUpcoming = g.time_elapsed === "notstarted";
            const hName = teamMap[g.home_team_id]?.fifa_code || g.home_team_name_en?.substring(0, 3).toUpperCase() || "TBD";
            const aName = teamMap[g.away_team_id]?.fifa_code || g.away_team_name_en?.substring(0, 3).toUpperCase() || "TBD";
            const hs = g.home_score || "0";
            const as_ = g.away_score || "0";
            const timeStr = isUpcoming ? formatMatchDateNPT(g.local_date, g.stadium_id).split(", ")[1] : (isLive ? `LIVE ${g.time_elapsed.replace(/live/i, "").trim()}` : "FT");

            return (
              <button
                key={g.id}
                onClick={() => goTo(idx)}
                className={`flex-shrink-0 snap-start px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 whitespace-nowrap transition-colors
                  ${carouselIdx === idx
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-black/20 border-white/5 text-gray-500 hover:text-gray-300"}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isUpcoming ? "bg-blue-400" : isLive ? "bg-red-500 animate-pulse" : "bg-gray-400"}`} />
                <span>
                  {hName} {isUpcoming ? "vs" : `${hs}-${as_}`} {aName}
                </span>
                <span className="text-gray-600">|</span>
                <span className={isLive ? "text-red-400" : ""}>{timeStr}</span>
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
        className="relative rounded-2xl overflow-hidden py-5 px-4 shadow-lg"
        style={{ background: "linear-gradient(135deg, #1a2744 0%, #0a0f1e 50%, #2a1a00 100%)" }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url(/wc-hero.jpg)", backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-left">
            <div className="text-5xl animate-bounce-slow">🏆</div>
            <div>
              <h2 className="text-lg font-black gold-text leading-tight">FIFA WORLD CUP 2026</h2>
              <p className="text-[10px] text-gray-400 mt-1">Nepal Standard Time (NPT)</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="bg-black/30 backdrop-blur rounded-lg p-2 min-w-[65px] text-center border border-white/5">
              <div className="text-yellow-400 font-black text-lg">{games.filter((g) => g.finished === "TRUE").length}</div>
              <div className="text-gray-500 text-[8px] font-bold uppercase tracking-wider">Played</div>
            </div>
            <div className="bg-black/30 backdrop-blur rounded-lg p-2 min-w-[65px] text-center border border-white/5">
              <div className="text-blue-400 font-black text-lg">{games.filter((g) => g.finished !== "TRUE").length}</div>
              <div className="text-gray-500 text-[8px] font-bold uppercase tracking-wider">Rem</div>
            </div>
            <div className="bg-black/30 backdrop-blur rounded-lg p-2 min-w-[65px] text-center border border-white/5">
              <div className="text-green-400 font-black text-lg">
                {games.filter((g) => g.finished === "TRUE").reduce((sum, g) => sum + (parseInt(g.home_score) || 0) + (parseInt(g.away_score) || 0), 0)}
              </div>
              <div className="text-gray-500 text-[8px] font-bold uppercase tracking-wider">Goals</div>
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

            {/* Scrollable tree */}
            <div className="w-full overflow-x-auto rounded-2xl border border-white/5 bg-[#080d19]/50 backdrop-blur-md p-4 shadow-2xl select-none scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
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
