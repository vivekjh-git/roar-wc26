"use client";

import { useState, useMemo } from "react";
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

interface ScorersTabProps {
  data: AllData;
  onPlayerClick?: (name: string, teamId: string) => void;
}

const TABS = [
  { id: "scorers", icon: "⚽", label: "Goal Scorers" },
  { id: "contributors", icon: "🎯", label: "Key Contributors" },
  { id: "ratio", icon: "📊", label: "Goals per Game" },
  { id: "cleansheets", icon: "🧤", label: "Clean Sheets" },
  { id: "owngoals", icon: "🔴", label: "Own Goals" },
  { id: "penalties", icon: "🎯", label: "Penalty Goals" },
];

export default function ScorersTab({ data, onPlayerClick }: ScorersTabProps) {
  const [activeTab, setActiveTab] = useState(TABS[0]!.id);
  const [expanded, setExpanded] = useState(false);

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
      default: return null;
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Scrollable Sub-tabs with spacing and glowing borders */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide snap-x px-0.5">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setExpanded(false); }}
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

      <div className="pt-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/10 transition-colors"
        >
          {expanded ? "Show less" : "Show full list"}
        </button>
      </div>
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
      <img src={src} alt={alt} className="w-6 h-4.5 object-cover rounded flex-shrink-0" />
    </>
  );
  return <div className="w-6 h-4.5 bg-gray-700 rounded flex-shrink-0" />;
}

import CachedPlayerImage from "./CachedPlayerImage";

function PlayerAvatar({ name, flag, teamName }: { name: string, flag: string, teamName: string }) {
  return (
    <div className="relative w-8 h-8 flex-shrink-0">
      <CachedPlayerImage
        playerName={name}
        flag={flag}
        teamName={teamName}
        className="w-full h-full rounded-full object-cover bg-black/40 border border-white/10"
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
            <div className="w-6 text-center flex-shrink-0"><RankBadge idx={idx} /></div>
            <PlayerAvatar name={scorer.name} flag={scorer.flag} teamName={scorer.teamName} />
            <div className="flex-1 min-w-0">
              <div 
                onClick={() => scorer.teamId && onPlayerClick?.(scorer.name, scorer.teamId)}
                className={`font-bold truncate text-sm hover:underline cursor-pointer transition-colors inline-block max-w-full ${idx === 0 ? "text-yellow-400" : "text-white hover:text-yellow-400"}`}
              >
                {scorer.name}
              </div>
              <div className="text-[10px] text-gray-400 truncate">{scorer.teamName}</div>
            </div>
            <div className="text-right flex-shrink-0">
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
            <div className="w-6 text-center flex-shrink-0"><RankBadge idx={idx} /></div>
            <PlayerAvatar name={item.name} flag={item.flag} teamName={item.teamName} />
            <div className="flex-1 min-w-0">
              <button 
                type="button"
                onClick={() => item.teamId && onPlayerClick?.(item.name, item.teamId)}
                className="font-bold text-white text-sm hover:underline cursor-pointer hover:text-yellow-400 transition-colors truncate inline-block text-left max-w-full"
              >
                {item.name}
              </button>
              <div className="text-[10px] text-gray-400 truncate">{item.teamName} • {item.goals}G ({item.penaltyGoals}P)</div>
            </div>
            <div className="text-right flex-shrink-0 text-cyan-400 text-sm font-extrabold">{item.score} <span className="text-[9px] text-gray-500 font-normal">pts</span></div>
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
            <div className="w-6 text-center flex-shrink-0"><RankBadge idx={idx} /></div>
            <PlayerAvatar name={item.name} flag={item.flag} teamName={item.teamName} />
            <div className="flex-1 min-w-0">
              <button 
                type="button"
                onClick={() => item.teamId && onPlayerClick?.(item.name, item.teamId)}
                className="font-bold text-white text-sm hover:underline cursor-pointer hover:text-yellow-400 transition-colors truncate inline-block text-left max-w-full"
              >
                {item.name}
              </button>
              <div className="text-[10px] text-gray-400 truncate">{item.teamName} • {item.goals} goals in {item.games} games</div>
            </div>
            <div className="text-right flex-shrink-0 text-green-400 text-sm font-extrabold">{item.ratio.toFixed(2)}</div>
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
            <div className="w-6 text-center flex-shrink-0"><RankBadge idx={idx} /></div>
            <FlagImage src={item.flag} alt={item.teamName} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-sm truncate">{item.teamName}</div>
              <div className="text-[10px] text-gray-400 truncate">{item.gamesPlayed} games played</div>
            </div>
            <div className="text-right flex-shrink-0 text-white text-sm font-extrabold">{item.cleanSheets}</div>
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
            <div className="w-6 text-center flex-shrink-0"><RankBadge idx={idx} medals={["🔴", "🔴", "🔴"]} /></div>
            <PlayerAvatar name={item.name} flag={item.flag} teamName={item.teamName} />
            <div className="flex-1 min-w-0">
              <button 
                type="button"
                onClick={() => item.teamId && onPlayerClick?.(item.name, item.teamId)}
                className="font-bold text-red-400 text-sm hover:underline cursor-pointer transition-colors truncate inline-block text-left max-w-full"
              >
                {item.name}
              </button>
              <div className="text-[10px] text-gray-400 truncate">{item.teamName} {item.matchInfos.join(", ")}</div>
            </div>
            <div className="text-right flex-shrink-0 text-red-400 text-sm font-extrabold">{item.ownGoals}</div>
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
            <div className="w-6 text-center flex-shrink-0"><RankBadge idx={idx} /></div>
            <PlayerAvatar name={item.name} flag={item.flag} teamName={item.teamName} />
            <div className="flex-1 min-w-0">
              <button 
                type="button"
                onClick={() => item.teamId && onPlayerClick?.(item.name, item.teamId)}
                className="font-bold text-white text-sm hover:underline cursor-pointer hover:text-yellow-400 transition-colors truncate inline-block text-left max-w-full"
              >
                {item.name}
              </button>
              <div className="text-[10px] text-gray-400 truncate">{item.teamName}</div>
            </div>
            <div className="text-right flex-shrink-0 text-white text-sm font-extrabold">{item.penalties}</div>
          </div>
        </motion.div>
      ))}
    </>
  );
}

function EmptyState({ icon, message }: Readonly<{ icon: string, message: string }>) {
  return (
    <div className="text-center py-12 text-gray-500">
      <div className="text-4xl mb-3">{icon}</div>
      <p>{message}</p>
      <p className="text-xs mt-1">Check back once matches begin</p>
    </div>
  );
}
