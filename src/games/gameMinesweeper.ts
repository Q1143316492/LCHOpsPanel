import { BaseGame, GameState } from './gameTypes';
import * as vscode from 'vscode';

interface Cell {
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    neighborMines: number;
}

interface MinesweeperState {
    board: Cell[][];
    width: number;
    height: number;
    mineCount: number;
    revealedCount: number;
    flaggedCount: number;
    isGameOver: boolean;
    hasWon: boolean;
    gameStarted: boolean;
    message?: string;
}

export class GameMinesweeper extends BaseGame {
    public name = 'Minesweeper';
    public type = 'minesweeper';
    
    private _state: MinesweeperState;
    private _context: vscode.ExtensionContext;
    
    // 游戏难度配置
    private _difficulties = {
        beginner: { width: 9, height: 9, mines: 10 },
        intermediate: { width: 16, height: 16, mines: 40 },
        expert: { width: 30, height: 16, mines: 99 }
    };
    
    private _currentDifficulty = 'beginner';

    constructor(context: vscode.ExtensionContext) {
        super();
        this._context = context;
        this._state = this._createInitialState();
    }

    private _createInitialState(): MinesweeperState {
        const difficulty = this._difficulties[this._currentDifficulty as keyof typeof this._difficulties];
        
        return {
            board: this._createEmptyBoard(difficulty.width, difficulty.height),
            width: difficulty.width,
            height: difficulty.height,
            mineCount: difficulty.mines,
            revealedCount: 0,
            flaggedCount: 0,
            isGameOver: false,
            hasWon: false,
            gameStarted: false
        };
    }

    private _createEmptyBoard(width: number, height: number): Cell[][] {
        const board: Cell[][] = [];
        for (let row = 0; row < height; row++) {
            board[row] = [];
            for (let col = 0; col < width; col++) {
                board[row][col] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
                };
            }
        }
        return board;
    }

    public reset(): void {
        this._state = this._createInitialState();
    }

    public handleAction(action: string, payload: any): GameState {
        switch (action) {
            case 'reveal':
                this._handleReveal(payload.row, payload.col);
                break;
            case 'flag':
                this._handleFlag(payload.row, payload.col);
                break;
            case 'reset':
                this.reset();
                break;
            case 'changeDifficulty':
                this._changeDifficulty(payload.difficulty);
                break;
        }
        return this.getState();
    }

    public getState(): GameState {
        return {
            gameType: this.type,
            gameData: {
                board: this._state.board,
                width: this._state.width,
                height: this._state.height,
                mineCount: this._state.mineCount,
                flaggedCount: this._state.flaggedCount,
                remainingMines: this._state.mineCount - this._state.flaggedCount,
                hasWon: this._state.hasWon,
                gameStarted: this._state.gameStarted,
                currentDifficulty: this._currentDifficulty
            },
            isGameOver: this._state.isGameOver,
            score: this._state.revealedCount,
            message: this._state.message
        };
    }

    private _handleReveal(row: number, col: number): void {
        if (this._state.isGameOver || 
            row < 0 || row >= this._state.height || 
            col < 0 || col >= this._state.width) {
            return;
        }

        const cell = this._state.board[row][col];
        if (cell.isRevealed || cell.isFlagged) {
            return;
        }

        // 第一次点击时生成地雷
        if (!this._state.gameStarted) {
            this._generateMines(row, col);
            this._calculateNeighborMines();
            this._state.gameStarted = true;
        }

        this._revealCell(row, col);
        this._checkWinCondition();
    }

    private _handleFlag(row: number, col: number): void {
        if (this._state.isGameOver || 
            row < 0 || row >= this._state.height || 
            col < 0 || col >= this._state.width) {
            return;
        }

        const cell = this._state.board[row][col];
        if (cell.isRevealed) {
            return;
        }

        if (cell.isFlagged) {
            cell.isFlagged = false;
            this._state.flaggedCount--;
        } else {
            cell.isFlagged = true;
            this._state.flaggedCount++;
        }
    }

    private _changeDifficulty(difficulty: string): void {
        if (difficulty in this._difficulties) {
            this._currentDifficulty = difficulty;
            this.reset();
        }
    }

    private _generateMines(safeRow: number, safeCol: number): void {
        const mines = this._state.mineCount;
        let placedMines = 0;

        while (placedMines < mines) {
            const row = Math.floor(Math.random() * this._state.height);
            const col = Math.floor(Math.random() * this._state.width);

            // 不在安全区域和已有地雷的位置放置地雷
            if (!this._state.board[row][col].isMine && 
                (Math.abs(row - safeRow) > 1 || Math.abs(col - safeCol) > 1)) {
                this._state.board[row][col].isMine = true;
                placedMines++;
            }
        }
    }

    private _calculateNeighborMines(): void {
        for (let row = 0; row < this._state.height; row++) {
            for (let col = 0; col < this._state.width; col++) {
                if (!this._state.board[row][col].isMine) {
                    this._state.board[row][col].neighborMines = this._countNeighborMines(row, col);
                }
            }
        }
    }

    private _countNeighborMines(row: number, col: number): number {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) {
                    continue;
                }
                
                const newRow = row + dr;
                const newCol = col + dc;
                
                if (newRow >= 0 && newRow < this._state.height && 
                    newCol >= 0 && newCol < this._state.width && 
                    this._state.board[newRow][newCol].isMine) {
                    count++;
                }
            }
        }
        return count;
    }

    private _revealCell(row: number, col: number): void {
        const cell = this._state.board[row][col];
        if (cell.isRevealed || cell.isFlagged) {
            return;
        }

        cell.isRevealed = true;
        this._state.revealedCount++;

        if (cell.isMine) {
            this._state.isGameOver = true;
            this._state.message = 'Game Over! You hit a mine!';
            this._revealAllMines();
            return;
        }

        // 如果是空白格（没有相邻地雷），自动揭开周围的格子
        if (cell.neighborMines === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) {
                        continue;
                    }
                    
                    const newRow = row + dr;
                    const newCol = col + dc;
                    
                    if (newRow >= 0 && newRow < this._state.height && 
                        newCol >= 0 && newCol < this._state.width) {
                        this._revealCell(newRow, newCol);
                    }
                }
            }
        }
    }

    private _revealAllMines(): void {
        for (let row = 0; row < this._state.height; row++) {
            for (let col = 0; col < this._state.width; col++) {
                if (this._state.board[row][col].isMine) {
                    this._state.board[row][col].isRevealed = true;
                }
            }
        }
    }

    private _checkWinCondition(): void {
        const totalCells = this._state.width * this._state.height;
        const mineCells = this._state.mineCount;
        const safeCells = totalCells - mineCells;

        if (this._state.revealedCount === safeCells) {
            this._state.isGameOver = true;
            this._state.hasWon = true;
            this._state.message = 'Congratulations! You won!';
            
            // 自动标记所有地雷
            for (let row = 0; row < this._state.height; row++) {
                for (let col = 0; col < this._state.width; col++) {
                    if (this._state.board[row][col].isMine && !this._state.board[row][col].isFlagged) {
                        this._state.board[row][col].isFlagged = true;
                        this._state.flaggedCount++;
                    }
                }
            }
        }
    }
}
