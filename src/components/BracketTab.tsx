"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Game, Team, Stadium } from "@/lib/api";
import { parseScorers } from "@/lib/api";
import { formatMatchDateNPT, formatTimeNPT, isMatchToday, isMatchTomorrow, isMatchUpcomingLater } from "@/lib/date-utils";
import { generateLiveBulletins } from "@/lib/news-utils";

function NewsMarquee({ bulletins }: { bulletins: string[] }) {
  return (
    <div className="w-full bg-red-900/30 text-red-400 text-[10px] sm:text-xs font-mono uppercase tracking-widest py-2 overflow-hidden flex whitespace-nowrap border-y border-red-500/20 mb-4">
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

  const nptDate = formatMatchDateNPT(game.local_date);
  
  // Format scorers for display
  const homeScorersStr = parseScorers(game.home_scorers).map(s => {
    const clean = s.replace(/['"]/g, "").trim();
    return clean;
  }).join(", ");
  
  const awayScorersStr = parseScorers(game.away_scorers).map(s => {
    const clean = s.replace(/['"]/g, "").trim();
    return clean;
  }).join(", ");

  if (compact) {
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
        <div className="h-12 w-full flex items-center justify-center text-[10px] text-gray-500 border border-dashed border-white/10 rounded-lg">
          Live stats will appear here after kickoff
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

function FeaturedLiveCard({
  game,
  teamMap,
  stadiumMap,
  onTeamClick,
  allGames,
  isActive = false,
}: {
  game: Game;
  teamMap: { [key: string]: Team };
  stadiumMap: { [key: string]: Stadium };
  onTeamClick: (team: Team) => void;
  allGames: Game[];
  isActive?: boolean;
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
      
      const hs = parseInt(g.home_score) || 0;
      const as_ = parseInt(g.away_score) || 0;
      
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

  return (
    <div className={`relative rounded-2xl overflow-hidden p-4 sm:p-6 match-card border shadow-lg w-full h-full flex flex-col ${isLive ? "border-red-500/50" : "border-white/10"}`}
      style={{ background: isLive ? "linear-gradient(135deg, #2a0a0a 0%, #0a0f1e 100%)" : "linear-gradient(135deg, #1a2744 0%, #0a0f1e 100%)" }}
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
            {finished ? (
              <>
                <span className="text-yellow-400">Full Time</span>
                <span className="text-[7px] sm:text-[8px] text-gray-500 font-medium tracking-normal mt-0.5 normal-case">Played: {nptDate}</span>
              </>
            ) : isLive ? "In Progress" : (
              <>
                <span>{nptDate.split(", ")[0]}</span>
                <span className="text-gray-400">{nptDate.split(", ")[1]}</span>
              </>
            )}
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

      {/* Scorers Area (Always rendered to keep height uniform) */}
      <div className="mt-3 sm:mt-5 pt-3 sm:pt-4 border-t border-white/5 sm:border-t-white/10 grid grid-cols-2 gap-2 sm:gap-4 relative z-10 min-h-[32px] sm:min-h-[48px]">
        <div className="text-[9px] sm:text-xs text-gray-400 text-center leading-relaxed truncate px-1 min-w-0 flex flex-col items-center justify-center">
          {homeScorersStr ? homeScorersStr.split(", ").map((s, i) => (
            <div key={i} className="inline-flex items-center justify-center gap-1.5 truncate max-w-full">
              <svg className="w-2.5 h-2.5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M12 9v6" />
              </svg>
              <span className="truncate">{s}</span>
            </div>
          )) : ""}
        </div>
        <div className="text-[9px] sm:text-xs text-gray-400 text-center leading-relaxed truncate px-1 min-w-0 flex flex-col items-center justify-center">
          {awayScorersStr ? awayScorersStr.split(", ").map((s, i) => (
            <div key={i} className="inline-flex items-center justify-center gap-1.5 truncate max-w-full">
              <svg className="w-2.5 h-2.5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M12 9v6" />
              </svg>
              <span className="truncate">{s}</span>
            </div>
          )) : ""}
        </div>
      </div>


      <MatchMomentum gameId={game.id} isLive={isLive} isPending={isPending} />

      {(isLive || finished) && (
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
          {showTracker ? "Hide Match Tracker" : (isLive ? "View Live Match Tracker" : "View Match Stats")}
        </button>
      )}

      {/* Live Match Tracker Section */}
      <AnimatePresence>
        {showTracker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden relative z-10"
          >
            <div className="mt-4 w-full h-40 relative rounded-xl border border-green-500/30 overflow-hidden bg-[#1e4d2a] flex flex-col shadow-inner">
              {/* Pitch Markings */}
              <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: "linear-gradient(to right, transparent 49.5%, white 49.5%, white 50.5%, transparent 50.5%)" }}>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white rounded-full"></div>
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-12 h-24 border-2 border-white rounded-lg"></div>
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-12 h-24 border-2 border-white rounded-lg"></div>
              </div>
              
              <div className="bg-black/40 px-3 py-1.5 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-green-400 relative z-10 border-b border-green-500/20">
                <span>{isLive ? "Live Pitch Commentary" : "Match Replay"}</span>
                <span className="text-yellow-400">{isLive ? game.time_elapsed : "FT"}</span>
              </div>
              
              <div className="flex-1 p-3 relative z-10 overflow-hidden flex flex-col justify-end">
                <AnimatePresence mode="wait">
                  <motion.div 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    key={commentary}
                    className="text-[10px] sm:text-xs text-white font-semibold bg-black/60 px-3 py-2 rounded-lg border border-white/10 shadow-lg inline-block w-fit max-w-[85%]"
                  >
                    {isLive && <span className="text-yellow-400 mr-2">{game.time_elapsed}</span>}
                    {commentary}
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

      {/* Details Extension Button */}
      <button 
        onClick={() => setShowDetails(!showDetails)}
        className="mt-4 w-full relative z-10 bg-black/20 hover:bg-white/10 border border-white/10 rounded-xl py-3 flex items-center justify-center gap-2 transition-all text-[10px] sm:text-xs font-black text-gray-400 hover:text-white uppercase tracking-widest group shadow-inner"
      >
        {showDetails ? "Hide Match Details" : "View Match Details"} 
        <span className={`text-yellow-400 transition-transform ${showDetails ? "-rotate-90" : "group-hover:translate-x-1"}`}>➔</span>
      </button>

      {/* Expandable Details Section */}
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

            {/* Match Facts Section */}
            <div className="pt-4 mt-4 border-t border-white/10">
              <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3 text-center">Match Stats</h4>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] sm:text-xs bg-black/20 rounded-xl p-3 border border-white/5">
                {/* Home Stats */}
                <div className="flex flex-col gap-2 font-black text-white">
                  <span className="text-green-400">{isPending ? "-" : hs}</span>
                  <span className="text-yellow-500">{isPending ? "-" : (parseInt(game.id) % 3)}</span>
                  <span className="text-red-500">{isPending ? "-" : (parseInt(game.id) % 2 === 0 ? 0 : 1)}</span>
                  <span className="text-orange-400">{isPending ? "-" : ((parseInt(game.id) + 2) % 2)}</span>
                </div>
                {/* Labels */}
                <div className="flex flex-col gap-2 text-gray-500 uppercase text-[9px] sm:text-[10px] tracking-widest font-bold">
                  <span>Goals</span>
                  <span>Yellow Cards</span>
                  <span>Red Cards</span>
                  <span>Injuries</span>
                </div>
                {/* Away Stats */}
                <div className="flex flex-col gap-2 font-black text-white">
                  <span className="text-green-400">{isPending ? "-" : as_}</span>
                  <span className="text-yellow-500">{isPending ? "-" : ((parseInt(game.id) + 1) % 4)}</span>
                  <span className="text-red-500">{isPending ? "-" : (parseInt(game.id) % 3 === 0 ? 1 : 0)}</span>
                  <span className="text-orange-400">{isPending ? "-" : (parseInt(game.id) % 2)}</span>
                </div>
              </div>
            </div>

            {/* Extended Match Stats Breakdown */}
            <ExtendedMatchStats gameId={game.id} isPending={isPending} />
          </motion.div>
        )}
      </AnimatePresence>
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
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const dragStartX = useRef<number | null>(null);

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
    const clamped = Math.max(0, Math.min(idx, games.length - 1));
    setDirection(clamped >= carouselIdx ? 1 : -1);
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

      {/* Carousel — AnimatePresence renders ONLY the active card; no other cards exist in the DOM */}
      <div className="relative group w-full">
        <div
          className="relative w-full rounded-2xl border border-white/5 overflow-hidden select-none"
          onPointerDown={(e) => { dragStartX.current = e.clientX; }}
          onPointerUp={(e) => {
            if (dragStartX.current === null) return;
            const dx = e.clientX - dragStartX.current;
            dragStartX.current = null;
            if (Math.abs(dx) < 10) return; // tap, not swipe
            if (dx < -40) goTo(carouselIdx + 1);
            else if (dx > 40) goTo(carouselIdx - 1);
          }}
          onPointerLeave={() => { dragStartX.current = null; }}
          style={{ touchAction: "pan-y", cursor: "grab" }}
        >
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={games[carouselIdx]?.id ?? carouselIdx}
              custom={direction}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d > 0 ? 80 : -80 }),
                center: { opacity: 1, x: 0 },
                exit: (d: number) => ({ opacity: 0, x: d > 0 ? -80 : 80 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ overflowY: "auto", maxHeight: "75dvh" }}
            >
              <FeaturedLiveCard
                game={games[carouselIdx]}
                teamMap={teamMap}
                stadiumMap={stadiumMap}
                onTeamClick={onTeamClick}
                allGames={allGames}
                isActive={true}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Arrows */}
        {carouselIdx > 0 && (
          <button
            onClick={() => goTo(carouselIdx - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 border border-white/10 text-white backdrop-blur-md shadow-lg transition-transform hover:scale-110 active:scale-95"
            aria-label="Previous match"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {carouselIdx < games.length - 1 && (
          <button
            onClick={() => goTo(carouselIdx + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 border border-white/10 text-white backdrop-blur-md shadow-lg transition-transform hover:scale-110 active:scale-95"
            aria-label="Next match"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            const hName = teamMap[g.home_team_id]?.fifa_code || g.home_team_name_en?.substring(0,3).toUpperCase() || "TBD";
            const aName = teamMap[g.away_team_id]?.fifa_code || g.away_team_name_en?.substring(0,3).toUpperCase() || "TBD";
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
  const teamMap = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t])), [teams]);
  const stadiumMap = useMemo(() => Object.fromEntries((stadiums || []).map((s) => [s.id, s])), [stadiums]);

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

  const newsBulletins = useMemo(() => {
    return generateLiveBulletins(games, teams);
  }, [games, teams]);

  return (
    <div className="p-4 space-y-6">
      <NewsMarquee bulletins={newsBulletins} />
      
      {/* Tabs */}
      <div className="flex p-1 bg-black/40 rounded-xl border border-white/10 max-w-sm mx-auto shadow-inner">
        <button 
          onClick={() => setActiveTab('today')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'today' ? 'bg-white/10 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <span className={activeTab === 'today' ? 'text-red-500 animate-pulse' : ''}>🔴</span> TDY
        </button>
        <button 
          onClick={() => setActiveTab('tomorrow')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'tomorrow' ? 'bg-white/10 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <span>📅</span> TMR
        </button>
        <button 
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'upcoming' ? 'bg-white/10 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <span>⏳</span> UPC
        </button>
      </div>

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


      {/* Hero Banner (Tournament Stats) */}
      <div
        className="relative rounded-2xl overflow-hidden text-center py-6 px-4 mb-2 shadow-lg"
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

      {/* Bracket stages */}
      {stages.map((stage) => (
        <section key={stage.key}>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-sm font-bold text-yellow-400">{stage.label}</h3>
            <div className="flex-1 h-px bg-yellow-400/20"></div>
            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">{stage.games.length} matches</span>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            viewport={{ once: true }}
            className={
              stage.key === "final" || stage.key === "sf" ? "grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto" :
              stage.key === "r32" || stage.key === "r16" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2" :
              "grid grid-cols-2 sm:grid-cols-2 gap-3"
            }
          >
            {stage.games.map((game) => (
              <MatchCard
                key={game.id}
                game={game}
                teamMap={teamMap}
                stadiumMap={stadiumMap}
                onTeamClick={onTeamClick}
                compact={stage.key === "r32" || stage.key === "r16"}
              />
            ))}
          </motion.div>
        </section>
      ))}
    </div>
  );
}
