"use client";

import { motion, AnimatePresence } from "framer-motion";
import HeadToHeadPanel from "./HeadToHeadPanel";

interface HeadToHeadModalProps {
  homeName: string;
  awayName: string;
  homeFifa?: string;
  awayFifa?: string;
  onClose: () => void;
}

// Lightweight popover showing just the past World Cup history between two teams —
// used from the carousel card, where the match itself is already fully visible.
export default function HeadToHeadModal({ homeName, awayName, homeFifa, awayFifa, onClose }: Readonly<HeadToHeadModalProps>) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xs bg-[#0c101d]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative glass-card"
        >
          <div className="bg-black/40 px-4 py-3 flex justify-between items-center border-b border-white/5">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Head to Head</span>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
              ✕
            </button>
          </div>

          <div className="p-4 space-y-3">
            <div className="text-center text-[11px] text-gray-400 font-bold">
              {homeName} <span className="text-gray-600">vs</span> {awayName}
            </div>
            <HeadToHeadPanel homeName={homeName} awayName={awayName} homeFifa={homeFifa} awayFifa={awayFifa} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
