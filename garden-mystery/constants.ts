import { LevelConfig, TileType, EntityType } from './types';

// ASCII Map Legend:
// # : Wall (Hedge)
// . : Path
// , : Grass (Hide)
// ~ : Water (Obstacle)
// T : Treat
// P : Player Start
// E : Exit
// Y : Yarn Ball
// S : Squeaky Toy

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: "The Rose Garden",
    description: "A gentle start. Collect all 3 treats. Use the tall grass (,,) to hide if the cat gets close.",
    map: [
      "#########",
      "#P......#",
      "#.##.##.#",
      "#.T#.#T.#",
      "#.,,.,,.#",
      "#.##.##.#",
      "#...T...#",
      "#########",
    ],
    catPatrols: [
      [{ x: 6, y: 1 }, { x: 6, y: 6 }, { x: 2, y: 6 }, { x: 2, y: 1 }]
    ],
    parTime: 30
  },
  {
    id: 2,
    name: "Hedge Labyrinth",
    description: "The paths twist and turn. Use the yarn (Y) to distract the cat.",
    map: [
      "###########",
      "#P...#...T#",
      "###.#.###.#",
      "#T..#...#.#",
      "#.#####.#.#",
      "#Y.....,,.#",
      "#####.###.#",
      "#T........#",
      "###########",
    ],
    catPatrols: [
      [{ x: 8, y: 3 }, { x: 8, y: 7 }, { x: 3, y: 7 }, { x: 3, y: 3 }]
    ],
    parTime: 45
  },
  {
    id: 3,
    name: "Fountain Courtyard",
    description: "Open spaces are dangerous. Stick to the edges. A squeaky toy (S) can buy you time.",
    map: [
      "#############",
      "#T....P....T#",
      "#.##.###.##.#",
      "#...~...~...#",
      "#.T.......T.#",
      "#...~...~...#",
      "#.##.###.##.#",
      "#S....T.....#",
      "#############",
    ],
    catPatrols: [
      [{ x: 6, y: 3 }, { x: 6, y: 5 }, { x: 6, y: 3 }] // Center patrol
    ],
    parTime: 60
  }
];

export const TILE_SIZE = 40; // Pixels
export const GAME_TICK_MS = 500; // Not used in turn-based mode, but kept for reference
export const PLAYER_MOVE_DELAY = 50; // Debounce for player movement