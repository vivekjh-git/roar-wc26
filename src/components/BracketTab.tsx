/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Game, Team, Stadium } from "@/lib/api";
import { parseScorers, PLAYER_NAME_ALIASES } from "@/lib/api";
import { formatMatchDateNPT, isMatchToday, isMatchTomorrow, isMatchUpcomingLater, getCurrentNPTDate, parseMatchDate } from "@/lib/date-utils";
import { generateLiveBulletins } from "@/lib/news-utils";
import { format, addDays } from "date-fns";
import CachedPlayerImage from "./CachedPlayerImage";
import { getPlayerMatchRating } from "@/lib/player-ratings";
import {
  GoalIcon,
  YellowCardIcon,
  RedCardIcon,
  SubIcon,
  AttemptIcon,
  FoulIcon,
  CornerIcon,
  OffsideIcon,
  InfoIcon,
  WhistleIcon,
  MegaphoneIcon,
} from "./FlatIcons";

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
  readonly onPlayerClick?: (name: string, teamId: string) => void;
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
}: {
  game: Game; homeTeam?: Team; awayTeam?: Team;
  homeName: string; awayName: string; homeFlag?: string; awayFlag?: string;
  hs: number; as_: number; homeWin: boolean; awayWin: boolean;
  finished: boolean; isLive: boolean; nptDate: string;
  onTeamClick: (team: Team) => void;
}) {
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
}: {
  game: Game; homeTeam?: Team; awayTeam?: Team; stadium?: Stadium;
  homeName: string; awayName: string; homeFlag?: string; awayFlag?: string;
  hs: number; as_: number; homeWin: boolean; awayWin: boolean;
  finished: boolean; isLive: boolean; nptDate: string;
  onTeamClick: (team: Team) => void;
}) {
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


  return (
    <motion.div variants={itemVariants} className={`glass-card rounded-xl p-3 match-card border ${isLive ? (isET ? "border-orange-500/50 bg-orange-500/5" : "border-red-500/50 bg-red-500/5") : "border-white/10"}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
          {stadium?.name_en || "TBD"}
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

interface TimelineMarker {
  minute: number;
  type: "goal" | "card" | "redCard" | "sub" | "attempt" | "foul" | "offside" | "corner";
  team: "home" | "away";
  detail: string;
}

function TimelineIcon({ type }: { readonly type: TimelineMarker["type"] }) {
  switch (type) {
    case "goal":
      return <GoalIcon size={12} />;
    case "sub":
      return <SubIcon size={12} />;
    case "card":
      return <YellowCardIcon className="inline-block" />;
    case "redCard":
      return <RedCardIcon className="inline-block" />;
    case "attempt":
      return <AttemptIcon size={12} />;
    case "foul":
      return <FoulIcon size={12} />;
    case "offside":
      return <OffsideIcon size={12} />;
    case "corner":
      return <CornerIcon size={12} />;
    default:
      return null;
  }
}

function TimelineEventsModal({
  onClose, events, homeFlag, awayFlag, homeCode, awayCode
}: {
  readonly onClose: () => void;
  readonly events: CommentaryEntry[];
  readonly homeFlag?: string;
  readonly awayFlag?: string;
  readonly homeCode: string;
  readonly awayCode: string;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        ref={overlayRef}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 w-full sm:w-[480px] max-h-[85vh] bg-[#0d1526] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        >
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white">
              {homeFlag && <img src={homeFlag} alt="" className="w-4 h-3 object-cover rounded-sm" />}
              <span>{homeCode}</span>
              <span className="text-gray-600">vs</span>
              <span>{awayCode}</span>
              {awayFlag && <img src={awayFlag} alt="" className="w-4 h-3 object-cover rounded-sm" />}
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-gray-400 hover:text-white">✕</button>
          </div>
          <div className="overflow-y-auto p-3 space-y-1.5">
            {events.length === 0 && (
              <p className="text-center text-xs text-gray-500 py-8">No events recorded yet.</p>
            )}
            {[...events].reverse().map(entry => {
              const flag = entry.team === "home" ? homeFlag : entry.team === "away" ? awayFlag : undefined;
              return (
                <div key={entry.id} className="flex items-center gap-2 bg-black/30 rounded-lg px-2.5 py-2 text-[11px] text-white">
                  {flag && <img src={flag} alt="" className="w-3.5 h-2.5 object-cover rounded-[1px] shrink-0" />}
                  <span className="text-yellow-400/90 font-bold shrink-0 tabular-nums">[{entry.minute}]</span>
                  <span className="flex-1">
                    {entry.headline && <span className="font-black">{entry.headline} </span>}
                    {entry.detail}
                  </span>
                  <span className="shrink-0 text-xs flex items-center justify-center">{getCommentaryIcon(entry.type, entry.detail)}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const TIMELINE_PX_PER_MIN = 10;

function MatchTimeline({
  isLive, isPending, isFinished, currentMinute, momentum, timeline, matched, events,
  homeFlag, awayFlag, homeCode, awayCode
}: {
  readonly isLive: boolean;
  readonly isPending?: boolean;
  readonly isFinished: boolean;
  readonly currentMinute: number | null;
  readonly momentum: Array<{ bucketStart: number; home: number; away: number }> | null;
  readonly timeline: TimelineMarker[] | null;
  readonly matched: boolean;
  readonly events: CommentaryEntry[];
  readonly homeFlag?: string;
  readonly awayFlag?: string;
  readonly homeCode: string;
  readonly awayCode: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const [showJumpToLive, setShowJumpToLive] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);
  const programmaticScrollRef = useRef(false);
  const hasFinishedScrolledRef = useRef(false);

  const bucketSize = 5;
  const dataMax = Math.max(
    90,
    ...(timeline ?? []).map(e => e.minute),
    ...(momentum ?? []).map(b => b.bucketStart + bucketSize)
  );
  const axisMax = Math.ceil(dataMax / 15) * 15;
  const canvasWidth = expanded ? axisMax * TIMELINE_PX_PER_MIN : undefined;
  const maxBucket = momentum?.length ? Math.max(1, ...momentum.map(b => Math.max(b.home, b.away))) : 1;
  const ticks = Array.from({ length: axisMax / 15 + 1 }, (_, i) => i * 15);

  const scrollToMinute = (minute: number) => {
    const el = scrollRef.current;
    if (!el || !canvasWidth) return;
    const target = Math.max(0, Math.min(canvasWidth - el.clientWidth, minute * TIMELINE_PX_PER_MIN - el.clientWidth * 0.6));
    programmaticScrollRef.current = true;
    el.scrollTo({ left: target, behavior: "smooth" });
    window.setTimeout(() => { programmaticScrollRef.current = false; }, 700);
  };

  useEffect(() => {
    if (!expanded || !matched || isPending || !canvasWidth) return;
    if (isLive && currentMinute != null && !userScrolledRef.current) {
      scrollToMinute(currentMinute);
    } else if (isFinished && !hasFinishedScrolledRef.current) {
      hasFinishedScrolledRef.current = true;
      const el = scrollRef.current;
      if (el) {
        programmaticScrollRef.current = true;
        el.scrollTo({ left: canvasWidth - el.clientWidth, behavior: "smooth" });
        window.setTimeout(() => { programmaticScrollRef.current = false; }, 700);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, matched, isPending, isLive, isFinished, currentMinute, canvasWidth]);

  const handleScroll = () => {
    if (programmaticScrollRef.current) return;
    userScrolledRef.current = true;
    if (isLive) setShowJumpToLive(true);
  };

  const jumpToLive = () => {
    userScrolledRef.current = false;
    setShowJumpToLive(false);
    if (currentMinute != null) scrollToMinute(currentMinute);
  };

  const toggleExpanded = () => {
    setExpanded(prev => {
      const next = !prev;
      if (next) {
        // Re-enter expanded mode with a fresh follow-live lock.
        userScrolledRef.current = false;
        hasFinishedScrolledRef.current = false;
        setShowJumpToLive(false);
      }
      return next;
    });
  };

  // Click-and-drag scrolling for desktop mice (touch devices already scroll natively).
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const dragMovedRef = useRef(false);

  const onTimelineMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDraggingRef.current = true;
    dragMovedRef.current = false;
    dragStartXRef.current = e.pageX;
    dragStartScrollRef.current = scrollRef.current.scrollLeft;
  };
  const onTimelineMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    const dx = e.pageX - dragStartXRef.current;
    if (Math.abs(dx) > 4) {
      dragMovedRef.current = true;
      userScrolledRef.current = true;
      if (isLive) setShowJumpToLive(true);
    }
    scrollRef.current.scrollLeft = dragStartScrollRef.current - dx;
  };
  const endTimelineDrag = () => { isDraggingRef.current = false; };
  // Swallow the click that follows a drag so it doesn't also open the icon/modal underneath.
  const onTimelineClickCapture = (e: React.MouseEvent) => {
    if (dragMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      dragMovedRef.current = false;
    }
  };

  if (isPending || !matched) {
    const statusLabel = isPending ? "Upcoming" : "Not available";
    return (
      <div className="w-full flex flex-col items-center mt-2 pt-4 border-t border-white/5 opacity-55">
        <div className="flex justify-between items-center w-full text-[9px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">
          <span>Match Timeline</span>
          <span className="text-gray-400 font-bold uppercase tracking-wider text-[8px]">{statusLabel}</span>
        </div>
        <div className="w-full h-16 flex items-center justify-center">
          <div className="h-[1px] w-full bg-white/20" />
        </div>
      </div>
    );
  }

  // Group markers landing on the same minute+team+type so duplicates stack instead of overlapping.
  const grouped = new Map<string, TimelineMarker[]>();
  (timeline ?? []).forEach(m => {
    const key = `${m.minute}-${m.team}-${m.type}`;
    const arr = grouped.get(key) ?? [];
    arr.push(m);
    grouped.set(key, arr);
  });

  return (
    <div className="w-full flex flex-col items-center mt-2 pt-4 border-t border-white/5 relative">
      <div className="flex justify-between items-center w-full px-2 mb-2 gap-2">
        <button
          onClick={() => setShowModal(true)}
          className="text-[9px] font-bold text-gray-500 uppercase tracking-widest hover:text-gray-300 transition-colors truncate"
        >
          Match Timeline <span className="text-gray-600 normal-case font-normal">(tap for full list)</span>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wider ${isLive ? "text-red-400" : "text-gray-400"}`}>
             {isLive && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>}
             {isLive ? "Live" : "Final"}
          </span>
          <button
            onClick={toggleExpanded}
            title={expanded ? "Collapse timeline" : "Expand timeline (scrollable)"}
            className="w-4 h-4 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white text-[10px] leading-none transition-colors"
          >
            {expanded ? "⊖" : "⊕"}
          </button>
        </div>
      </div>

      {showJumpToLive && expanded && (
        <button
          onClick={jumpToLive}
          className="absolute top-6 right-2 z-10 text-[8px] font-black uppercase tracking-widest bg-red-500/90 text-white px-2 py-0.5 rounded-full shadow-lg animate-pulse"
        >
          ● Jump to live
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onMouseDown={onTimelineMouseDown}
        onMouseMove={onTimelineMouseMove}
        onMouseUp={endTimelineDrag}
        onMouseLeave={endTimelineDrag}
        onClickCapture={onTimelineClickCapture}
        className={`w-full overflow-x-auto no-scrollbar select-none ${expanded ? "cursor-grab active:cursor-grabbing" : ""}`}
      >
        <div className={!expanded ? "w-full" : undefined} style={{ width: canvasWidth }}>
          <div className="relative" style={{ height: 78 }}>
            {/* HT / FT guide lines */}
            <div className="absolute top-0 bottom-3 w-px bg-white/10" style={{ left: `${(45 / axisMax) * 100}%` }} />
            <span className="absolute -top-0.5 text-[7px] text-gray-500 font-bold -translate-x-1/2" style={{ left: `${(45 / axisMax) * 100}%` }}>HT</span>
            <span className="absolute -top-0.5 right-0 text-[7px] text-gray-500 font-bold">FT</span>

            {/* Home icon lane */}
            <div className="absolute top-2.5 left-0 right-0 h-4">
              {[...grouped.entries()].filter(([k]) => k.includes("-home-")).map(([key, items]) => (
                <button key={key} onClick={() => setShowModal(true)} className="absolute flex flex-col items-center gap-[1px] -translate-x-1/2" style={{ left: `${(items[0].minute / axisMax) * 100}%` }}>
                  <TimelineIcon type={items[0].type} />
                  {items.length > 1 && <span className="text-[6px] text-gray-400 leading-none">×{items.length}</span>}
                </button>
              ))}
            </div>

            {/* Density bars */}
            <div className="absolute top-7 bottom-7 left-0 right-0 flex items-center gap-px">
              {momentum && momentum.length > 0 ? momentum.map((bucket) => (
                <div key={bucket.bucketStart} className="flex flex-col justify-center h-full" style={{ width: `${(bucketSize / axisMax) * 100}%` }}>
                  <div className="h-1/2 flex items-end">
                    {bucket.home > 0 && <div className="w-full bg-blue-400/70 rounded-t-[1px]" style={{ height: `${(bucket.home / maxBucket) * 100}%` }} />}
                  </div>
                  <div className="h-px w-full bg-white/10" />
                  <div className="h-1/2 flex items-start">
                    {bucket.away > 0 && <div className="w-full bg-orange-400/70 rounded-b-[1px]" style={{ height: `${(bucket.away / maxBucket) * 100}%` }} />}
                  </div>
                </div>
              )) : <div className="h-px w-full bg-white/20" />}
            </div>

            {/* Away icon lane */}
            <div className="absolute bottom-0 left-0 right-0 h-4">
              {[...grouped.entries()].filter(([k]) => k.includes("-away-")).map(([key, items]) => (
                <button key={key} onClick={() => setShowModal(true)} className="absolute flex flex-col items-center gap-[1px] -translate-x-1/2" style={{ left: `${(items[0].minute / axisMax) * 100}%` }}>
                  {items.length > 1 && <span className="text-[6px] text-gray-400 leading-none">×{items.length}</span>}
                  <TimelineIcon type={items[0].type} />
                </button>
              ))}
            </div>
          </div>

          {/* Minute axis */}
          <div className="relative h-3 mt-1">
            {ticks.map(t => (
              <span key={t} className="absolute text-[7px] text-gray-600 font-mono -translate-x-1/2" style={{ left: `${(t / axisMax) * 100}%` }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <TimelineEventsModal
          onClose={() => setShowModal(false)}
          events={events}
          homeFlag={homeFlag}
          awayFlag={awayFlag}
          homeCode={homeCode}
          awayCode={awayCode}
        />
      )}
    </div>
  );
}

function ExtendedMatchStats({
  isPending, real, cardCounts, possession, homeGoals, awayGoals
}: {
  isPending?: boolean;
  real: { home: RealTeamStats; away: RealTeamStats } | null;
  cardCounts: { home: number; away: number } | null;
  possession?: { Home: number; Away: number } | null;
  homeGoals?: number;
  awayGoals?: number;
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

  // Shot accuracy derived from real event data: on-target shots = GK saves by opponent + goals scored
  const homeShotsOnTarget = real.home.attemptsAtGoal > 0
    ? ((awayGoals ?? 0) + real.home.attemptsAtGoal === 0 ? null : Math.min(real.home.attemptsAtGoal, real.away.saves + (homeGoals ?? 0)))
    : null;
  const awayShotsOnTarget = real.away.attemptsAtGoal > 0
    ? Math.min(real.away.attemptsAtGoal, real.home.saves + (awayGoals ?? 0))
    : null;

  const categories = [
    {
      name: "Possession",
      stats: possession
        ? [{ label: "Ball Possession %", home: possession.Home, away: possession.Away, pct: true }]
        : [],
    },
    {
      name: "Attack",
      stats: [
        { label: "Attempts at Goal", home: real.home.attemptsAtGoal, away: real.away.attemptsAtGoal, pct: false },
        ...(homeShotsOnTarget !== null || awayShotsOnTarget !== null
          ? [{ label: "Shots on Target", home: homeShotsOnTarget, away: awayShotsOnTarget, pct: false }]
          : []),
        { label: "Corner Kicks", home: real.home.corners, away: real.away.corners, pct: false },
      ]
    },
    {
      name: "Discipline",
      stats: [
        { label: "Fouls", home: real.home.fouls, away: real.away.fouls, pct: false },
        { label: "Offsides", home: real.home.offsides, away: real.away.offsides, pct: false },
        { label: "Yellow Cards", home: cardCounts?.home ?? null, away: cardCounts?.away ?? null, pct: false },
        { label: "Red Cards", home: real.home.redCards, away: real.away.redCards, pct: false },
      ]
    },
    {
      name: "Goalkeeping",
      stats: [
        { label: "Saves", home: real.home.saves, away: real.away.saves, pct: false },
      ]
    }
  ].filter(cat => cat.stats.length > 0);

  return (
    <div className="pt-3 mt-3 border-t border-white/10">
      <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3 text-center">Extended Match Stats</h4>

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
              const displayH = stat.pct && stat.home !== null ? `${stat.home}%` : (stat.home ?? "—");
              const displayA = stat.pct && stat.away !== null ? `${stat.away}%` : (stat.away ?? "—");
              return (
                <div key={j} className="relative py-0.5">
                  <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-gray-400 mb-0.5 px-1">
                    <span className="w-8 text-left text-white">{displayH}</span>
                    <span className="flex-1 text-center text-gray-500 font-semibold">{stat.label}</span>
                    <span className="w-8 text-right text-white">{displayA}</span>
                  </div>
                  <div className="flex h-1 w-full bg-black/40 rounded-full overflow-hidden">
                    <div className="bg-blue-400/80 h-full" style={{ width: `${hPct}%` }}></div>
                    <div className="bg-orange-400/80 h-full ml-auto" style={{ width: `${aPct}%` }}></div>
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

function getCommentaryIcon(type: CommentaryEntry["type"], detail = "") {
  const d = detail.toLowerCase();
  switch (type) {
    case "goal":
      return <GoalIcon className="inline-block" size={14} />;
    case "card":
      if (d.includes("red card")) return <RedCardIcon className="inline-block" />;
      return <YellowCardIcon className="inline-block" />;
    case "sub":
      return <SubIcon className="inline-block" size={14} />;
    case "info":
      if (d.includes("hydration") || d.includes("cooling")) {
        return <InfoIcon className="inline-block text-cyan-300 animate-pulse" size={14} />;
      }
      return <InfoIcon className="inline-block" size={14} />;
    case "marker":
      if (d.includes("kick off") || d.includes("start")) return <WhistleIcon className="inline-block text-emerald-400" size={14} />;
      if (d.includes("half time") || d.includes("halftime")) return <WhistleIcon className="inline-block text-blue-400" size={14} />;
      return <MegaphoneIcon className="inline-block" size={14} />;
    default:
      return null;
  }
}

// FIFA event descriptions are "LASTNAME Firstname action (Team)". Remove the first name to keep it short.
function shortenDetail(detail: string): string {
  return detail.replace(/^([A-Z][A-Z\s]*[A-Z])\s+([A-Z][a-z]\w*)\s+/, "$1 ");
}

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
              {isLive
                ? <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                : <span className="text-yellow-400 text-[8px]">{isFarAhead ? "Offline" : isPending ? "Upcoming" : "FT"}</span>
              }
            </div>

            {/* Compact Scoreboard: flags + score + stage */}
            {!isFarAhead && !isPending && (
              <div className="bg-black/30 px-2.5 py-1 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-black text-white relative z-10 border-b border-green-500/10">
                <span className={`tabular-nums text-[9px] ${isLive ? "text-white/70" : "text-gray-400"}`}>{isLive ? liveTimeStr : "FT"}</span>
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
                {stageTag && stageTag !== "LIVE" && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                    stageTag === "HT" ? "text-blue-300 border-blue-400/30 bg-blue-500/10"
                    : stageTag === "ET" ? "text-orange-300 border-orange-400/30 bg-orange-500/10"
                    : stageTag === "PEN" ? "text-purple-300 border-purple-400/30 bg-purple-500/10"
                    : "text-gray-400 border-gray-600/30 bg-gray-500/10"
                  }`}>
                    {stageTag}
                  </span>
                )}
              </div>
            )}

            <div className="flex-1 relative z-10 min-h-0">
              {/* Ball — decorative overlay, stays centered regardless of feed scroll */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
                <motion.div
                  animate={isLive ? { x: ballPos.x, y: ballPos.y } : { x: 0, y: 0 }}
                  transition={{ type: "spring", stiffness: 50, damping: 10 }}
                  className="text-base sm:text-lg drop-shadow-md"
                >
                  ⚽
                </motion.div>
              </div>

              {isFarAhead || isPending ? (
                <div className="h-full p-3 flex flex-col justify-end">
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
                </div>
              ) : (
                <div className="h-full p-3 flex flex-col justify-end">
                  <div
                    className="overflow-y-auto no-scrollbar h-[128px] sm:h-[152px]"
                    style={{
                      maskImage: "linear-gradient(to bottom, black 0%, black 20%, transparent 90%)",
                      WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 20%, transparent 90%)",
                    }}
                  >
                    <AnimatePresence initial={false}>
                      <div className="flex flex-col gap-1.5">
                        {feed.map((entry) => {
                          const flag = entry.team === "home" ? homeFlag : entry.team === "away" ? awayFlag : undefined;
                          return (
                            <motion.div
                              key={entry.id}
                              layout
                              initial={{ y: 14, opacity: 0, scale: 0.96 }}
                              animate={{ y: 0, opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.35, ease: "easeOut" }}
                              className="w-full text-[9px] sm:text-[10px] text-white bg-black/55 px-2.5 py-1.5 rounded-lg shadow-lg flex items-start gap-1.5 shrink-0"
                            >
                              <span className="text-white/60 font-bold shrink-0 tabular-nums leading-4">{entry.minute}&apos;</span>
                              {flag && <img src={flag} alt="" className="w-3.5 h-2.5 object-cover rounded-[1px] shrink-0 mt-[1px]" />}
                              <span className="flex-1 break-words min-w-0 line-clamp-2 leading-[1.3]">
                                {entry.headline && <span className="font-black">{entry.headline} </span>}
                                {shortenDetail(entry.detail)}
                              </span>
                              <span className="shrink-0 text-xs flex items-center justify-center">{getCommentaryIcon(entry.type, entry.detail)}</span>
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
                      </div>
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MatchDetailsView({
  showDetails, game, stadium, isPending, hs, as_, real, cardCounts, possession, attendance
}: {
  readonly showDetails: boolean;
  readonly game: Game;
  readonly stadium?: Stadium;
  readonly isPending: boolean;
  readonly hs: number;
  readonly as_: number;
  readonly real: { home: RealTeamStats; away: RealTeamStats } | null;
  readonly cardCounts: { home: number; away: number } | null;
  readonly possession?: { Home: number; Away: number } | null;
  readonly attendance?: number | null;
}) {
  const capacityStr = (() => {
    const total = stadium?.capacity ? stadium.capacity.toLocaleString() : null;
    if (!total) return "TBD";
    if (attendance) return `${attendance.toLocaleString()} / ${total}`;
    return total;
  })();

  return (
    <AnimatePresence>
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden relative z-10"
        >
          <div className="pt-3 mt-3 border-t border-white/10 space-y-2">
            <div className="flex justify-between items-start text-[10px] text-gray-400 gap-4">
              <span className="shrink-0">Tournament Stage</span>
              <span className="font-semibold text-white uppercase text-right text-[10px]">{game.type.replace("_", " ")}</span>
            </div>
            {game.group && (
              <div className="flex justify-between items-start text-[10px] text-gray-400 gap-4">
                <span className="shrink-0">Group</span>
                <span className="font-semibold text-white uppercase text-right text-[10px]">{game.group}</span>
              </div>
            )}
            <div className="flex justify-between items-start text-[10px] text-gray-400 gap-4">
              <span className="shrink-0">{attendance ? "Attendance / Capacity" : "Stadium Capacity"}</span>
              <span className="font-semibold text-white uppercase text-right text-[10px]">{capacityStr}</span>
            </div>
            <div className="flex justify-between items-start text-[10px] text-gray-400 gap-4">
              <span className="shrink-0">City / Region</span>
              <span className="font-semibold text-white text-right text-[10px]">{stadium?.city_en || "TBD"}, {stadium?.region || "TBD"}</span>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/10">
            <div className="flex flex-col gap-3 bg-black/20 rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between">
                <span className="w-12 text-left font-black text-green-400 text-sm sm:text-base">{isPending ? "-" : hs}</span>
                <span className="flex-1 text-center text-gray-500 uppercase text-[9px] sm:text-[10px] tracking-widest font-bold">Goals</span>
                <span className="w-12 text-right font-black text-green-400 text-sm sm:text-base">{isPending ? "-" : as_}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="w-12 text-left font-black text-yellow-500 text-sm sm:text-base">{isPending ? "-" : (cardCounts?.home ?? "N/A")}</span>
                <span className="flex-1 text-center text-gray-500 uppercase text-[9px] sm:text-[10px] tracking-widest font-bold">Yellow Cards</span>
                <span className="w-12 text-right font-black text-yellow-500 text-sm sm:text-base">{isPending ? "-" : (cardCounts?.away ?? "N/A")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="w-12 text-left font-black text-red-500 text-sm sm:text-base">{isPending ? "-" : (real?.home.redCards ?? "N/A")}</span>
                <span className="flex-1 text-center text-gray-500 uppercase text-[9px] sm:text-[10px] tracking-widest font-bold">Red Cards</span>
                <span className="w-12 text-right font-black text-red-500 text-sm sm:text-base">{isPending ? "-" : (real?.away.redCards ?? "N/A")}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/5 pt-2">
                <span className="w-12 text-left font-black text-gray-300 text-sm sm:text-base">{isPending ? "-" : possession?.Home ? `${possession.Home}%` : "50%"}</span>
                <span className="flex-1 text-center text-gray-500 uppercase text-[9px] sm:text-[10px] tracking-widest font-bold">Possession</span>
                <span className="w-12 text-right font-black text-gray-300 text-sm sm:text-base">{isPending ? "-" : possession?.Away ? `${possession.Away}%` : "50%"}</span>
              </div>
            </div>
          </div>

          <ExtendedMatchStats
            isPending={isPending} real={real} cardCounts={cardCounts}
            possession={possession} homeGoals={hs} awayGoals={as_}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Map a feed entry to a rough ball position on the pitch widget.
// Convention: home team attacks right (positive x), away attacks left (negative x).
// x range: -100 to +100; y range: -43 to +43 (relative to center of pitch area).
function eventToBallPos(entry: CommentaryEntry | undefined): { x: number; y: number } {
  if (!entry) return { x: 0, y: 0 };
  switch (entry.type) {
    case "goal":
      if (entry.team === "home") return { x: 90, y: 0 };
      if (entry.team === "away") return { x: -90, y: 0 };
      return { x: 0, y: 0 };
    case "marker":
      return { x: 0, y: 0 };
    case "info":
      if (entry.team === "home") return { x: 72, y: 0 };
      if (entry.team === "away") return { x: -72, y: 0 };
      return { x: 0, y: 0 };
    case "card":
    case "sub":
      if (entry.team === "home") return { x: 25, y: 40 };
      if (entry.team === "away") return { x: -25, y: 40 };
      return { x: 0, y: 40 };
    default:
      return { x: 0, y: 0 };
  }
}

const COACH_LOOKUP: Record<string, string> = {
  "ARG": "Lionel Scaloni",
  "FRA": "Didier Deschamps",
  "POR": "Roberto Martínez",
  "ENG": "Gareth Southgate",
  "GER": "Julian Nagelsmann",
  "BRA": "Dorival Júnior",
  "NED": "Ronald Koeman",
  "ESP": "Luis de la Fuente",
  "BEL": "Domenico Tedesco",
  "USA": "Mauricio Pochettino",
  "CAN": "Jesse Marsch",
  "MEX": "Javier Aguirre",
  "MAR": "Walid Regragui",
  "COL": "Néstor Lorenzo",
  "URU": "Marcelo Bielsa",
  "ITA": "Luciano Spalletti",
  "CRO": "Zlatko Dalić",
  "SUI": "Murat Yakin",
  "NOR": "Ståle Solbakken",
  "SEN": "Aliou Cissé",
  "JPN": "Hajime Moriyasu",
  "KOR": "Hong Myung-bo",
  "AUS": "Tony Popovic",
  "KSA": "Roberto Mancini",
  "CMR": "Marc Brys",
  "ECU": "Sebastián Beccacece",
  "TUN": "Faouzi Benzarti",
  "GHA": "Otto Addo",
  "PAN": "Thomas Christiansen",
  "JAM": "Steve McClaren",
  "CRC": "Claudio Vivas",
};

interface FifaPlayerData {
  PlayerName?: Array<{ Description: string }>;
  ShortName?: Array<{ Description: string }>;
  ShirtNumber: number;
  Status: number;
  Position?: number;
  IdPlayer: string;
}

interface FifaTeamData {
  Players: FifaPlayerData[];
  Tactics?: string;
  Coaches?: Array<{ Role: number; Name: Array<{ Description: string }> }>;
  Substitutions?: Array<{
    PlayerOnName?: Array<{ Description: string }>;
    PlayerOffName?: Array<{ Description: string }>;
    Minute?: number;
  }>;
}

function LineupPitch({
  players,
  isHome,
  team,
  onPlayerClick,
  matchId
}: {
  players: FifaPlayerData[];
  isHome: boolean;
  team: Team;
  onPlayerClick?: (name: string, teamId: string) => void;
  matchId: string;
}) {
  // 1. Filter starting players (Status === 1)
  const starters = players.filter(p => p.Status === 1);
  
  // 2. Group starters by position: 0=GK, 1=DEF, 2=MID, 3/4=FWD
  const gks = starters.filter(p => p.Position === 0);
  const defs = starters.filter(p => p.Position === 1);
  const mids = starters.filter(p => p.Position === 2);
  const fwds = starters.filter(p => p.Position === 3 || p.Position === 4);
  
  const layoutPlayers: Array<{ player: FifaPlayerData; x: number; y: number }> = [];
  
  // GK (at bottom x=50, y=88)
  gks.forEach(p => {
    layoutPlayers.push({ player: p, x: 50, y: 88 });
  });
  
  // Defenders
  const defCount = defs.length;
  defs.forEach((p, i) => {
    let x = 50;
    let y = 70;
    if (defCount === 4) {
      const coords = [15, 38, 62, 85];
      x = coords[i] || 50;
      y = (i === 0 || i === 3) ? 68 : 72;
    } else if (defCount === 3) {
      const coords = [25, 50, 75];
      x = coords[i] || 50;
      y = i === 1 ? 72 : 70;
    } else if (defCount === 5) {
      const coords = [10, 30, 50, 70, 90];
      x = coords[i] || 50;
      y = (i === 0 || i === 4) ? 66 : (i === 2) ? 73 : 71;
    } else {
      x = defCount > 1 ? 15 + (70 / (defCount - 1)) * i : 50;
      y = 70;
    }
    layoutPlayers.push({ player: p, x, y });
  });
  
  // Midfielders
  const midCount = mids.length;
  mids.forEach((p, i) => {
    let x = 50;
    let y = 48;
    if (midCount === 3) {
      const coords = [25, 50, 75];
      x = coords[i] || 50;
      y = i === 1 ? 52 : 48;
    } else if (midCount === 4) {
      const coords = [15, 38, 62, 85];
      x = coords[i] || 50;
      y = (i === 0 || i === 3) ? 46 : 50;
    } else if (midCount === 5) {
      const coords = [12, 34, 50, 66, 88];
      x = coords[i] || 50;
      y = i === 2 ? 52 : (i === 1 || i === 3) ? 49 : 46;
    } else if (midCount === 2) {
      const coords = [33, 67];
      x = coords[i] || 50;
      y = 50;
    } else {
      x = midCount > 1 ? 15 + (70 / (midCount - 1)) * i : 50;
      y = 48;
    }
    layoutPlayers.push({ player: p, x, y });
  });
  
  // Forwards
  const fwdCount = fwds.length;
  fwds.forEach((p, i) => {
    let x = 50;
    let y = 20;
    if (fwdCount === 3) {
      const coords = [20, 50, 80];
      x = coords[i] || 50;
      y = i === 1 ? 15 : 22;
    } else if (fwdCount === 2) {
      const coords = [35, 65];
      x = coords[i] || 50;
      y = 20;
    } else if (fwdCount === 1) {
      x = 50;
      y = 16;
    } else {
      x = fwdCount > 1 ? 20 + (60 / (fwdCount - 1)) * i : 50;
      y = 20;
    }
    layoutPlayers.push({ player: p, x, y });
  });

  const mappedIds = new Set(layoutPlayers.map(lp => lp.player.IdPlayer));
  const unmappedStarters = starters.filter(p => !mappedIds.has(p.IdPlayer));
  if (unmappedStarters.length > 0) {
    unmappedStarters.forEach((p, i) => {
      layoutPlayers.push({ player: p, x: 20 + (60 / Math.max(1, unmappedStarters.length - 1)) * i, y: 35 });
    });
  }

  const cleanPlayerName = (fullName: string) => {
    const parts = fullName.trim().split(" ");
    if (parts.length <= 1) return fullName;
    const lastName = parts[parts.length - 1];
    const firstInitial = parts[0].charAt(0);
    let cleanLast = lastName;
    if (cleanLast === cleanLast.toUpperCase()) {
      cleanLast = cleanLast.charAt(0) + cleanLast.slice(1).toLowerCase();
    }
    return `${firstInitial}. ${cleanLast}`;
  };

  return (
    <div className="relative w-full aspect-[4/5] bg-gradient-to-b from-[#1b4332] to-[#081c15] border border-white/10 rounded-xl overflow-hidden shadow-inner select-none">
      {/* Grass Stripes Pattern */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none" 
        style={{
          background: "repeating-linear-gradient(180deg, transparent, transparent 8.33%, rgba(255,255,255,0.06) 8.33%, rgba(255,255,255,0.06) 16.66%)"
        }}
      />

      {/* Pitch Markings */}
      <div className="absolute inset-0 border border-white/15 m-2 pointer-events-none rounded-sm">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/15" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/15" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/15" />
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-12 border-b border-x border-white/15" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[30%] h-4 border-b border-x border-white/15" />
        
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-12 border-t border-x border-white/15" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[30%] h-4 border-t border-x border-white/15" />
      </div>

      {/* Player Positions */}
      {layoutPlayers.map(({ player, x, y }) => {
        const pName = player.PlayerName?.[0]?.Description || player.ShortName?.[0]?.Description || "Player";
        const cleanName = cleanPlayerName(pName);
        // Normalize abbreviated FIFA names to full names for consistent lookups
        const normalizedName = PLAYER_NAME_ALIASES[cleanName] || cleanName;
        const rating = getPlayerMatchRating(normalizedName, matchId);
        const ratingBg = rating >= 7.5 ? "bg-green-500 text-white" : rating >= 6.5 ? "bg-yellow-500 text-black" : "bg-orange-500 text-white";

        return (
          <button
            key={player.IdPlayer}
            onClick={() => onPlayerClick?.(normalizedName, team.id)}
            className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 group cursor-pointer active:scale-95 transition-all z-10"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            {/* Player Head Container */}
            <div className="relative">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/80 group-hover:border-yellow-400 group-hover:scale-105 transition-all shadow-md overflow-hidden bg-black/40 flex items-center justify-center">
                <CachedPlayerImage playerName={normalizedName} className="w-full h-full object-cover" />
              </div>
              <span className={`absolute -top-1 -right-1 text-[7px] font-black px-1 py-0.5 rounded border border-black/30 shadow-md leading-none z-20 ${ratingBg}`}>
                {rating}
              </span>
            </div>
            
            {/* Player Label */}
            <div className="mt-1 bg-black/75 px-1.5 py-0.5 rounded text-[7px] font-bold text-gray-200 border border-white/5 truncate max-w-[55px] sm:max-w-[70px] text-center shadow">
              <span className="text-yellow-400 font-mono mr-0.5">{player.ShirtNumber}</span> {cleanName}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function getGameStateAndTime(
  isLive: boolean,
  finished: boolean,
  stageTag: string,
  timeElapsed: string,
  feed: CommentaryEntry[],
  nptDate: string
) {
  if (finished) {
    return {
      label: "Full Time",
      timeStr: nptDate.split(", ")[0],
      icon: <WhistleIcon size={12} className="text-yellow-400 shrink-0" />
    };
  }
  if (!isLive) {
    return {
      label: nptDate.split(", ")[0],
      timeStr: nptDate.split(", ")[1],
      icon: null
    };
  }

  const raw = timeElapsed.toLowerCase().trim();
  
  // Extract time from time_elapsed or fall back to feed's most recent event
  let minuteStr = "";
  const matchMin = raw.match(/(\d+)/);
  if (matchMin) {
    minuteStr = `${matchMin[1]}'`;
  } else if (feed.length > 0) {
    const latestMin = feed[0].minute;
    if (latestMin) {
      minuteStr = `${latestMin}'`;
    }
  }

  // Determine stage and labels
  if (raw.includes("ht") || raw.includes("half") || stageTag === "HT") {
    return {
      label: "Half Time",
      timeStr: "HT",
      icon: <InfoIcon size={12} className="text-blue-300 shrink-0" />
    };
  }
  if (raw.includes("pen") || raw.includes("penalty") || stageTag === "PEN") {
    return {
      label: "Penalties",
      timeStr: minuteStr || "PEN",
      icon: <WhistleIcon size={12} className="text-purple-400 shrink-0" />
    };
  }
  if (raw.includes("et") || raw.includes("extra") || stageTag === "ET") {
    return {
      label: "Extra Time",
      timeStr: minuteStr || "ET",
      icon: <WhistleIcon size={12} className="text-orange-400 shrink-0" />
    };
  }

  // Check feed detail for breaks
  const latestDetail = feed.length > 0 ? feed[0].detail.toLowerCase() : "";
  if (latestDetail.includes("hydration break") || latestDetail.includes("cooling break")) {
    return {
      label: "Hydration Break",
      timeStr: minuteStr,
      icon: <InfoIcon size={12} className="text-cyan-300 animate-pulse shrink-0" />
    };
  }

  // Determine if 1st or 2nd half
  let halfLabel = "Live";
  const minNum = matchMin ? parseInt(matchMin[1], 10) : (feed.length > 0 ? parseInt(feed[0].minute, 10) : 0);
  if (minNum > 0) {
    halfLabel = minNum <= 45 ? "1st Half" : "2nd Half";
  }

  return {
    label: halfLabel,
    timeStr: minuteStr || "Live",
    icon: (
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
      </span>
    )
  };
}

function FeaturedLiveCard({
  game,
  teamMap,
  stadiumMap,
  onTeamClick,
  allGames,
  isActive = false,
  onPlayerClick,
}: {
  readonly game: Game;
  readonly teamMap: { [key: string]: Team };
  readonly stadiumMap: { [key: string]: Stadium };
  readonly onTeamClick: (team: Team) => void;
  readonly allGames: Game[];
  readonly isActive?: boolean;
  readonly onPlayerClick?: (name: string, teamId: string) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showTracker, setShowTracker] = useState(false);
  const [showLineup, setShowLineup] = useState(false);
  const [fallbackLineups, setFallbackLineups] = useState<{
    home: { players: FifaPlayerData[]; tactics: string; coach: string; isPrevious: boolean } | null;
    away: { players: FifaPlayerData[]; tactics: string; coach: string; isPrevious: boolean } | null;
  } | null>(null);

  // Reset expanded states when active status changes to false (swiped away)
  const [prevIsActive, setPrevIsActive] = useState(isActive);
  if (isActive !== prevIsActive) {
    setPrevIsActive(isActive);
    if (!isActive) {
      setShowDetails(false);
      setShowTracker(false);
      setShowLineup(false);
    }
  }

  const [prevGameId, setPrevGameId] = useState(game.id);
  if (game.id !== prevGameId) {
    setPrevGameId(game.id);
    setShowDetails(false);
    setShowTracker(false);
    setShowLineup(false);
    setFallbackLineups(null);
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

  const stageTag = (() => {
    if (!isLive) return "";
    const t = game.time_elapsed.toLowerCase();
    if (t.includes("ht") || t.includes("half")) return "HT";
    if (t.includes("pen") || /\bp\b/.test(t)) return "PEN";
    if (isET) return "ET";
    return "LIVE";
  })();

  const [fifaData, setFifaData] = useState<{
    matched: boolean;
    events?: CommentaryEntry[];
    cardCounts?: { home: number; away: number };
    stats?: { home: RealTeamStats; away: RealTeamStats };
    momentum?: Array<{ bucketStart: number; home: number; away: number }>;
    timeline?: TimelineMarker[];
    possession?: { Home: number; Away: number } | null;
    attendance?: number | null;
    homeTeam?: FifaTeamData;
    awayTeam?: FifaTeamData;
  } | null>(null);

  // Fetch on mount, immediately again at key match-stage transitions (half time, extra time,
  // full time), and steadily every 15s while the match is live in between. A single fetch
  // failure (cold serverless start, brief network blip) shouldn't permanently strand the UI on
  // "not available", so failed/unmatched attempts retry a few times with backoff before giving up.
  useEffect(() => {
    const homeCode = homeTeam?.fifa_code;
    const awayCode = awayTeam?.fifa_code;
    if (!homeCode || !awayCode) return;
    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    const maxRetries = 3;

    const scheduleRetry = () => {
      if (cancelled || attempt >= maxRetries) return;
      attempt++;
      retryTimeout = setTimeout(load, attempt * 3000);
    };

    function load() {
      fetch(`/api/wc/fifa-match?home=${homeCode}&away=${awayCode}`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (cancelled) return;
          if (data) {
            setFifaData(data);
            if (data.matched) { attempt = 0; return; }
          }
          scheduleRetry();
        })
        .catch(scheduleRetry);
    }

    load();
    if (!isLive) return () => { cancelled = true; if (retryTimeout) clearTimeout(retryTimeout); };
    const interval = setInterval(load, 15000);
    return () => { cancelled = true; if (retryTimeout) clearTimeout(retryTimeout); clearInterval(interval); };
  }, [homeTeam?.fifa_code, awayTeam?.fifa_code, isLive, stageTag, finished]);

  // 1. Derive live lineups directly during render
  const liveLineups = useMemo(() => {
    if (!homeTeam || !awayTeam) return null;

    function getCoachName(team: FifaTeamData | null | undefined, fallbackFifaCode?: string): string {
      if (team?.Coaches && team.Coaches.length > 0) {
        const headCoach = team.Coaches.find((c) => c.Role === 0);
        const nameObj = headCoach?.Name?.[0] || team.Coaches[0]?.Name?.[0];
        if (nameObj?.Description) return nameObj.Description;
      }
      if (fallbackFifaCode && COACH_LOOKUP[fallbackFifaCode]) {
        return COACH_LOOKUP[fallbackFifaCode];
      }
      return "Not available";
    }

    if (fifaData?.matched && fifaData.homeTeam?.Players?.length && fifaData.awayTeam?.Players?.length) {
      return {
        home: {
          players: fifaData.homeTeam.Players,
          tactics: fifaData.homeTeam.Tactics || "4-3-3",
          coach: getCoachName(fifaData.homeTeam, homeTeam.fifa_code),
          isPrevious: false
        },
        away: {
          players: fifaData.awayTeam.Players,
          tactics: fifaData.awayTeam.Tactics || "4-3-3",
          coach: getCoachName(fifaData.awayTeam, awayTeam.fifa_code),
          isPrevious: false
        }
      };
    }
    return null;
  }, [fifaData, homeTeam, awayTeam]);

  // 2. Load fallback lineups from previous finished matches if live data is not yet available
  useEffect(() => {
    if (!homeTeam || !awayTeam) return;
    if (liveLineups) return; // Already have live data

    function getCoachName(team: FifaTeamData | null | undefined, fallbackFifaCode?: string): string {
      if (team?.Coaches && team.Coaches.length > 0) {
        const headCoach = team.Coaches.find((c) => c.Role === 0);
        const nameObj = headCoach?.Name?.[0] || team.Coaches[0]?.Name?.[0];
        if (nameObj?.Description) return nameObj.Description;
      }
      if (fallbackFifaCode && COACH_LOOKUP[fallbackFifaCode]) {
        return COACH_LOOKUP[fallbackFifaCode];
      }
      return "Not available";
    }

    const homePrevGames = allGames.filter(g =>
      g.finished === "TRUE" &&
      g.id !== game.id &&
      (g.home_team_id === game.home_team_id || g.away_team_id === game.home_team_id)
    ).sort((a, b) => parseInt(b.id) - parseInt(a.id));

    const awayPrevGames = allGames.filter(g =>
      g.finished === "TRUE" &&
      g.id !== game.id &&
      (g.home_team_id === game.away_team_id || g.away_team_id === game.away_team_id)
    ).sort((a, b) => parseInt(b.id) - parseInt(a.id));

    let homeLineup: { players: FifaPlayerData[]; tactics: string; coach: string; isPrevious: boolean } | null = null;
    let awayLineup: { players: FifaPlayerData[]; tactics: string; coach: string; isPrevious: boolean } | null = null;
    const promises: Promise<void>[] = [];

    if (homePrevGames.length > 0) {
      const hG = homePrevGames[0];
      const prevHomeTeam = teamMap[hG.home_team_id];
      const prevAwayTeam = teamMap[hG.away_team_id];
      if (prevHomeTeam?.fifa_code && prevAwayTeam?.fifa_code) {
        promises.push(
          fetch(`/api/wc/fifa-match?home=${prevHomeTeam.fifa_code}&away=${prevAwayTeam.fifa_code}`)
            .then(res => res.json())
            .then(data => {
              if (data?.matched) {
                const isPrevHome = hG.home_team_id === game.home_team_id;
                const teamData = isPrevHome ? data.homeTeam : data.awayTeam;
                if (teamData?.Players && teamData.Players.length > 0) {
                  homeLineup = {
                    players: teamData.Players,
                    tactics: teamData.Tactics || "4-3-3",
                    coach: getCoachName(teamData, homeTeam.fifa_code),
                    isPrevious: true
                  };
                }
              }
            })
            .catch(err => console.error("Error fetching home prev lineup:", err))
        );
      }
    }

    if (awayPrevGames.length > 0) {
      const aG = awayPrevGames[0];
      const prevHomeTeam = teamMap[aG.home_team_id];
      const prevAwayTeam = teamMap[aG.away_team_id];
      if (prevHomeTeam?.fifa_code && prevAwayTeam?.fifa_code) {
        promises.push(
          fetch(`/api/wc/fifa-match?home=${prevHomeTeam.fifa_code}&away=${prevAwayTeam.fifa_code}`)
            .then(res => res.json())
            .then(data => {
              if (data?.matched) {
                const isPrevAway = aG.away_team_id === game.away_team_id;
                const teamData = isPrevAway ? data.awayTeam : data.homeTeam;
                if (teamData?.Players && teamData.Players.length > 0) {
                  awayLineup = {
                    players: teamData.Players,
                    tactics: teamData.Tactics || "4-3-3",
                    coach: getCoachName(teamData, awayTeam.fifa_code),
                    isPrevious: true
                  };
                }
              }
            })
            .catch(err => console.error("Error fetching away prev lineup:", err))
        );
      }
    }

    Promise.all(promises).then(() => {
      setFallbackLineups({
        home: homeLineup,
        away: awayLineup
      });
    });
  }, [liveLineups, game.id, homeTeam?.fifa_code, awayTeam?.fifa_code, allGames, teamMap]);

  // Combine live and fallback lineups
  const lineups = liveLineups || fallbackLineups;
  // If we don't have live lineups AND haven't loaded fallbackLineups yet, it's loading
  const lineupsLoading = !liveLineups && !fallbackLineups;

  const realFeed = useMemo<CommentaryEntry[]>(
    () => (fifaData?.matched && fifaData.events ? [...fifaData.events].reverse() : []),
    [fifaData]
  );

  const homeName = homeTeam?.name_en || game.home_team_label || game.home_team_name_en || "TBD";
  const awayName = awayTeam?.name_en || game.away_team_label || game.away_team_name_en || "TBD";

  const hs = Number.parseInt(game.home_score) || 0;
  const as_ = Number.parseInt(game.away_score) || 0;
  const hp = Number.parseInt(game.home_penalty_score || '');
  const ap = Number.parseInt(game.away_penalty_score || '');
  const hasPenalties = !Number.isNaN(hp) && !Number.isNaN(ap);
  const homeWin = finished && (hs > as_ || (hasPenalties && hs === as_ && hp > ap));
  const awayWin = finished && (as_ > hs || (hasPenalties && hs === as_ && ap > hp));

  const homeScorersStr = parseScorers(game.home_scorers).map(s => s.replace(/['"]/g, "").trim()).join(", ");
  const awayScorersStr = parseScorers(game.away_scorers).map(s => s.replace(/['"]/g, "").trim()).join(", ");

  const homeCardCount = fifaData?.matched && fifaData.cardCounts ? fifaData.cardCounts.home : null;
  const awayCardCount = fifaData?.matched && fifaData.cardCounts ? fifaData.cardCounts.away : null;
  const realStats = fifaData?.matched && fifaData.stats ? fifaData.stats : null;
  const realMomentum = fifaData?.matched && fifaData.momentum ? fifaData.momentum : null;
  const realTimeline = fifaData?.matched && fifaData.timeline ? fifaData.timeline : null;
  const realEvents = fifaData?.matched && fifaData.events ? fifaData.events : [];
  const realPossession = fifaData?.matched ? (fifaData.possession ?? null) : null;
  const realAttendance = fifaData?.matched ? (fifaData.attendance ?? null) : null;
  const currentMinute = isLive ? (() => {
    const m = game.time_elapsed.replace(/live/i, '').trim().match(/(\d+)/);
    return m ? Number.parseInt(m[1], 10) : null;
  })() : null;

  const nptDate = formatMatchDateNPT(game.local_date, game.stadium_id);

  // Ball position: base from most recent event, with a small drift every 10 s during play.
  // Stops drifting at half-time so the ball parks at centre circle.
  const [ballDrift, setBallDrift] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!isLive || stageTag === "HT") {
      const timer = setTimeout(() => {
        setBallDrift({ x: 0, y: 0 });
      }, 0);
      return () => clearTimeout(timer);
    }
    const interval = setInterval(() => {
      setBallDrift({ x: Math.round(Math.random() * 30 - 15), y: Math.round(Math.random() * 20 - 10) });
    }, 10000);
    return () => clearInterval(interval);
  }, [isLive, stageTag]);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (!isLive || stageTag === "HT") {
      setElapsedSeconds(0);
      return;
    }
    setElapsedSeconds(0);
    const interval = setInterval(() => {
      setElapsedSeconds(s => (s < 59 ? s + 1 : 59));
    }, 1000);
    return () => clearInterval(interval);
  }, [isLive, stageTag, game.time_elapsed]);

  const liveMatchMinute = useMemo(() => {
    if (!isLive) return 0;
    const matchMin = game.time_elapsed.toLowerCase().match(/(\d+)/);
    if (matchMin) {
      return parseInt(matchMin[1], 10);
    }
    if (realFeed.length > 0) {
      const latestMin = realFeed[0].minute;
      if (latestMin) {
        return parseInt(latestMin, 10);
      }
    }
    return 0;
  }, [isLive, game.time_elapsed, realFeed]);

  const timeWithSeconds = useMemo(() => {
    const minStr = String(liveMatchMinute);
    const secStr = String(elapsedSeconds).padStart(2, "0");
    return `${minStr}:${secStr}`;
  }, [liveMatchMinute, elapsedSeconds]);

  const ballPos = useMemo(() => {
    if (!isLive || stageTag === "HT") return { x: 0, y: 0 };
    const base = eventToBallPos(realFeed[0]);
    return {
      x: Math.max(-100, Math.min(100, base.x + ballDrift.x)),
      y: Math.max(-43, Math.min(43, base.y + ballDrift.y)),
    };
  }, [realFeed, stageTag, ballDrift, isLive]);

  const commentary = fifaData?.matched
    ? ""
    : isLive
      ? "Live commentary not available for this match."
      : finished
        ? "Match commentary not available for this match."
        : "Match will begin soon. Waiting for kickoff...";

  // Exact time from the API — no fake elapsed-second computation.
  const liveTimeDisplay = (() => {
    if (!isLive) return "";
    const raw = game.time_elapsed.replace(/live/gi, "").trim();
    if (hasPenalties) return "PEN";
    return raw || (isET ? "ET" : "");
  })();

  const stateInfo = getGameStateAndTime(isLive, finished, stageTag, game.time_elapsed, realFeed, nptDate);

  return (
    <div className={`relative rounded-2xl overflow-hidden p-4 sm:p-6 match-card border w-full h-full flex flex-col transition-all duration-300 ${
      isLive ? (isET ? "border-orange-500/30" : "border-white/15") : "border-white/10"
    }`}
      style={{ 
        background: isLive
          ? (isET ? "linear-gradient(135deg, #1a1005 0%, #0a0800 100%)" : "linear-gradient(135deg, #111827 0%, #0a0f1a 100%)")
          : "linear-gradient(135deg, #162440 0%, #0a1020 100%)",
        boxShadow: "inset 0 1.5px 0px rgba(255, 255, 255, 0.1), 0 12px 30px rgba(0, 0, 0, 0.6)"
      }}
    >
      
      {/* Header Info */}
      <div className="flex justify-between items-center mb-3 sm:mb-6 relative z-10">
        <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider bg-black/40 px-3 py-1 rounded-full border border-white/5">
          {stadium?.name_en || "TBD"}
        </span>
        {isLive && (
          <div className={`text-[10px] sm:text-sm font-black flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full border ${
            isET
              ? 'text-orange-300 bg-orange-500/10 border-orange-500/20'
              : 'text-white/80 bg-white/5 border-white/15'
          }`}>
            {stateInfo.icon}
            <span className="ml-1 uppercase tracking-widest text-[9px] sm:text-[10px]">
              {stateInfo.label}
            </span>
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
          {isLive ? (
            <div className="flex items-center justify-center gap-1 mt-1.5 bg-black/40 px-2.5 py-1 rounded-full border border-white/5 relative z-10 shrink-0 select-none">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-black text-white font-mono leading-none tracking-wider ml-0.5">
                {timeWithSeconds}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1 mt-1.5 bg-black/40 px-2.5 py-1 rounded-full border border-white/5 relative z-10 shrink-0 select-none">
              {stateInfo.icon}
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white ml-0.5 leading-none">
                {stateInfo.label}
              </span>
              {stateInfo.timeStr && (
                <>
                  <span className="text-gray-600 font-bold text-[8px] sm:text-[9px] leading-none select-none">•</span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-yellow-400 font-mono leading-none">
                    {stateInfo.timeStr}
                  </span>
                </>
              )}
            </div>
          )}
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

      <MatchTimeline
        isLive={isLive} isPending={isPending} isFinished={finished} currentMinute={currentMinute}
        momentum={realMomentum} timeline={realTimeline} matched={!!fifaData?.matched} events={realEvents}
        homeFlag={homeTeam?.flag} awayFlag={awayTeam?.flag}
        homeCode={homeTeam?.fifa_code || homeName} awayCode={awayTeam?.fifa_code || awayName}
      />

      {/* Expandable Lineup Accordion */}
      <div className="flex justify-center mt-3 pt-3 border-t border-white/5 relative z-10">
        <button
          onClick={() => setShowLineup(!showLineup)}
          className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 px-4 py-1.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>Line-up</span>
          <span>{showLineup ? "▲" : "▼"}</span>
        </button>
      </div>

      <AnimatePresence>
        {showLineup && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden relative z-10 w-full mt-3 animate-fade-in"
          >
            {lineupsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-500 text-[10px] gap-2 font-bold uppercase tracking-widest">
                <span className="animate-spin text-lg">🔄</span>
                <span>Loading squad layouts...</span>
              </div>
            ) : (!lineups?.home && !lineups?.away) ? (
              <div className="py-8 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500 border border-dashed border-white/10 rounded-xl">
                Roster not yet announced
              </div>
            ) : (
              <div className="space-y-4">
                {(lineups.home?.isPrevious || lineups.away?.isPrevious) && (
                  <div className="text-center text-[8px] sm:text-[9px] text-yellow-400 font-extrabold uppercase tracking-widest bg-yellow-400/10 border border-yellow-400/20 px-3 py-1.5 rounded-lg">
                    ⚠️ Lineup not yet confirmed — showing previously played
                  </div>
                )}

                <div id="lineups-scroll-container" className="flex sm:grid sm:grid-cols-2 gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full pb-2 px-1">
                  {/* Left (Home) Team */}
                  {lineups.home ? (
                    <div className="w-[88vw] sm:w-auto shrink-0 snap-center space-y-2 relative">
                      {lineups.away && (
                        <button
                          onClick={() => {
                            document.getElementById('lineups-scroll-container')?.scrollTo({
                              left: window.innerWidth * 0.9,
                              behavior: 'smooth'
                            });
                          }}
                          className="absolute top-1/3 -right-2 -translate-y-1/2 bg-black/75 hover:bg-black/90 active:scale-95 border border-white/15 rounded-l-full py-1.5 pl-2.5 pr-1.5 flex items-center gap-1 z-30 text-[9px] font-black text-white cursor-pointer select-none sm:hidden shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all"
                        >
                          {awayTeam?.flag && <img src={awayTeam.flag} alt="" className="w-4.5 h-3.5 object-cover rounded-[1px]" />}
                          <span className="text-[10px] text-yellow-400 font-extrabold">➔</span>
                        </button>
                      )}
                      <div className="text-center bg-black/20 p-2 rounded-lg border border-white/5">
                        <div className="text-[10px] sm:text-xs font-black text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
                          {homeTeam?.flag && <img src={homeTeam.flag} alt="" className="w-4 h-3 object-cover rounded-sm" />}
                          <span>{homeName}</span>
                        </div>
                        <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                          Coach: {lineups.home.coach} • {lineups.home.tactics}
                        </div>
                      </div>
                      <LineupPitch
                        players={lineups.home.players}
                        isHome={true}
                        team={homeTeam}
                        onPlayerClick={onPlayerClick}
                        matchId={game.id}
                      />
                      {/* Substitutes */}
                      <div className="bg-black/35 rounded-xl p-2.5 border border-white/5 space-y-1">
                        <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Substitutes</div>
                        <div className="grid grid-cols-1 gap-1 text-[9px]">
                          {lineups.home.players.filter((p) => p.Status === 2).slice(0, 8).map((p) => {
                            const name = p.PlayerName?.[0]?.Description || "Player";
                            const sub = fifaData?.homeTeam?.Substitutions?.find((s) => s.PlayerOnName?.[0]?.Description === name || s.PlayerOffName?.[0]?.Description === name);
                            return (
                              <div key={p.IdPlayer} className="flex items-center justify-between text-gray-400 font-medium border-b border-white/5 pb-0.5 last:border-0 last:pb-0">
                                <span>#{p.ShirtNumber} {name}</span>
                                {sub && (
                                  <span className="text-[8px] bg-white/5 border border-white/10 px-1 rounded flex items-center gap-1">
                                    <span className="text-[8px]">🔁</span>
                                    <span>{sub.Minute}</span>
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-[88vw] sm:w-auto shrink-0 snap-center text-center text-xs text-gray-500 py-12 bg-black/10 border border-white/5 rounded-xl flex items-center justify-center">
                      Home Lineup Not Available
                    </div>
                  )}

                  {/* Right (Away) Team */}
                  {lineups.away ? (
                    <div className="w-[88vw] sm:w-auto shrink-0 snap-center space-y-2 relative">
                      {lineups.home && (
                        <button
                          onClick={() => {
                            document.getElementById('lineups-scroll-container')?.scrollTo({
                              left: 0,
                              behavior: 'smooth'
                            });
                          }}
                          className="absolute top-1/3 -left-2 -translate-y-1/2 bg-black/75 hover:bg-black/90 active:scale-95 border border-white/15 rounded-r-full py-1.5 pl-1.5 pr-2.5 flex items-center gap-1 z-30 text-[9px] font-black text-white cursor-pointer select-none sm:hidden shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all"
                        >
                          <span className="text-[10px] text-yellow-400 font-extrabold rotate-180 inline-block">➔</span>
                          {homeTeam?.flag && <img src={homeTeam.flag} alt="" className="w-4.5 h-3.5 object-cover rounded-[1px]" />}
                        </button>
                      )}
                      <div className="text-center bg-black/20 p-2 rounded-lg border border-white/5">
                        <div className="text-[10px] sm:text-xs font-black text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
                          {awayTeam?.flag && <img src={awayTeam.flag} alt="" className="w-4 h-3 object-cover rounded-sm" />}
                          <span>{awayName}</span>
                        </div>
                        <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                          Coach: {lineups.away.coach} • {lineups.away.tactics}
                        </div>
                      </div>
                      <LineupPitch
                        players={lineups.away.players}
                        isHome={false}
                        team={awayTeam}
                        onPlayerClick={onPlayerClick}
                        matchId={game.id}
                      />
                      {/* Substitutes */}
                      <div className="bg-black/35 rounded-xl p-2.5 border border-white/5 space-y-1">
                        <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Substitutes</div>
                        <div className="grid grid-cols-1 gap-1 text-[9px]">
                          {lineups.away.players.filter((p) => p.Status === 2).slice(0, 8).map((p) => {
                            const name = p.PlayerName?.[0]?.Description || "Player";
                            const sub = fifaData?.awayTeam?.Substitutions?.find((s) => s.PlayerOnName?.[0]?.Description === name || s.PlayerOffName?.[0]?.Description === name);
                            return (
                              <div key={p.IdPlayer} className="flex items-center justify-between text-gray-400 font-medium border-b border-white/5 pb-0.5 last:border-0 last:pb-0">
                                <span>#{p.ShirtNumber} {name}</span>
                                {sub && (
                                  <span className="text-[8px] bg-white/5 border border-white/10 px-1 rounded flex items-center gap-1">
                                    <span className="text-[8px]">🔁</span>
                                    <span>{sub.Minute}</span>
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-[88vw] sm:w-auto shrink-0 snap-center text-center text-xs text-gray-500 py-12 bg-black/10 border border-white/5 rounded-xl flex items-center justify-center">
                      Away Lineup Not Available
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
        {showTracker ? "Hide Live Tracker" : "View Live Tracker"}
      </button>

      {/* Live Match Tracker Section */}
      <MatchTrackerView
        showTracker={showTracker} isLive={isLive} isPending={isPending} game={game} commentary={commentary}
        feed={realFeed} ballPos={ballPos}
        homeFlag={homeTeam?.flag} awayFlag={awayTeam?.flag}
        homeCode={homeTeam?.fifa_code || homeName} awayCode={awayTeam?.fifa_code || awayName}
        hs={hs} as_={as_} stageTag={stageTag}
      />

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="mt-4 w-full relative z-10 bg-black/20 hover:bg-white/10 border border-white/10 rounded-xl py-3 flex items-center justify-center gap-2 transition-all text-[10px] sm:text-xs font-black text-gray-400 hover:text-white uppercase tracking-widest group shadow-inner"
      >
        {showDetails ? "Hide Match Details" : "View Match Details"}
        <span className={`text-yellow-400 transition-transform ${showDetails ? "-rotate-90" : "group-hover:translate-x-1"}`}>➔</span>
      </button>

      <MatchDetailsView showDetails={showDetails} game={game} stadium={stadium} isPending={isPending} hs={hs} as_={as_} real={realStats} cardCounts={fifaData?.matched ? fifaData.cardCounts ?? null : null} possession={realPossession} attendance={realAttendance} />
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
  onPlayerClick,
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
  onPlayerClick?: (name: string, teamId: string) => void;
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
                onPlayerClick={onPlayerClick}
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

export default function BracketTab({ games, teams, stadiums, onTeamClick, onPlayerClick }: BracketTabProps) {
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'upcoming'>('today');
  const [viewType, setViewType] = useState<'tree' | 'fall'>('tree');
  const [startRound, setStartRound] = useState<'r32' | 'r16' | 'qf' | 'sf' | 'final'>('r32');
  const treeContainerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<'left' | 'center' | 'right'>('center');

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
    setActiveSection(section);
  };

  const handleTreeScroll = () => {
    const el = treeContainerRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;
    const pct = scrollLeft / maxScroll;
    if (pct < 0.33) {
      setActiveSection('left');
    } else if (pct > 0.66) {
      setActiveSection('right');
    } else {
      setActiveSection('center');
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
      case 'final': return 'min-w-[240px]';
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
              onPlayerClick={onPlayerClick}
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
              onPlayerClick={onPlayerClick}
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
              onPlayerClick={onPlayerClick}
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
                if (r.key === 'all') {
                  setStartRound('r32');
                } else {
                  setStartRound(r.key);
                }
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
              <div className="flex p-0.5 bg-black/40 rounded-lg border border-white/5 shadow-inner gap-1 w-full max-w-[130px] justify-between">
                <button
                  onClick={() => scrollToBracketSection('left')}
                  className={`flex-1 flex items-center justify-center py-1 rounded text-[10px] font-black transition-all border cursor-pointer ${
                    activeSection === 'left'
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.2)]'
                      : 'bg-white/5 text-gray-400 border-white/5 hover:text-white hover:bg-white/10'
                  }`}
                  aria-label="Left Bracket"
                >
                  ◀
                </button>
                <button
                  onClick={() => scrollToBracketSection('center')}
                  className={`flex-1 flex items-center justify-center py-1 rounded text-[10px] font-black transition-all border cursor-pointer ${
                    activeSection === 'center'
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-[0_0_8px_rgba(234,179,8,0.2)]'
                      : 'bg-white/5 text-gray-400 border-white/5 hover:text-white hover:bg-white/10'
                  }`}
                  aria-label="Finals"
                >
                  <img src="/favicon.png" className="w-3.5 h-3.5 object-contain select-none" alt="Finals" />
                </button>
                <button
                  onClick={() => scrollToBracketSection('right')}
                  className={`flex-1 flex items-center justify-center py-1 rounded text-[10px] font-black transition-all border cursor-pointer ${
                    activeSection === 'right'
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.2)]'
                      : 'bg-white/5 text-gray-400 border-white/5 hover:text-white hover:bg-white/10'
                  }`}
                  aria-label="Right Bracket"
                >
                  ▶
                </button>
              </div>
            </div>

            {/* Scrollable tree */}
            <div 
              ref={treeContainerRef} 
              onScroll={handleTreeScroll}
              className="w-full overflow-x-auto rounded-2xl border border-white/5 bg-[#080d19]/50 backdrop-blur-md p-4 shadow-2xl select-none scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            >
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
                {startRound !== 'final' && (
                  <>
                    <div className="flex flex-col justify-around h-full animate-fade-in">
                      <BracketNode gameId="101" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="SF" />
                    </div>
                    <ConnectorColSFToFinal side="left" />
                  </>
                )}

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

                {startRound !== 'final' && (
                  <>
                    <ConnectorColSFToFinal side="right" />
                    <div className="flex flex-col justify-around h-full animate-fade-in">
                      <BracketNode gameId="102" teamMap={teamMap} gameMap={gameMap} onTeamClick={onTeamClick} label="SF" />
                    </div>
                  </>
                )}
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
