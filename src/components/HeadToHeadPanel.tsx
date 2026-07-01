"use client";

import { useEffect, useState } from "react";

interface HeadToHeadMeeting {
  year: number;
  round: string;
  homeGoals: number;
  awayGoals: number;
  penaltyWinner: "home" | "away" | null;
}

interface HeadToHeadData {
  matched: boolean;
  totalMeetings: number;
  homeWins: number;
  awayWins: number;
  draws: number;
  meetings: HeadToHeadMeeting[];
}

function h2hSummary(homeName: string, awayName: string, h: HeadToHeadData): string {
  const { totalMeetings, homeWins, awayWins, draws } = h;
  if (totalMeetings === 0) return `First-ever World Cup meeting between ${homeName} and ${awayName}.`;
  const record = `${homeWins}-${draws}-${awayWins}`;
  const times = `${totalMeetings} World Cup meeting${totalMeetings > 1 ? "s" : ""}`;
  if (homeWins > awayWins) return `${homeName} lead ${record} across ${times}.`;
  if (awayWins > homeWins) return `${awayName} lead ${record} across ${times}.`;
  return `Level at ${record} across ${times}.`;
}

interface HeadToHeadPanelProps {
  homeName: string;
  awayName: string;
  homeFifa?: string;
  awayFifa?: string;
}

// Real FIFA World Cup history (1930-2022) for a team pair — shown as a small stat + summary
// block. Used by both the full match details modal and the lightweight carousel popover.
export default function HeadToHeadPanel({ homeName, awayName, homeFifa, awayFifa }: Readonly<HeadToHeadPanelProps>) {
  // Keyed by team pair so a still-loading result never gets attributed to the wrong matchup —
  // every setState call lives inside the fetch callback, not synchronously in the effect body.
  const h2hKey = `${homeName}|${awayName}`;
  const [h2hResult, setH2hResult] = useState<{ key: string; data: HeadToHeadData | null; failed: boolean } | null>(null);

  useEffect(() => {
    if (homeName === "TBD" || awayName === "TBD") return;
    let cancelled = false;
    fetch(`/api/wc/h2h?home=${encodeURIComponent(homeName)}&away=${encodeURIComponent(awayName)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.matched) setH2hResult({ key: h2hKey, data, failed: false });
        else setH2hResult({ key: h2hKey, data: null, failed: true });
      })
      .catch(() => {
        if (!cancelled) setH2hResult({ key: h2hKey, data: null, failed: true });
      });
    return () => { cancelled = true; };
  }, [h2hKey, homeName, awayName]);

  const h2hLoading = h2hResult?.key !== h2hKey;
  const h2h = h2hLoading ? null : h2hResult?.data ?? null;
  const h2hFailed = h2hLoading ? false : (h2hResult?.failed ?? false);

  return (
    <div className="bg-black/30 rounded-xl p-3 border border-white/5 text-center shadow-inner">
      <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1.5">Previous World Cup Encounters</div>

      {h2hLoading && (
        <p className="text-[10px] text-gray-500 leading-relaxed py-1">Loading history…</p>
      )}

      {!h2hLoading && h2hFailed && (
        <p className="text-[10px] text-gray-500 leading-relaxed py-1">History not available</p>
      )}

      {!h2hLoading && !h2hFailed && h2h && (
        <>
          <div className="flex justify-between items-center mb-2 px-6">
            <div className="text-base font-black text-white">{h2h.homeWins}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">
              {h2h.draws} Draw{h2h.draws === 1 ? "" : "s"}
            </div>
            <div className="text-base font-black text-white">{h2h.awayWins}</div>
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            {h2hSummary(homeName, awayName, h2h)}
          </p>
          {h2h.meetings.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
              {h2h.meetings.slice(-3).reverse().map((m) => (
                <div key={`${m.year}-${m.round}`} className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-500">{m.year} · {m.round}</span>
                  <span className="text-gray-300 font-bold">
                    {m.homeGoals}-{m.awayGoals}
                    {m.penaltyWinner && (
                      <span className="text-gray-500 font-normal"> (pens: {m.penaltyWinner === "home" ? homeFifa : awayFifa})</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
