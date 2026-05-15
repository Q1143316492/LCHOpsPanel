import * as vscode from 'vscode';
import { ConfigStore } from '../../core/configStore';
import { COMMANDS, VIEW_IDS } from '../../core/constants';
import { NoticeFile, WorkspaceNotice } from '../../core/types';
import { NoticeTreeProvider } from './noticeTreeProvider';

/**
 * Wire up the Notice Collections feature: tree view + commands.
 * The shared `openFile` command (registered by opsPanel) handles notice-file clicks.
 */
export function activateNotices(
    context: vscode.ExtensionContext,
    store: ConfigStore,
): NoticeTreeProvider {
    const provider = new NoticeTreeProvider(store);
    const view = vscode.window.createTreeView(VIEW_IDS.noticeCollection, {
        treeDataProvider: provider,
        showCollapseAll: true,
    });

    context.subscriptions.push(
        view,
        vscode.commands.registerCommand(COMMANDS.switchNoticeCollection, () => switchNoticeCollection(provider)),
        vscode.commands.registerCommand(COMMANDS.addNoticeCollection, () => addNoticeCollection(provider)),
        vscode.commands.registerCommand(COMMANDS.manageNoticeCollections, () => manageNoticeCollections(provider)),
    );

    return provider;
}

async function switchNoticeCollection(provider: NoticeTreeProvider): Promise<void> {
    const notices = provider.getNotices();
    if (notices.length === 0) {
        vscode.window.showInformationMessage('No workspace notice collections available. Create one first.');
        return;
    }

    const CLEAR_LABEL = '$(close) Clear Selection';
    const items: vscode.QuickPickItem[] = [
        { label: CLEAR_LABEL, description: 'Hide the current notice collection' },
        ...notices.map(n => ({
            label: n.name,
            description: `${n.files.length} files - ${n.description || 'No description'}`,
        })),
    ];

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a workspace notice collection to display',
    });
    if (!selected) {
        return;
    }

    if (selected.label === CLEAR_LABEL) {
        await provider.setCurrentNotice('');
        vscode.window.showInformationMessage('Notice collection cleared');
    } else {
        await provider.setCurrentNotice(selected.label);
        vscode.window.showInformationMessage(`Switched to notice collection: ${selected.label}`);
    }
}

async function addNoticeCollection(provider: NoticeTreeProvider): Promise<void> {
    const name = await vscode.window.showInputBox({
        prompt: 'Enter name for the new notice collection',
        validateInput: value => {
            if (!value || value.trim().length === 0) {
                return 'Name cannot be empty';
            }
            if (provider.getNotices().some(n => n.name === value.trim())) {
                return 'A notice collection with this name already exists';
            }
            return undefined;
        },
    });
    if (!name) {
        return;
    }

    const description = await vscode.window.showInputBox({
        prompt: 'Enter description for the notice collection (optional)',
    });

    const files: NoticeFile[] = [];
    while (true) {
        const action = await vscode.window.showQuickPick(
            [
                { label: '$(add) Add File', description: 'Add a file to this collection' },
                { label: '$(check) Done', description: 'Finish creating the collection' },
            ],
            { placeHolder: `Collection "${name}" has ${files.length} files. Add more or finish?` },
        );
        if (!action || action.label === '$(check) Done') {
            break;
        }

        const fileName = await vscode.window.showInputBox({ prompt: 'Enter display name for the file' });
        if (!fileName) {
            continue;
        }
        const filePath = await vscode.window.showInputBox({
            prompt: 'Enter file path (relative to workspace root)',
            value: './',
        });
        if (!filePath) {
            continue;
        }
        const fileDescription = await vscode.window.showInputBox({
            prompt: 'Enter file description (optional)',
        });

        files.push({ name: fileName, path: filePath, description: fileDescription || undefined });
    }

    if (files.length === 0) {
        vscode.window.showWarningMessage('Cannot create empty notice collection');
        return;
    }

    const notice: WorkspaceNotice = {
        name: name.trim(),
        description: description?.trim() || undefined,
        files,
    };
    await provider.addNotice(notice);
    vscode.window.showInformationMessage(`Created notice collection: ${notice.name} with ${files.length} files`);
}

async function manageNoticeCollections(provider: NoticeTreeProvider): Promise<void> {
    const notices = provider.getNotices();
    if (notices.length === 0) {
        vscode.window.showInformationMessage('No workspace notice collections available.');
        return;
    }

    const selected = await vscode.window.showQuickPick(
        notices.map(n => ({
            label: n.name,
            description: `${n.files.length} files`,
            detail: n.description,
        })),
        { placeHolder: 'Select a notice collection to manage' },
    );
    if (!selected) {
        return;
    }

    const SET_CURRENT = '$(eye) Set as Current';
    const DELETE = '$(trash) Delete Collection';
    const action = await vscode.window.showQuickPick(
        [
            { label: SET_CURRENT, description: 'Display this collection in the tree' },
            { label: DELETE, description: 'Remove this collection' },
        ],
        { placeHolder: `Manage collection: ${selected.label}` },
    );
    if (!action) {
        return;
    }

    if (action.label === SET_CURRENT) {
        await provider.setCurrentNotice(selected.label);
        vscode.window.showInformationMessage(`Set current collection to: ${selected.label}`);
    } else if (action.label === DELETE) {
        const confirm = await vscode.window.showWarningMessage(
            `Are you sure you want to delete the collection "${selected.label}"?`,
            { modal: true },
            'Delete',
        );
        if (confirm === 'Delete') {
            await provider.removeNotice(selected.label);
            vscode.window.showInformationMessage(`Deleted collection: ${selected.label}`);
        }
    }
}
