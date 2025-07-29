import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { OpsItem, WorkspaceNotice, NoticeFile } from './configManager';
import { OpsTreeDataProvider } from './treeDataProvider';
import { NoticeCollectionProvider } from './noticeCollectionProvider';

export class CommandHandler {
    constructor(
        private treeDataProvider: OpsTreeDataProvider,
        private noticeCollectionProvider: NoticeCollectionProvider
    ) {}

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

    async switchNoticeCollection(): Promise<void> {
        const notices = this.noticeCollectionProvider.getWorkspaceNotices();
        
        if (notices.length === 0) {
            vscode.window.showInformationMessage('No workspace notice collections available. Create one first.');
            return;
        }

        const items = notices.map((notice: WorkspaceNotice) => ({
            label: notice.name,
            description: `${notice.files.length} files - ${notice.description || 'No description'}`
        }));

        // Add option to clear current selection
        items.unshift({
            label: '$(close) Clear Selection',
            description: 'Hide the current notice collection'
        });

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a workspace notice collection to display'
        });

        if (selected) {
            if (selected.label === '$(close) Clear Selection') {
                await this.noticeCollectionProvider.setCurrentNotice('');
                vscode.window.showInformationMessage('Notice collection cleared');
            } else {
                await this.noticeCollectionProvider.setCurrentNotice(selected.label);
                vscode.window.showInformationMessage(`Switched to notice collection: ${selected.label}`);
            }
        }
    }

    async addNoticeCollection(): Promise<void> {
        const name = await vscode.window.showInputBox({
            prompt: 'Enter name for the new notice collection',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Name cannot be empty';
                }
                const existing = this.noticeCollectionProvider.getWorkspaceNotices();
                if (existing.find((n: WorkspaceNotice) => n.name === value.trim())) {
                    return 'A notice collection with this name already exists';
                }
                return undefined;
            }
        });

        if (!name) {
            return;
        }

        const description = await vscode.window.showInputBox({
            prompt: 'Enter description for the notice collection (optional)'
        });

        const files: NoticeFile[] = [];
        
        // Allow user to add files
        while (true) {
            const addFile = await vscode.window.showQuickPick([
                { label: '$(add) Add File', description: 'Add a file to this collection' },
                { label: '$(check) Done', description: 'Finish creating the collection' }
            ], {
                placeHolder: `Collection "${name}" has ${files.length} files. Add more or finish?`
            });

            if (!addFile || addFile.label === '$(check) Done') {
                break;
            }

            const fileName = await vscode.window.showInputBox({
                prompt: 'Enter display name for the file'
            });

            if (!fileName) {
                continue;
            }

            const filePath = await vscode.window.showInputBox({
                prompt: 'Enter file path (relative to workspace root)',
                value: './'
            });

            if (!filePath) {
                continue;
            }

            const fileDescription = await vscode.window.showInputBox({
                prompt: 'Enter file description (optional)'
            });

            files.push({
                name: fileName,
                path: filePath,
                description: fileDescription || undefined
            });
        }

        if (files.length === 0) {
            vscode.window.showWarningMessage('Cannot create empty notice collection');
            return;
        }

        const notice: WorkspaceNotice = {
            name: name.trim(),
            description: description?.trim() || undefined,
            files
        };

        await this.noticeCollectionProvider.addWorkspaceNotice(notice);
        vscode.window.showInformationMessage(`Created notice collection: ${notice.name} with ${files.length} files`);
    }

    async manageNoticeCollections(): Promise<void> {
        const notices = this.noticeCollectionProvider.getWorkspaceNotices();
        
        if (notices.length === 0) {
            vscode.window.showInformationMessage('No workspace notice collections available.');
            return;
        }

        const items = notices.map((notice: WorkspaceNotice) => ({
            label: notice.name,
            description: `${notice.files.length} files`,
            detail: notice.description
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a notice collection to manage'
        });

        if (!selected) {
            return;
        }

        const actions = await vscode.window.showQuickPick([
            { label: '$(eye) Set as Current', description: 'Display this collection in the tree' },
            { label: '$(edit) Edit Collection', description: 'Modify files in this collection' },
            { label: '$(trash) Delete Collection', description: 'Remove this collection' }
        ], {
            placeHolder: `Manage collection: ${selected.label}`
        });

        if (!actions) {
            return;
        }

        switch (actions.label) {
            case '$(eye) Set as Current':
                await this.noticeCollectionProvider.setCurrentNotice(selected.label);
                vscode.window.showInformationMessage(`Set current collection to: ${selected.label}`);
                break;
                
            case '$(edit) Edit Collection':
                vscode.window.showInformationMessage('Edit functionality coming soon!');
                // TODO: Implement edit functionality
                break;
                
            case '$(trash) Delete Collection':
                const confirm = await vscode.window.showWarningMessage(
                    `Are you sure you want to delete the collection "${selected.label}"?`,
                    { modal: true },
                    'Delete'
                );
                
                if (confirm === 'Delete') {
                    await this.noticeCollectionProvider.removeWorkspaceNotice(selected.label);
                    vscode.window.showInformationMessage(`Deleted collection: ${selected.label}`);
                }
                break;
        }
    }
}
