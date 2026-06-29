"use client";

import React, { useState } from "react";
import { getPlayerImageSources } from "@/lib/player-images";

interface CachedPlayerImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  playerName: string;
  flag?: string;
  teamName?: string;
}

export default function CachedPlayerImage({ playerName, flag, teamName, className, ...props }: CachedPlayerImageProps) {
  const sources = getPlayerImageSources(playerName);
  const [currentSrc, setCurrentSrc] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`player_headshot_${playerName}`) || sources[0];
    }
    return sources[0];
  });
  const [sourceIndex, setSourceIndex] = useState<number>(0);
  const [prevPlayerName, setPrevPlayerName] = useState(playerName);

  if (playerName !== prevPlayerName) {
    setPrevPlayerName(playerName);
    let initialSrc = sources[0];
    if (typeof window !== "undefined") {
      initialSrc = localStorage.getItem(`player_headshot_${playerName}`) || sources[0];
    }
    setCurrentSrc(initialSrc);
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

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <img
        src={currentSrc}
        alt={playerName}
        onError={handleError}
        onLoad={handleLoad}
        className={className}
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
