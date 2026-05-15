import { BaseGame, GameState } from './gameTypes';
import * as vscode from 'vscode';

interface Game2048State {
    board: number[][];
    score: number;
    bestScore: number;
    isGameOver: boolean;
    hasWon: boolean;
    message?: string;
}

export class Game2048 extends BaseGame {
    public name = '2048';
    public type = '2048';
    
    private _state: Game2048State;
    private _size = 4;
    private _context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        super();
        this._context = context;
        this._state = this._createInitialState();
        this._addRandomTile();
        this._addRandomTile();
    }

    private _createInitialState(): Game2048State {
        return {
            board: Array(this._size).fill(null).map(() => Array(this._size).fill(0)),
            score: 0,
            bestScore: this._loadBestScore(),
            isGameOver: false,
            hasWon: false
        };
    }

    private _loadBestScore(): number {
        return this._context.globalState.get('lchOpsPanel.game2048.bestScore', 0);
    }

    private _saveBestScore(score: number): void {
        if (score > this._state.bestScore) {
            this._state.bestScore = score;
            this._context.globalState.update('lchOpsPanel.game2048.bestScore', score);
        }
    }

    public reset(): void {
        this._state = this._createInitialState();
        this._addRandomTile();
        this._addRandomTile();
    }

    public handleAction(action: string, payload: any): GameState {
        switch (action) {
            case 'move':
                this._handleMove(payload.direction);
                break;
            case 'reset':
                this.reset();
                break;
        }
        return this.getState();
    }

    public getState(): GameState {
        return {
            gameType: this.type,
            gameData: {
                board: this._state.board,
                score: this._state.score,
                bestScore: this._state.bestScore,
                hasWon: this._state.hasWon
            },
            isGameOver: this._state.isGameOver,
            score: this._state.score,
            message: this._state.message
        };
    }

    private _handleMove(direction: 'up' | 'down' | 'left' | 'right'): void {
        if (this._state.isGameOver) {
            return;
        }

        const previousBoard = this._state.board.map(row => [...row]);
        let moved = false;

        switch (direction) {
            case 'left':
                moved = this._moveLeft();
                break;
            case 'right':
                moved = this._moveRight();
                break;
            case 'up':
                moved = this._moveUp();
                break;
            case 'down':
                moved = this._moveDown();
                break;
        }

        if (moved) {
            this._addRandomTile();
            this._checkGameState();
            this._saveBestScore(this._state.score);
        }
    }

    private _moveLeft(): boolean {
        let moved = false;
        for (let row = 0; row < this._size; row++) {
            const line = this._state.board[row].filter(cell => cell !== 0);
            for (let col = 0; col < line.length - 1; col++) {
                if (line[col] === line[col + 1]) {
                    line[col] *= 2;
                    this._state.score += line[col];
                    line[col + 1] = 0;
                    if (line[col] === 2048 && !this._state.hasWon) {
                        this._state.hasWon = true;
                        this._state.message = 'You won! Keep playing or start a new game.';
                    }
                }
            }
            const newRow = line.filter(cell => cell !== 0);
            while (newRow.length < this._size) {
                newRow.push(0);
            }
            
            if (JSON.stringify(this._state.board[row]) !== JSON.stringify(newRow)) {
                moved = true;
                this._state.board[row] = newRow;
            }
        }
        return moved;
    }

    private _moveRight(): boolean {
        let moved = false;
        for (let row = 0; row < this._size; row++) {
            const line = this._state.board[row].filter(cell => cell !== 0);
            for (let col = line.length - 1; col > 0; col--) {
                if (line[col] === line[col - 1]) {
                    line[col] *= 2;
                    this._state.score += line[col];
                    line[col - 1] = 0;
                    if (line[col] === 2048 && !this._state.hasWon) {
                        this._state.hasWon = true;
                        this._state.message = 'You won! Keep playing or start a new game.';
                    }
                }
            }
            const filteredLine = line.filter(cell => cell !== 0);
            const newRow = Array(this._size - filteredLine.length).fill(0).concat(filteredLine);
            
            if (JSON.stringify(this._state.board[row]) !== JSON.stringify(newRow)) {
                moved = true;
                this._state.board[row] = newRow;
            }
        }
        return moved;
    }

    private _moveUp(): boolean {
        let moved = false;
        for (let col = 0; col < this._size; col++) {
            const line = [];
            for (let row = 0; row < this._size; row++) {
                if (this._state.board[row][col] !== 0) {
                    line.push(this._state.board[row][col]);
                }
            }
            
            for (let i = 0; i < line.length - 1; i++) {
                if (line[i] === line[i + 1]) {
                    line[i] *= 2;
                    this._state.score += line[i];
                    line[i + 1] = 0;
                    if (line[i] === 2048 && !this._state.hasWon) {
                        this._state.hasWon = true;
                        this._state.message = 'You won! Keep playing or start a new game.';
                    }
                }
            }
            
            const filteredLine = line.filter(cell => cell !== 0);
            const newColumn = filteredLine.concat(Array(this._size - filteredLine.length).fill(0));
            
            for (let row = 0; row < this._size; row++) {
                if (this._state.board[row][col] !== newColumn[row]) {
                    moved = true;
                    this._state.board[row][col] = newColumn[row];
                }
            }
        }
        return moved;
    }

    private _moveDown(): boolean {
        let moved = false;
        for (let col = 0; col < this._size; col++) {
            const line = [];
            for (let row = 0; row < this._size; row++) {
                if (this._state.board[row][col] !== 0) {
                    line.push(this._state.board[row][col]);
                }
            }
            
            for (let i = line.length - 1; i > 0; i--) {
                if (line[i] === line[i - 1]) {
                    line[i] *= 2;
                    this._state.score += line[i];
                    line[i - 1] = 0;
                    if (line[i] === 2048 && !this._state.hasWon) {
                        this._state.hasWon = true;
                        this._state.message = 'You won! Keep playing or start a new game.';
                    }
                }
            }
            
            const filteredLine = line.filter(cell => cell !== 0);
            const newColumn = Array(this._size - filteredLine.length).fill(0).concat(filteredLine);
            
            for (let row = 0; row < this._size; row++) {
                if (this._state.board[row][col] !== newColumn[row]) {
                    moved = true;
                    this._state.board[row][col] = newColumn[row];
                }
            }
        }
        return moved;
    }

    private _addRandomTile(): void {
        const emptyCells = [];
        for (let row = 0; row < this._size; row++) {
            for (let col = 0; col < this._size; col++) {
                if (this._state.board[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }

        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this._state.board[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    private _checkGameState(): void {
        // Check if there are any empty cells
        for (let row = 0; row < this._size; row++) {
            for (let col = 0; col < this._size; col++) {
                if (this._state.board[row][col] === 0) {
                    return; // Game can continue
                }
            }
        }

        // Check if any adjacent cells can be merged
        for (let row = 0; row < this._size; row++) {
            for (let col = 0; col < this._size; col++) {
                const current = this._state.board[row][col];
                if (
                    (row < this._size - 1 && this._state.board[row + 1][col] === current) ||
                    (col < this._size - 1 && this._state.board[row][col + 1] === current)
                ) {
                    return; // Game can continue
                }
            }
        }

        // No moves available
        this._state.isGameOver = true;
        this._state.message = 'Game Over! No more moves available.';
    }
}
