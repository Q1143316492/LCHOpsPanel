import * as vscode from 'vscode';
import { ConfigStore } from '../../core/configStore';
import { COMMANDS } from '../../core/constants';
import { NoticeItem, WorkspaceNotice } from '../../core/types';

class NoticeTreeItem extends vscode.TreeItem {
    constructor(item: NoticeItem, collapsibleState: vscode.TreeItemCollapsibleState) {
        super(item.name, collapsibleState);
        this.tooltip = item.description || item.name;
        this.description = item.description;
        this.contextValue = item.type;

        switch (item.type) {
            case 'notice-collection':
                this.iconPath = new vscode.ThemeIcon('folder-library');
                break;
            case 'notice-folder':
                this.iconPath = new vscode.ThemeIcon('folder');
                break;
            case 'notice-file':
                this.iconPath = new vscode.ThemeIcon('file');
                this.command = {
                    title: 'Open File',
                    command: COMMANDS.openFile,
                    arguments: [item],
                };
                break;
        }
    }
}

/**
 * Tree data provider for the Notice Collections view.
 *
 * If `currentNoticeName` is set, only that collection is shown; otherwise all are listed.
 * Each collection's flat file list is rendered as a folder tree based on `/` separators.
 */
export class NoticeTreeProvider implements vscode.TreeDataProvider<NoticeItem> {
    private readonly _onDidChangeTreeData = new vscode.EventEmitter<NoticeItem | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private readonly store: ConfigStore) {
        store.onDidChange(() => this._onDidChangeTreeData.fire());
    }

    refresh(): void {
        void this.store.reload().then(() => this._onDidChangeTreeData.fire());
    }

    getTreeItem(element: NoticeItem): vscode.TreeItem {
        const hasChildren = element.type === 'notice-collection' || element.type === 'notice-folder';
        const collapsible = hasChildren
            ? vscode.TreeItemCollapsibleState.Expanded
            : vscode.TreeItemCollapsibleState.None;
        return new NoticeTreeItem(element, collapsible);
    }

    getChildren(element?: NoticeItem): NoticeItem[] {
        if (!this.store.workspaceRoot) {
            return [];
        }
        if (!element) {
            return this._getCollections();
        }
        if (element.type === 'notice-collection') {
            const real = element.collectionName ?? element.name;
            return this._getCollectionTree(real);
        }
        if (element.type === 'notice-folder') {
            return element.children || [];
        }
        return [];
    }

    private _getCollections(): NoticeItem[] {
        const notices = this.store.config.workspaceNotices;
        const current = this.store.config.currentNoticeName;

        const toItem = (n: WorkspaceNotice): NoticeItem => ({
            id: `notice-collection-${n.name}`,
            name: `📋 ${n.name} (${n.files.length} files)`,
            type: 'notice-collection',
            description: n.description || `File collection: ${n.name}`,
            collectionName: n.name,
        });

        if (current) {
            const found = notices.find(n => n.name === current);
            return found ? [toItem(found)] : [];
        }
        return notices.map(toItem);
    }

    private _getCollectionTree(collectionName: string): NoticeItem[] {
        const collection = this.store.config.workspaceNotices.find(n => n.name === collectionName);
        if (!collection) {
            return [];
        }

        const folderMap = new Map<string, NoticeItem>();
        const roots: NoticeItem[] = [];

        collection.files.forEach((file, index) => {
            const parts = file.path.split('/').filter(p => p !== '.');
            const fileItem: NoticeItem = {
                id: `notice-file-${index}`,
                name: file.name,
                type: 'notice-file',
                path: file.path,
                description: file.description,
            };

            if (parts.length === 1) {
                roots.push(fileItem);
                return;
            }

            let currentPath = '';
            let parent: NoticeItem | null = null;
            for (let i = 0; i < parts.length - 1; i++) {
                currentPath += (currentPath ? '/' : '') + parts[i];
                if (!folderMap.has(currentPath)) {
                    const folder: NoticeItem = {
                        id: `notice-folder-${currentPath}`,
                        name: parts[i],
                        type: 'notice-folder',
                        children: [],
                        description: `Folder: ${parts[i]}`,
                    };
                    folderMap.set(currentPath, folder);
                    if (parent) {
                        parent.children = parent.children || [];
                        parent.children.push(folder);
                    } else {
                        roots.push(folder);
                    }
                }
                parent = folderMap.get(currentPath)!;
            }
            if (parent) {
                parent.children = parent.children || [];
                parent.children.push(fileItem);
            }
        });

        return roots;
    }

    // --- Mutations ----------------------------------------------------------

    async setCurrentNotice(name: string): Promise<void> {
        this.store.config.currentNoticeName = name;
        await this.store.save();
    }

    async addNotice(notice: WorkspaceNotice): Promise<void> {
        this.store.config.workspaceNotices.push(notice);
        await this.store.save();
    }

    async removeNotice(name: string): Promise<void> {
        const cfg = this.store.config;
        cfg.workspaceNotices = cfg.workspaceNotices.filter(n => n.name !== name);
        if (cfg.currentNoticeName === name) {
            cfg.currentNoticeName = '';
        }
        await this.store.save();
    }

    async updateNotice(name: string, updates: Partial<WorkspaceNotice>): Promise<void> {
        const cfg = this.store.config;
        const idx = cfg.workspaceNotices.findIndex(n => n.name === name);
        if (idx === -1) {
            return;
        }
        const next = { ...cfg.workspaceNotices[idx], ...updates };
        cfg.workspaceNotices[idx] = next;
        // If the collection was renamed and was current, keep the pointer in sync.
        if (updates.name && updates.name !== name && cfg.currentNoticeName === name) {
            cfg.currentNoticeName = updates.name;
        }
        await this.store.save();
    }

    getNotice(name: string): WorkspaceNotice | undefined {
        return this.store.config.workspaceNotices.find(n => n.name === name);
    }

    getNotices(): WorkspaceNotice[] {
        return this.store.config.workspaceNotices;
    }
}
