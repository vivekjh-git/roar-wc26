"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AllData } from "@/app/page";
import { 
  computeTopScorers, computeKeyContributors, computeGoalsPerGame, 
  computeCleanSheets, computeOwnGoals, computePenaltyGoals 
} from "@/lib/api";
import type { 
  ScorerEntry, KeyContributorEntry, GoalsPerGameEntry, 
  CleanSheetEntry, OwnGoalEntry, PenaltyGoalEntry 
} from "@/lib/api";
import { getPlayerImageUrl } from "@/lib/player-images";
import { getPlayerFifaRating } from "@/lib/player-ratings";
import { GoalIcon, AttemptIcon, InfoIcon, RedCardIcon, CornerIcon } from "./FlatIcons";

interface ScorersTabProps {
  data: AllData;
  onPlayerClick?: (name: string, teamId: string) => void;
}

const TABS = [
  { id: "scorers", icon: <GoalIcon size={12} className="inline-block" />, label: "Goal Scorers" },
  { id: "contributors", icon: <AttemptIcon size={12} className="inline-block text-cyan-400" />, label: "Key Contributors" },
  { id: "ratio", icon: <InfoIcon size={12} className="inline-block text-emerald-400" />, label: "Goals per Game" },
  { id: "cleansheets", icon: <InfoIcon size={12} className="inline-block text-blue-400" />, label: "Clean Sheets" },
  { id: "owngoals", icon: <RedCardIcon className="inline-block" />, label: "Own Goals" },
  { id: "penalties", icon: <CornerIcon size={12} className="inline-block text-yellow-500" />, label: "Penalty Goals" },
  { id: "teams", icon: <span>🌍</span>, label: "By Country" },
];

function EmptyState({ icon, message }: Readonly<{ icon: string, message: string }>) {
  return (
    <div className="text-center py-12 text-gray-500">
      <div className="text-4xl mb-3">{icon}</div>
      <p>{message}</p>
      <p className="text-xs mt-1">Check back once matches begin</p>
    </div>
  );
}

// Real EA FC rating badge — renders nothing when we don't have a verified rating for the player
// (no invented numbers). `prefix` lets the By-Country card show "FIFA 91" vs a bare "91" inline.
function FifaRatingBadge({ name, prefix = "", className = "px-1 ml-1.5" }: Readonly<{ name: string, prefix?: string, className?: string }>) {
  const rating = getPlayerFifaRating(name);
  if (rating == null) return null;
  return (
    <span className={`text-[9px] bg-yellow-400/10 text-yellow-400 rounded font-mono font-bold ${className}`}>
      {prefix}{rating}
    </span>
  );
}

