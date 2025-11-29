import { Position, TileType, EntityType, CatState, CatEntity, LevelConfig } from '../types';

export const DIRECTIONS = [
  { x: 0, y: -1 }, // Up
  { x: 0, y: 1 },  // Down
  { x: -1, y: 0 }, // Left
  { x: 1, y: 0 },  // Right
];

export const isSolid = (pos: Position, map: string[]): boolean => {
  if (pos.y < 0 || pos.y >= map.length || pos.x < 0 || pos.x >= map[0].length) return true;
  const tile = map[pos.y][pos.x];
  return tile === TileType.WALL || tile === TileType.WATER;
};

export const getTileAt = (pos: Position, map: string[]): string => {
  if (pos.y < 0 || pos.y >= map.length || pos.x < 0 || pos.x >= map[0].length) return TileType.WALL;
  return map[pos.y][pos.x];
};

// Simple Manhattan distance
export const distance = (a: Position, b: Position): number => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};

// Bresenham's Line Algorithm for Line of Sight
export const hasLineOfSight = (start: Position, end: Position, map: string[]): boolean => {
  let x0 = start.x;
  let y0 = start.y;
  const x1 = end.x;
  const y1 = end.y;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = (x0 < x1) ? 1 : -1;
  const sy = (y0 < y1) ? 1 : -1;
  let err = dx - dy;

  while (true) {
    if (x0 === x1 && y0 === y1) return true;
    if (isSolid({ x: x0, y: y0 }, map)) return false;

    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
};

// Determine next step for AI using BFS (Breadth-First Search) for shortest path
export const getNextStepTowards = (start: Position, target: Position, map: string[]): Position => {
  if (start.x === target.x && start.y === target.y) return start;

  const queue: { pos: Position; firstStep: Position | null }[] = [
    { pos: start, firstStep: null }
  ];
  const visited = new Set<string>();
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const { pos, firstStep } = queue.shift()!;

    if (pos.x === target.x && pos.y === target.y) {
      return firstStep || start;
    }

    // Try all directions
    // Randomize slightly to make movement less robotic when multiple paths exist
    const shuffledDirs = [...DIRECTIONS].sort(() => Math.random() - 0.5);

    for (const dir of shuffledDirs) {
      const next = { x: pos.x + dir.x, y: pos.y + dir.y };
      const key = `${next.x},${next.y}`;

      if (!visited.has(key)) {
        // Check if walkable (walls and water block)
        if (!isSolid(next, map)) {
          visited.add(key);
          queue.push({
            pos: next,
            firstStep: firstStep || next
          });
        } else if (next.x === target.x && next.y === target.y) {
          // If target is on a solid block (unlikely but possible logic), we still want to move towards it
           return firstStep || next;
        }
      }
    }
  }

  // No path found
  return start;
};

export const parseLevel = (level: LevelConfig) => {
  const map = level.map;
  let playerStart = { x: 1, y: 1 };
  const treats: Position[] = [];
  const yarns: Position[] = [];
  const toys: Position[] = [];

  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      const char = map[y][x];
      if (char === 'P') playerStart = { x, y };
      if (char === 'T') treats.push({ x, y });
      if (char === 'Y') yarns.push({ x, y });
      if (char === 'S') toys.push({ x, y });
    }
  }

  const cats: CatEntity[] = level.catPatrols.map((patrol, idx) => ({
    id: `cat-${idx}`,
    type: EntityType.CAT,
    pos: patrol[0],
    state: CatState.PATROL,
    patrolPath: patrol,
    patrolIndex: 0,
    lastKnownPlayerPos: null,
    alertTimer: 0,
    facing: { x: 1, y: 0 } // Default facing
  }));

  return { playerStart, treats, cats, yarns, toys };
};