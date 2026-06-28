"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Header from "@/components/Header";
import GroupsTab from "@/components/GroupsTab";
import BracketTab from "@/components/BracketTab";
import ScorersTab from "@/components/ScorersTab";
import RecordsTab from "@/components/RecordsTab";
import PopularityTab from "@/components/PopularityTab";
import TeamModal from "@/components/TeamModal";
import type { 
  Team, Group, Game, Stadium, ScorerEntry, WCRecord, PopularityEntry,
  OwnGoalEntry, GoalsPerGameEntry, MaxGoalsMatchEntry, CleanSheetEntry,
  GoalsConcededEntry, PenaltyGoalEntry, KeyContributorEntry, FullTeamStats 
} from "@/lib/api";
import type { HistoricalRecord, RecordStatus } from "@/lib/records-data";

export interface AllData {
  teams: Team[];
  groups: Group[];
  games: Game[];
  stadiums: Stadium[];
  topScorers: ScorerEntry[];
  popularity: PopularityEntry[];
  records: WCRecord[];
  ownGoals: OwnGoalEntry[];
  goalsPerGame: GoalsPerGameEntry[];
  maxGoalsMatch: MaxGoalsMatchEntry[];
  cleanSheets: CleanSheetEntry[];
  goalsConceded: GoalsConcededEntry[];
  penaltyGoals: PenaltyGoalEntry[];
  keyContributors: KeyContributorEntry[];
  fullTeamStats: FullTeamStats[];
  expandedRecords: (HistoricalRecord & { status: RecordStatus })[];
}

function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="shimmer rounded-xl h-32" />
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-bold text-white mb-2">Failed to load data</h3>
      <p className="text-sm text-gray-400 mb-6">
        Could not fetch World Cup data. Please check your connection.
      </p>
      <button
        onClick={onRetry}
        className="bg-yellow-400 text-black font-bold px-6 py-2.5 rounded-full hover:bg-yellow-300 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("bracket");
  const [data, setData] = useState<AllData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/wc/all", { cache: "no-store" });
      if (!res.ok) throw new Error("API error");
      const json = await res.json() as AllData;
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    // Auto-refresh only games every 10 seconds to keep live data fast and lightweight
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/wc/games", { cache: "no-store" });
        if (res.ok) {
          const newGames = await res.json();
          setData(prev => prev ? { ...prev, games: newGames } : null);
        }
      } catch (e) {
        // silent error for background polling
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const teamMap = data
    ? Object.fromEntries(data.teams.map((t) => [t.id, t]))
    : {};

  const handleTeamClick = (team: Team) => {
    setSelectedTeam(team);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] overflow-x-hidden">
      <Header activeTab={activeTab} onTabChange={setActiveTab} onRefresh={fetchData} loading={loading} games={data?.games || []} />

      <main className="max-w-4xl mx-auto pb-safe-bottom pb-8">
        {loading && <LoadingSkeleton />}
        {error && !loading && <ErrorState onRetry={fetchData} />}

        {!loading && !error && data && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "bracket" && (
                <BracketTab
                  games={data.games}
                  teams={data.teams}
                  stadiums={data.stadiums}
                  onTeamClick={handleTeamClick}
                />
              )}
              {activeTab === "groups" && (
                <GroupsTab
                  groups={data.groups}
                  teams={data.teams}
                  games={data.games}
                  onTeamClick={handleTeamClick}
                />
              )}
              {activeTab === "scorers" && (
                <ScorersTab data={data} />
              )}
              {activeTab === "records" && (
                <RecordsTab records={data.expandedRecords || data.records} />
              )}
              {activeTab === "popularity" && (
                <PopularityTab popularity={data.popularity} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Team detail modal */}
      {selectedTeam && data && (
        <TeamModal
          team={selectedTeam}
          games={data.games}
          groups={data.groups}
          stadiums={data.stadiums}
          teamMap={teamMap}
          onClose={() => setSelectedTeam(null)}
        />
      )}

      {/* PWA install hint */}
      <div className="fixed bottom-4 right-4 z-40">
        <div className="bg-[#1a2744] border border-yellow-400/20 rounded-full px-3 py-1.5 text-[10px] text-gray-400 flex items-center gap-1.5">
          <span className="text-yellow-400">📱</span>
          Install as app
        </div>
      </div>
    </div>
  );
}
