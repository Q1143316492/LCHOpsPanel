import * as vscode from 'vscode';
import { COMMANDS } from '../../core/constants';
import { JsonTreeEditorProvider } from './jsonTreeEditorProvider';

/**
 * Wire up the JSON Tree Editor custom editor + the open-with command.
 */
export function activateJsonEditor(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        JsonTreeEditorProvider.register(context),
        vscode.commands.registerCommand(COMMANDS.openJsonEditor, async (uri?: vscode.Uri) => {
            const target = await resolveTarget(uri);
            if (!target) {
                return;
            }
            try {
                await vscode.commands.executeCommand('vscode.openWith', target, JsonTreeEditorProvider.viewType);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open JSON Tree Editor: ${error}`);
            }
        }),
    );
}

async function resolveTarget(uri?: vscode.Uri): Promise<vscode.Uri | undefined> {
    if (uri) {
        return uri;
    }
    const active = vscode.window.activeTextEditor;
    if (active && active.document.fileName.endsWith('.json')) {
        return active.document.uri;
    }
    const picked = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: { 'JSON Files': ['json'] },
        openLabel: 'Open with JSON Tree Editor',
    });
    return picked?.[0];
}
