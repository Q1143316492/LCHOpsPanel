export interface Game {
    name: string;
    type: string;
    reset(): void;
    handleAction(action: string, payload: any): GameState;
    getState(): GameState;
}

export interface GameState {
    gameType: string;
    gameData: any;
    isGameOver: boolean;
    score: number;
    message?: string;
}

export abstract class BaseGame implements Game {
    abstract name: string;
    abstract type: string;
    
    abstract reset(): void;
    abstract handleAction(action: string, payload: any): GameState;
    abstract getState(): GameState;
}
