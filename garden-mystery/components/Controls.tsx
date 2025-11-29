import React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Hand, Search, Box } from 'lucide-react';
import { clsx } from 'clsx';

interface ControlsProps {
  onMove: (dx: number, dy: number) => void;
  onSniffStart: () => void;
  onSniffEnd: () => void;
  onItem: (type: 'yarn' | 'toy') => void;
  yarnCount: number;
  toyCount: number;
  isSniffing: boolean;
}

const Controls: React.FC<ControlsProps> = ({ 
  onMove, 
  onSniffStart, 
  onSniffEnd, 
  onItem, 
  yarnCount, 
  toyCount,
  isSniffing
}) => {
  const btnClass = "bg-paper border-2 border-ink rounded-lg active:bg-stone-300 shadow-md touch-manipulation flex items-center justify-center transition-transform active:scale-95";

  return (
    <div className="w-full max-w-2xl mt-4 px-4 flex justify-between items-end gap-4 select-none">
      {/* D-Pad */}
      <div className="grid grid-cols-3 gap-2 w-40 h-40">
        <div />
        <button 
          className={clsx(btnClass, "h-12")}
          onPointerDown={(e) => { e.preventDefault(); onMove(0, -1); }}
        >
          <ChevronUp size={28} className="text-ink" />
        </button>
        <div />
        
        <button 
          className={clsx(btnClass, "h-12")}
          onPointerDown={(e) => { e.preventDefault(); onMove(-1, 0); }}
        >
          <ChevronLeft size={28} className="text-ink" />
        </button>
        <button 
          className={clsx(btnClass, "h-12 bg-stone-200")} // Center dummy
          disabled
        >
          <div className="w-2 h-2 bg-stone-400 rounded-full" />
        </button>
        <button 
          className={clsx(btnClass, "h-12")}
          onPointerDown={(e) => { e.preventDefault(); onMove(1, 0); }}
        >
          <ChevronRight size={28} className="text-ink" />
        </button>
        
        <div />
        <button 
          className={clsx(btnClass, "h-12")}
          onPointerDown={(e) => { e.preventDefault(); onMove(0, 1); }}
        >
          <ChevronDown size={28} className="text-ink" />
        </button>
        <div />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pb-2">
         <div className="flex gap-3">
            <button 
                className={clsx(btnClass, "w-16 h-16 flex-col gap-1", isSniffing && "bg-pink-100 border-pink-400")}
                onPointerDown={(e) => { e.preventDefault(); onSniffStart(); }}
                onPointerUp={(e) => { e.preventDefault(); onSniffEnd(); }}
                onPointerLeave={(e) => { e.preventDefault(); onSniffEnd(); }}
            >
                <Search size={24} className={isSniffing ? "text-pink-600" : "text-ink"} />
                <span className="text-[10px] font-bold uppercase">Sniff</span>
            </button>
         </div>
         <div className="flex gap-3">
             <button 
                className={clsx(btnClass, "w-14 h-14 flex-col gap-0.5", yarnCount === 0 && "opacity-50")}
                onClick={() => onItem('yarn')}
                disabled={yarnCount === 0}
             >
                <div className="w-4 h-4 bg-rose-400 rounded-full border border-rose-600 shadow-sm" />
                <span className="text-[10px] font-bold text-rose-800">Yarn ({yarnCount})</span>
             </button>
             <button 
                className={clsx(btnClass, "w-14 h-14 flex-col gap-0.5", toyCount === 0 && "opacity-50")}
                onClick={() => onItem('toy')}
                disabled={toyCount === 0}
             >
                <div className="w-4 h-4 bg-yellow-400 rounded-md border border-yellow-600 shadow-sm" />
                <span className="text-[10px] font-bold text-yellow-800">Toy ({toyCount})</span>
             </button>
         </div>
      </div>
    </div>
  );
};

export default Controls;