import * as vscode from 'vscode';
import { ConfigStore } from './core/configStore';
import { activateOpsPanel } from './features/opsPanel';
import { activateNotices } from './features/notices';
import { activateGames } from './features/games';
import { activateJsonEditor } from './features/jsonEditor';

/**
 * Extension entry point. Composes feature modules; holds no business logic.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    const store = new ConfigStore();
    context.subscriptions.push(store);
    await store.initialize();

    activateOpsPanel(context, store);
    activateNotices(context, store);
    activateGames(context);
    activateJsonEditor(context);

    vscode.window.showInformationMessage('LCHOpsPanel is ready!');
}

export function deactivate(): void {
    // Disposables are released via context.subscriptions.
}
