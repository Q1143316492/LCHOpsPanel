import * as vscode from 'vscode';
import * as path from 'path';
import { ConfigStore } from '../../core/configStore';
import { COMMANDS, VIEW_IDS } from '../../core/constants';
import { NoticeFile, NoticeItem, WorkspaceNotice } from '../../core/types';
import { resolvePath } from '../../core/terminalRunner';
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
        vscode.commands.registerCommand(COMMANDS.openAllInCollection, (item?: NoticeItem) =>
            openAllInCollection(provider, item),
        ),
        vscode.commands.registerCommand(COMMANDS.editNoticeCollection, (item?: NoticeItem) =>
            editNoticeCollection(provider, item),
        ),
        vscode.commands.registerCommand(COMMANDS.saveTabsAsCollection, () => saveTabsAsCollection(provider)),
    );

    return provider;
}

// ---------------------------------------------------------------------------
// Switch / clear current collection
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Create a new collection (manual file entry)
// ---------------------------------------------------------------------------

async function addNoticeCollection(provider: NoticeTreeProvider): Promise<void> {
    const name = await promptForNewName(provider, 'Enter name for the new notice collection');
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
        const file = await promptForFileEntry();
        if (file) {
            files.push(file);
        }
    }

    if (files.length === 0) {
        vscode.window.showWarningMessage('Cannot create empty notice collection');
        return;
    }

    await provider.addNotice({
        name: name.trim(),
        description: description?.trim() || undefined,
        files,
    });
    vscode.window.showInformationMessage(`Created notice collection: ${name} with ${files.length} files`);
}

// ---------------------------------------------------------------------------
// Save currently open editor tabs as a new collection
// ---------------------------------------------------------------------------

async function saveTabsAsCollection(provider: NoticeTreeProvider): Promise<void> {
    const tabs = collectOpenTabs();
    if (tabs.length === 0) {
        vscode.window.showInformationMessage('No open file tabs to save.');
        return;
    }

    const picked = await vscode.window.showQuickPick(
        tabs.map(t => ({
            label: t.name,
            description: t.relPath,
            picked: true,
            relPath: t.relPath,
        })),
        {
            canPickMany: true,
            placeHolder: `Select tabs to include (${tabs.length} open)`,
        },
    );
    if (!picked || picked.length === 0) {
        return;
    }

    const name = await promptForNewName(provider, 'Name for this collection');
    if (!name) {
        return;
    }
    const description = await vscode.window.showInputBox({
        prompt: 'Description (optional)',
    });

    const files: NoticeFile[] = picked.map(p => ({
        name: p.label,
        path: p.relPath,
    }));

    await provider.addNotice({
        name: name.trim(),
        description: description?.trim() || undefined,
        files,
    });
    vscode.window.showInformationMessage(`Created "${name}" with ${files.length} files. Use "Open All" to recall.`);
}

// ---------------------------------------------------------------------------
// Open every file in a collection
// ---------------------------------------------------------------------------

async function openAllInCollection(provider: NoticeTreeProvider, item?: NoticeItem): Promise<void> {
    const notice = await resolveCollection(provider, item);
    if (!notice) {
        return;
    }

    let opened = 0;
    let failed = 0;
    for (const f of notice.files) {
        const abs = f.path ? resolvePath(f.path) : undefined;
        if (!abs) {
            failed++;
            continue;
        }
        try {
            const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(abs));
            await vscode.window.showTextDocument(doc, { preview: false, preserveFocus: true });
            opened++;
        } catch {
            failed++;
        }
    }

    if (failed === 0) {
        vscode.window.showInformationMessage(`Opened ${opened} file(s) from "${notice.name}".`);
    } else {
        vscode.window.showWarningMessage(`Opened ${opened} of ${notice.files.length} file(s); ${failed} failed.`);
    }
}

// ---------------------------------------------------------------------------
// Edit a collection (rename, description, add/remove files)
// ---------------------------------------------------------------------------

