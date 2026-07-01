// Server-side client for FIFA's public match-centre API (api.fifa.com).
// This is an undocumented endpoint that fifa.com's own frontend uses — there is no
// official published API or auth required, but it can change or go away without notice.
// All calls here are best-effort: callers must treat failures as "no real data available"
// and fall back to the simulated experience.

const FIFA_COMPETITION_ID = "17";
const FIFA_SEASON_ID = "285023";
const FIFA_BASE = "https://api.fifa.com/api/v3";

interface FifaLocalizedText {
  Locale: string;
  Description: string;
}

interface FifaCalendarTeam {
  IdTeam: string;
  IdCountry: string;
  Abbreviation: string;
  Tactics?: string;
  TeamName: FifaLocalizedText[];
}

interface FifaCalendarMatch {
  IdStage: string;
  IdMatch: string;
  Home: FifaCalendarTeam;
  Away: FifaCalendarTeam;
  Date: string;
}

interface FifaCalendarResponse {
  Results: FifaCalendarMatch[];
}

export interface FifaMatchRef {
  idStage: string;
  idMatch: string;
}

async function fifaFetch<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(`${FIFA_BASE}/${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

let calendarPromise: Promise<FifaCalendarMatch[] | null> | null = null;

function fetchFifaCalendar(): Promise<FifaCalendarMatch[] | null> {
  if (!calendarPromise) {
    calendarPromise = fifaFetch<FifaCalendarResponse>(
      `calendar/matches?idseason=${FIFA_SEASON_ID}&idcompetition=${FIFA_COMPETITION_ID}&count=500&language=en`,
      60
    ).then(data => {
      const results = data?.Results ?? null;
      // Don't cache a failed lookup in-process — let the next call retry.
      if (!results) calendarPromise = null;
      return results;
    });
  }
  return calendarPromise;
}

// Matches our simulated fixture to a real FIFA match by federation code (e.g. "NED"/"MAR"),
// which is reliable since both our data and FIFA's use standard 3-letter FIFA team codes.
export async function findFifaMatch(homeFifaCode: string, awayFifaCode: string): Promise<FifaMatchRef | null> {
  const calendar = await fetchFifaCalendar();
  if (!calendar) return null;
  const match = calendar.find(
    m => m.Home?.IdCountry === homeFifaCode && m.Away?.IdCountry === awayFifaCode
  );
  if (!match) return null;
  return { idStage: match.IdStage, idMatch: match.IdMatch };
}

export interface FifaPlayer {
  IdPlayer: string;
  IdTeam: string;
  ShirtNumber: number;
  Captain: boolean;
  PlayerName: FifaLocalizedText[];
  Position: number;
  LineupX: number | null;
  LineupY: number | null;
  PlayerPicture?: { PictureUrl: string };
}

export interface FifaTeamLive {
  IdTeam: string;
  IdCountry: string;
  Tactics?: string;
  Players: FifaPlayer[];
  Bookings: Array<{ IdPlayer: string; Minute: string; Card?: number }>;
  Goals: Array<{ IdPlayer: string; Minute: string; Type: number }>;
  Substitutions: Array<{
    IdPlayerOff: string; IdPlayerOn: string;
    PlayerOffName: FifaLocalizedText[]; PlayerOnName: FifaLocalizedText[];
    Minute: string;
  }>;
}

export interface FifaLiveMatch {
  MatchTime: string;
  Period: number;
  HomeTeamPenaltyScore?: number;
  AwayTeamPenaltyScore?: number;
  HomeTeam: FifaTeamLive;
  AwayTeam: FifaTeamLive;
  BallPossession: { Home: number; Away: number } | null;
  Attendance?: number;
}

export function fetchFifaLiveMatch(ref: FifaMatchRef): Promise<FifaLiveMatch | null> {
  return fifaFetch<FifaLiveMatch>(
    `live/football/${FIFA_COMPETITION_ID}/${FIFA_SEASON_ID}/${ref.idStage}/${ref.idMatch}?language=en`,
    15
  );
}

export interface FifaTimelineEvent {
  IdTeam?: string;
  IdPlayer?: string;
  MatchMinute: string;
  Type: number;
  EventDescription: FifaLocalizedText[];
}

export async function fetchFifaTimeline(ref: FifaMatchRef): Promise<FifaTimelineEvent[] | null> {
  const data = await fifaFetch<{ Event: FifaTimelineEvent[] }>(
    `timelines/${FIFA_COMPETITION_ID}/${FIFA_SEASON_ID}/${ref.idStage}/${ref.idMatch}?language=en`,
    15
  );
  return data?.Event ?? null;
}
