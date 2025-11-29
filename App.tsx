import React, { useState } from 'react';
import { GameRunner } from './components/GameRunner';
import { SkinCreator } from './components/SkinCreator';
import { GameState, PugSkin } from './types';

// Placeholder/Default Skin
const DEFAULT_SKIN: PugSkin = {
  id: 'default',
  name: 'Party Pug',
  imageUrl: null // triggers default drawing code
};

const UNLOCK_SCORE = 500;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [skins, setSkins] = useState<PugSkin[]>([DEFAULT_SKIN]);
  const [activeSkinId, setActiveSkinId] = useState<string>('default');
  const [lastScore, setLastScore] = useState<number>(0);
  
  // Initialize high score from local storage
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pugly_high_score');
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      console.warn('Failed to access local storage', e);
      return 0;
    }
  });

  const activeSkin = skins.find(s => s.id === activeSkinId) || DEFAULT_SKIN;
  const isCreatorUnlocked = highScore >= UNLOCK_SCORE;

  const handleStartGame = () => {
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = (score: number) => {
    setLastScore(score);
    if (score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem('pugly_high_score', score.toString());
      } catch (e) {
        console.warn('Failed to save to local storage', e);
      }
    }
    setGameState(GameState.GAME_OVER);
  };

  const handleSkinCreated = (newSkin: PugSkin) => {
    setSkins(prev => [...prev, newSkin]);
    setActiveSkinId(newSkin.id);
    setGameState(GameState.MENU);
  };

  return (
    <div className="min-h-screen bg-[#1b2e1b] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        
        {/* Header/Title */}
        {gameState !== GameState.PLAYING && (
          <div className="text-center mb-10 animate-bounce">
            <h1 className="text-4xl md:text-6xl text-[#FFEB3B] pixel-text mb-4 drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
              PUGLY'S TEA PARTY
            </h1>
            <p className="text-[#A5D6A7] text-sm md:text-lg">
              Collect <b>Biscuits</b>, jump on <b>Floating Trays</b>, and avoid the bees!
            </p>
          </div>
        )}

        {/* --- MAIN MENU --- */}
        {gameState === GameState.MENU && (
          <div className="flex flex-col items-center gap-8">
            
            <div className="bg-[#2E7D32] p-6 rounded-lg border-4 border-[#1B5E20] shadow-xl w-full max-w-md">
              <h2 className="text-[#E8F5E9] text-xl mb-4 text-center pixel-text">SELECT GUEST</h2>
              <div className="grid grid-cols-3 gap-4 max-h-60 overflow-y-auto p-2">
                {skins.map(skin => (
                  <button
                    key={skin.id}
                    onClick={() => setActiveSkinId(skin.id)}
                    className={`aspect-square rounded border-2 flex flex-col items-center justify-center p-1 transition-all ${
                      activeSkinId === skin.id 
                        ? 'border-[#FFEB3B] bg-[#1B5E20] scale-105 shadow-[0_0_10px_rgba(255,235,59,0.5)]' 
                        : 'border-[#558B2F] bg-[#1B5E20]/50 hover:border-[#81C784]'
                    }`}
                  >
                    {skin.imageUrl ? (
                      <img src={skin.imageUrl} alt={skin.name} className="w-full h-full object-contain pixelated" style={{ imageRendering: 'pixelated' }} />
                    ) : (
                      <div className="w-full h-full bg-[#E5C098] flex items-center justify-center text-xs text-black font-bold relative overflow-hidden">
                        <span className="z-10">PUG</span>
                        {/* Little hint of the tutu */}
                        <div className="absolute bottom-0 w-full h-1/4 bg-[#F48FB1]"></div>
                      </div>
                    )}
                  </button>
                ))}
                
                {/* New Skin Button - Locked until score 500 */}
                <button
                  onClick={() => isCreatorUnlocked && setGameState(GameState.SKIN_CREATOR)}
                  disabled={!isCreatorUnlocked}
                  className={`aspect-square rounded border-2 border-dashed flex flex-col items-center justify-center transition-colors group relative overflow-hidden ${
                    isCreatorUnlocked 
                    ? 'border-[#81C784] bg-[#1B5E20]/30 hover:bg-[#1B5E20] hover:border-[#FFEB3B] text-[#81C784] hover:text-[#FFEB3B] cursor-pointer'
                    : 'border-gray-600 bg-black/20 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isCreatorUnlocked ? (
                    <>
                      <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">+</span>
                      <span className="text-[10px]">NEW SKIN</span>
                    </>
                  ) : (
                    <>
                       <div className="text-2xl mb-1">🔒</div>
                       <span className="text-[8px] text-center px-1">UNLOCK AT {UNLOCK_SCORE} PTS</span>
                    </>
                  )}
                </button>
              </div>
              <div className="mt-4 text-center text-[#FFEB3B] text-xs font-bold">
                Guest: {activeSkin.name}
              </div>
            </div>

            <button
              onClick={handleStartGame}
              className="bg-[#F06292] hover:bg-[#EC407A] text-white text-2xl py-4 px-12 rounded border-b-8 border-[#880E4F] active:border-b-0 active:mt-2 font-bold shadow-2xl pixel-text transition-all"
            >
              START TEA
            </button>

            {highScore > 0 && (
              <div className="text-[#FFEB3B] text-lg pixel-text mt-4">
                BEST PARTY POINTS: {highScore}
              </div>
            )}
          </div>
        )}

        {/* --- GAME RUNNER --- */}
        {gameState === GameState.PLAYING && (
          <GameRunner 
            activeSkin={activeSkin} 
            onGameOver={handleGameOver}
            onBack={() => setGameState(GameState.MENU)}
          />
        )}

        {/* --- GAME OVER --- */}
        {gameState === GameState.GAME_OVER && (
          <div className="text-center bg-[#2E7D32] p-10 rounded-lg border-4 border-[#1B5E20] shadow-2xl animate-fade-in-up mx-auto max-w-lg">
            <h2 className="text-4xl text-[#FFCDD2] mb-6 pixel-text">TEA SPILLED!</h2>
            <div className="text-white text-2xl mb-8">
              PARTY POINTS: <span className="text-[#FFEB3B]">{lastScore}</span>
            </div>

            {!isCreatorUnlocked && lastScore < UNLOCK_SCORE && (
               <div className="text-sm text-[#81C784] mb-6 bg-black/20 p-2 rounded">
                 Score {UNLOCK_SCORE - lastScore} more to unlock Custom Skins!
               </div>
            )}
            
            <div className="flex gap-4 justify-center">
               <button
                onClick={() => setGameState(GameState.MENU)}
                className="bg-[#558B2F] hover:bg-[#33691E] text-white py-3 px-6 rounded border-b-4 border-[#1B5E20] active:border-b-0 active:mt-1 font-bold pixel-text"
              >
                MENU
              </button>
              <button
                onClick={() => setGameState(GameState.PLAYING)}
                className="bg-[#F06292] hover:bg-[#EC407A] text-white py-3 px-6 rounded border-b-4 border-[#880E4F] active:border-b-0 active:mt-1 font-bold pixel-text"
              >
                TRY AGAIN
              </button>
            </div>
          </div>
        )}

        {/* --- SKIN CREATOR --- */}
        {gameState === GameState.SKIN_CREATOR && (
          <SkinCreator 
            onSkinCreated={handleSkinCreated}
            onCancel={() => setGameState(GameState.MENU)}
          />
        )}

      </div>
    </div>
  );
};

export default App;
