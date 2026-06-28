"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Game, Team, Stadium } from "@/lib/api";
import type { AllData } from "@/app/page";
import { formatMatchDateNPT } from "@/lib/date-utils";
import Image from "next/image";
import { motion } from "framer-motion";
import { generateLiveBulletins } from "@/lib/news-utils";

const newsItems = [
  "BREAKING: Brazil sets new attendance record in thrilling Quarter-Final!",
  "UPCOMING: Argentina faces France in a highly anticipated rematch tomorrow.",
  "RECORD: Lionel Messi becomes the first player to score in 6 World Cups.",
  "INJURY UPDATE: Key midfielder for Spain ruled out of the semi-finals.",
  "LIVE: Dramatic penalty shootout underway in the Round of 16!"
];

function useWidgetData() {
  const [data, setData] = useState<AllData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchInitialData = async () => {
      try {
        const res = await fetch("/api/wc/all", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json() as AllData;
          if (mounted) setData(json);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void fetchInitialData();

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/wc/games", { cache: "no-store" });
        if (res.ok) {
          const newGames = await res.json();
          if (mounted) {
            setData((prev: AllData | null) => prev ? { ...prev, games: newGames } : null);
          }
        }
      } catch (e) {}
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { data, loading };
}

function useWidgetDerivedData(data: AllData | null) {
  const teamMap = useMemo(() => {
    if (!data) return {} as Record<string, Team>;
    return Object.fromEntries(data.teams.map((t: Team) => [t.id, t]));
  }, [data]);

  const targetGames = useMemo(() => {
    if (!data) return [];
    const games = data.games;

    const liveGames = games
      .filter((g) => g.time_elapsed !== "notstarted" && g.finished !== "TRUE")
      .sort((a, b) => new Date(b.local_date).getTime() - new Date(a.local_date).getTime());

    const finishedGames = games
      .filter((g) => g.finished === "TRUE")
      .sort((a, b) => new Date(b.local_date).getTime() - new Date(a.local_date).getTime());

    const upcomingGames = games
      .filter((g) => g.time_elapsed === "notstarted")
      .sort((a, b) => new Date(a.local_date).getTime() - new Date(b.local_date).getTime());

    const liveCount = liveGames.length;
    
    let selectedFinished: Game[] = [];
    let selectedUpcoming: Game[] = upcomingGames.slice(0, 2);

    if (liveCount >= 1) {
      selectedFinished = finishedGames.slice(0, 2);
      return [...liveGames, ...selectedFinished, ...selectedUpcoming];
    } else {
      selectedFinished = finishedGames.slice(0, 3);
      return [...selectedFinished, ...selectedUpcoming];
    }
  }, [data]);

  return { teamMap, targetGames };
}

export default function WidgetPage() {
  const { data, loading } = useWidgetData();
  const { teamMap, targetGames } = useWidgetDerivedData(data);

  const carouselRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragged, setDragged] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setDragged(false);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 5) {
      setDragged(true);
    }
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (dragged) {
      e.preventDefault();
    }
  };

  const newsBulletins = useMemo(() => {
    if (!data) return [];
    return generateLiveBulletins(data.games, data.teams);
  }, [data]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center p-4 bg-transparent">
        <div className="animate-pulse w-full max-w-sm h-40 bg-white/5 rounded-2xl"></div>
      </div>
    );
  }

  if (targetGames.length === 0 || !data) {
    return null;
  }

  return (
    <div className="w-full h-screen flex flex-col p-3 bg-transparent overflow-hidden select-none">
      {/* Header with Logo */}
      <div className="flex items-center justify-between mb-2 px-1.5">
        <div className="flex items-center gap-1.5">
          <Image src="/tiger.png" alt="Logo" width={18} height={18} className="object-contain" />
          <span className="text-[10px] font-black uppercase tracking-widest gold-text">ROAR FIFA</span>
        </div>
        <span className="text-[8px] text-gray-500 font-mono tracking-widest">NPT TIME</span>
      </div>

      {/* Horizontal Carousel */}
      <div 
        ref={carouselRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className="flex-1 flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1 cursor-grab active:cursor-grabbing select-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {targetGames.map((game) => {
          const homeTeam = teamMap[game.home_team_id];
          const awayTeam = teamMap[game.away_team_id];
          const finished = game.finished === "TRUE";
          const isLive = game.time_elapsed !== "notstarted" && game.time_elapsed !== "finished" && !finished;
          
          const homeName = homeTeam?.fifa_code || game.home_team_label || game.home_team_name_en?.substring(0, 3).toUpperCase() || "TBD";
          const awayName = awayTeam?.fifa_code || game.away_team_label || game.away_team_name_en?.substring(0, 3).toUpperCase() || "TBD";
          const hs = parseInt(game.home_score) || 0;
          const as_ = parseInt(game.away_score) || 0;
          const nptDate = formatMatchDateNPT(game.local_date, game.stadium_id);

          return (
            <a 
              key={game.id}
              href="/" 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={handleClick}
              className={`flex-shrink-0 snap-start relative w-[280px] h-[125px] p-3 match-card border shadow-xl flex flex-col justify-between overflow-hidden bg-black transition-all hover:scale-[1.01] active:scale-95 ${isLive ? "border-red-500/50" : "border-white/10"}`}
              style={{ 
                background: isLive ? "linear-gradient(135deg, #2a0a0a 0%, #0a0f1e 100%)" : "linear-gradient(135deg, #1a2744 0%, #0a0f1e 100%)",
                borderRadius: '16px'
              }}
            >
              {/* Background styling for Live */}
              {isLive && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 animate-pulse pointer-events-none"></div>
              )}
              
              {/* Top Banner */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  {isLive ? (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-500 border border-red-500/30 text-[8px] font-bold uppercase tracking-wider">
                      <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse"></span>
                      LIVE {game.time_elapsed.replace(/live/i, '').trim()}&apos;
                    </span>
                  ) : finished ? (
                    <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-gray-400 border border-white/5 text-[8px] font-bold uppercase tracking-wider">
                      FT
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[8px] font-bold uppercase tracking-wider">
                      PRE
                    </span>
                  )}
                  <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">Grp {game.group}</span>
                </div>
                <div className="text-[8px] text-gray-500 font-mono tracking-widest text-right leading-tight">
                  {nptDate.split(", ")[1]}
                </div>
              </div>
              
              {/* Teams and Score */}
              <div className="flex items-center justify-between my-auto">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-1 w-[40%]">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 shadow bg-black/50 p-0.5">
                    {homeTeam?.flag ? (
                      <Image src={homeTeam.flag} alt={homeName} fill className="object-cover rounded-full" sizes="32px" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center rounded-full text-[8px] text-gray-500">TBD</div>
                    )}
                  </div>
                  <span className="text-[9px] font-black text-center leading-tight uppercase tracking-wider truncate w-full">{homeName}</span>
                </div>
                
                {/* Score/VS */}
                <div className="flex flex-col items-center justify-center w-[20%]">
                  {game.time_elapsed === "notstarted" ? (
                    <div className="text-xs font-black text-gray-500/50">VS</div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xl font-black ${finished && hs > as_ ? "text-white" : finished ? "text-gray-400" : "text-white"}`}>{hs}</span>
                      <span className="text-gray-600 text-xs">-</span>
                      <span className={`text-xl font-black ${finished && as_ > hs ? "text-white" : finished ? "text-gray-400" : "text-white"}`}>{as_}</span>
                    </div>
                  )}
                </div>
                
                {/* Away Team */}
                <div className="flex flex-col items-center gap-1 w-[40%]">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 shadow bg-black/50 p-0.5">
                    {awayTeam?.flag ? (
                      <Image src={awayTeam.flag} alt={awayName} fill className="object-cover rounded-full" sizes="32px" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center rounded-full text-[8px] text-gray-500">TBD</div>
                    )}
                  </div>
                  <span className="text-[9px] font-black text-center leading-tight uppercase tracking-wider truncate w-full">{awayName}</span>
                </div>
              </div>
              
              {/* Bottom Date */}
              <div className="text-[7px] text-gray-600 uppercase tracking-widest text-center">
                {nptDate.split(", ")[0]}
              </div>
            </a>
          );
        })}
      </div>

      {/* Miniature News Ticker */}
      <div className="w-[calc(100%+24px)] -mx-3 bg-red-950/45 text-red-400 text-[6.5px] font-mono uppercase tracking-widest py-0.5 flex whitespace-nowrap border-t border-b border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.15)] mt-1.5 overflow-hidden">
        <motion.div
          className="flex gap-8 items-center min-w-fit pr-8"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
        >
          <div className="flex gap-8 items-center">
            {newsBulletins.map((news, i) => (
              <React.Fragment key={i}>
                <span>{news}</span>
                <span className="w-1 h-1 bg-red-500 rounded-full" />
              </React.Fragment>
            ))}
          </div>
          <div className="flex gap-8 items-center">
            {newsBulletins.map((news, i) => (
              <React.Fragment key={`dup-${i}`}>
                <span>{news}</span>
                <span className="w-1 h-1 bg-red-500 rounded-full" />
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
