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

interface ScorersTabProps {
  data: AllData;
}

const TABS = [
  { id: "scorers", icon: "⚽", label: "Goal Scorers" },
  { id: "contributors", icon: "🎯", label: "Key Contributors" },
  { id: "ratio", icon: "📊", label: "Goals per Game" },
  { id: "cleansheets", icon: "🧤", label: "Clean Sheets" },
  { id: "owngoals", icon: "🔴", label: "Own Goals" },
  { id: "penalties", icon: "🎯", label: "Penalty Goals" },
];

export default function ScorersTab({ data }: ScorersTabProps) {
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
      case "scorers": return <GoalScorersList list={liveTopScorers} expanded={expanded} variants={itemVariants} />;
      case "contributors": return <ContributorsList list={liveKeyContributors} expanded={expanded} variants={itemVariants} />;
      case "ratio": return <GoalsRatioList list={liveGoalsPerGame} expanded={expanded} variants={itemVariants} />;
      case "cleansheets": return <CleanSheetsList list={liveCleanSheets} expanded={expanded} variants={itemVariants} />;
      case "owngoals": return <OwnGoalsList list={liveOwnGoals} expanded={expanded} variants={itemVariants} />;
      case "penalties": return <PenaltiesList list={livePenaltyGoals} expanded={expanded} variants={itemVariants} />;
      default: return null;
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Scrollable Sub-tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-4 px-4 snap-x">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setExpanded(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap snap-start transition-colors ${
              activeTab === tab.id 
                ? "bg-yellow-400 text-black" 
                : "bg-white/5 text-gray-400 border border-white/10"
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
  if (idx < 3) return <span className="text-lg">{medals[idx]}</span>;
  return <span className="text-sm font-bold text-gray-500">#{idx + 1}</span>;
}

function FlagImage({ src, alt }: { src: string, alt: string }) {
  if (src) return <img src={src} alt={alt} className="w-8 h-6 object-cover rounded flex-shrink-0" />;
  return <div className="w-8 h-6 bg-gray-700 rounded flex-shrink-0" />;
}

