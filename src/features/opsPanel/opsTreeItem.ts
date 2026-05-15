import * as vscode from 'vscode';
import { OpsItem } from '../../core/types';
import { COMMANDS } from '../../core/constants';

/**
 * Tree item used by the Operations Panel view.
 * Visual concerns only — data lives in OpsItem.
 */
export class OpsTreeItem extends vscode.TreeItem {
    constructor(
        public readonly item: OpsItem,
        collapsibleState: vscode.TreeItemCollapsibleState,
    ) {
        super(item.name, collapsibleState);
        this.tooltip = item.description || item.name;
        this.description = item.description;
        this.contextValue = item.type;

        switch (item.type) {
            case 'category':
                this.iconPath = new vscode.ThemeIcon('folder');
                break;
            case 'file':
                this.iconPath = new vscode.ThemeIcon('file');
                this.command = {
                    title: 'Open File',
                    command: COMMANDS.openFile,
                    arguments: [item],
                };
                break;
            case 'script':
                this.iconPath = new vscode.ThemeIcon('file-code');
                break;
            case 'command':
                this.iconPath = new vscode.ThemeIcon('terminal');
                break;
        }
    }
}
