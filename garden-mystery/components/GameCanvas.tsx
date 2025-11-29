import React, { useMemo } from 'react';
import { Entity, EntityType, Position, TileType, CatEntity, CatState, VisualEffect } from '../types';
import { clsx } from 'clsx';
import { Dog, Cat, Bone, Eye, Hexagon, Waves, TreePine, Sparkles } from 'lucide-react';
import { TILE_SIZE } from '../constants';

interface GameCanvasProps {
  map: string[];
  playerPos: Position;
  cats: CatEntity[];
  treats: Entity[];
  items: Entity[];
  playerDirection: Position;
  isSniffing: boolean;
  onTileClick?: (pos: Position) => void;
  effects: VisualEffect[];
  isShaking: boolean;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  map, 
  playerPos, 
  cats, 
  treats, 
  items, 
  playerDirection, 
  isSniffing,
  onTileClick,
  effects,
  isShaking
}) => {
  const height = map.length;
  const width = map[0].length;

  // Memoize grid rendering to avoid expensive recalculations on every tick
  const GridTiles = useMemo(() => {
    return map.map((row, y) => (
      <div key={`row-${y}`} className="flex">
        {row.split('').map((tile, x) => {
           let bgClass = 'bg-stone-200'; // Default PATH
           
           if (tile === TileType.WALL) bgClass = 'bg-green-900 border-green-950';
           if (tile === TileType.GRASS) bgClass = 'bg-green-700/80';
           if (tile === TileType.WATER) bgClass = 'bg-blue-200/50';

           const isWall = tile === TileType.WALL;
           const isGrass = tile === TileType.GRASS;
           const isWater = tile === TileType.WATER;

           return (
            <div
              key={`tile-${x}-${y}`}
              style={{ width: TILE_SIZE, height: TILE_SIZE }}
              className={clsx(
                "relative border border-stone-300/20 box-border flex items-center justify-center transition-colors duration-300",
                bgClass,
                isWall && "shadow-inner",
              )}
              onClick={() => onTileClick && onTileClick({ x, y })}
            >
              {isGrass && <TreePine size={16} className="text-green-900 opacity-40" />}
              {isWater && <Waves size={16} className="text-blue-500 opacity-40" />}
              {/* Decorative elements for paths */}
              {!isWall && !isGrass && !isWater && (x + y) % 7 === 0 && (
                <div className="w-1 h-1 bg-stone-400/30 rounded-full" />
              )}
            </div>
           );
        })}
      </div>
    ));
  }, [map]);

  const renderEntity = (type: EntityType, pos: Position, key: string, extraClasses = "", rotation = 0) => {
    const style = {
      width: TILE_SIZE,
      height: TILE_SIZE,
      left: pos.x * TILE_SIZE,
      top: pos.y * TILE_SIZE,
      transform: `rotate(${rotation}deg)`,
    };

    let Icon = Hexagon;
    if (type === EntityType.CAT) Icon = Cat;
    if (type === EntityType.TREAT) Icon = Bone;
    if (type === EntityType.YARN) Icon = Hexagon; 
    if (type === EntityType.TOY) Icon = Hexagon;

    return (
      <div
        key={key}
        className={clsx("absolute transition-all duration-300 ease-linear flex items-center justify-center", extraClasses)}
        style={style}
      >
        <Icon size={TILE_SIZE * 0.7} strokeWidth={2.5} />
      </div>
    );
  };
  
  const renderPugly = () => {
    const isFlipped = playerDirection.x < 0; // Flip if moving left

    const style = {
      width: TILE_SIZE,
      height: TILE_SIZE,
      left: playerPos.x * TILE_SIZE,
      top: playerPos.y * TILE_SIZE,
      transform: `scaleX(${isFlipped ? -1 : 1})`,
    };
    
    return (
      <div
        key="pugly"
        className="absolute transition-all duration-300 ease-linear flex items-center justify-center z-50"
        style={style}
      >
        {/* Tutu Layer */}
        <div className="absolute w-[110%] h-[110%] bg-pink-300/50 rounded-full animate-pulse border-2 border-pink-400/60" />
        
        {/* Pugly Body */}
        <Dog 
            size={TILE_SIZE * 0.85} 
            className="relative text-stone-900 fill-stone-800 drop-shadow-md" 
            strokeWidth={2}
        />
        
        {/* Cute details - A little collar tag */}
        <div className="absolute top-[60%] left-[50%] w-1.5 h-1.5 bg-yellow-400 rounded-full shadow-sm" style={{ transform: 'translateX(-50%)' }} />
      </div>
    );
  };

  return (
    <div 
      className={clsx(
        "relative bg-stone-100 shadow-2xl rounded-lg overflow-hidden border-4 border-stone-800 transition-transform",
        isShaking && "animate-shake"
      )}
      style={{ width: width * TILE_SIZE, height: height * TILE_SIZE }}
    >
      {/* Grid Layer */}
      <div className="absolute inset-0">
        {GridTiles}
      </div>

      {/* Visual Effects Layer */}
      {effects.map(effect => (
        <div
            key={effect.id}
            className="absolute flex items-center justify-center pointer-events-none z-40"
            style={{
                width: TILE_SIZE,
                height: TILE_SIZE,
                left: effect.pos.x * TILE_SIZE,
                top: effect.pos.y * TILE_SIZE,
            }}
        >
            {effect.type === 'DUST' && (
                <div className="w-full h-full bg-stone-500/30 rounded-full animate-ping opacity-60" />
            )}
            {effect.type === 'SPARKLE' && (
                <Sparkles size={32} className="text-yellow-400 animate-ping" />
            )}
        </div>
      ))}

      {/* Scent Trails / Vision Cones (Visual Feedback) */}
      {isSniffing && treats.map((t, i) => !t.collected && (
        <div 
          key={`scent-${i}`} 
          className="absolute w-full h-[2px] bg-pink-400/30 origin-left z-0 pointer-events-none"
          style={{
             left: playerPos.x * TILE_SIZE + TILE_SIZE/2,
             top: playerPos.y * TILE_SIZE + TILE_SIZE/2,
             width: Math.sqrt(Math.pow((t.pos.x - playerPos.x) * TILE_SIZE, 2) + Math.pow((t.pos.y - playerPos.y) * TILE_SIZE, 2)),
             transform: `rotate(${Math.atan2(t.pos.y - playerPos.y, t.pos.x - playerPos.x)}rad)`
          }}
        />
      ))}

      {/* Items Layer */}
      {treats.map((t) => !t.collected && (
        <div
          key={`treat-${t.pos.x}-${t.pos.y}`}
          className="absolute flex items-center justify-center animate-bounce-slow"
          style={{
            width: TILE_SIZE,
            height: TILE_SIZE,
            left: t.pos.x * TILE_SIZE,
            top: t.pos.y * TILE_SIZE,
          }}
        >
          <Bone size={TILE_SIZE * 0.5} className="text-earth fill-amber-200" />
        </div>
      ))}

      {items.map((i) => !i.collected && (
        <div
          key={`item-${i.id}`}
          className="absolute flex items-center justify-center"
          style={{
            width: TILE_SIZE,
            height: TILE_SIZE,
            left: i.pos.x * TILE_SIZE,
            top: i.pos.y * TILE_SIZE,
          }}
        >
          {i.type === EntityType.YARN && <div className="w-4 h-4 rounded-full bg-rose-400 shadow-sm border border-rose-600" />}
          {i.type === EntityType.TOY && <div className="w-4 h-4 rounded-md bg-yellow-400 shadow-sm border border-yellow-600" />}
        </div>
      ))}

      {/* Pugly Rendered Distinctly */}
      {renderPugly()}
      
      {/* Cats */}
      {cats.map((cat) => (
        <div key={cat.id}>
          {/* Cat Vision Cone Indicator (Simplified as an eye if alert) */}
          {cat.state === CatState.ALERT && (
            <div 
              className="absolute text-red-600 animate-pulse z-30"
              style={{
                left: cat.pos.x * TILE_SIZE,
                top: (cat.pos.y - 1) * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
              }}
            >
              <Eye size={24} className="mx-auto" />
            </div>
          )}
          {cat.state === CatState.SLEEP && (
             <div 
             className="absolute text-blue-600 z-30 font-bold"
             style={{
               left: cat.pos.x * TILE_SIZE + 10,
               top: (cat.pos.y - 1) * TILE_SIZE,
             }}
           >
             Zzz...
           </div>
          )}
          {renderEntity(
            EntityType.CAT, 
            cat.pos, 
            cat.id, 
            clsx(
              "z-10 transition-colors duration-300", 
              cat.state === CatState.CHASE ? "text-red-800" : "text-stone-600"
            )
          )}
        </div>
      ))}
    </div>
  );
};

export default GameCanvas;