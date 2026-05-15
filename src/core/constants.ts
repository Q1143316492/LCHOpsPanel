/**
 * Centralized identifiers used across the extension.
 * Keep view IDs and command IDs in sync with package.json `contributes`.
 */

export const CONFIG_FILE_NAME = '.lch-ops-panel.json';

export const VIEW_IDS = {
    opsPanel: 'lchOpsPanelView',
    noticeCollection: 'lchNoticeCollectionView',
    gamesPanel: 'lchGamesPanelView',
    jsonTreeEditor: 'lchOpsPanel.jsonTreeEditor',
} as const;

export const COMMANDS = {
    // Ops panel
    refresh: 'lchOpsPanel.refresh',
    addItem: 'lchOpsPanel.addItem',
    editItem: 'lchOpsPanel.editItem',
    deleteItem: 'lchOpsPanel.deleteItem',
    openFile: 'lchOpsPanel.openFile',
    executeScript: 'lchOpsPanel.executeScript',
    openInTerminal: 'lchOpsPanel.openInTerminal',
    executeCommand: 'lchOpsPanel.executeCommand',
    openConfigFile: 'lchOpsPanel.openConfigFile',
    // Notices
    switchNoticeCollection: 'lchOpsPanel.switchNoticeCollection',
    addNoticeCollection: 'lchOpsPanel.addNoticeCollection',
    manageNoticeCollections: 'lchOpsPanel.manageNoticeCollections',
    // Games
    switchGame: 'lchOpsPanel.switchGame',
    resetGame: 'lchOpsPanel.resetGame',
    startGame2048: 'lchOpsPanel.startGame2048',
    startGameMinesweeper: 'lchOpsPanel.startGameMinesweeper',
    // JSON editor
    openJsonEditor: 'lchOpsPanel.openJsonEditor',
} as const;
