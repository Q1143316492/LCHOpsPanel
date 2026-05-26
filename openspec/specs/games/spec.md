# Spec: Mini Games

## Summary

An embedded mini-game panel implemented as a WebviewView. Supports two games: **2048** (number tile puzzle) and **Minesweeper**. The last selected game is persisted in VS Code global state across sessions.

## Architecture

```
activateGames(context)
│
├── GamesPanelProvider (WebviewViewProvider)
│   └── GameManager
│       ├── Game2048      (implements Game)
│       └── GameMinesweeper (implements Game)
│
└── Commands: switchGame, resetGame, startGame2048, startGameMinesweeper
```

`GameManager` owns the two game instances and tracks which is active. The webview communicates with the host via `postMessage`.

## Game Interface

```typescript
interface Game {
  name: string;
  type: string;      // '2048' | 'minesweeper'
  reset(): void;
  handleAction(action: string, payload: any): GameState;
  getState(): GameState;
}

interface GameState {
  gameType: string;
  gameData: any;     // game-specific board data
  isGameOver: boolean;
  score: number;
  message?: string;
}
```

## Persistence

- Active game type is stored via `context.globalState` under key `lchOpsPanel.lastSelectedGame`.
- Default: `'2048'`.
- Game board state (score, tiles, etc.) is NOT persisted across VS Code restarts — each reload starts a fresh game.

## Commands

| Command | Behavior |
|---|---|
| `lchOpsPanel.switchGame` | QuickPick: "2048 - Number Puzzle" / "Minesweeper - Mine Hunter" |
| `lchOpsPanel.resetGame` | Resets the current game to initial state |
| `lchOpsPanel.startGame2048` | Directly switches to and starts 2048 |
| `lchOpsPanel.startGameMinesweeper` | Directly switches to and starts Minesweeper |

## Media Assets

The webview loads external JS/CSS from the `media/` directory:
- `media/games.js` — game rendering and input logic
- `media/games.css` — game styles

These are loaded as `webview.asWebviewUri(...)` URIs. The CSP allows `${webview.cspSource}` for scripts and styles.

## Non-goals

- Persisting game scores or high scores.
- Adding games dynamically (games are hardcoded in `GameManager`).
- Multiplayer or online features.
- Keyboard remapping or accessibility configuration.
