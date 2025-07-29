import * as vscode from 'vscode';
import * as path from 'path';
import { OpsItem, OpsConfig, ConfigManager, WorkspaceNotice, NoticeFile } from './configManager';

export class NoticeCollectionTreeItem extends vscode.TreeItem {
    constructor(
        public readonly item: OpsItem,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(item.name, collapsibleState);

        this.tooltip = item.description || item.name;
        this.description = item.description;

        // Set context value for menu visibility
        this.contextValue = item.type;

        // Set icons based on item type
        switch (item.type) {
            case 'notice-collection':
                this.iconPath = new vscode.ThemeIcon('folder-library');
                break;
            case 'notice-folder':
                this.iconPath = new vscode.ThemeIcon('folder');
                break;
            case 'notice-file':
                this.iconPath = new vscode.ThemeIcon('file');
                // 左键点击直接打开文件
                this.command = {
                    title: 'Open File',
                    command: 'lchOpsPanel.openFile',
                    arguments: [item]
                };
                break;
        }
    }
}

export class NoticeCollectionProvider implements vscode.TreeDataProvider<OpsItem>, vscode.Disposable {
    private _onDidChangeTreeData: vscode.EventEmitter<OpsItem | undefined | null | void> = new vscode.EventEmitter<OpsItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<OpsItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private config: OpsConfig = { categories: [], items: [], workspaceNotices: [], currentNoticeName: '' };
    private workspaceRoot: string | undefined;
    private fileWatcher: vscode.FileSystemWatcher | undefined;
    private workspaceFoldersListener: vscode.Disposable | undefined;
    private isConfigLoaded: boolean = false;

    constructor() {
        this.initialize();
    }

    private async initialize(): Promise<void> {
        // 监听workspace文件夹变化
        this.workspaceFoldersListener = vscode.workspace.onDidChangeWorkspaceFolders(async () => {
            await this.updateWorkspaceRoot();
        });

        // 初始化workspace root
        await this.updateWorkspaceRoot();
    }

    private async updateWorkspaceRoot(): Promise<void> {
        const newWorkspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

        if (this.workspaceRoot !== newWorkspaceRoot) {
            // 清理旧的文件监听器
            if (this.fileWatcher) {
                this.fileWatcher.dispose();
                this.fileWatcher = undefined;
            }

            this.workspaceRoot = newWorkspaceRoot;

            if (this.workspaceRoot) {
                // 加载新的配置
                await this.loadConfig();
                this.setupFileWatcher();
                // 刷新树视图
                this._onDidChangeTreeData.fire();
            } else {
                // 没有workspace时清空配置
                this.config = { categories: [], items: [], workspaceNotices: [], currentNoticeName: '' };
                this.isConfigLoaded = false;
                this._onDidChangeTreeData.fire();
            }
        }
    }

    refresh(): void {
        this.loadConfig();
        this._onDidChangeTreeData.fire();
    }

    private setupFileWatcher(): void {
        if (this.workspaceRoot) {
            const configFile = path.join(this.workspaceRoot, '.lch-ops-panel.json');
            this.fileWatcher = vscode.workspace.createFileSystemWatcher(configFile);

            this.fileWatcher.onDidChange(() => {
                this.refresh();
            });

            this.fileWatcher.onDidCreate(() => {
                this.refresh();
            });

            this.fileWatcher.onDidDelete(() => {
                this.refresh();
            });
        }
    }

