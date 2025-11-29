export type Position = { x: number; y: number };

export enum TileType {
  WALL = '#',
  PATH = '.',
  GRASS = ',', // Hiding spot
  WATER = '~',
  EXIT = 'E',
}

export enum EntityType {
  PLAYER = 'P',
  CAT = 'C',
  TREAT = 'T',
  YARN = 'Y',
  TOY = 'S', // Squeaky toy
}

export enum CatState {
  PATROL = 'PATROL',
  ALERT = 'ALERT',
  CHASE = 'CHASE',
  SLEEP = 'SLEEP', // When hit by squeaky toy
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Position;
  collected?: boolean;
}

export interface CatEntity extends Entity {
  type: EntityType.CAT;
  state: CatState;
  patrolPath: Position[];
  patrolIndex: number;
  lastKnownPlayerPos: Position | null;
  alertTimer: number; // Ticks remaining in current state
  facing: Position; // For vision cone
}

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  map: string[];
  catPatrols: Position[][];
  parTime: number; // Seconds
}

export interface GameState {
  levelIndex: number;
  isPlaying: boolean;
  isGameOver: boolean;
  gameWon: boolean;
  score: number;
  items: {
    yarn: number;
    toys: number;
  };
  messages: string[];
}

export interface VisualEffect {
  id: string;
  type: 'DUST' | 'SPARKLE';
  pos: Position;
  createdAt: number;
}