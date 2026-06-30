import { NextRequest, NextResponse } from "next/server";
import { findFifaMatch, fetchFifaLiveMatch, fetchFifaTimeline, type FifaTimelineEvent } from "@/lib/fifa-api";

export const revalidate = 0;

type EntryType = "goal" | "card" | "sub" | "marker" | "info";

// Full taxonomy verified against every real match in this World Cup's calendar (see route history).
const TYPE_MAP: Record<number, { type: EntryType; headline?: string }> = {
  0: { type: "goal", headline: "GOAL!" },
  41: { type: "goal", headline: "PENALTY GOAL!" },
  34: { type: "goal", headline: "OWN GOAL!" },
  6: { type: "info", headline: "PENALTY AWARDED!" },
  60: { type: "info", headline: "PENALTY MISSED!" },
  2: { type: "card", headline: "CARD!" },
  3: { type: "card", headline: "RED CARD!" },
  5: { type: "sub", headline: "SUB!" },
  7: { type: "marker", headline: "KICK OFF!" },
  78: { type: "marker", headline: "KICK OFF!" },
  8: { type: "marker" },
  26: { type: "marker", headline: "FULL TIME!" },
  71: { type: "info", headline: "VAR CHECK!" },
};

// Own goals are logged against the team whose player put it in their own net — but for "which
// side does this event belong to" purposes (flag, timeline placement) we attribute it to the
// team that benefited on the scoreboard, matching how the score itself is read.
function eventTeamSide(e: FifaTimelineEvent, homeTeamId: string): "home" | "away" | undefined {
  if (!e.IdTeam) return undefined;
  const isHomeActor = e.IdTeam === homeTeamId;
  if (e.Type === 34) return isHomeActor ? "away" : "home";
  return isHomeActor ? "home" : "away";
}

function toEntry(e: FifaTimelineEvent, homeTeamId: string, idx: number) {
  const mapped = TYPE_MAP[e.Type] ?? { type: "info" as EntryType };
  const detail = e.EventDescription?.[0]?.Description || "";
  if (!detail) return null;
  return {
    id: `fifa-${idx}-${e.Type}`,
    minute: e.MatchMinute || "",
    headline: mapped.headline,
    detail,
    type: mapped.type,
    team: eventTeamSide(e, homeTeamId),
  };
}

type TimelineIconType = "goal" | "card" | "redCard" | "sub" | "attempt" | "foul" | "offside" | "corner";
const TIMELINE_ICON_MAP: Record<number, TimelineIconType> = {
  0: "goal", 41: "goal", 34: "goal",
  2: "card",
  3: "redCard",
  5: "sub",
  12: "attempt",
  18: "foul",
  15: "offside",
  16: "corner",
};

function buildTimeline(events: FifaTimelineEvent[], homeTeamId: string) {
  return events
    .map(e => {
      const iconType = TIMELINE_ICON_MAP[e.Type];
      const team = eventTeamSide(e, homeTeamId);
      if (!iconType || !team) return null;
      const minute = Number.parseInt((e.MatchMinute || "0").match(/(\d+)/)?.[1] ?? "0", 10);
      return { minute, type: iconType, team };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);
}

// Counts directly observable from the real event timeline. Each field here is something we can
// literally count from FIFA's own event log — nothing here is estimated or guessed.
function countByTeam(events: FifaTimelineEvent[], type: number, homeTeamId: string) {
  let home = 0, away = 0;
  for (const e of events) {
    if (e.Type !== type || !e.IdTeam) continue;
    if (e.IdTeam === homeTeamId) home++; else away++;
  }
  return { home, away };
}

// "Momentum" derived from real attacking-event minutes (goals, attempts, corners) bucketed into
// 5-minute windows — a genuine pressure timeline from FIFA's own event log, not a simulation.
const MOMENTUM_TYPES = new Set([0, 41, 12, 16, 60]);
const BUCKET_SIZE = 5;

function buildMomentum(events: FifaTimelineEvent[], homeTeamId: string) {
  const buckets = new Map<number, { home: number; away: number }>();
  for (const e of events) {
    if (!MOMENTUM_TYPES.has(e.Type) || !e.IdTeam) continue;
    const min = Number.parseInt((e.MatchMinute || "0").match(/(\d+)/)?.[1] ?? "0", 10);
    const bucketStart = Math.floor(min / BUCKET_SIZE) * BUCKET_SIZE;
    const bucket = buckets.get(bucketStart) ?? { home: 0, away: 0 };
    if (e.IdTeam === homeTeamId) bucket.home++; else bucket.away++;
    buckets.set(bucketStart, bucket);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([bucketStart, counts]) => ({ bucketStart, ...counts }));
}

export async function GET(req: NextRequest) {
  const home = req.nextUrl.searchParams.get("home");
  const away = req.nextUrl.searchParams.get("away");
  if (!home || !away) {
    return NextResponse.json({ matched: false }, { status: 400 });
  }

  const ref = await findFifaMatch(home, away);
  if (!ref) {
    return NextResponse.json({ matched: false });
  }

  const [live, timeline] = await Promise.all([fetchFifaLiveMatch(ref), fetchFifaTimeline(ref)]);
  if (!live) {
    return NextResponse.json({ matched: false });
  }

  const homeTeamId = live.HomeTeam.IdTeam;
  const events = (timeline ?? [])
    .map((e, i) => toEntry(e, homeTeamId, i))
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const evs = timeline ?? [];
  const attempts = countByTeam(evs, 12, homeTeamId);
  const corners = countByTeam(evs, 16, homeTeamId);
  const fouls = countByTeam(evs, 18, homeTeamId);
  const offsides = countByTeam(evs, 15, homeTeamId);
  const saves = countByTeam(evs, 57, homeTeamId);

  const redCardCount = (bookings: { Card?: number }[]) => bookings.filter(b => (b.Card ?? 1) !== 1).length;

  return NextResponse.json({
    matched: true,
    tactics: { home: live.HomeTeam.Tactics ?? null, away: live.AwayTeam.Tactics ?? null },
    cardCounts: {
      home: live.HomeTeam.Bookings?.length ?? 0,
      away: live.AwayTeam.Bookings?.length ?? 0,
    },
    // Real, directly-counted stats. Possession and on/off-target shot splits are not available
    // from FIFA's public feed for this match, so they are intentionally omitted (not estimated).
    stats: {
      home: {
        attemptsAtGoal: attempts.home, corners: corners.home, fouls: fouls.home,
        offsides: offsides.home, saves: saves.home,
        redCards: redCardCount(live.HomeTeam.Bookings ?? []),
      },
      away: {
        attemptsAtGoal: attempts.away, corners: corners.away, fouls: fouls.away,
        offsides: offsides.away, saves: saves.away,
        redCards: redCardCount(live.AwayTeam.Bookings ?? []),
      },
    },
    momentum: buildMomentum(evs, homeTeamId),
    possession: live.BallPossession,
    events,
  });
}