    dispose(): void {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }
        if (this.workspaceFoldersListener) {
            this.workspaceFoldersListener.dispose();
        }
    }

    private async loadConfig(): Promise<void> {
        if (this.workspaceRoot) {
            try {
                this.config = await ConfigManager.loadConfig(this.workspaceRoot);
                this.isConfigLoaded = true;
                console.log('Notice collection config loaded successfully:', this.config);
            } catch (error) {
                console.error('Error loading notice collection config:', error);
                this.config = { categories: [], items: [], workspaceNotices: [], currentNoticeName: '' };
                this.isConfigLoaded = false;
            }
        } else {
            this.config = { categories: [], items: [], workspaceNotices: [], currentNoticeName: '' };
            this.isConfigLoaded = false;
        }
    }

    getTreeItem(element: OpsItem): vscode.TreeItem {
        const hasChildren = element.type === 'notice-collection' ||
            element.type === 'notice-folder';
        const collapsibleState = hasChildren ?
            vscode.TreeItemCollapsibleState.Expanded :
            vscode.TreeItemCollapsibleState.None;

        return new NoticeCollectionTreeItem(element, collapsibleState);
    }

    getChildren(element?: OpsItem): Thenable<OpsItem[]> {
        if (!this.workspaceRoot) {
            return Promise.resolve([]);
        }

        // 如果配置还没加载完成，先加载配置
        if (!this.isConfigLoaded) {
            return this.loadConfig().then(() => {
                return this.getChildrenInternal(element);
            });
        }

        return Promise.resolve(this.getChildrenInternal(element));
    }

    private getChildrenInternal(element?: OpsItem): OpsItem[] {
        if (!element) {
            // Root level - show all notice collections
            return this.getNoticeCollections();
        } else if (element.type === 'notice-collection') {
            // Show files in this notice collection
            return this.getNoticeCollectionFiles(element.name.replace(/^📋\s*/, '').replace(/\s*\(\d+\s*files\)$/, ''));
        } else if (element.type === 'notice-folder') {
            // Show files in this folder
            return element.children || [];
        } else {
            return [];
        }
    }

    private getNoticeCollections(): OpsItem[] {
        if (!this.config.workspaceNotices) {
            return [];
        }

        if (this.config.currentNoticeName) {
            const notice = this.config.workspaceNotices.find(
                n => n.name === this.config.currentNoticeName
            );
            return notice
                ? [{
                    id: `notice-collection-${notice.name}`,
                    name: `📋 ${notice.name} (${notice.files.length} files)`,
                    type: 'notice-collection' as const,
                    description: notice.description || `File collection: ${notice.name}`
                }]
                : [];
        }

        return this.config.workspaceNotices.map(notice => ({
            id: `notice-collection-${notice.name}`,
            name: `📋 ${notice.name} (${notice.files.length} files)`,
            type: 'notice-collection' as const,
            description: notice.description || `File collection: ${notice.name}`
        }));
    }

    private getNoticeCollectionFiles(collectionName: string): OpsItem[] {
        if (!this.config.workspaceNotices) {
            return [];
        }

        const collection = this.config.workspaceNotices.find(
            notice => notice.name === collectionName
        );

        if (!collection) {
            return [];
        }

        // Create tree structure from flat file list
        const folderMap = new Map<string, OpsItem>();
        const rootFiles: OpsItem[] = [];

        collection.files.forEach((file, index) => {
            const pathParts = file.path.split('/').filter(part => part !== '.');

            if (pathParts.length === 1) {
                // Root level file
                rootFiles.push({
                    id: `notice-file-${index}`,
                    name: file.name,
                    type: 'notice-file',
                    path: file.path,
                    description: file.description
                });
            } else {
                // File in a folder - create folder structure
                let currentPath = '';
                let parentFolder: OpsItem | null = null;

                for (let i = 0; i < pathParts.length - 1; i++) {
                    currentPath += (currentPath ? '/' : '') + pathParts[i];

                    if (!folderMap.has(currentPath)) {
                        const folder: OpsItem = {
                            id: `notice-folder-${currentPath}`,
                            name: pathParts[i],
                            type: 'notice-folder',
                            children: [],
                            description: `Folder: ${pathParts[i]}`
                        };

                        folderMap.set(currentPath, folder);

                        if (parentFolder) {
                            parentFolder.children = parentFolder.children || [];
                            parentFolder.children.push(folder);
                        } else {
                            rootFiles.push(folder);
                        }
                    }

                    parentFolder = folderMap.get(currentPath)!;
                }

                // Add the file to its parent folder
                const fileItem: OpsItem = {
                    id: `notice-file-${index}`,
                    name: file.name,
                    type: 'notice-file',
                    path: file.path,
                    description: file.description
                };

                if (parentFolder) {
                    parentFolder.children = parentFolder.children || [];
                    parentFolder.children.push(fileItem);
                }
            }
        });

        return rootFiles;
    }

    // Notice collection management methods
    async setCurrentNotice(noticeName: string): Promise<void> {
        this.config.currentNoticeName = noticeName;

        if (this.workspaceRoot) {
            await ConfigManager.saveConfig(this.workspaceRoot, this.config);
            this.refresh();
        }
    }

    async addWorkspaceNotice(notice: WorkspaceNotice): Promise<void> {
        if (!this.config.workspaceNotices) {
            this.config.workspaceNotices = [];
        }

        this.config.workspaceNotices.push(notice);

        if (this.workspaceRoot) {
            await ConfigManager.saveConfig(this.workspaceRoot, this.config);
            this.refresh();
        }
    }

    async removeWorkspaceNotice(noticeName: string): Promise<void> {
        if (!this.config.workspaceNotices) {
            return;
        }

        this.config.workspaceNotices = this.config.workspaceNotices.filter(
            notice => notice.name !== noticeName
        );

        // If the removed notice was the current one, clear the current notice
        if (this.config.currentNoticeName === noticeName) {
            this.config.currentNoticeName = '';
        }

        if (this.workspaceRoot) {
            await ConfigManager.saveConfig(this.workspaceRoot, this.config);
            this.refresh();
        }
    }

    getWorkspaceNotices(): WorkspaceNotice[] {
        return this.config.workspaceNotices || [];
    }

    getCurrentNoticeName(): string {
        return this.config.currentNoticeName || '';
    }

    getConfig(): OpsConfig {
        return this.config;
    }
}
