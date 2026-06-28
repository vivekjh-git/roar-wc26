"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Game, Team, Stadium } from "@/lib/api";
import type { AllData } from "@/app/page";
import { formatMatchDateNPT } from "@/lib/date-utils";
import Image from "next/image";

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

  const stadiumMap = useMemo(() => {
    if (!data) return {} as Record<string, Stadium>;
    return Object.fromEntries((data.stadiums || []).map((s: Stadium) => [s.id, s]));
  }, [data]);

  const targetGame = useMemo(() => {
    if (!data) return null;
    const games = data.games;
    
    const sortGames = (a: Game, b: Game) => {
      const aLive = a.time_elapsed !== "notstarted" && a.finished !== "TRUE" ? 1 : 0;
      const bLive = b.time_elapsed !== "notstarted" && b.finished !== "TRUE" ? 1 : 0;
      if (aLive !== bLive) return bLive - aLive;
      
      const aUpcoming = a.time_elapsed === "notstarted" ? 1 : 0;
      const bUpcoming = b.time_elapsed === "notstarted" ? 1 : 0;
      if (aUpcoming !== bUpcoming) return bUpcoming - aUpcoming;
      
      if (aUpcoming) {
        return new Date(a.local_date).getTime() - new Date(b.local_date).getTime();
      } else {
        return new Date(b.local_date).getTime() - new Date(a.local_date).getTime();
      }
    };

    const sortedGames = [...games].sort(sortGames);
    return sortedGames[0] || null;
  }, [data]);

  return { teamMap, stadiumMap, targetGame };
}

export default function WidgetPage() {
  const { data, loading } = useWidgetData();
  const { teamMap, stadiumMap, targetGame } = useWidgetDerivedData(data);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center p-2 sm:p-4 bg-transparent">
        <div className="animate-pulse w-full max-w-sm h-48 bg-white/5 rounded-2xl"></div>
      </div>
    );
  }

  if (!targetGame || !data) {
    return null;
  }

  const homeTeam = teamMap[targetGame.home_team_id];
  const awayTeam = teamMap[targetGame.away_team_id];
  const stadium = stadiumMap[targetGame.stadium_id];
  const finished = targetGame.finished === "TRUE";
  const isLive = targetGame.time_elapsed !== "notstarted" && targetGame.time_elapsed !== "finished" && !finished;
  
  const homeName = homeTeam?.name_en || targetGame.home_team_label || targetGame.home_team_name_en || "TBD";
  const awayName = awayTeam?.name_en || targetGame.away_team_label || targetGame.away_team_name_en || "TBD";
  const hs = parseInt(targetGame.home_score) || 0;
  const as_ = parseInt(targetGame.away_score) || 0;
  
  const nptDate = formatMatchDateNPT(targetGame.local_date, targetGame.stadium_id);
  
  return (
    <div className="w-full h-screen flex items-center justify-center p-2 sm:p-4 bg-transparent overflow-hidden">
      <a 
        href="/" 
        target="_blank" 
        rel="noopener noreferrer" 
        className={`block relative w-full max-w-sm h-full max-h-56 p-4 match-card border shadow-xl flex flex-col justify-center overflow-hidden bg-black transition-all hover:scale-[1.02] active:scale-95 ${isLive ? "border-red-500/50" : "border-white/10"}`}
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
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {isLive ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                LIVE {targetGame.time_elapsed.replace(/live/i, '').trim()}&apos;
              </span>
            ) : finished ? (
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-gray-400 border border-white/5 text-[10px] font-bold uppercase tracking-wider">
                Full Time
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider">
                Upcoming
              </span>
            )}
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Group {targetGame.group}</span>
          </div>
          <div className="text-[9px] text-gray-500 font-mono tracking-widest text-right">
            {nptDate.split(", ")[0]}<br/>
            {nptDate.split(", ")[1]}
          </div>
        </div>
        
        {/* Teams and Score */}
        <div className="flex items-center justify-between mb-2">
          {/* Home Team */}
          <div className="flex flex-col items-center gap-2 w-[40%]">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 shadow-lg bg-black/50 p-1">
              {homeTeam?.flag ? (
                <Image src={homeTeam.flag} alt={homeName} fill className="object-cover rounded-full" sizes="48px" />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center rounded-full text-[9px] text-gray-500 font-bold uppercase tracking-wider">TBD</div>
              )}
            </div>
            <span className="text-[10px] font-black text-center leading-tight uppercase tracking-widest">{homeName}</span>
          </div>
          
          {/* Score/VS */}
          <div className="flex flex-col items-center justify-center w-[20%]">
            {targetGame.time_elapsed === "notstarted" ? (
              <div className="text-xl font-black text-gray-500/50">VS</div>
            ) : (
              <div className="flex flex-col items-center gap-0">
                <div className="flex items-center gap-2">
                  <span className={`text-3xl font-black ${finished && hs > as_ ? "text-white" : finished ? "text-gray-400" : "text-white"}`}>{hs}</span>
                  <span className="text-gray-600">-</span>
                  <span className={`text-3xl font-black ${finished && as_ > hs ? "text-white" : finished ? "text-gray-400" : "text-white"}`}>{as_}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Away Team */}
          <div className="flex flex-col items-center gap-2 w-[40%]">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 shadow-lg bg-black/50 p-1">
              {awayTeam?.flag ? (
                <Image src={awayTeam.flag} alt={awayName} fill className="object-cover rounded-full" sizes="48px" />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center rounded-full text-[9px] text-gray-500 font-bold uppercase tracking-wider">TBD</div>
              )}
            </div>
            <span className="text-[10px] font-black text-center leading-tight uppercase tracking-widest">{awayName}</span>
          </div>
        </div>
        
        {/* Stadium/Location */}
        {stadium && (
          <div className="mt-auto pt-3 border-t border-white/10 flex items-center justify-center gap-1.5 text-gray-500">
            <span>🏟️</span>
            <span className="text-[8px] uppercase tracking-widest">{stadium.name_en}</span>
          </div>
        )}
      </a>
    </div>
  );
}
