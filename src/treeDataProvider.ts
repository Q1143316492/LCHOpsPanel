import * as vscode from 'vscode';
import * as path from 'path';
import { OpsItem, OpsConfig, ConfigManager } from './configManager';

export class OpsTreeItem extends vscode.TreeItem {
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
                // Remove click command - use right-click menu instead
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

export class OpsTreeDataProvider implements vscode.TreeDataProvider<OpsItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<OpsItem | undefined | null | void> = new vscode.EventEmitter<OpsItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<OpsItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private config: OpsConfig = { categories: [], items: [] };
    private workspaceRoot: string | undefined;

    constructor() {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        this.loadConfig();
    }

    refresh(): void {
        this.loadConfig();
        this._onDidChangeTreeData.fire();
    }

    private async loadConfig(): Promise<void> {
        if (this.workspaceRoot) {
            this.config = await ConfigManager.loadConfig(this.workspaceRoot);
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

        if (!element) {
            // Root level - show categories and uncategorized items
            return Promise.resolve(this.getRootItems());
        } else if (element.type === 'category') {
            // Show items in this category
            return Promise.resolve(this.getItemsInCategory(element.name));
        } else {
            return Promise.resolve([]);
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
