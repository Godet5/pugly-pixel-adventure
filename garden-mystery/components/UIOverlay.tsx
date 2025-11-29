import React from 'react';
import { GameState, LevelConfig } from '../types';
import { Bone, RotateCcw, Home, Cat } from 'lucide-react';

interface UIOverlayProps {
  gameState: GameState;
  currentLevel: LevelConfig;
  treatsLeft: number;
  onRestart: () => void;
  onHome: () => void;
  isSniffing: boolean;
  moveCount: number;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  gameState, 
  currentLevel, 
  treatsLeft, 
  onRestart,
  onHome,
  isSniffing,
  moveCount
}) => {
  const movesUntilActive = Math.max(0, 5 - moveCount);

  return (
    <div className="w-full max-w-2xl bg-paper border-2 border-ink p-4 rounded-lg shadow-xl font-serif text-ink mb-4 flex flex-col gap-2">
      <div className="flex justify-between items-center border-b border-stone-300 pb-2">
        <div>
          <h2 className="text-xl font-bold">{currentLevel.name}</h2>
          <p className="text-sm italic opacity-80">{currentLevel.description}</p>
        </div>
        <div className="flex gap-2">
             <button onClick={onRestart} className="p-2 hover:bg-stone-200 rounded-full" title="Restart Level">
                <RotateCcw size={20} />
             </button>
             <button onClick={onHome} className="p-2 hover:bg-stone-200 rounded-full" title="Quit to Menu">
                <Home size={20} />
             </button>
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2" title="Treats Remaining">
            <Bone className="text-earth fill-earth" size={24} />
            <span className="text-2xl font-bold">{treatsLeft}</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
             <div className="flex items-center gap-1 opacity-70">
                <div className="w-4 h-4 bg-rose-400 rounded-full border border-rose-600"></div>
                <span>x {gameState.items.yarn} (Press 1)</span>
             </div>
             <div className="flex items-center gap-1 opacity-70">
                <div className="w-4 h-4 bg-yellow-400 rounded-md border border-yellow-600"></div>
                <span>x {gameState.items.toys} (Press 2)</span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
            {movesUntilActive > 0 ? (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold bg-blue-100 border border-blue-300 text-blue-800">
                    <Cat size={16} />
                    <span>Cats Asleep: {movesUntilActive}</span>
                </div>
            ) : (
                <div className={`px-3 py-1 rounded-full text-sm font-bold border ${isSniffing ? 'bg-pink-200 border-pink-400 text-pink-900 animate-pulse' : 'bg-stone-200 border-stone-300 text-stone-500'}`}>
                    {isSniffing ? 'SNIFFING...' : 'HOLD SPACE TO SNIFF'}
                </div>
            )}
        </div>
      </div>

      {gameState.messages.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-2 text-center text-amber-900 text-sm rounded animate-fade-in-up">
           {gameState.messages[gameState.messages.length - 1]}
        </div>
      )}
    </div>
  );
};

export default UIOverlay;