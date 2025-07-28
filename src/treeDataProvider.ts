import * as vscode from 'vscode';
import * as path from 'path';
import { OpsItem, OpsConfig, ConfigManager } from './configManager';

export class OpsTreeItem extends vscode.TreeItem {
    /**
     * item.type 可选值说明：
     *   - 'file'    ：普通文件，右键可“打开文件”
     *   - 'script'  ：可执行脚本，右键可“执行脚本”或“在终端打开目录”
     *   - 'command' ：自定义命令，右键可“执行命令”
     *   - 'category'：分组（自动生成，不建议手动配置）
     */
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
            case 'category':
                this.iconPath = new vscode.ThemeIcon('folder');
                break;
            case 'file':
                this.iconPath = new vscode.ThemeIcon('file');
                // 左键点击直接打开文件
                this.command = {
                    title: 'Open File',
                    command: 'lchOpsPanel.openFile',
                    arguments: [item]
                };
                break;
            case 'script':
                this.iconPath = new vscode.ThemeIcon('file-code');
                // Remove click command - use right-click menu instead
                break;
            case 'command':
                this.iconPath = new vscode.ThemeIcon('terminal');
                // Remove click command - use right-click menu instead
                break;
        }
    }
}

export class OpsTreeDataProvider implements vscode.TreeDataProvider<OpsItem>, vscode.Disposable {
    private _onDidChangeTreeData: vscode.EventEmitter<OpsItem | undefined | null | void> = new vscode.EventEmitter<OpsItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<OpsItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private config: OpsConfig = { categories: [], items: [] };
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
                this.config = { categories: [], items: [] };
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
                console.log('Config loaded successfully:', this.config);
            } catch (error) {
                console.error('Error loading config:', error);
                this.config = { categories: [], items: [] };
                this.isConfigLoaded = false;
            }
        } else {
            this.config = { categories: [], items: [] };
            this.isConfigLoaded = false;
        }
    }

    getTreeItem(element: OpsItem): vscode.TreeItem {
        const isCategory = element.type === 'category';
        const collapsibleState = isCategory ? 
            vscode.TreeItemCollapsibleState.Expanded : 
            vscode.TreeItemCollapsibleState.None;
        
        return new OpsTreeItem(element, collapsibleState);
    }

    getChildren(element?: OpsItem): Thenable<OpsItem[]> {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('No workspace folder is open');
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
            // Root level - show categories and uncategorized items
            return this.getRootItems();
        } else if (element.type === 'category') {
            // Show items in this category
            return this.getItemsInCategory(element.name);
        } else {
            return [];
        }
    }

    private getRootItems(): OpsItem[] {
        const items: OpsItem[] = [];
        
        // Add categories
        for (const categoryName of this.config.categories) {
            const categoryItems = this.getItemsInCategory(categoryName);
            if (categoryItems.length > 0) {
                items.push({
                    id: `category-${categoryName}`,
                    name: categoryName,
                    type: 'category',
                    description: `${categoryItems.length} items`
                });
            }
        }
        
        // Add uncategorized items
        const uncategorizedItems = this.config.items.filter(item => 
            !item.category || !this.config.categories.includes(item.category)
        );
        
        if (uncategorizedItems.length > 0) {
            items.push({
                id: 'category-uncategorized',
                name: 'Uncategorized',
                type: 'category',
                description: `${uncategorizedItems.length} items`
            });
        }
        
        return items;
    }

    private getItemsInCategory(categoryName: string): OpsItem[] {
        if (categoryName === 'Uncategorized') {
            return this.config.items.filter(item => 
                !item.category || !this.config.categories.includes(item.category)
            );
        }
        
        return this.config.items.filter(item => item.category === categoryName);
    }

    async addItem(item: Omit<OpsItem, 'id'>): Promise<void> {
        const newItem: OpsItem = {
            ...item,
            id: ConfigManager.generateId()
        };
        
        this.config.items.push(newItem);
        
        if (this.workspaceRoot) {
            await ConfigManager.saveConfig(this.workspaceRoot, this.config);
            this.refresh();
        }
    }

    async deleteItem(itemId: string): Promise<void> {
        this.config.items = this.config.items.filter(item => item.id !== itemId);
        
        if (this.workspaceRoot) {
            await ConfigManager.saveConfig(this.workspaceRoot, this.config);
            this.refresh();
        }
    }

    async updateItem(itemId: string, updates: Partial<OpsItem>): Promise<void> {
        const itemIndex = this.config.items.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
            this.config.items[itemIndex] = { ...this.config.items[itemIndex], ...updates };
            
            if (this.workspaceRoot) {
                await ConfigManager.saveConfig(this.workspaceRoot, this.config);
                this.refresh();
            }
        }
    }

    getConfig(): OpsConfig {
        return this.config;
    }
}
