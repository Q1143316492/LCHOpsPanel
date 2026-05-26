import * as vscode from 'vscode';
import * as path from 'path';
import { ConfigStore } from '../../core/configStore';
import { COMMANDS, CONFIG_FILE_NAME, VIEW_IDS } from '../../core/constants';
import { OpsItem, OpsItemType } from '../../core/types';
import {
    openPathInEditor,
    openPathInTerminal,
    runCommandInTerminal,
    runScriptInTerminal,
} from '../../core/terminalRunner';
import { OpsTreeProvider } from './opsTreeProvider';

/**
 * Wire up the Operations Panel feature: tree view + commands.
 */
export function activateOpsPanel(
    context: vscode.ExtensionContext,
    store: ConfigStore,
): OpsTreeProvider {
    const provider = new OpsTreeProvider(store);
    const view = vscode.window.createTreeView(VIEW_IDS.opsPanel, {
        treeDataProvider: provider,
        showCollapseAll: true,
    });

    context.subscriptions.push(
        view,
        vscode.commands.registerCommand(COMMANDS.refresh, () => provider.refresh()),
        vscode.commands.registerCommand(COMMANDS.addItem, () => addItem(provider, store)),
        vscode.commands.registerCommand(COMMANDS.editItem, (item: OpsItem) => editItem(provider, item)),
        vscode.commands.registerCommand(COMMANDS.deleteItem, (item: OpsItem) => deleteItem(provider, item)),
        vscode.commands.registerCommand(COMMANDS.openFile, (item: OpsItem) => openPathInEditor(item)),
        vscode.commands.registerCommand(COMMANDS.executeScript, (item: OpsItem) => runScriptInTerminal(item)),
        vscode.commands.registerCommand(COMMANDS.openInTerminal, (item: OpsItem) => openPathInTerminal(item)),
        vscode.commands.registerCommand(COMMANDS.executeCommand, (item: OpsItem) => {
            if (!item.command) {
                vscode.window.showErrorMessage('No command specified for this item');
                return;
            }
            runCommandInTerminal(item.name, item.command);
        }),
        vscode.commands.registerCommand(COMMANDS.openConfigFile, () => openConfigFile(store)),
    );

    return provider;
}

async function openConfigFile(store: ConfigStore): Promise<void> {
    const root = store.workspaceRoot;
    if (!root) {
        vscode.window.showInformationMessage('No workspace folder is open.');
        return;
    }
    try {
        await vscode.window.showTextDocument(vscode.Uri.file(path.join(root, CONFIG_FILE_NAME)));
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open config file: ${error}`);
    }
}

async function addItem(provider: OpsTreeProvider, store: ConfigStore): Promise<void> {
    const itemType = await vscode.window.showQuickPick(
        [
            { label: 'File', value: 'file' as OpsItemType, description: 'A file to open' },
            { label: 'Script', value: 'script' as OpsItemType, description: 'An executable script' },
            { label: 'Command', value: 'command' as OpsItemType, description: 'A command to run' },
        ],
        { placeHolder: 'Select item type' },
    );
    if (!itemType) {
        return;
    }

    const name = await vscode.window.showInputBox({ prompt: 'Enter item name', placeHolder: 'My Item' });
    if (!name) {
        return;
    }

    let itemPath: string | undefined;
    let command: string | undefined;
    if (itemType.value === 'command') {
        command = await vscode.window.showInputBox({
            prompt: 'Enter command to execute',
            placeHolder: 'python3 test.py',
        });
        if (!command) {
            return;
        }
    } else {
        const pathInput = await vscode.window.showInputBox({
            prompt: `Enter ${itemType.label.toLowerCase()} path`,
            placeHolder: itemType.value === 'file' ? './logs/app.log' : './scripts/deploy.py',
        });
        if (!pathInput) {
            return;
        }
        itemPath = pathInput;
    }

    const description = await vscode.window.showInputBox({
        prompt: 'Enter description (optional)',
        placeHolder: 'Description of this item',
    });

    const category = await pickCategory(store);

    await provider.addItem({
        name,
        type: itemType.value,
        path: itemPath,
        command,
        description: description || undefined,
        category,
    });
    vscode.window.showInformationMessage(`Added ${itemType.label}: ${name}`);
}

async function pickCategory(store: ConfigStore): Promise<string | undefined> {
    const options = store.config.categories.map(cat => ({ label: cat, value: cat }));
    options.push({ label: '+ New Category', value: '__new__' });

    const picked = await vscode.window.showQuickPick(options, { placeHolder: 'Select category' });
    if (!picked) {
        return undefined;
    }
    if (picked.value !== '__new__') {
        return picked.value;
    }

    const newName = await vscode.window.showInputBox({
        prompt: 'Enter new category name',
        placeHolder: 'Scripts',
    });
    if (newName && !store.config.categories.includes(newName)) {
        store.config.categories.push(newName);
    }
    return newName || undefined;
}

async function editItem(provider: OpsTreeProvider, item: OpsItem): Promise<void> {
    const name = await vscode.window.showInputBox({ prompt: 'Enter item name', value: item.name });
    if (!name) {
        return;
    }

    let itemPath = item.path;
    let command = item.command;

    if (item.type === 'command') {
        command = await vscode.window.showInputBox({
            prompt: 'Enter command to execute',
            value: item.command || '',
        });
    } else {
        itemPath = await vscode.window.showInputBox({
            prompt: `Enter ${item.type} path`,
            value: item.path || '',
        });
    }

    const description = await vscode.window.showInputBox({
        prompt: 'Enter description (optional)',
        value: item.description || '',
    });

    await provider.updateItem(item.id, {
        name,
        path: itemPath,
        command,
        description: description || undefined,
    });
    vscode.window.showInformationMessage(`Updated: ${name}`);
}

async function deleteItem(provider: OpsTreeProvider, item: OpsItem): Promise<void> {
    const confirm = await vscode.window.showWarningMessage(
        `Are you sure you want to delete "${item.name}"?`,
        { modal: true },
        'Delete',
    );
    if (confirm === 'Delete') {
        await provider.deleteItem(item.id);
        vscode.window.showInformationMessage(`Deleted: ${item.name}`);
    }
}
