import * as vscode from 'vscode';
import { OpsTreeDataProvider } from './treeDataProvider';
import { NoticeCollectionProvider } from './noticeCollectionProvider';
import { GamesPanelProvider } from './gamesPanelProvider';
import { CommandHandler } from './commandHandler';
import * as path from 'path'; // Add this line

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log('LCHOpsPanel extension activating...');
    
    // Create the tree data providers
    const treeDataProvider = new OpsTreeDataProvider();
    const noticeCollectionProvider = new NoticeCollectionProvider();
    const gamesPanelProvider = new GamesPanelProvider(context.extensionUri, context);
    
    // Create the tree views
    const treeView = vscode.window.createTreeView('lchOpsPanelView', {
        treeDataProvider: treeDataProvider,
        showCollapseAll: true
    });
    
    const noticeCollectionView = vscode.window.createTreeView('lchNoticeCollectionView', {
        treeDataProvider: noticeCollectionProvider,
        showCollapseAll: true
    });

    // Register the games webview view provider
    const gamesView = vscode.window.registerWebviewViewProvider(
        GamesPanelProvider.viewType,
        gamesPanelProvider
    );
    
    console.log('Tree views created successfully');

    // Create command handler - pass both providers
    const commandHandler = new CommandHandler(treeDataProvider, noticeCollectionProvider);

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
        }),
        
        vscode.commands.registerCommand('lchOpsPanel.switchNoticeCollection', () => {
            commandHandler.switchNoticeCollection();
        }),
        
        vscode.commands.registerCommand('lchOpsPanel.addNoticeCollection', () => {
            commandHandler.addNoticeCollection();
        }),
        
        vscode.commands.registerCommand('lchOpsPanel.manageNoticeCollections', () => {
            commandHandler.manageNoticeCollections();
        }),

        vscode.commands.registerCommand('lchOpsPanel.switchGame', async () => {
            const games = ['2048', 'minesweeper'];
            const gameNames = {
                '2048': '2048 - Number Puzzle',
                'minesweeper': 'Minesweeper - Mine Hunter'
            };
            
            const items = games.map(game => ({
                label: gameNames[game as keyof typeof gameNames],
                value: game
            }));
            
            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a game to play'
            });
            
            if (selected) {
                gamesPanelProvider.switchGame(selected.value);
            }
        }),

        vscode.commands.registerCommand('lchOpsPanel.resetGame', () => {
            gamesPanelProvider.resetCurrentGame();
        }),

        vscode.commands.registerCommand('lchOpsPanel.startGame2048', () => {
            gamesPanelProvider.switchGame('2048');
        }),

        vscode.commands.registerCommand('lchOpsPanel.startGameMinesweeper', () => {
            gamesPanelProvider.switchGame('minesweeper');
        }),

        vscode.commands.registerCommand('lchOpsPanel.openConfigFile', async () => {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                const rootPath = workspaceFolders[0].uri.fsPath;
                const configFilePath = vscode.Uri.file(path.join(rootPath, '.lch-ops-panel.json'));
                try {
                    await vscode.window.showTextDocument(configFilePath);
                } catch (error) {
                    vscode.window.showErrorMessage(`无法打开配置文件: ${error}`);
                }
            } else {
                vscode.window.showInformationMessage('没有打开的工作区文件夹。');
            }
        })
    ];

    // Add all commands to subscriptions
    commands.forEach(command => context.subscriptions.push(command));
    
    // Add tree views to subscriptions
    context.subscriptions.push(treeView);
    context.subscriptions.push(noticeCollectionView);
    context.subscriptions.push(gamesView);
    
    // Add tree data providers to subscriptions for proper disposal
    context.subscriptions.push(treeDataProvider);
    context.subscriptions.push(noticeCollectionProvider);

    // Show welcome message
    vscode.window.showInformationMessage('LCHOpsPanel is ready!');
    
    console.log('LCHOpsPanel extension activated successfully!');
}

// This method is called when your extension is deactivated
export function deactivate() {
    // Clean up resources
}
