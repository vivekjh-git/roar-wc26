"use client";

import React, { useState, useEffect } from "react";
import { getPlayerImageSources } from "@/lib/player-images";

interface CachedPlayerImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  playerName: string;
  flag?: string;
  teamName?: string;
}

export default function CachedPlayerImage({ playerName, flag, teamName, className, ...props }: CachedPlayerImageProps) {
  const sources = getPlayerImageSources(playerName);
  const [currentSrc, setCurrentSrc] = useState<string>("");
  const [sourceIndex, setSourceIndex] = useState<number>(0);

  useEffect(() => {
    // 1. Check if we have a cached successful URL in localStorage
    const cached = localStorage.getItem(`player_headshot_${playerName}`);
    if (cached) {
      setCurrentSrc(cached);
    } else {
      // Start with the first source
      setCurrentSrc(sources[0]);
      setSourceIndex(0);
    }
  }, [playerName]);

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
