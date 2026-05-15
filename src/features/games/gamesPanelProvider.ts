import * as vscode from 'vscode';
import { GameManager } from './gameManager';
import { VIEW_IDS } from '../../core/constants';

/**
 * Webview-view provider that renders the Mini Games panel and forwards
 * messages between the webview and GameManager.
 */
export class GamesPanelProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = VIEW_IDS.gamesPanel;

    private _view?: vscode.WebviewView;
    private readonly _gameManager: GameManager;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        context: vscode.ExtensionContext,
    ) {
        this._gameManager = new GameManager(context);
    }

    resolveWebviewView(webviewView: vscode.WebviewView): void {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this._getHtml(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'gameAction':
                    if (data.action === 'switchGame') {
                        this._gameManager.switchGame(data.payload.gameType);
                        this._sendState();
                    } else {
                        const result = this._gameManager.handleAction(data.action, data.payload);
                        this._view?.webview.postMessage({ type: 'gameUpdate', data: result });
                    }
                    break;
                case 'requestGameState':
                    this._sendState();
                    break;
            }
        });

        this._sendState();
    }

    private _sendState(): void {
        this._view?.webview.postMessage({
            type: 'gameState',
            data: this._gameManager.getCurrentState(),
        });
    }

    switchGame(gameType: string): void {
        this._gameManager.switchGame(gameType);
        this._sendState();
    }

    resetCurrentGame(): void {
        this._gameManager.resetCurrentGame();
        this._sendState();
    }

    private _getHtml(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'games.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'games.css'));
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">
                <title>Mini Games</title>
            </head>
            <body>
                <div id="gameContainer">
                    <div id="gameHeader">
                        <h3 id="gameTitle">Mini Games</h3>
                        <div id="gameControls">
                            <select id="gameSelector">
                                <option value="2048">2048</option>
                                <option value="minesweeper">Minesweeper</option>
                            </select>
                            <button id="newGameBtn">New Game</button>
                        </div>
                    </div>
                    <div id="gameArea">
                        <div id="game2048" class="game-content">
                            <div id="gameStatus">
                                <div>Score: <span id="score">0</span></div>
                                <div>Best: <span id="best">0</span></div>
                            </div>
                            <div id="gameBoard"></div>
                            <div id="gameInstructions">
                                <p>Use arrow keys (↑↓←→) or WASD to move tiles. Combine tiles with the same number to reach 2048!</p>
                            </div>
                        </div>
                        <div id="gameMinesweeper" class="game-content" style="display: none;">
                            <div id="minesweeperStatus">
                                <div>Mines: <span id="remainingMines">10</span></div>
                                <div>
                                    <select id="difficultySelector">
                                        <option value="beginner">Beginner (9×9)</option>
                                        <option value="intermediate">Intermediate (16×16)</option>
                                        <option value="expert">Expert (30×16)</option>
                                    </select>
                                </div>
                            </div>
                            <div id="minesweeperBoard"></div>
                            <div id="minesweeperInstructions">
                                <p>Left click to reveal, right click to flag. Find all mines without clicking on them!</p>
                            </div>
                        </div>
                    </div>
                </div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}

function getNonce(): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
