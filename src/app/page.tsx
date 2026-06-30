"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Header from "@/components/Header";
import GroupsTab from "@/components/GroupsTab";
import versionInfo from "../version.json";
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
  const [showCredits, setShowCredits] = useState(false);
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

    // Adaptive live polling: 1s when any game is live, 10s otherwise
    let pollTimeout: ReturnType<typeof setTimeout> | null = null;

    const pollGames = async () => {
      if (!mounted) return;
      try {
        const res = await fetch("/api/wc/games", { cache: "no-store" });
        if (res.ok && mounted) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newGames: any[] = await res.json();
          if (mounted) setData(prev => prev ? { ...prev, games: newGames } : null);
          const hasLive = newGames.some(
            g => g.finished !== "TRUE" &&
                 g.time_elapsed !== "notstarted" &&
                 g.time_elapsed?.toLowerCase() !== "finished"
          );
          if (mounted) pollTimeout = setTimeout(pollGames, hasLive ? 1000 : 10000);
        } else {
          if (mounted) pollTimeout = setTimeout(pollGames, 10000);
        }
      } catch {
        if (mounted) pollTimeout = setTimeout(pollGames, 10000);
      }
    };

    // Start polling 2s after initial load
    pollTimeout = setTimeout(pollGames, 2000);

    return () => {
      mounted = false;
      if (pollTimeout) clearTimeout(pollTimeout);
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
  
  const handleUpdateClick = () => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready.then((registration) => {
        void registration.update().then(() => {
          window.location.reload();
        });
      });
    } else {
      window.location.reload();
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
        <p className="text-gray-600 text-[9px] font-mono mt-1.5 tracking-wider select-none">
          v{versionInfo.version}
        </p>

        <button
          onClick={() => setShowCredits(s => !s)}
          className="mt-3 text-[9px] uppercase tracking-widest font-black text-gray-500 hover:text-yellow-400 transition-colors underline decoration-dotted underline-offset-4"
        >
          Credits & Sources
        </button>

        <AnimatePresence>
          {showCredits && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="max-w-md mx-auto mt-4 px-4 text-left space-y-3 text-[10px] text-gray-400">
                <div>
                  <p className="font-black text-gray-300 uppercase tracking-wider text-[9px]">worldcup26.ir <span className="text-gray-600 normal-case font-normal">(unofficial)</span></p>
                  <p className="mt-0.5">Tournament fixtures, schedule, scores, team rosters, flags, group standings, scorers and stadium info.</p>
                </div>
                <div>
                  <p className="font-black text-gray-300 uppercase tracking-wider text-[9px]">api.fifa.com <span className="text-gray-600 normal-case font-normal">(unofficial — FIFA&apos;s public match-centre feed)</span></p>
                  <p className="mt-0.5">Real live commentary, match events, and match stats (attempts, corners, fouls, offsides, saves, cards) for fixtures that can be matched to a real World Cup match.</p>
                </div>
                <div>
                  <p className="font-black text-gray-300 uppercase tracking-wider text-[9px]">flagcdn.com <span className="text-gray-600 normal-case font-normal">(open source)</span></p>
                  <p className="mt-0.5">Country flag images used throughout the app.</p>
                </div>
                <p className="pt-2 border-t border-white/5 text-gray-600 text-[9px]">
                  This app is open source. Free to use — not for commercial use.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

      {/* PWA Install / Update Button */}
      <AnimatePresence>
        {((installPrompt && !isInstalled) || isInstalled) && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={isInstalled ? handleUpdateClick : handleInstallClick}
            className="fixed bottom-6 right-4 z-50 flex flex-col items-center justify-center gap-0.5 bg-[#131d35] border border-yellow-400/30 hover:border-yellow-400/60 rounded-xl px-2 py-1.5 text-[8px] sm:text-[9px] font-black text-gray-400 hover:text-white shadow-[0_0_15px_rgba(250,204,21,0.1)] hover:shadow-[0_0_24px_rgba(250,204,21,0.25)] transition-all active:scale-95 cursor-pointer uppercase tracking-wider min-w-[42px]"
            aria-label={isInstalled ? "Update app" : "Install app"}
          >
            {isInstalled ? (
              <svg className="w-3.5 h-3.5 text-yellow-400 select-none animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            ) : (
              <img src="/favicon.png" className="w-4 h-4 object-contain select-none" alt="" />
            )}
            <span className="mt-0.5 leading-none">{isInstalled ? "Update" : "Install"}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
