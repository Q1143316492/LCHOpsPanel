import * as vscode from 'vscode';
import { ConfigStore } from '../../core/configStore';
import { COMMANDS, VIEW_IDS } from '../../core/constants';
import { NotesMemoProvider } from './notesMemoProvider';

/**
 * Wire up the Notes Memo feature: webview sidebar panel + commands.
 */
export function activateNotesMemo(
    context: vscode.ExtensionContext,
    store: ConfigStore,
): NotesMemoProvider {
    const provider = new NotesMemoProvider(store);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(VIEW_IDS.notesMemo, provider, {
            webviewOptions: { retainContextWhenHidden: true },
        }),
        vscode.commands.registerCommand(COMMANDS.saveNotesMemo, () => {
            provider.requestSave();
        }),
        vscode.commands.registerCommand(COMMANDS.clearNotesMemo, async () => {
            const confirm = await vscode.window.showWarningMessage(
                'Clear all notes? This cannot be undone.',
                { modal: true },
                'Clear',
            );
            if (confirm === 'Clear') {
                await store.savePartial({ notes: [] });
            }
        }),
    );

    return provider;
}
