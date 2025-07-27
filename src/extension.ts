// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { OpsTreeDataProvider } from './treeDataProvider';
import { CommandHandler } from './commandHandler';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log('LCHOpsPanel extension is now active!');

    // Create the tree data provider
    const treeDataProvider = new OpsTreeDataProvider();
    
    // Create the tree view
    const treeView = vscode.window.createTreeView('lchOpsPanelView', {
        treeDataProvider: treeDataProvider,
        showCollapseAll: true
    });

    // Create command handler
    const commandHandler = new CommandHandler(treeDataProvider);

    // Register commands
    const commands = [
        vscode.commands.registerCommand('lchOpsPanel.refresh', () => {
            treeDataProvider.refresh();
        }),
        
        vscode.commands.registerCommand('lchOpsPanel.addItem', () => {
            commandHandler.addItem();
        }),
        
        vscode.commands.registerCommand('lchOpsPanel.editItem', (item) => {
            commandHandler.editItem(item);
        }),
        
        vscode.commands.registerCommand('lchOpsPanel.deleteItem', (item) => {
            commandHandler.deleteItem(item);
        }),
        
        vscode.commands.registerCommand('lchOpsPanel.openFile', (item) => {
            commandHandler.openFile(item);
        }),
        
        vscode.commands.registerCommand('lchOpsPanel.executeScript', (item) => {
            commandHandler.executeScript(item);
        }),
        
        vscode.commands.registerCommand('lchOpsPanel.openInTerminal', (item) => {
            commandHandler.openInTerminal(item);
        }),
        
        vscode.commands.registerCommand('lchOpsPanel.executeCommand', (item) => {
            commandHandler.executeCommand(item);
        })
    ];

    // Add all commands to subscriptions
    commands.forEach(command => context.subscriptions.push(command));
    
    // Add tree view to subscriptions
    context.subscriptions.push(treeView);

    // Show welcome message
    vscode.window.showInformationMessage('LCHOpsPanel is ready! You can now manage your workspace configurations.');
}

// This method is called when your extension is deactivated
export function deactivate() {
    console.log('LCHOpsPanel extension is deactivated.');
}
