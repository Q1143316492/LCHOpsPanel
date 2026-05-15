import * as vscode from 'vscode';
import { ConfigStore, generateId } from '../../core/configStore';
import { OpsItem } from '../../core/types';
import { OpsTreeItem } from './opsTreeItem';

const UNCATEGORIZED = 'Uncategorized';

/**
 * Tree data provider for the Operations Panel view.
 * Pure rendering on top of ConfigStore — no I/O or watchers of its own.
 */
export class OpsTreeProvider implements vscode.TreeDataProvider<OpsItem> {
    private readonly _onDidChangeTreeData = new vscode.EventEmitter<OpsItem | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private readonly store: ConfigStore) {
        store.onDidChange(() => this._onDidChangeTreeData.fire());
    }

    refresh(): void {
        void this.store.reload().then(() => this._onDidChangeTreeData.fire());
    }

    getTreeItem(element: OpsItem): vscode.TreeItem {
        const collapsible = element.type === 'category'
            ? vscode.TreeItemCollapsibleState.Expanded
            : vscode.TreeItemCollapsibleState.None;
        return new OpsTreeItem(element, collapsible);
    }

    getChildren(element?: OpsItem): OpsItem[] {
        if (!this.store.workspaceRoot) {
            return [];
        }
        if (!element) {
            return this._getRootItems();
        }
        if (element.type === 'category') {
            return this._getItemsInCategory(element.name);
        }
        return [];
    }

    private _getRootItems(): OpsItem[] {
        const { categories } = this.store.config;
        const items: OpsItem[] = [];

        for (const name of categories) {
            const children = this._getItemsInCategory(name);
            if (children.length > 0) {
                items.push({
                    id: `category-${name}`,
                    name,
                    type: 'category',
                    description: `${children.length} items`,
                });
            }
        }

        const uncategorized = this._getItemsInCategory(UNCATEGORIZED);
        if (uncategorized.length > 0) {
            items.push({
                id: 'category-uncategorized',
                name: UNCATEGORIZED,
                type: 'category',
                description: `${uncategorized.length} items`,
            });
        }
        return items;
    }

    private _getItemsInCategory(name: string): OpsItem[] {
        const { items, categories } = this.store.config;
        if (name === UNCATEGORIZED) {
            return items.filter(it => !it.category || !categories.includes(it.category));
        }
        return items.filter(it => it.category === name);
    }

    // --- Mutations ----------------------------------------------------------

    async addItem(item: Omit<OpsItem, 'id'>): Promise<void> {
        this.store.config.items.push({ ...item, id: generateId() });
        await this.store.save();
    }

    async deleteItem(itemId: string): Promise<void> {
        this.store.config.items = this.store.config.items.filter(it => it.id !== itemId);
        await this.store.save();
    }

    async updateItem(itemId: string, updates: Partial<OpsItem>): Promise<void> {
        const items = this.store.config.items;
        const idx = items.findIndex(it => it.id === itemId);
        if (idx !== -1) {
            items[idx] = { ...items[idx], ...updates };
            await this.store.save();
        }
    }
}
