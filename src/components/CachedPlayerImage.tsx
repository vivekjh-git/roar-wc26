"use client";

import React, { useState } from "react";
import { getPlayerImageSources } from "@/lib/player-images";

interface CachedPlayerImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  playerName: string;
  flag?: string;
  teamName?: string;
  /** A known real image URL (e.g. FIFA's own player photo) tried before name-based guesses. */
  primarySrc?: string;
}

export default function CachedPlayerImage({ playerName, flag, teamName, primarySrc, className, ...props }: Readonly<CachedPlayerImageProps>) {
  const sources = primarySrc
    ? [primarySrc, ...getPlayerImageSources(playerName)]
    : getPlayerImageSources(playerName);

  // A known real photo (FIFA's own) is authoritative — use it over any cached name-based guess.
  const getInitialSrc = () => {
    if (primarySrc) return primarySrc;
    if (globalThis.window !== undefined) {
      return localStorage.getItem(`player_headshot_${playerName}`) || sources[0];
    }
    return sources[0];
  };

  const [currentSrc, setCurrentSrc] = useState<string>(getInitialSrc);
  const [sourceIndex, setSourceIndex] = useState<number>(0);
  const [prevPlayerName, setPrevPlayerName] = useState(playerName);

  if (playerName !== prevPlayerName) {
    setPrevPlayerName(playerName);
    setCurrentSrc(getInitialSrc());
    setSourceIndex(0);
  }

  const handleError = () => {
    // If the current image fails to load, try the next source
    const nextIndex = sourceIndex + 1;
    if (nextIndex < sources.length) {
      setSourceIndex(nextIndex);
      setCurrentSrc(sources[nextIndex]);
    }
  };

  const handleLoad = () => {
    // If we loaded a valid URL successfully (and it's not the SVG fallback), cache it in localStorage
    if (currentSrc && !currentSrc.includes("dicebear.com")) {
      localStorage.setItem(`player_headshot_${playerName}`, currentSrc);
    }
  };

  const isKnownHeadshot = currentSrc?.includes('futbin.com') || 
                          currentSrc?.includes('espncdn.com') || 
                          currentSrc?.includes('fifaindex.com') || 
                          currentSrc?.includes('dicebear.com');
  const needsZoom = currentSrc && !isKnownHeadshot;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={currentSrc}
        alt={playerName}
        onError={handleError}
        onLoad={handleLoad}
        className={`${className || ""} ${needsZoom ? "scale-[2.6] -translate-y-1 origin-[50%_15%]" : "object-cover"}`}
        {...props}
      />
      {flag && (
        <img
          src={flag}
          alt={teamName}
          className="absolute -bottom-0.5 -right-0.5 w-4 h-3 object-cover rounded-sm border border-black/40 shadow-sm"
        />
      )}
    </div>
  );
}