// 7. By Country — scorers grouped by team with collapsible sections
function TeamScorersByCountry({ list, onPlayerClick }: Readonly<{ list: ScorerEntry[], onPlayerClick?: (name: string, teamId: string) => void }>) {
  const [openTeam, setOpenTeam] = useState<string | null>(null);

  if (list.length === 0) return <EmptyState icon="🌍" message="No scorer data yet" />;

  // Group scorers by teamId, preserving order of first appearance (teams sorted by total goals desc)
  const byTeam = new Map<string, ScorerEntry[]>();
  for (const s of list) {
    const key = s.teamId ?? "unknown";
    const existing = byTeam.get(key);
    if (existing) {
      existing.push(s);
    } else {
      byTeam.set(key, [s]);
    }
  }

  return (
    <div className="space-y-2">
      {[...byTeam.entries()].map(([teamId, players]) => {
        const first = players[0];
        if (!first) return null;
        const teamGoals = players.reduce((sum, p) => sum + p.goals, 0);
        const isOpen = openTeam === teamId;

        return (
          <div key={teamId} className="glass-card rounded-xl border border-white/5 overflow-hidden">
            {/* Team header */}
            <button
              onClick={() => setOpenTeam(isOpen ? null : teamId)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {first.flag && <img src={first.flag} alt={first.teamName} className="w-7 h-5 object-cover rounded shrink-0 shadow-sm" />}
              <span className="font-black text-sm text-white flex-1 uppercase tracking-wide">{first.teamName}</span>
              <span className="text-[10px] text-yellow-400 font-extrabold bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full mr-1">
                {teamGoals} goal{teamGoals !== 1 ? "s" : ""}
              </span>
              <span className="text-gray-500 text-[10px] font-bold">{isOpen ? "▲" : "▼"}</span>
            </button>

            {/* Players list */}
            {isOpen && (
              <div className="border-t border-white/5">
                {players.map((scorer) => (
                  <button
                    key={scorer.name}
                    type="button"
                    onClick={() => scorer.teamId && onPlayerClick?.(scorer.name, scorer.teamId)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                  >
                    <PlayerAvatar name={scorer.name} flag={scorer.flag} teamName={scorer.teamName} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-white truncate">{scorer.name}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <FifaRatingBadge name={scorer.name} prefix="FIFA " className="px-1.5 py-0.5" />
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-lg font-black text-white leading-none">{scorer.goals}</span>
                      <span className="text-[9px] text-gray-500">goals</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ScorersTab({ data, onPlayerClick }: ScorersTabProps) {
  const [activeTab, setActiveTab] = useState(TABS[0]!.id);
  const [expanded, setExpanded] = useState(false);

  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const isDraggingTabs = useRef(false);
  const tabsStartX = useRef(0);
  const tabsScrollLeft = useRef(0);
  const tabsHasMoved = useRef(false);

  const onTabsMouseDown = (e: React.MouseEvent) => {
    if (!tabsScrollRef.current) return;
    isDraggingTabs.current = true;
    tabsHasMoved.current = false;
    tabsStartX.current = e.pageX - tabsScrollRef.current.offsetLeft;
    tabsScrollLeft.current = tabsScrollRef.current.scrollLeft;
  };

  const onTabsMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingTabs.current || !tabsScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - tabsScrollRef.current.offsetLeft;
    const walk = (x - tabsStartX.current) * 1.8;
    if (Math.abs(walk) > 3) {
      tabsHasMoved.current = true;
    }
    tabsScrollRef.current.scrollLeft = tabsScrollLeft.current - walk;
  };

  const onTabsMouseUpOrLeave = () => {
    isDraggingTabs.current = false;
  };

  const teamMap = useMemo(() => Object.fromEntries(data.teams.map((t) => [t.id, t])), [data.teams]);
  const liveTopScorers = useMemo(() => computeTopScorers(data.games, teamMap), [data.games, teamMap]);
  const liveKeyContributors = useMemo(() => computeKeyContributors(data.games, teamMap), [data.games, teamMap]);
  const liveGoalsPerGame = useMemo(() => computeGoalsPerGame(data.games, teamMap), [data.games, teamMap]);
  const liveCleanSheets = useMemo(() => computeCleanSheets(data.games, teamMap), [data.games, teamMap]);
  const liveOwnGoals = useMemo(() => computeOwnGoals(data.games, teamMap), [data.games, teamMap]);
  const livePenaltyGoals = useMemo(() => computePenaltyGoals(data.games, teamMap), [data.games, teamMap]);

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

  const renderContent = () => {
    switch (activeTab) {
      case "scorers": return <GoalScorersList list={liveTopScorers} expanded={expanded} variants={itemVariants} onPlayerClick={onPlayerClick} />;
      case "contributors": return <ContributorsList list={liveKeyContributors} expanded={expanded} variants={itemVariants} onPlayerClick={onPlayerClick} />;
      case "ratio": return <GoalsRatioList list={liveGoalsPerGame} expanded={expanded} variants={itemVariants} onPlayerClick={onPlayerClick} />;
      case "cleansheets": return <CleanSheetsList list={liveCleanSheets} expanded={expanded} variants={itemVariants} />;
      case "owngoals": return <OwnGoalsList list={liveOwnGoals} expanded={expanded} variants={itemVariants} onPlayerClick={onPlayerClick} />;
      case "penalties": return <PenaltiesList list={livePenaltyGoals} expanded={expanded} variants={itemVariants} onPlayerClick={onPlayerClick} />;
      case "teams": return <TeamScorersByCountry list={liveTopScorers} onPlayerClick={onPlayerClick} />;
      default: return null;
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Scrollable Sub-tabs with spacing and glowing borders */}
      <div
        ref={tabsScrollRef}
        onMouseDown={onTabsMouseDown}
        onMouseMove={onTabsMouseMove}
        onMouseUp={onTabsMouseUpOrLeave}
        onMouseLeave={onTabsMouseUpOrLeave}
        className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide snap-x px-0.5 select-none cursor-grab active:cursor-grabbing"
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={(e) => {
              if (tabsHasMoved.current) {
                e.preventDefault();
                return;
              }
              setActiveTab(tab.id);
              setExpanded(false);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap snap-start transition-all border ${
              activeTab === tab.id 
                ? "bg-yellow-400/10 text-yellow-300 border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.4)]" 
                : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          exit="hidden"
          className="space-y-2"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {activeTab !== "teams" && (
        <div className="pt-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/10 transition-colors"
          >
            {expanded ? "Show less" : "Show full list"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function RankBadge({ idx, medals = ["🥇", "🥈", "🥉"] }: { idx: number, medals?: string[] }) {
  if (idx < 3) return <span className="text-base">{medals[idx]}</span>;
  return <span className="text-xs font-bold text-gray-500">#{idx + 1}</span>;
}

function FlagImage({ src, alt }: Readonly<{ src: string, alt: string }>) {
  if (src) return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="w-6 h-4.5 object-cover rounded shrink-0" />
    </>
  );
  return <div className="w-6 h-4.5 bg-gray-700 rounded shrink-0" />;
}

import CachedPlayerImage from "./CachedPlayerImage";

function PlayerAvatar({ name, flag, teamName }: { name: string, flag: string, teamName: string }) {
  return (
    <div className="relative w-8 h-8 shrink-0 rounded-full overflow-hidden border border-white/10 bg-black/40">
      <CachedPlayerImage
        playerName={name}
        flag={flag}
        teamName={teamName}
        className="w-full h-full object-cover object-top scale-[1.35] origin-top"
      />
    </div>
  );
}


// 1. Goal Scorers
function GoalScorersList({ list, expanded, variants, onPlayerClick }: Readonly<{ list: ScorerEntry[], expanded: boolean, variants: any, onPlayerClick?: (name: string, teamId: string) => void }>) {
  const maxGoals = list[0]?.goals || 1;
  const displayList = expanded ? list : list.slice(0, 10);
  
  if (list.length === 0) return <EmptyState icon="⚽" message="No goals scored yet" />;

  return (
    <>
      {displayList.map((scorer, idx) => (
        <motion.div
          key={`${scorer.name}_${scorer.teamId}`}
          variants={variants}
          className={`glass-card rounded-xl p-2.5 border transition-all ${idx === 0 ? "border-yellow-400/30 bg-yellow-400/5" : "border-white/5"}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 text-center shrink-0"><RankBadge idx={idx} /></div>
            <PlayerAvatar name={scorer.name} flag={scorer.flag} teamName={scorer.teamName} />
            <div className="flex-1 min-w-0">
              <button 
                type="button"
                onClick={() => scorer.teamId && onPlayerClick?.(scorer.name, scorer.teamId)}
                className={`font-bold truncate text-sm hover:underline cursor-pointer transition-colors inline-block text-left max-w-full ${idx === 0 ? "text-yellow-400" : "text-white hover:text-yellow-400"}`}
              >
                {scorer.name}
                <FifaRatingBadge name={scorer.name} />
              </button>
              <div className="text-[10px] text-gray-400 truncate">{scorer.teamName}</div>
            </div>
            <div className="text-right shrink-0">
              <div className={`text-base font-extrabold leading-none ${idx === 0 ? "text-yellow-400" : "text-white"}`}>{scorer.goals}</div>
              <div className="text-[9px] text-gray-500 mt-0.5">goals</div>
            </div>
          </div>
          <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${idx === 0 ? "bg-yellow-400" : idx < 3 ? "bg-blue-400" : "bg-gray-500"}`} style={{ width: `${(scorer.goals / maxGoals) * 100}%` }} />
          </div>
        </motion.div>
      ))}
    </>
  );
}

// 2. Key Contributors
function ContributorsList({ list, expanded, variants, onPlayerClick }: Readonly<{ list: KeyContributorEntry[], expanded: boolean, variants: any, onPlayerClick?: (name: string, teamId: string) => void }>) {
  const displayList = expanded ? list : list.slice(0, 10);
  if (list.length === 0) return <EmptyState icon="🎯" message="No stats yet" />;

  return (
    <>
      {displayList.map((item, idx) => (
        <motion.div key={`${item.name}_${item.teamId}`} variants={variants} className="glass-card rounded-xl p-2.5 border border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-6 text-center shrink-0"><RankBadge idx={idx} /></div>
            <PlayerAvatar name={item.name} flag={item.flag} teamName={item.teamName} />
            <div className="flex-1 min-w-0">
              <button 
                type="button"
                onClick={() => item.teamId && onPlayerClick?.(item.name, item.teamId)}
                className="font-bold text-white text-sm hover:underline cursor-pointer hover:text-yellow-400 transition-colors truncate inline-block text-left max-w-full"
              >
                {item.name}
                <FifaRatingBadge name={item.name} />
              </button>
              <div className="text-[10px] text-gray-400 truncate">{item.teamName} • {item.goals}G ({item.penaltyGoals}P)</div>
            </div>
            <div className="text-right shrink-0 text-cyan-400 text-sm font-extrabold">{item.score} <span className="text-[9px] text-gray-500 font-normal">pts</span></div>
          </div>
        </motion.div>
      ))}
    </>
  );
}

// 3. Goals Ratio
function GoalsRatioList({ list, expanded, variants, onPlayerClick }: Readonly<{ list: GoalsPerGameEntry[], expanded: boolean, variants: any, onPlayerClick?: (name: string, teamId: string) => void }>) {
  const displayList = expanded ? list : list.slice(0, 10);
  if (list.length === 0) return <EmptyState icon="📊" message="No data yet" />;

  return (
    <>
      {displayList.map((item, idx) => (
        <motion.div key={`${item.name}_${item.teamId}`} variants={variants} className="glass-card rounded-xl p-2.5 border border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-6 text-center shrink-0"><RankBadge idx={idx} /></div>
            <PlayerAvatar name={item.name} flag={item.flag} teamName={item.teamName} />
            <div className="flex-1 min-w-0">
              <button 
                type="button"
                onClick={() => item.teamId && onPlayerClick?.(item.name, item.teamId)}
                className="font-bold text-white text-sm hover:underline cursor-pointer hover:text-yellow-400 transition-colors truncate inline-block text-left max-w-full"
              >
                {item.name}
                <FifaRatingBadge name={item.name} />
              </button>
              <div className="text-[10px] text-gray-400 truncate">{item.teamName} • {item.goals} goals in {item.games} games</div>
            </div>
            <div className="text-right shrink-0 text-green-400 text-sm font-extrabold">{item.ratio.toFixed(2)}</div>
          </div>
        </motion.div>
      ))}
    </>
  );
}

// 4. Clean Sheets
function CleanSheetsList({ list, expanded, variants }: Readonly<{ list: CleanSheetEntry[], expanded: boolean, variants: any }>) {
  const displayList = expanded ? list : list.slice(0, 10);
  if (list.length === 0) return <EmptyState icon="🧤" message="No clean sheets yet" />;

  return (
    <>
      {displayList.map((item, idx) => (
        <motion.div key={item.teamName} variants={variants} className="glass-card rounded-xl p-2.5 border border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-6 text-center shrink-0"><RankBadge idx={idx} /></div>
            <FlagImage src={item.flag} alt={item.teamName} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-sm truncate">{item.teamName}</div>
              <div className="text-[10px] text-gray-400 truncate">{item.gamesPlayed} games played</div>
            </div>
            <div className="text-right shrink-0 text-white text-sm font-extrabold">{item.cleanSheets}</div>
          </div>
        </motion.div>
      ))}
    </>
  );
}

// 5. Own Goals
function OwnGoalsList({ list, expanded, variants, onPlayerClick }: Readonly<{ list: OwnGoalEntry[], expanded: boolean, variants: any, onPlayerClick?: (name: string, teamId: string) => void }>) {
  const displayList = expanded ? list : list.slice(0, 10);
  if (list.length === 0) return <EmptyState icon="🔴" message="No own goals yet" />;

  return (
    <>
      {displayList.map((item, idx) => (
        <motion.div key={`${item.name}_${item.teamId}`} variants={variants} className="glass-card rounded-xl p-2.5 border border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-2.5">
            <div className="w-6 text-center shrink-0"><RankBadge idx={idx} medals={["🔴", "🔴", "🔴"]} /></div>
            <PlayerAvatar name={item.name} flag={item.flag} teamName={item.teamName} />
            <div className="flex-1 min-w-0">
              <button 
                type="button"
                onClick={() => item.teamId && onPlayerClick?.(item.name, item.teamId)}
                className="font-bold text-red-400 text-sm hover:underline cursor-pointer transition-colors truncate inline-block text-left max-w-full"
              >
                {item.name}
                <FifaRatingBadge name={item.name} />
              </button>
              <div className="text-[10px] text-gray-400 truncate">{item.teamName} {item.matchInfos.join(", ")}</div>
            </div>
            <div className="text-right shrink-0 text-red-400 text-sm font-extrabold">{item.ownGoals}</div>
          </div>
        </motion.div>
      ))}
    </>
  );
}

// 6. Penalty Goals
function PenaltiesList({ list, expanded, variants, onPlayerClick }: Readonly<{ list: PenaltyGoalEntry[], expanded: boolean, variants: any, onPlayerClick?: (name: string, teamId: string) => void }>) {
  const displayList = expanded ? list : list.slice(0, 10);
  if (list.length === 0) return <EmptyState icon="🎯" message="No penalty goals yet" />;

  return (
    <>
      {displayList.map((item, idx) => (
        <motion.div key={`${item.name}_${item.teamId}`} variants={variants} className="glass-card rounded-xl p-2.5 border border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-6 text-center shrink-0"><RankBadge idx={idx} /></div>
            <PlayerAvatar name={item.name} flag={item.flag} teamName={item.teamName} />
            <div className="flex-1 min-w-0">
              <button 
                type="button"
                onClick={() => item.teamId && onPlayerClick?.(item.name, item.teamId)}
                className="font-bold text-white text-sm hover:underline cursor-pointer hover:text-yellow-400 transition-colors truncate inline-block text-left max-w-full"
              >
                {item.name}
                <FifaRatingBadge name={item.name} />
              </button>
              <div className="text-[10px] text-gray-400 truncate">{item.teamName}</div>
            </div>
            <div className="text-right shrink-0 text-white text-sm font-extrabold">{item.penalties}</div>
          </div>
        </motion.div>
      ))}
    </>
  );
}

