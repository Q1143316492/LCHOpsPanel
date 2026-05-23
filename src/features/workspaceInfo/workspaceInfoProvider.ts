import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigStore } from '../../core/configStore';

interface WorkspaceInfoData {
    folderPath: string;
    folderName: string;
    gitBranch: string | null;
    svnUrl: string | null;
}

class InfoTreeItem extends vscode.TreeItem {
    constructor(label: string, description: string, iconId: string, tooltip: string) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.description = description;
        this.iconPath = new vscode.ThemeIcon(iconId);
        this.tooltip = tooltip;
        this.contextValue = 'workspaceInfoItem';
    }
}

/**
 * Tree data provider that displays persistent workspace identity information:
 * folder path, Git branch, and SVN URL.
 */
export class WorkspaceInfoProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
    private readonly _onDidChangeTreeData = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private _info: WorkspaceInfoData | null = null;
    private _fileWatcher: vscode.FileSystemWatcher | undefined;
    private readonly _disposables: vscode.Disposable[] = [];

    constructor(private readonly _store: ConfigStore) {
        this._refresh();
        this._setupWatcher();

        this._disposables.push(
            vscode.workspace.onDidChangeWorkspaceFolders(() => {
                this._refresh();
                this._setupWatcher();
            }),
            // Re-render when workspaceInfoPathSegments changes in the config file
            _store.onDidChange(() => this._onDidChangeTreeData.fire()),
        );
    }

    private _setupWatcher(): void {
        this._fileWatcher?.dispose();
        const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!root) { return; }

        // Watch .git/HEAD so branch changes are reflected automatically
        const gitHeadPattern = new vscode.RelativePattern(root, '.git/HEAD');
        this._fileWatcher = vscode.workspace.createFileSystemWatcher(gitHeadPattern);
        this._fileWatcher.onDidChange(() => this._refresh());
        this._fileWatcher.onDidCreate(() => this._refresh());
        this._fileWatcher.onDidDelete(() => this._refresh());
    }

    refresh(): void {
        this._refresh();
    }

    private _refresh(): void {
        this._info = this._collectInfo();
        this._onDidChangeTreeData.fire();
    }

    private _collectInfo(): WorkspaceInfoData | null {
        const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!root) { return null; }

        return {
            folderPath: root,
            folderName: path.basename(root),
            gitBranch: this._getGitBranch(root),
            svnUrl: this._getSvnUrl(root),
        };
    }

    private _getGitBranch(cwd: string): string | null {
        try {
            const gitDir = path.join(cwd, '.git');
            if (!fs.existsSync(gitDir)) { return null; }

            const result = cp.execSync('git rev-parse --abbrev-ref HEAD', {
                cwd,
                timeout: 3000,
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
                windowsHide: true,
            });
            return result.trim() || null;
        } catch {
            return null;
        }
    }

    private _getSvnUrl(cwd: string): string | null {
        try {
            const svnDir = path.join(cwd, '.svn');
            if (!fs.existsSync(svnDir)) { return null; }

            const info = cp.execSync('svn info', {
                cwd,
                timeout: 5000,
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
                windowsHide: true,
            });
            const match = info.match(/^URL:\s*(.+)$/m);
            return match ? match[1].trim() : null;
        } catch {
            return null;
        }
    }

    /**
     * Shorten a path to its last `segments` slash/backslash-separated parts.
     * If `segments` is 0, the full path is returned unchanged.
     * The full path is always preserved in the tooltip.
     */
    private _shortenPath(fullPath: string, segments: number): string {
        if (segments <= 0) { return fullPath; }

        const sep = fullPath.includes('\\') ? '\\' : '/';
        const parts = fullPath.split(sep).filter(p => p.length > 0);

        if (parts.length <= segments) { return fullPath; }

        const tail = parts.slice(-segments).join(sep);
        return `...${sep}${tail}`;
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(): vscode.TreeItem[] {
        if (!this._info) {
            const placeholder = new vscode.TreeItem('No workspace open');
            placeholder.iconPath = new vscode.ThemeIcon('warning');
            return [placeholder];
        }

        const items: vscode.TreeItem[] = [];

        // Workspace folder — label is the folder name, description is shortened path
        items.push(new InfoTreeItem(
            this._info.folderName,
            this._shortenPath(this._info.folderPath, this._store.config.workspaceInfoPathSegments),
            'folder-opened',
            `Workspace folder: ${this._info.folderPath}`,
        ));

        // Git branch
        if (this._info.gitBranch !== null) {
            items.push(new InfoTreeItem(
                'Git',
                this._info.gitBranch,
                'git-branch',
                `Git branch: ${this._info.gitBranch}`,
            ));
        }

        // SVN URL
        if (this._info.svnUrl !== null) {
            items.push(new InfoTreeItem(
                'SVN',
                this._info.svnUrl,
                'source-control',
                `SVN URL: ${this._info.svnUrl}`,
            ));
        }

        return items;
    }

    dispose(): void {
        this._fileWatcher?.dispose();
        this._onDidChangeTreeData.dispose();
        for (const d of this._disposables) { d.dispose(); }
    }
}
