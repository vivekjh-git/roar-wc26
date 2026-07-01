import React from "react";

interface IconProps {
  className?: string;
  size?: number;
}

export function GoalIcon({ className = "w-4 h-4", size = 16 }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} text-white drop-shadow-[0_2px_4px_rgba(255,255,255,0.1)]`}
      style={{ width: size, height: size }}
    >
      <circle cx="12" cy="12" r="10" fill="#ffffff" stroke="#111827" strokeWidth="1.5" />
      {/* Pentagon center */}
      <path d="M12 8.5L15 10.5L14 14L10 14L9 10.5Z" fill="#111827" />
      {/* Lines out to edges */}
      <line x1="12" y1="8.5" x2="12" y2="2" stroke="#111827" strokeWidth="1.5" />
      <line x1="15" y1="10.5" x2="20.5" y2="8.5" stroke="#111827" strokeWidth="1.5" />
      <line x1="14" y1="14" x2="18" y2="20" stroke="#111827" strokeWidth="1.5" />
      <line x1="10" y1="14" x2="6" y2="20" stroke="#111827" strokeWidth="1.5" />
      <line x1="9" y1="10.5" x2="3.5" y2="8.5" stroke="#111827" strokeWidth="1.5" />
    </svg>
  );
}

export function YellowCardIcon({ className = "w-3 h-4" }: IconProps) {
  return (
    <div
      className={`${className} bg-gradient-to-br from-amber-300 to-yellow-500 rounded-[2px] border border-yellow-600/40 shadow-[0_1px_3px_rgba(234,179,8,0.3)]`}
      style={{ width: "10px", height: "14px", display: "inline-block" }}
    />
  );
}

export function RedCardIcon({ className = "w-3 h-4" }: IconProps) {
  return (
    <div
      className={`${className} bg-gradient-to-br from-red-400 to-red-600 rounded-[2px] border border-red-700/40 shadow-[0_1px_3px_rgba(239,68,68,0.3)]`}
      style={{ width: "10px", height: "14px", display: "inline-block" }}
    />
  );
}

export function SubIcon({ className = "w-4 h-4", size = 16 }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ width: size, height: size }}
    >
      {/* Green arrow coming on */}
      <path d="M16 3h5v5" stroke="#22c55e" />
      <path d="M21 3c-4.5 0-8 3.5-8 8" stroke="#22c55e" />
      
      {/* Red arrow going off */}
      <path d="M8 21H3v-5" stroke="#ef4444" />
      <path d="M3 21c4.5 0 8-3.5 8-8" stroke="#ef4444" />
    </svg>
  );
}

export function AttemptIcon({ className = "w-4 h-4", size = 16 }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} text-cyan-400`}
      style={{ width: size, height: size }}
    >
      {/* Target/Aim */}
      <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" strokeWidth="1.5" />
    </svg>
  );
}

export function FoulIcon({ className = "w-4 h-4", size = 16 }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} text-orange-400`}
      style={{ width: size, height: size }}
    >
      {/* Whistle */}
      <path d="M9 12h7a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H9a5 5 0 0 0-5 5v1a2 2 0 0 0 2 2h3Z" fill="currentColor" fillOpacity="0.1" />
      <path d="M4 11v4a2 2 0 0 0 2 2h3v-5" />
      <path d="M16 4h3a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-3" />
      <circle cx="10" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

export function CornerIcon({ className = "w-4 h-4", size = 16 }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} text-yellow-500`}
      style={{ width: size, height: size }}
    >
      {/* Corner Flag */}
      <path d="M5 21V3" />
      <path d="M5 3l14 4.5L5 12" fill="currentColor" fillOpacity="0.2" />
      {/* Pitch arc */}
      <path d="M12 21a7 7 0 0 0-7-7" strokeDasharray="2,2" />
    </svg>
  );
}

export function OffsideIcon({ className = "w-4 h-4", size = 16 }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} text-amber-500`}
      style={{ width: size, height: size }}
    >
      {/* Diagonal referee flag pattern */}
      <rect x="3" y="5" width="18" height="11" rx="1" fill="#ef4444" />
      <path d="M3 5l11 11h7v-11z" fill="#eab308" />
      <path d="M3 16V5" stroke="currentColor" strokeWidth="2" />
      <path d="M3 16v5" />
    </svg>
  );
}

export function InfoIcon({ className = "w-4 h-4", size = 16 }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} text-blue-400`}
      style={{ width: size, height: size }}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export function WhistleIcon({ className = "w-4 h-4", size = 16 }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} text-gray-300`}
      style={{ width: size, height: size }}
    >
      <path d="M9 12h7a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H9a5 5 0 0 0-5 5v1a2 2 0 0 0 2 2h3Z" fill="currentColor" fillOpacity="0.1" />
      <path d="M4 11v4a2 2 0 0 0 2 2h3v-5" />
      <path d="M16 4h3a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-3" />
      <circle cx="10" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

export function MegaphoneIcon({ className = "w-4 h-4", size = 16 }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} text-gray-300`}
      style={{ width: size, height: size }}
    >
      <path d="M18 8a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H3V8h15z" fill="currentColor" fillOpacity="0.1" />
      <path d="M3 11a4 4 0 0 1 4-4h8l5 4v2l-5 4H7a4 4 0 0 1-4-4z" />
      <path d="M11 16l-3 5H5l2.5-5" />
      <path d="M18 10a2 2 0 0 1 0 4" />
    </svg>
  );
}