// 1. Goal Scorers
function GoalScorersList({ list, expanded, variants }: { list: ScorerEntry[], expanded: boolean, variants: any }) {
  const maxGoals = list[0]?.goals || 1;
  const displayList = expanded ? list : list.slice(0, 10);
  
  if (list.length === 0) return <EmptyState icon="⚽" message="No goals scored yet" />;

  return (
    <>
      {displayList.map((scorer, idx) => (
        <motion.div
          key={`${scorer.name}_${scorer.teamId}`}
          variants={variants}
          className={`glass-card rounded-xl p-3 border transition-all ${idx === 0 ? "border-yellow-400/50 bg-yellow-400/5" : "border-white/5"}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 text-center flex-shrink-0"><RankBadge idx={idx} /></div>
            <FlagImage src={scorer.flag} alt={scorer.teamName} />
            <div className="flex-1 min-w-0">
              <div className={`font-bold truncate ${idx === 0 ? "text-yellow-400" : "text-white"}`}>{scorer.name}</div>
              <div className="text-xs text-gray-400">{scorer.teamName}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={`text-xl font-black ${idx === 0 ? "text-yellow-400" : "text-white"}`}>{scorer.goals}</div>
              <div className="text-[10px] text-gray-500">goals</div>
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
function ContributorsList({ list, expanded, variants }: { list: KeyContributorEntry[], expanded: boolean, variants: any }) {
  const displayList = expanded ? list : list.slice(0, 10);
  if (list.length === 0) return <EmptyState icon="🎯" message="No stats yet" />;

  return (
    <>
      {displayList.map((item, idx) => (
        <motion.div key={item.name} variants={variants} className="glass-card rounded-xl p-3 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 text-center flex-shrink-0"><RankBadge idx={idx} /></div>
            <FlagImage src={item.flag} alt={item.teamName} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white truncate">{item.name}</div>
              <div className="text-[10px] text-gray-400">{item.teamName} • {item.goals}G ({item.penaltyGoals}P)</div>
            </div>
            <div className="text-right flex-shrink-0 text-cyan-400 font-black">{item.score} <span className="text-[10px] text-gray-500 font-normal">pts</span></div>
          </div>
        </motion.div>
      ))}
    </>
  );
}

// 3. Goals Ratio
function GoalsRatioList({ list, expanded, variants }: { list: GoalsPerGameEntry[], expanded: boolean, variants: any }) {
  const displayList = expanded ? list : list.slice(0, 10);
  if (list.length === 0) return <EmptyState icon="📊" message="No data yet" />;

  return (
    <>
      {displayList.map((item, idx) => (
        <motion.div key={item.name} variants={variants} className="glass-card rounded-xl p-3 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 text-center flex-shrink-0"><RankBadge idx={idx} /></div>
            <FlagImage src={item.flag} alt={item.teamName} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white truncate">{item.name}</div>
              <div className="text-[10px] text-gray-400">{item.teamName} • {item.goals} goals in {item.games} games</div>
            </div>
            <div className="text-right flex-shrink-0 text-green-400 font-black">{item.ratio.toFixed(2)}</div>
          </div>
        </motion.div>
      ))}
    </>
  );
}

// 4. Clean Sheets
function CleanSheetsList({ list, expanded, variants }: { list: CleanSheetEntry[], expanded: boolean, variants: any }) {
  const displayList = expanded ? list : list.slice(0, 10);
  if (list.length === 0) return <EmptyState icon="🧤" message="No clean sheets yet" />;

  return (
    <>
      {displayList.map((item, idx) => (
        <motion.div key={item.teamName} variants={variants} className="glass-card rounded-xl p-3 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 text-center flex-shrink-0"><RankBadge idx={idx} /></div>
            <FlagImage src={item.flag} alt={item.teamName} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white truncate">{item.teamName}</div>
              <div className="text-[10px] text-gray-400">{item.gamesPlayed} games played</div>
            </div>
            <div className="text-right flex-shrink-0 text-white font-black">{item.cleanSheets}</div>
          </div>
        </motion.div>
      ))}
    </>
  );
}

// 5. Own Goals
function OwnGoalsList({ list, expanded, variants }: { list: OwnGoalEntry[], expanded: boolean, variants: any }) {
  const displayList = expanded ? list : list.slice(0, 10);
  if (list.length === 0) return <EmptyState icon="🔴" message="No own goals yet" />;

  return (
    <>
      {displayList.map((item, idx) => (
        <motion.div key={item.name} variants={variants} className="glass-card rounded-xl p-3 border border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-3">
            <div className="w-8 text-center flex-shrink-0"><RankBadge idx={idx} medals={["🔴", "🔴", "🔴"]} /></div>
            <FlagImage src={item.flag} alt={item.teamName} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-red-400 truncate">{item.name}</div>
              <div className="text-[10px] text-gray-400">{item.teamName} {item.matchInfos.join(", ")}</div>
            </div>
            <div className="text-right flex-shrink-0 text-red-400 font-black">{item.ownGoals}</div>
          </div>
        </motion.div>
      ))}
    </>
  );
}

// 6. Penalty Goals
function PenaltiesList({ list, expanded, variants }: { list: PenaltyGoalEntry[], expanded: boolean, variants: any }) {
  const displayList = expanded ? list : list.slice(0, 10);
  if (list.length === 0) return <EmptyState icon="🎯" message="No penalty goals yet" />;

  return (
    <>
      {displayList.map((item, idx) => (
        <motion.div key={item.name} variants={variants} className="glass-card rounded-xl p-3 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 text-center flex-shrink-0"><RankBadge idx={idx} /></div>
            <FlagImage src={item.flag} alt={item.teamName} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white truncate">{item.name}</div>
              <div className="text-[10px] text-gray-400">{item.teamName}</div>
            </div>
            <div className="text-right flex-shrink-0 text-white font-black">{item.penalties}</div>
          </div>
        </motion.div>
      ))}
    </>
  );
}

function EmptyState({ icon, message }: { icon: string, message: string }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <div className="text-4xl mb-3">{icon}</div>
      <p>{message}</p>
      <p className="text-xs mt-1">Check back once matches begin</p>
    </div>
  );
}
