import * as vscode from 'vscode';
import { ConfigStore } from '../../core/configStore';
import { VIEW_IDS, COMMANDS } from '../../core/constants';
import { WorkspaceInfoProvider } from './workspaceInfoProvider';

export { WorkspaceInfoProvider };

/**
 * Wire up the Workspace Info feature: read-only tree view showing
 * folder path, Git branch, and SVN URL.
 */
export function activateWorkspaceInfo(context: vscode.ExtensionContext, store: ConfigStore): WorkspaceInfoProvider {
    const provider = new WorkspaceInfoProvider(store);

    const view = vscode.window.createTreeView(VIEW_IDS.workspaceInfo, {
        treeDataProvider: provider,
        showCollapseAll: false,
    });

    context.subscriptions.push(
        view,
        provider,
        vscode.commands.registerCommand(COMMANDS.refreshWorkspaceInfo, () => provider.refresh()),
    );

    return provider;
}
