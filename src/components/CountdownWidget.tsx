"use client";

import { useState, useEffect } from "react";
import type { Game } from "@/lib/api";

export default function CountdownWidget({ games }: { games: Game[] }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [nextGame, setNextGame] = useState<Game | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    if (!games || games.length === 0) return;

    const calculate = () => {
      const now = new Date();
      
      // Check for live games
      const liveGames = games.filter(g => g.time_elapsed !== "notstarted" && g.time_elapsed !== "finished" && g.finished !== "TRUE");
      
      if (liveGames.length > 0) {
        setIsLive(true);
        setLiveCount(liveGames.length);
        setTimeLeft(null);
        setNextGame(null);
        return;
      }
      
      setIsLive(false);
      setLiveCount(0);

      // Find next upcoming game
      const upcoming = games
        .filter(g => g.finished !== "TRUE" && g.local_date)
        .map(g => ({ game: g, date: new Date(g.local_date.replace(" ", "T")) }))
        .filter(item => item.date > now)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      if (upcoming.length > 0) {
        const next = upcoming[0];
        setNextGame(next.game);
        
        const diff = next.date.getTime() - now.getTime();
        if (diff > 0) {
          const d = Math.floor(diff / (1000 * 60 * 60 * 24));
          const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const m = Math.floor((diff / 1000 / 60) % 60);
          const s = Math.floor((diff / 1000) % 60);
          setTimeLeft({ d, h, m, s });
        } else {
          setTimeLeft(null);
        }
      } else {
        setNextGame(null);
        setTimeLeft(null);
      }
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [games]);

  if (isLive) {
    return (
      <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 rounded-full px-2.5 py-1">
        <span className="w-2 h-2 bg-red-500 rounded-full live-pulse"></span>
        <span className="text-[10px] text-red-400 font-bold tracking-wider">{liveCount} LIVE {liveCount === 1 ? "MATCH" : "MATCHES"}</span>
      </div>
    );
  }

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:block text-[9px] text-gray-500 uppercase font-bold text-right leading-tight">
        Next Match<br/>
        <span className="text-yellow-400">T -</span>
      </div>
      <div className="flex gap-1">
        {timeLeft.d > 0 && (
          <div className="bg-black/40 rounded px-1.5 py-0.5 min-w-[24px] text-center border border-white/5 shadow-inner">
            <div className="text-[10px] font-black text-white">{timeLeft.d}</div>
            <div className="text-[7px] text-gray-500 font-bold uppercase -mt-1">D</div>
          </div>
        )}
        <div className="bg-black/40 rounded px-1.5 py-0.5 min-w-[24px] text-center border border-white/5 shadow-inner">
          <div className="text-[10px] font-black text-white">{timeLeft.h.toString().padStart(2, "0")}</div>
          <div className="text-[7px] text-gray-500 font-bold uppercase -mt-1">H</div>
        </div>
        <div className="bg-black/40 rounded px-1.5 py-0.5 min-w-[24px] text-center border border-white/5 shadow-inner">
          <div className="text-[10px] font-black text-white">{timeLeft.m.toString().padStart(2, "0")}</div>
          <div className="text-[7px] text-gray-500 font-bold uppercase -mt-1">M</div>
        </div>
        <div className="bg-yellow-400/10 rounded px-1.5 py-0.5 min-w-[24px] text-center border border-yellow-400/20 shadow-inner">
          <div className="text-[10px] font-black text-yellow-400">{timeLeft.s.toString().padStart(2, "0")}</div>
          <div className="text-[7px] text-yellow-500/70 font-bold uppercase -mt-1">S</div>
        </div>
      </div>
    </div>
  );
}
