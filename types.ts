export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  SKIN_CREATOR = 'SKIN_CREATOR'
}

export interface PugSkin {
  id: string;
  name: string;
  imageUrl: string | null; // null means default drawn pug
}

export interface HighScore {
  score: number;
  date: string;
}
