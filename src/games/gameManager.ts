import { Game, GameState } from './gameTypes';
import { Game2048 } from './game2048';
import * as vscode from 'vscode';

export class GameManager {
    private _games: Map<string, Game> = new Map();
    private _currentGame: Game;
    private _availableGames: string[] = ['2048'];
    private _context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
        // Initialize available games
        this._games.set('2048', new Game2048(context));
        
        // Set default game
        this._currentGame = this._games.get('2048')!;
    }

    public getCurrentState(): GameState {
        return {
            ...this._currentGame.getState(),
            availableGames: this._availableGames,
            currentGameType: this._currentGame.type
        } as GameState & { availableGames: string[], currentGameType: string };
    }

    public handleAction(action: string, payload: any): GameState {
        return this._currentGame.handleAction(action, payload);
    }

    public switchGame(gameType: string): boolean {
        const game = this._games.get(gameType);
        if (game) {
            this._currentGame = game;
            return true;
        }
        return false;
    }

    public resetCurrentGame(): void {
        this._currentGame.reset();
    }

    public getAvailableGames(): string[] {
        return this._availableGames;
    }

    public getCurrentGameType(): string {
        return this._currentGame.type;
    }
}
