import * as vscode from 'vscode';
import { GameManager } from './games/gameManager';

export class GamesPanelProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'lchGamesPanelView';
    
    private _view?: vscode.WebviewView;
    private _gameManager: GameManager;
    private _context: vscode.ExtensionContext;

    constructor(private readonly _extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        this._context = context;
        this._gameManager = new GameManager(context);
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'gameAction':
                    this._handleGameAction(data.action, data.payload);
                    break;
                case 'requestGameState':
                    this._sendGameState();
                    break;
            }
        });

        // Send initial game state
        this._sendGameState();
    }

    private _handleGameAction(action: string, payload: any) {
        const result = this._gameManager.handleAction(action, payload);
        if (this._view) {
            this._view.webview.postMessage({
                type: 'gameUpdate',
                data: result
            });
        }
    }

    private _sendGameState() {
        const state = this._gameManager.getCurrentState();
        if (this._view) {
            this._view.webview.postMessage({
                type: 'gameState',
                data: state
            });
        }
    }

    public switchGame(gameType: string) {
        this._gameManager.switchGame(gameType);
        this._sendGameState();
    }

    public resetCurrentGame() {
        this._gameManager.resetCurrentGame();
        this._sendGameState();
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'games.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'games.css'));

        // Use a nonce to only allow specific scripts to be run
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
                        <h3 id="gameTitle">2048</h3>
                        <div id="gameControls">
                            <button id="newGameBtn">New Game</button>
                        </div>
                    </div>
                    <div id="gameArea">
                        <div id="gameStatus">
                            <div>Score: <span id="score">0</span></div>
                            <div>Best: <span id="best">0</span></div>
                        </div>
                        <div id="gameBoard"></div>
                        <div id="gameInstructions">
                            <p>Use arrow keys (↑↓←→) or WASD to move tiles. Combine tiles with the same number to reach 2048!</p>
                        </div>
                    </div>
                </div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
