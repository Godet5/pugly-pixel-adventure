import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LEVELS, PLAYER_MOVE_DELAY } from './constants';
import { 
  LevelConfig, 
  GameState, 
  Position, 
  Entity, 
  CatEntity, 
  EntityType, 
  CatState, 
  TileType,
  VisualEffect
} from './types';
import { 
  parseLevel, 
  isSolid, 
  getTileAt, 
  hasLineOfSight, 
  getNextStepTowards, 
  distance 
} from './utils/gameLogic';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import Controls from './components/Controls';
import { Play, Crown, Cat, Frown } from 'lucide-react';

const INITIAL_GAME_STATE: GameState = {
  levelIndex: 0,
  isPlaying: false,
  isGameOver: false,
  gameWon: false,
  score: 0,
  items: { yarn: 1, toys: 1 },
  messages: ["Welcome to the garden!"]
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: 0 });
  const [playerDirection, setPlayerDirection] = useState<Position>({ x: 1, y: 0 });
  const [cats, setCats] = useState<CatEntity[]>([]);
  const [treats, setTreats] = useState<Entity[]>([]);
  const [items, setItems] = useState<Entity[]>([]);
  const [isSniffing, setIsSniffing] = useState(false);
  const [levelConfig, setLevelConfig] = useState<LevelConfig>(LEVELS[0]);
  const [moveCount, setMoveCount] = useState(0);
  
  // Visual Effects State
  const [effects, setEffects] = useState<VisualEffect[]>([]);
  const [isShaking, setIsShaking] = useState(false);

  // Refs for loop management
  const lastMoveTime = useRef<number>(0);

  // Effect Cleanup
  useEffect(() => {
    const interval = setInterval(() => {
        const now = Date.now();
        setEffects(prev => prev.filter(e => now - e.createdAt < 800)); // Keep effects for 800ms
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const triggerShake = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  }, []);

  const addEffect = useCallback((type: 'DUST' | 'SPARKLE', pos: Position) => {
    setEffects(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        type,
        pos,
        createdAt: Date.now()
    }]);
  }, []);

  const startLevel = useCallback((index: number) => {
    const config = LEVELS[index];
    const { playerStart, treats: levelTreats, cats: levelCats, yarns, toys } = parseLevel(config);
    
    setLevelConfig(config);
    setPlayerPos(playerStart);
    setCats(levelCats);
    setTreats(levelTreats.map((pos, i) => ({ id: `t-${i}`, type: EntityType.TREAT, pos, collected: false })));
    
    const worldItems: Entity[] = [
        ...yarns.map((pos, i) => ({ id: `y-${i}`, type: EntityType.YARN, pos, collected: false })),
        ...toys.map((pos, i) => ({ id: `s-${i}`, type: EntityType.TOY, pos, collected: false }))
    ];
    setItems(worldItems);
    setMoveCount(0);
    setEffects([]);

    setGameState(prev => ({
      ...prev,
      levelIndex: index,
      isPlaying: true,
      isGameOver: false,
      gameWon: false,
      messages: ["Avoid the cat! Collect all treats!"]
    }));
  }, []);

  const handleWin = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      gameWon: true,
      isGameOver: true,
      messages: [...prev.messages, "Level Complete! Delicious victory!"]
    }));
  }, []);

  const handleLoss = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      gameWon: false,
      isGameOver: true,
      messages: [...prev.messages, "Caught by the Grumpy Cat! Oh no!"]
    }));
  }, []);

  const useItem = useCallback((type: 'yarn' | 'toy') => {
    if (!gameState.isPlaying) return;
    
    if (type === 'yarn' && gameState.items.yarn > 0) {
        // Throw yarn in facing direction 3 tiles
        const targetPos = {
            x: playerPos.x + playerDirection.x * 3,
            y: playerPos.y + playerDirection.y * 3
        };
        // Clamp to map
        targetPos.x = Math.max(0, Math.min(levelConfig.map[0].length-1, targetPos.x));
        targetPos.y = Math.max(0, Math.min(levelConfig.map.length-1, targetPos.y));

        setGameState(prev => ({ 
            ...prev, 
            items: { ...prev.items, yarn: prev.items.yarn - 1 },
            messages: [...prev.messages, "Threw a yarn ball!"] 
        }));

        // Alert cats to that position
        setCats(prev => prev.map(cat => ({
            ...cat,
            state: CatState.ALERT,
            lastKnownPlayerPos: targetPos,
            alertTimer: 5
        })));
        addEffect('SPARKLE', targetPos);

    } else if (type === 'toy' && gameState.items.toys > 0) {
        setGameState(prev => ({ 
            ...prev, 
            items: { ...prev.items, toys: prev.items.toys - 1 },
            messages: [...prev.messages, "SQUEAK! The cats are confused."] 
        }));
        // Stun cats
        setCats(prev => prev.map(cat => ({
            ...cat,
            state: CatState.SLEEP,
            alertTimer: 8 // Sleep for 8 ticks
        })));
        triggerShake();
    }
  }, [gameState.isPlaying, gameState.items, playerPos, playerDirection, levelConfig, addEffect, triggerShake]);

  // Turn Logic
  const processTurn = useCallback((newPlayerPos: Position) => {
    const nextMoveCount = moveCount + 1;
    
    // 1. Calculate Cat Logic
    const catsActive = nextMoveCount >= 5;
    
    // We need to access the CURRENT state of cats inside this functional update
    // But since this is called from an event handler, we can rely on `cats` dependency being somewhat fresh 
    // or pass it in. For simplicity, we use the `cats` from closure which is updated via useEffect dependencies.
    
    let anyCatAlerted = false;

    let updatedCats = cats.map(cat => {
        if (!catsActive) return cat;

        if (cat.state === CatState.SLEEP) {
            if (cat.alertTimer > 0) return { ...cat, alertTimer: cat.alertTimer - 1 };
            return { ...cat, state: CatState.PATROL };
        }

        let nextPos = cat.pos;
        let nextState = cat.state;
        let timer = cat.alertTimer;

        // Vision Check
        const distToPlayer = distance(cat.pos, newPlayerPos);
        const playerTile = getTileAt(newPlayerPos, levelConfig.map);
        const isPlayerHidden = playerTile === TileType.GRASS;
        const canSeePlayer = distToPlayer <= 5 && hasLineOfSight(cat.pos, newPlayerPos, levelConfig.map) && !isPlayerHidden;

        if (canSeePlayer) {
            nextState = CatState.CHASE;
        } else if (nextState === CatState.CHASE) {
            nextState = CatState.ALERT;
            timer = 5; 
        }

        // Movement Logic
        if (nextState === CatState.CHASE) {
            nextPos = getNextStepTowards(cat.pos, newPlayerPos, levelConfig.map);
        } else if (nextState === CatState.ALERT) {
            if (cat.lastKnownPlayerPos) {
               nextPos = getNextStepTowards(cat.pos, cat.lastKnownPlayerPos, levelConfig.map);
               if (distance(nextPos, cat.lastKnownPlayerPos) === 0) {
                  timer--;
               }
            } else {
               timer--;
            }
            if (timer <= 0) nextState = CatState.PATROL;
        } else if (nextState === CatState.PATROL) {
            const targetPatrol = cat.patrolPath[cat.patrolIndex];
            if (distance(cat.pos, targetPatrol) === 0) {
                const nextIdx = (cat.patrolIndex + 1) % cat.patrolPath.length;
                return { ...cat, patrolIndex: nextIdx };
            }
            nextPos = getNextStepTowards(cat.pos, targetPatrol, levelConfig.map);
        }

        const blocked = cats.some(c => c.id !== cat.id && c.pos.x === nextPos.x && c.pos.y === nextPos.y);
        
        // Check for state change to trigger shake
        if ((nextState === CatState.ALERT || nextState === CatState.CHASE) && (cat.state === CatState.PATROL || cat.state === CatState.SLEEP)) {
            anyCatAlerted = true;
        }

        return {
            ...cat,
            pos: blocked ? cat.pos : nextPos,
            state: nextState,
            alertTimer: timer,
            facing: { x: nextPos.x - cat.pos.x, y: nextPos.y - cat.pos.y }
        };
    });

    if (anyCatAlerted) triggerShake();

    // 2. Check Game Over (Collisions)
    const caught = updatedCats.some(cat => 
        (cat.pos.x === newPlayerPos.x && cat.pos.y === newPlayerPos.y) || 
        (cat.pos.x === playerPos.x && cat.pos.y === playerPos.y && newPlayerPos.x === cat.pos.x && newPlayerPos.y === cat.pos.y)
    );

    if (caught) {
        setPlayerPos(newPlayerPos);
        setCats(updatedCats);
        handleLoss();
    } else {
        setPlayerPos(newPlayerPos);
        setCats(updatedCats);
        setMoveCount(nextMoveCount);
    }
  }, [cats, moveCount, levelConfig, playerPos, triggerShake, handleLoss]);

  const attemptMove = useCallback((dx: number, dy: number) => {
    if (!gameState.isPlaying || gameState.isGameOver) return;
    if (isSniffing) return;
    
    const now = Date.now();
    if (now - lastMoveTime.current < PLAYER_MOVE_DELAY) return;

    if (dx === 0 && dy === 0) return;

    const newDirection = { x: dx, y: dy };
    setPlayerDirection(newDirection);

    const newPos = { x: playerPos.x + dx, y: playerPos.y + dy };
    
    // Validate Move
    if (!isSolid(newPos, levelConfig.map)) {
        lastMoveTime.current = now;
        
        // Dust Effect
        addEffect('DUST', playerPos);

        // Check Item Interactions FIRST
        const treatIdx = treats.findIndex(t => !t.collected && t.pos.x === newPos.x && t.pos.y === newPos.y);
        let currentTreats = treats;
        if (treatIdx !== -1) {
            const newTreats = [...treats];
            newTreats[treatIdx].collected = true;
            setTreats(newTreats);
            currentTreats = newTreats;
            
            // Sparkle Effect
            addEffect('SPARKLE', newPos);
            
            if (newTreats.every(t => t.collected)) {
                setPlayerPos(newPos); // Visual update
                handleWin();
                return; // Stop turn logic
            }
        }

        const itemIdx = items.findIndex(i => !i.collected && i.pos.x === newPos.x && i.pos.y === newPos.y);
        if (itemIdx !== -1) {
            const item = items[itemIdx];
            const newItemsList = [...items];
            newItemsList[itemIdx].collected = true;
            setItems(newItemsList);
            addEffect('SPARKLE', newPos);
            
            setGameState(prev => ({
                ...prev,
                items: {
                    yarn: item.type === EntityType.YARN ? prev.items.yarn + 1 : prev.items.yarn,
                    toys: item.type === EntityType.TOY ? prev.items.toys + 1 : prev.items.toys
                },
                messages: [...prev.messages, `Found a ${item.type === EntityType.YARN ? 'Yarn Ball' : 'Squeaky Toy'}!`]
            }));
        }

        // Execute Turn
        processTurn(newPos);
    }
  }, [gameState, isSniffing, playerPos, levelConfig, treats, items, addEffect, handleWin, processTurn]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === '1') useItem('yarn');
        if (e.key === '2') useItem('toy');
        if (e.code === 'Space') {
            if (!e.repeat) setIsSniffing(true);
        }

        let dx = 0;
        let dy = 0;

        if (e.key === 'ArrowUp' || e.key === 'w') dy = -1;
        if (e.key === 'ArrowDown' || e.key === 's') dy = 1;
        if (e.key === 'ArrowLeft' || e.key === 'a') dx = -1;
        if (e.key === 'ArrowRight' || e.key === 'd') dx = 1;

        if (dx !== 0 || dy !== 0) {
            attemptMove(dx, dy);
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') setIsSniffing(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [useItem, attemptMove]);


  // Rendering
  return (
    <div className="min-h-screen bg-earth flex items-center justify-center p-4 font-serif">
      {!gameState.isPlaying && !gameState.isGameOver ? (
        // Main Menu
        <div className="max-w-md w-full bg-paper p-8 rounded-lg border-8 border-ink shadow-2xl text-center">
            <h1 className="text-4xl font-bold text-ink mb-4 flex flex-col items-center gap-2">
                <Crown size={48} className="text-rose-400" />
                <span>Pugly's Garden</span>
                <span className="text-2xl text-earth italic">Mystery</span>
            </h1>
            <div className="mb-6 text-left space-y-2 bg-stone-100 p-4 rounded border border-stone-300">
                <p><strong>Goal:</strong> Collect all treats without getting caught!</p>
                <p><strong>Controls:</strong> D-Pad or Arrow Keys.</p>
                <p><strong>Grace Period:</strong> Cats wait 5 moves.</p>
                <p><strong>Sniff:</strong> Hold Button or SPACE.</p>
                <p><strong>Items:</strong> Yarn distraction, Squeaky Toy stun.</p>
            </div>
            <div className="space-y-4">
                {LEVELS.map((level, idx) => (
                    <button 
                        key={level.id}
                        onClick={() => startLevel(idx)}
                        className="w-full py-3 bg-sage hover:bg-green-600 text-white font-bold rounded shadow transition-transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                        <Play size={18} /> Play {level.name}
                    </button>
                ))}
            </div>
        </div>
      ) : (
        // Game HUD
        <div className="flex flex-col items-center w-full max-w-2xl">
             <UIOverlay 
                gameState={gameState} 
                currentLevel={levelConfig} 
                treatsLeft={treats.filter(t => !t.collected).length} 
                onRestart={() => startLevel(gameState.levelIndex)}
                onHome={() => setGameState(INITIAL_GAME_STATE)}
                isSniffing={isSniffing}
                moveCount={moveCount}
             />
             
             <div className="relative">
                <GameCanvas 
                    map={levelConfig.map} 
                    playerPos={playerPos} 
                    cats={cats}
                    treats={treats}
                    items={items}
                    playerDirection={playerDirection}
                    isSniffing={isSniffing}
                    effects={effects}
                    isShaking={isShaking}
                />
                
                {gameState.isGameOver && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm rounded-lg z-50">
                        <div className="bg-paper p-8 rounded border-4 border-ink text-center max-w-sm">
                            {gameState.gameWon ? (
                                <>
                                    <Crown size={64} className="mx-auto text-yellow-500 mb-4 animate-bounce" />
                                    <h2 className="text-3xl font-bold text-ink mb-2">Delicious Victory!</h2>
                                    <p className="mb-6">You found all the snacks!</p>
                                    {gameState.levelIndex < LEVELS.length - 1 ? (
                                        <button 
                                            onClick={() => startLevel(gameState.levelIndex + 1)}
                                            className="px-6 py-2 bg-rose-400 hover:bg-rose-500 text-white rounded-full font-bold shadow"
                                        >
                                            Next Garden &rarr;
                                        </button>
                                    ) : (
                                        <p className="text-xl font-bold text-rose-600">You completed all gardens!</p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-center mb-4">
                                        <Cat size={64} className="text-stone-600" />
                                        <Frown size={32} className="text-stone-600 -ml-4 mt-8" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-ink mb-2">Caught!</h2>
                                    <p className="mb-6">The Grumpy Cat found you.</p>
                                    <button 
                                        onClick={() => startLevel(gameState.levelIndex)}
                                        className="px-6 py-2 bg-earth hover:bg-stone-700 text-white rounded-full font-bold shadow"
                                    >
                                        Try Again
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
             </div>

             <Controls 
                onMove={attemptMove}
                onSniffStart={() => setIsSniffing(true)}
                onSniffEnd={() => setIsSniffing(false)}
                onItem={useItem}
                yarnCount={gameState.items.yarn}
                toyCount={gameState.items.toys}
                isSniffing={isSniffing}
             />
        </div>
      )}
    </div>
  );
};

export default App;