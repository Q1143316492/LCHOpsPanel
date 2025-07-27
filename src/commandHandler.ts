import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { OpsItem } from './configManager';
import { OpsTreeDataProvider } from './treeDataProvider';

export class CommandHandler {
    constructor(private treeDataProvider: OpsTreeDataProvider) {}

    async openFile(item: OpsItem): Promise<void> {
        if (!item.path) {
            vscode.window.showErrorMessage('No path specified for this item');
            return;
        }

        try {
            let filePath = item.path;
            
            // If path is relative, make it relative to workspace
            if (!path.isAbsolute(filePath)) {
                const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (workspaceRoot) {
                    filePath = path.join(workspaceRoot, filePath);
                }
            }

            const uri = vscode.Uri.file(filePath);
            await vscode.window.showTextDocument(uri);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open file: ${error}`);
        }
    }

    async executeScript(item: OpsItem): Promise<void> {
        if (!item.path) {
            vscode.window.showErrorMessage('No path specified for this script');
            return;
        }

        try {
            let scriptPath = item.path;
            
            // If path is relative, make it relative to workspace
            if (!path.isAbsolute(scriptPath)) {
                const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (workspaceRoot) {
                    scriptPath = path.join(workspaceRoot, scriptPath);
                }
            }

            // Check if file exists
            if (!fs.existsSync(scriptPath)) {
                vscode.window.showErrorMessage(`Script file not found: ${scriptPath}`);
                return;
            }

            // Execute the script in terminal
            const terminal = vscode.window.createTerminal(`LCH Ops: ${item.name}`);
            const scriptDir = path.dirname(scriptPath);
            const scriptName = path.basename(scriptPath);
            
            terminal.sendText(`cd "${scriptDir}"`);
            
            // Determine how to execute based on file extension
            const ext = path.extname(scriptPath).toLowerCase();
            switch (ext) {
                case '.py':
                    terminal.sendText(`python "${scriptName}"`);
                    break;
                case '.js':
                    terminal.sendText(`node "${scriptName}"`);
                    break;
                case '.ps1':
                    terminal.sendText(`powershell -ExecutionPolicy Bypass -File "${scriptName}"`);
                    break;
                case '.bat':
                case '.cmd':
                    terminal.sendText(`"${scriptName}"`);
                    break;
                case '.sh':
                    terminal.sendText(`bash "${scriptName}"`);
                    break;
                default:
                    terminal.sendText(`"${scriptPath}"`);
            }
            
            terminal.show();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to execute script: ${error}`);
        }
    }

    async executeCommand(item: OpsItem): Promise<void> {
        if (!item.command) {
            vscode.window.showErrorMessage('No command specified for this item');
            return;
        }

        try {
            const terminal = vscode.window.createTerminal(`LCH Ops: ${item.name}`);
            
            // Change to workspace directory if available
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (workspaceRoot) {
                terminal.sendText(`cd "${workspaceRoot}"`);
            }
            
            terminal.sendText(item.command);
            terminal.show();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to execute command: ${error}`);
        }
    }

    async openInTerminal(item: OpsItem): Promise<void> {
        if (!item.path) {
            vscode.window.showErrorMessage('No path specified for this item');
            return;
        }

        try {
            let itemPath = item.path;
            
            // If path is relative, make it relative to workspace
            if (!path.isAbsolute(itemPath)) {
                const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (workspaceRoot) {
                    itemPath = path.join(workspaceRoot, itemPath);
                }
            }

            const itemDir = fs.lstatSync(itemPath).isDirectory() ? itemPath : path.dirname(itemPath);
            
            const terminal = vscode.window.createTerminal({
                name: `LCH Ops: ${item.name}`,
                cwd: itemDir
            });
            
            terminal.show();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open terminal: ${error}`);
        }
    }

    async addItem(): Promise<void> {
        const config = this.treeDataProvider.getConfig();
        
        // Ask user for item type
        const itemType = await vscode.window.showQuickPick([
            { label: 'File', value: 'file', description: 'A file to open' },
            { label: 'Script', value: 'script', description: 'An executable script' },
            { label: 'Command', value: 'command', description: 'A command to run' }
        ], {
            placeHolder: 'Select item type'
        });

        if (!itemType) {
            return;
        }

        // Ask for item name
        const name = await vscode.window.showInputBox({
            prompt: 'Enter item name',
            placeHolder: 'My Item'
        });

        if (!name) {
            return;
        }

        let path: string | undefined;
        let command: string | undefined;

        if (itemType.value === 'command') {
            // Ask for command
            command = await vscode.window.showInputBox({
                prompt: 'Enter command to execute',
                placeHolder: 'python3 test.py'
            });

            if (!command) {
                return;
            }
        } else {
            // Ask for file/script path
            const pathInput = await vscode.window.showInputBox({
                prompt: `Enter ${itemType.label.toLowerCase()} path`,
                placeHolder: itemType.value === 'file' ? './logs/app.log' : './scripts/deploy.py'
            });

            if (!pathInput) {
                return;
            }
            path = pathInput;
        }

        // Ask for description
        const description = await vscode.window.showInputBox({
            prompt: 'Enter description (optional)',
            placeHolder: 'Description of this item'
        });

        // Ask for category
        const categoryOptions = config.categories.map(cat => ({ label: cat, value: cat }));
        categoryOptions.push({ label: '+ New Category', value: '__new__' });

        const selectedCategory = await vscode.window.showQuickPick(categoryOptions, {
            placeHolder: 'Select category'
        });

        let category: string | undefined;
        if (selectedCategory?.value === '__new__') {
            category = await vscode.window.showInputBox({
                prompt: 'Enter new category name',
                placeHolder: 'Scripts'
            });
            
            if (category && !config.categories.includes(category)) {
                config.categories.push(category);
            }
        } else if (selectedCategory) {
            category = selectedCategory.value;
        }

        // Add the item
        await this.treeDataProvider.addItem({
            name,
            type: itemType.value as 'file' | 'script' | 'command',
            path,
            command,
            description,
            category
        });

        vscode.window.showInformationMessage(`Added ${itemType.label}: ${name}`);
    }

    async editItem(item: OpsItem): Promise<void> {
        // Create a simple edit dialog
        const name = await vscode.window.showInputBox({
            prompt: 'Enter item name',
            value: item.name
        });

        if (!name) {
            return;
        }

        let path = item.path;
        let command = item.command;

        if (item.type === 'command') {
            command = await vscode.window.showInputBox({
                prompt: 'Enter command to execute',
                value: item.command || ''
            });
        } else {
            path = await vscode.window.showInputBox({
                prompt: `Enter ${item.type} path`,
                value: item.path || ''
            });
        }

        const description = await vscode.window.showInputBox({
            prompt: 'Enter description (optional)',
            value: item.description || ''
        });

        // Update the item
        await this.treeDataProvider.updateItem(item.id, {
            name,
            path,
            command,
            description: description || undefined
        });

        vscode.window.showInformationMessage(`Updated: ${name}`);
    }

    async deleteItem(item: OpsItem): Promise<void> {
        const confirm = await vscode.window.showWarningMessage(
            `Are you sure you want to delete "${item.name}"?`,
            { modal: true },
            'Delete'
        );

        if (confirm === 'Delete') {
            await this.treeDataProvider.deleteItem(item.id);
            vscode.window.showInformationMessage(`Deleted: ${item.name}`);
        }
    }
}
