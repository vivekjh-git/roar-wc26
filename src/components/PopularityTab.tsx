"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { AllData } from "@/app/page";

interface PopularityTabProps {
  data: AllData;
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

export default function PopularityTab({ data }: PopularityTabProps) {
  const { popularity, games, topScorers, cleanSheets, goalsPerGame } = data;

  const maxScore = popularity[0]?.score || 1;

  /* ── Derived game facts (home_score & away_score are strings in the Game type) ── */
  const finishedGames = useMemo(
    () => games.filter(g => g.finished === "TRUE"),
    [games]
  );

  const totalGoals = useMemo(
    () => finishedGames.reduce((s, g) => s + (parseInt(g.home_score) || 0) + (parseInt(g.away_score) || 0), 0),
    [finishedGames]
  );

  const avgGoals = finishedGames.length > 0
    ? (totalGoals / finishedGames.length).toFixed(2)
    : "–";

  // Most dramatic game: highest combined score
  const mostDramatic = useMemo(() => {
    return [...finishedGames]
      .sort((a, b) =>
        ((parseInt(b.home_score) || 0) + (parseInt(b.away_score) || 0)) -
        ((parseInt(a.home_score) || 0) + (parseInt(a.away_score) || 0))
      )[0];
  }, [finishedGames]);

  // Biggest win: biggest margin
  const biggestWin = useMemo(() => {
    return [...finishedGames]
      .sort((a, b) =>
        Math.abs((parseInt(b.home_score) || 0) - (parseInt(b.away_score) || 0)) -
        Math.abs((parseInt(a.home_score) || 0) - (parseInt(a.away_score) || 0))
      )[0];
  }, [finishedGames]);

  // Top scorer
  const topScorer = topScorers[0];

  // Clean sheet leader
  const csLeader = cleanSheets?.[0];

  // Goals per game leader (by team ratio)
  const topGPG = goalsPerGame?.[0];

  // Teams still unbeaten (no losses)
  const unbeatenTeams = useMemo(() => {
    const record: Record<string, { w: number; d: number; l: number; played: number; name: string }> = {};
    finishedGames.forEach(g => {
      const hS = parseInt(g.home_score) || 0;
      const aS = parseInt(g.away_score) || 0;
      const hId = g.home_team_id, aId = g.away_team_id;
      const hName = g.home_team_name_en || hId;
      const aName = g.away_team_name_en || aId;
      if (!record[hId]) record[hId] = { w: 0, d: 0, l: 0, played: 0, name: hName };
      if (!record[aId]) record[aId] = { w: 0, d: 0, l: 0, played: 0, name: aName };
      record[hId].played++;
      record[aId].played++;
      if (hS > aS) { record[hId].w++; record[aId].l++; }
      else if (hS === aS) { record[hId].d++; record[aId].d++; }
      else { record[aId].w++; record[hId].l++; }
    });
    return Object.values(record)
      .filter(t => t.played >= 2 && t.l === 0)
      .sort((a, b) => b.w - a.w || b.played - a.played)
      .slice(0, 5);
  }, [finishedGames]);

  // Trending topics
  const trendingItems = useMemo(() => {
    const items: { icon: string; label: string; sub: string; heat: string }[] = [];

    if (topScorer) items.push({
      icon: "⚽",
      label: `${topScorer.name} – ${topScorer.goals} goals`,
      sub: "Leading the Golden Boot race",
      heat: "🔴",
    });

    if (mostDramatic) {
      const tot = (parseInt(mostDramatic.home_score) || 0) + (parseInt(mostDramatic.away_score) || 0);
      items.push({
        icon: "🎭",
        label: `${mostDramatic.home_team_name_en || "?"} ${mostDramatic.home_score}–${mostDramatic.away_score} ${mostDramatic.away_team_name_en || "?"}`,
        sub: `${tot}-goal thriller – most action in one game`,
        heat: "🔴",
      });
    }

    if (biggestWin) {
      const margin = Math.abs((parseInt(biggestWin.home_score) || 0) - (parseInt(biggestWin.away_score) || 0));
      const winner = (parseInt(biggestWin.home_score) || 0) > (parseInt(biggestWin.away_score) || 0)
        ? biggestWin.home_team_name_en : biggestWin.away_team_name_en;
      items.push({
        icon: "💥",
        label: `${winner || "?"} wins by ${margin}`,
        sub: "Biggest margin of victory so far",
        heat: "🟠",
      });
    }

    if (unbeatenTeams.length > 0) items.push({
      icon: "🛡️",
      label: `${unbeatenTeams.length} teams still unbeaten`,
      sub: unbeatenTeams.map(t => t.name).join(", "),
      heat: "🟡",
    });

    if (csLeader) items.push({
      icon: "🧤",
      label: `${csLeader.teamName} – ${csLeader.cleanSheets} clean sheets`,
      sub: "Best defensive record so far",
      heat: "🟡",
    });

    items.push({
      icon: "📊",
      label: `${avgGoals} goals per game`,
      sub: `Across ${finishedGames.length} completed matches`,
      heat: totalGoals > 60 ? "🔴" : "🟠",
    });

    return items.slice(0, 6);
  }, [topScorer, mostDramatic, biggestWin, unbeatenTeams, csLeader, avgGoals, finishedGames, totalGoals]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-4 space-y-5">

      {/* === SECTION: Live Counters === */}
      <motion.div variants={item} className="grid grid-cols-3 gap-2">
        {[
          { val: totalGoals, label: "Total Goals", icon: "⚽", color: "text-green-400", border: "border-green-500/20" },
          { val: finishedGames.length, label: "Games Played", icon: "🏟️", color: "text-blue-400", border: "border-blue-500/20" },
          { val: avgGoals, label: "Goals/Game", icon: "📈", color: "text-yellow-400", border: "border-yellow-500/20" },
        ].map(s => (
          <div key={s.label} className={`glass-card rounded-xl p-3 border ${s.border} flex flex-col items-center justify-center text-center`}>
            <div className="text-lg mb-0.5">{s.icon}</div>
            <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
            <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-tight mt-0.5">{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* === SECTION: Trending Now === */}
      <motion.div variants={item}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🔥</span>
          <h2 className="text-sm font-black text-white tracking-wide">Trending Now</h2>
          <span className="ml-auto text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
        </div>
        <div className="space-y-2">
          {trendingItems.map((t, i) => (
            <div key={i} className="flex items-start gap-3 glass-card rounded-xl p-3 border border-white/5 hover:bg-white/5 transition-colors">
              <span className="text-xl flex-shrink-0">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white leading-snug">{t.label}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{t.sub}</div>
              </div>
              <span className="text-base flex-shrink-0">{t.heat}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* === SECTION: Buzz Index Podium === */}
      {popularity.length >= 3 && (
        <motion.div variants={item}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🏆</span>
            <h2 className="text-sm font-black text-white tracking-wide">Buzz Index — Top 3</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 items-end h-44 px-1">
            {/* 2nd */}
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "68%", opacity: 1 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 100 }}
              className="glass-card rounded-t-xl border-t border-l border-r border-gray-400/40 bg-gray-500/10 flex flex-col items-center justify-start relative pt-8"
            >
              <div className="absolute -top-5">{popularity[1]?.flag && <img src={popularity[1].flag} alt="" className="w-10 h-7 object-cover rounded shadow-lg border border-white/20" />}</div>
              <div className="text-xl font-black text-gray-300">🥈</div>
              <div className="text-[10px] font-bold text-gray-300 truncate w-full text-center mt-1 px-1">{popularity[1]?.teamName}</div>
              <div className="text-[9px] text-gray-500 mt-auto mb-1">{popularity[1]?.score} pts</div>
            </motion.div>
            {/* 1st */}
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "100%", opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 100 }}
              className="glass-card rounded-t-xl border-t border-l border-r border-yellow-400/70 bg-yellow-400/10 flex flex-col items-center justify-start relative pt-10"
            >
              <div className="absolute -top-7 z-10 text-2xl animate-bounce drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">👑</div>
              <div className="absolute -top-3">{popularity[0]?.flag && <img src={popularity[0].flag} alt="" className="w-12 h-8 object-cover rounded shadow-[0_0_15px_rgba(250,204,21,0.4)] border border-yellow-400/50" />}</div>
              <div className="text-2xl font-black text-yellow-400 mt-2">🥇</div>
              <div className="text-[11px] font-black text-yellow-300 truncate w-full text-center mt-1 px-1">{popularity[0]?.teamName}</div>
              <div className="text-[10px] font-bold text-yellow-500 mt-auto mb-1 bg-black/30 px-2 py-0.5 rounded-full">{popularity[0]?.score} pts</div>
            </motion.div>
            {/* 3rd */}
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "55%", opacity: 1 }}
              transition={{ delay: 0.55, type: "spring", stiffness: 100 }}
              className="glass-card rounded-t-xl border-t border-l border-r border-amber-700/40 bg-amber-900/10 flex flex-col items-center justify-start relative pt-8"
            >
              <div className="absolute -top-5">{popularity[2]?.flag && <img src={popularity[2].flag} alt="" className="w-10 h-7 object-cover rounded shadow-lg border border-white/20" />}</div>
              <div className="text-xl font-black text-amber-600">🥉</div>
              <div className="text-[10px] font-bold text-amber-500 truncate w-full text-center mt-1 px-1">{popularity[2]?.teamName}</div>
              <div className="text-[9px] text-gray-500 mt-auto mb-1">{popularity[2]?.score} pts</div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* === SECTION: Full Buzz Rankings === */}
      <motion.div variants={item}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">📋</span>
          <h2 className="text-sm font-black text-white tracking-wide">Full Rankings</h2>
          <div className="ml-auto flex gap-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>Goals</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>Played</span>
          </div>
        </div>
        <div className="space-y-2">
          {popularity.map((entry, idx) => (
            <div
              key={entry.teamId}
              className={`glass-card rounded-xl p-3 border transition-all hover:bg-white/5 ${
                idx === 0 ? "border-yellow-400/30 bg-yellow-400/5 shadow-[0_0_12px_rgba(250,204,21,0.08)]" : "border-white/5"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 text-center flex-shrink-0">
                  {idx < 3 ? (
                    <span className="text-sm">{["🥇", "🥈", "🥉"][idx]}</span>
                  ) : (
                    <span className="text-xs font-bold text-gray-500">#{idx + 1}</span>
                  )}
                </div>
                {entry.flag ? (
                  <img src={entry.flag} alt={entry.teamName} className="w-9 h-6 object-cover rounded shadow flex-shrink-0" />
                ) : (
                  <div className="w-9 h-6 bg-gray-700 rounded flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-white truncate">{entry.teamName}</div>
                  <div className="text-[9px] text-gray-500">{entry.played} MP · ⚽{entry.goalsFor} · 🥅{entry.goalsAgainst}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-sm font-black ${idx === 0 ? "text-yellow-400" : "text-white"}`}>{entry.score}</div>
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest -mt-0.5">pts</div>
                </div>
              </div>
              {/* Stacked bar */}
              <div className="mt-2 h-1.5 flex bg-black/40 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(((entry.goalsFor * 3) / maxScore) * 100, 100)}%` }}
                  transition={{ duration: 0.9, delay: 0.4 + idx * 0.04 }}
                  className="h-full bg-green-500"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((entry.played / maxScore) * 100, 30)}%` }}
                  transition={{ duration: 0.9, delay: 0.6 + idx * 0.04 }}
                  className="h-full bg-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* === SECTION: Stat Spotlight Cards === */}
      <motion.div variants={item}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🔦</span>
          <h2 className="text-sm font-black text-white tracking-wide">Stat Spotlights</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {mostDramatic && (
            <div className="glass-card col-span-2 rounded-xl p-4 border border-purple-500/20 bg-purple-500/5">
              <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1.5">🎭 Most Dramatic Match</div>
              <div className="text-sm font-black text-white">
                {mostDramatic.home_team_name_en || "?"}{" "}
                <span className="text-purple-400">{mostDramatic.home_score}–{mostDramatic.away_score}</span>{" "}
                {mostDramatic.away_team_name_en || "?"}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">
                {(parseInt(mostDramatic.home_score) || 0) + (parseInt(mostDramatic.away_score) || 0)} total goals
              </div>
            </div>
          )}

          {biggestWin && (
            <div className="glass-card rounded-xl p-4 border border-red-500/20 bg-red-500/5">
              <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1.5">💥 Biggest Win</div>
              <div className="text-sm font-black text-white leading-snug">
                {(parseInt(biggestWin.home_score) || 0) > (parseInt(biggestWin.away_score) || 0)
                  ? biggestWin.home_team_name_en
                  : biggestWin.away_team_name_en}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">
                {biggestWin.home_score}–{biggestWin.away_score} ({Math.abs((parseInt(biggestWin.home_score) || 0) - (parseInt(biggestWin.away_score) || 0))}-goal margin)
              </div>
            </div>
          )}

          {topScorer && (
            <div className="glass-card rounded-xl p-4 border border-yellow-500/20 bg-yellow-500/5">
              <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest mb-1.5">⚽ Golden Boot Leader</div>
              <div className="text-sm font-black text-white leading-snug truncate">{topScorer.name}</div>
              <div className="text-[10px] text-gray-400 mt-1">{topScorer.goals} goals · {topScorer.teamName}</div>
            </div>
          )}

          {csLeader && (
            <div className="glass-card rounded-xl p-4 border border-cyan-500/20 bg-cyan-500/5">
              <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1.5">🧤 Clean Sheet King</div>
              <div className="text-sm font-black text-white leading-snug truncate">{csLeader.teamName}</div>
              <div className="text-[10px] text-gray-400 mt-1">{csLeader.cleanSheets} clean sheets kept</div>
            </div>
          )}

          {topGPG && (
            <div className="glass-card rounded-xl p-4 border border-orange-500/20 bg-orange-500/5">
              <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1.5">📈 Goals/Game Leader</div>
              <div className="text-sm font-black text-white leading-snug truncate">{topGPG.teamName}</div>
              <div className="text-[10px] text-gray-400 mt-1">{topGPG.ratio?.toFixed(2)} goals per game</div>
            </div>
          )}

          {unbeatenTeams.length > 0 && (
            <div className="glass-card rounded-xl p-4 border border-emerald-500/20 bg-emerald-500/5">
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5">🛡️ Still Unbeaten</div>
              <div className="text-[11px] font-bold text-white leading-relaxed">
                {unbeatenTeams.map(t => t.name).join(" · ")}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* === SECTION: Fan / Geek Facts === */}
      <motion.div variants={item} className="glass-card rounded-xl p-4 border border-white/10 bg-gradient-to-br from-white/3 to-transparent">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span>🤓</span> Did You Know?
        </div>
        <div className="space-y-2.5">
          {[
            { fact: "This tournament features 48 teams for the first time — up from 32 in Qatar 2022.", icon: "🌍" },
            { fact: "USA, Canada & Mexico is the first time 3 nations co-host a FIFA World Cup.", icon: "🤝" },
            { fact: `${totalGoals} goals scored so far — averaging ${avgGoals} per game across all matches.`, icon: "📊" },
            { fact: "The 2026 WC has the most matches ever: 104 games in total.", icon: "🏟️" },
            { fact: "16 teams advance to the Round of 32 — a brand-new stage in WC history.", icon: "🆕" },
            { fact: "MetLife Stadium (New Jersey) hosts the Final on July 19, 2026.", icon: "🏆" },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="text-base flex-shrink-0 mt-0.5">{f.icon}</span>
              <p className="text-[11px] text-gray-300 leading-relaxed">{f.fact}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* === SECTION: How buzz is calculated === */}
      <motion.div variants={item} className="glass-card rounded-xl p-4 border border-white/5 bg-black/30">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">⚙️ Buzz Score Formula</div>
        <div className="flex items-center gap-3 text-xs font-black flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
            <span className="text-green-400">Goals × 3 pts</span>
          </div>
          <span className="text-gray-600">+</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            <span className="text-blue-400">Matches × 1 pt</span>
          </div>
          <span className="text-gray-600">=</span>
          <span className="text-white">Buzz Score</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">Teams that score heavily and go deep into the tournament naturally dominate the Buzz Index.</p>
      </motion.div>
    </motion.div>
  );
}
