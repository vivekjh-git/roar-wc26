"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Header from "@/components/Header";
import GroupsTab from "@/components/GroupsTab";
import BracketTab from "@/components/BracketTab";
import FixturesTab from "@/components/FixturesTab";
import ScorersTab from "@/components/ScorersTab";
import RecordsTab from "@/components/RecordsTab";
import PopularityTab from "@/components/PopularityTab";
import TeamModal from "@/components/TeamModal";
import PlayerModal from "@/components/PlayerModal";
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
  const [selectedPlayer, setSelectedPlayer] = useState<{ name: string; teamId: string } | null>(null);
  // PWA install prompt
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

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
    let mounted = true;

    const loadInitial = async () => {
      try {
        const res = await fetch("/api/wc/all", { cache: "no-store" });
        if (!res.ok) throw new Error("API error");
        const json = await res.json() as AllData;
        if (mounted) {
          setData(json);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    void loadInitial();

    // Auto-refresh only games every 10 seconds to keep live data fast and lightweight
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/wc/games", { cache: "no-store" });
        if (res.ok) {
          const newGames = await res.json();
          if (mounted) {
            setData(prev => prev ? { ...prev, games: newGames } : null);
          }
        }
      } catch (e) {
        // silent error for background polling
      }
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // PWA install prompt capture
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    // Check if already running as installed PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setTimeout(() => setIsInstalled(true), 0);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prompt = installPrompt as any;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  };

  const teamMap = data
    ? Object.fromEntries(data.teams.map((t) => [t.id, t]))
    : {};

  const handleTeamClick = (team: Team) => {
    setSelectedTeam(team);
  };

  return (
    <div className="min-h-screen bg-[#030611] overflow-x-hidden">
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
              {activeTab === "fixtures" && (
                <FixturesTab
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
                <ScorersTab data={data} onPlayerClick={(name, teamId) => setSelectedPlayer({ name, teamId })} />
              )}
              {activeTab === "records" && (
                <RecordsTab records={data.expandedRecords || data.records} />
              )}
              {activeTab === "popularity" && (
                <PopularityTab data={data} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Global Footer */}
      <footer className="w-full text-center py-6 border-t border-white/5 opacity-90 mb-safe">
        <p className="text-gray-400 text-[10px] sm:text-xs tracking-widest uppercase font-black mb-1">For the fan, by the fan</p>
        <p className="text-gray-500 text-[10px]">
          By <a href="https://vivekjunghamal.com" target="_blank" rel="noopener noreferrer" className="text-yellow-500/80 hover:text-yellow-400 font-bold transition-colors">VJH</a>
        </p>
      </footer>

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

      {/* Player detail modal */}
      {selectedPlayer && data && (
        <PlayerModal
          playerName={selectedPlayer.name}
          teamId={selectedPlayer.teamId}
          games={data.games}
          teams={data.teams}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {/* PWA Install Button — only visible when browser exposes install prompt */}
      <AnimatePresence>
        {installPrompt && !isInstalled && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={handleInstallClick}
            className="fixed bottom-6 right-4 z-50 flex items-center gap-2 bg-[#1a2744] border border-yellow-400/40 hover:border-yellow-400/80 rounded-full px-4 py-2 text-[11px] font-bold text-gray-300 hover:text-white shadow-[0_0_20px_rgba(250,204,21,0.15)] hover:shadow-[0_0_28px_rgba(250,204,21,0.3)] transition-all active:scale-95"
            aria-label="Install app"
          >
            <span className="text-base">📱</span>
            Install as app
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