async function editNoticeCollection(provider: NoticeTreeProvider, item?: NoticeItem): Promise<void> {
    const notice = await resolveCollection(provider, item);
    if (!notice) {
        return;
    }

    const ADD_TABS = '$(save-all) Add Files from Open Tabs';
    const ADD_PICKER = '$(file-add) Add Files from File Picker';
    const ADD_PATH = '$(edit) Add File by Path';
    const REMOVE = '$(trash) Remove Files';
    const RENAME = '$(symbol-text) Rename Collection';
    const CHANGE_DESC = '$(comment) Change Description';

    const action = await vscode.window.showQuickPick(
        [
            { label: ADD_TABS, description: 'Append currently open tabs' },
            { label: ADD_PICKER, description: 'Browse and select files' },
            { label: ADD_PATH, description: 'Type a path manually' },
            { label: REMOVE, description: 'Remove one or more files' },
            { label: RENAME, description: 'Rename this collection' },
            { label: CHANGE_DESC, description: 'Edit description' },
        ],
        { placeHolder: `Edit collection: ${notice.name} (${notice.files.length} files)` },
    );
    if (!action) {
        return;
    }

    switch (action.label) {
        case ADD_TABS:
            await addFromTabs(provider, notice);
            break;
        case ADD_PICKER:
            await addFromPicker(provider, notice);
            break;
        case ADD_PATH: {
            const file = await promptForFileEntry();
            if (file) {
                await provider.updateNotice(notice.name, { files: [...notice.files, file] });
                vscode.window.showInformationMessage(`Added "${file.name}".`);
            }
            break;
        }
        case REMOVE:
            await removeFiles(provider, notice);
            break;
        case RENAME: {
            const newName = await promptForNewName(provider, 'New name', notice.name);
            if (newName && newName.trim() !== notice.name) {
                await provider.updateNotice(notice.name, { name: newName.trim() });
                vscode.window.showInformationMessage(`Renamed to "${newName}".`);
            }
            break;
        }
        case CHANGE_DESC: {
            const desc = await vscode.window.showInputBox({
                prompt: 'Description (leave empty to clear)',
                value: notice.description || '',
            });
            if (desc !== undefined) {
                await provider.updateNotice(notice.name, { description: desc.trim() || undefined });
            }
            break;
        }
    }
}

async function addFromTabs(provider: NoticeTreeProvider, notice: WorkspaceNotice): Promise<void> {
    const tabs = collectOpenTabs();
    if (tabs.length === 0) {
        vscode.window.showInformationMessage('No open file tabs.');
        return;
    }
    const existing = new Set(notice.files.map(f => f.path));
    const candidates = tabs.filter(t => !existing.has(t.relPath));
    if (candidates.length === 0) {
        vscode.window.showInformationMessage('All open tabs are already in this collection.');
        return;
    }
    const picked = await vscode.window.showQuickPick(
        candidates.map(t => ({ label: t.name, description: t.relPath, picked: true, relPath: t.relPath })),
        { canPickMany: true, placeHolder: `Select tabs to add to "${notice.name}"` },
    );
    if (!picked || picked.length === 0) {
        return;
    }
    const additions: NoticeFile[] = picked.map(p => ({ name: p.label, path: p.relPath }));
    await provider.updateNotice(notice.name, { files: [...notice.files, ...additions] });
    vscode.window.showInformationMessage(`Added ${additions.length} file(s).`);
}

async function addFromPicker(provider: NoticeTreeProvider, notice: WorkspaceNotice): Promise<void> {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri;
    const uris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectMany: true,
        defaultUri: root,
        openLabel: `Add to "${notice.name}"`,
    });
    if (!uris || uris.length === 0) {
        return;
    }
    const existing = new Set(notice.files.map(f => f.path));
    const additions: NoticeFile[] = [];
    for (const uri of uris) {
        const rel = toWorkspaceRelative(uri.fsPath);
        if (existing.has(rel)) {
            continue;
        }
        additions.push({ name: path.basename(uri.fsPath), path: rel });
    }
    if (additions.length === 0) {
        vscode.window.showInformationMessage('Nothing new to add.');
        return;
    }
    await provider.updateNotice(notice.name, { files: [...notice.files, ...additions] });
    vscode.window.showInformationMessage(`Added ${additions.length} file(s).`);
}

async function removeFiles(provider: NoticeTreeProvider, notice: WorkspaceNotice): Promise<void> {
    if (notice.files.length === 0) {
        vscode.window.showInformationMessage('Collection is empty.');
        return;
    }
    const picked = await vscode.window.showQuickPick(
        notice.files.map((f, idx) => ({ label: f.name, description: f.path, index: idx })),
        { canPickMany: true, placeHolder: `Select files to remove from "${notice.name}"` },
    );
    if (!picked || picked.length === 0) {
        return;
    }
    const removeIdx = new Set(picked.map(p => p.index));
    const remaining = notice.files.filter((_, i) => !removeIdx.has(i));
    await provider.updateNotice(notice.name, { files: remaining });
    vscode.window.showInformationMessage(`Removed ${picked.length} file(s).`);
}

