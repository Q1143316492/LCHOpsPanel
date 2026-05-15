import * as vscode from 'vscode';
import { COMMANDS } from '../../core/constants';
import { GamesPanelProvider } from './gamesPanelProvider';

interface GameChoice {
    label: string;
    value: string;
}

const GAME_CHOICES: GameChoice[] = [
    { label: '2048 - Number Puzzle', value: '2048' },
    { label: 'Minesweeper - Mine Hunter', value: 'minesweeper' },
];

/**
 * Wire up the Mini Games feature: webview view + commands.
 */
export function activateGames(context: vscode.ExtensionContext): void {
    const provider = new GamesPanelProvider(context.extensionUri, context);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(GamesPanelProvider.viewType, provider),
        vscode.commands.registerCommand(COMMANDS.switchGame, async () => {
            const selected = await vscode.window.showQuickPick(GAME_CHOICES, {
                placeHolder: 'Select a game to play',
            });
            if (selected) {
                provider.switchGame(selected.value);
            }
        }),
        vscode.commands.registerCommand(COMMANDS.resetGame, () => provider.resetCurrentGame()),
        vscode.commands.registerCommand(COMMANDS.startGame2048, () => provider.switchGame('2048')),
        vscode.commands.registerCommand(COMMANDS.startGameMinesweeper, () => provider.switchGame('minesweeper')),
    );
}