// ---------------------------------------------------------------------------
// Manage (set as current / edit / open all / delete)
// ---------------------------------------------------------------------------

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
    const EDIT = '$(edit) Edit Collection';
    const OPEN_ALL = '$(go-to-file) Open All Files';
    const DELETE = '$(trash) Delete Collection';
    const action = await vscode.window.showQuickPick(
        [{ label: SET_CURRENT }, { label: EDIT }, { label: OPEN_ALL }, { label: DELETE }],
        { placeHolder: `Manage collection: ${selected.label}` },
    );
    if (!action) {
        return;
    }

    const notice = provider.getNotice(selected.label);
    if (!notice) {
        return;
    }
    const stubItem: NoticeItem = {
        id: `notice-collection-${notice.name}`,
        name: notice.name,
        type: 'notice-collection',
        collectionName: notice.name,
    };

    switch (action.label) {
        case SET_CURRENT:
            await provider.setCurrentNotice(selected.label);
            vscode.window.showInformationMessage(`Set current collection to: ${selected.label}`);
            break;
        case EDIT:
            await editNoticeCollection(provider, stubItem);
            break;
        case OPEN_ALL:
            await openAllInCollection(provider, stubItem);
            break;
        case DELETE: {
            const confirm = await vscode.window.showWarningMessage(
                `Are you sure you want to delete the collection "${selected.label}"?`,
                { modal: true },
                'Delete',
            );
            if (confirm === 'Delete') {
                await provider.removeNotice(selected.label);
                vscode.window.showInformationMessage(`Deleted collection: ${selected.label}`);
            }
            break;
        }
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface OpenTabInfo {
    name: string;
    relPath: string;
    uri: vscode.Uri;
}

/** Collect all open text-editor tabs across all tab groups (deduped by fsPath). */
function collectOpenTabs(): OpenTabInfo[] {
    const out: OpenTabInfo[] = [];
    const seen = new Set<string>();
    for (const group of vscode.window.tabGroups.all) {
        for (const tab of group.tabs) {
            const input = tab.input as { uri?: vscode.Uri } | undefined;
            const uri = input?.uri;
            if (!uri || uri.scheme !== 'file') {
                continue;
            }
            const key = uri.fsPath;
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            out.push({
                name: path.basename(uri.fsPath),
                relPath: toWorkspaceRelative(uri.fsPath),
                uri,
            });
        }
    }
    return out;
}

/** Convert an absolute path to a `./...` form relative to the first workspace folder. */
function toWorkspaceRelative(absPath: string): string {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!root) {
        return absPath;
    }
    const rel = path.relative(root, absPath).replace(/\\/g, '/');
    if (!rel || rel.startsWith('..')) {
        return absPath;
    }
    return `./${rel}`;
}

/** Resolve which collection the user wants to act on, prompting if needed. */
async function resolveCollection(
    provider: NoticeTreeProvider,
    item?: NoticeItem,
): Promise<WorkspaceNotice | undefined> {
    if (item?.type === 'notice-collection') {
        const name = item.collectionName ?? item.name;
        const found = provider.getNotice(name);
        if (found) {
            return found;
        }
    }
    const notices = provider.getNotices();
    if (notices.length === 0) {
        vscode.window.showInformationMessage('No workspace notice collections available.');
        return undefined;
    }
    if (notices.length === 1) {
        return notices[0];
    }
    const picked = await vscode.window.showQuickPick(
        notices.map(n => ({ label: n.name, description: `${n.files.length} files`, detail: n.description })),
        { placeHolder: 'Select a collection' },
    );
    return picked ? provider.getNotice(picked.label) : undefined;
}

async function promptForNewName(
    provider: NoticeTreeProvider,
    prompt: string,
    currentName?: string,
): Promise<string | undefined> {
    return vscode.window.showInputBox({
        prompt,
        value: currentName,
        validateInput: value => {
            const v = value?.trim();
            if (!v) {
                return 'Name cannot be empty';
            }
            if (v !== currentName && provider.getNotices().some(n => n.name === v)) {
                return 'A notice collection with this name already exists';
            }
            return undefined;
        },
    });
}

async function promptForFileEntry(): Promise<NoticeFile | undefined> {
    const fileName = await vscode.window.showInputBox({ prompt: 'Display name for the file' });
    if (!fileName) {
        return undefined;
    }
    const filePath = await vscode.window.showInputBox({
        prompt: 'File path (relative to workspace root)',
        value: './',
    });
    if (!filePath) {
        return undefined;
    }
    const fileDescription = await vscode.window.showInputBox({
        prompt: 'File description (optional)',
    });
    return { name: fileName, path: filePath, description: fileDescription || undefined };
}
