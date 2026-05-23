import * as vscode from 'vscode';
import * as path from 'path';
import { promises as fs } from 'fs';
import { CONFIG_FILE_NAME } from './constants';
import { OpsConfig, createEmptyConfig } from './types';

/**
 * Single source of truth for the per-workspace `.lch-ops-panel.json` config.
 *
 * Responsibilities:
 *   - Track the active workspace root and react to folder changes.
 *   - Load / save the config file (with schema sanitization).
 *   - Watch the config file and fire `onDidChange` so any number of consumers
 *     (tree providers, command handlers) can stay in sync without each
 *     maintaining their own file watcher.
 *
 * Tree providers should read `config` after each change event and re-render.
 */
export class ConfigStore implements vscode.Disposable {
    private _config: OpsConfig = createEmptyConfig();
    private _workspaceRoot: string | undefined;
    private _fileWatcher: vscode.FileSystemWatcher | undefined;
    private _folderListener: vscode.Disposable | undefined;
    private _loaded = false;

    private readonly _onDidChange = new vscode.EventEmitter<void>();
    /** Fires whenever the active workspace root or config contents change. */
    readonly onDidChange = this._onDidChange.event;

    /** Kick off workspace tracking. Safe to call once at activation. */
    async initialize(): Promise<void> {
        this._folderListener = vscode.workspace.onDidChangeWorkspaceFolders(() => {
            void this.updateWorkspaceRoot();
        });
        await this.updateWorkspaceRoot();
    }

    private async updateWorkspaceRoot(): Promise<void> {
        const next = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (this._workspaceRoot === next) {
            return;
        }

        this._fileWatcher?.dispose();
        this._fileWatcher = undefined;
        this._workspaceRoot = next;

        if (this._workspaceRoot) {
            await this.reload();
            this._setupWatcher();
        } else {
            this._config = createEmptyConfig();
            this._loaded = false;
        }
        this._onDidChange.fire();
    }

    private _setupWatcher(): void {
        if (!this._workspaceRoot) {
            return;
        }
        const file = path.join(this._workspaceRoot, CONFIG_FILE_NAME);
        const watcher = vscode.workspace.createFileSystemWatcher(file);
        const trigger = () => void this.reload().then(() => this._onDidChange.fire());
        watcher.onDidChange(trigger);
        watcher.onDidCreate(trigger);
        watcher.onDidDelete(trigger);
        this._fileWatcher = watcher;
    }

    /** Manually reload from disk. Tree providers can use this on a refresh command. */
    async reload(): Promise<void> {
        if (!this._workspaceRoot) {
            this._config = createEmptyConfig();
            this._loaded = false;
            return;
        }
        this._config = await this._readFromDisk(this._workspaceRoot);
        this._loaded = true;
    }

    private async _readFromDisk(root: string): Promise<OpsConfig> {
        const file = path.join(root, CONFIG_FILE_NAME);
        try {
            await fs.access(file);
            const raw = await fs.readFile(file, 'utf8');
            if (!raw.trim()) {
                return createEmptyConfig();
            }
            const parsed = JSON.parse(raw);
            return sanitize(parsed);
        } catch {
            return createEmptyConfig();
        }
    }

    /** Persist the current config to disk. The watcher will refire change events. */
    async save(): Promise<void> {
        if (!this._workspaceRoot) {
            return;
        }
        const file = path.join(this._workspaceRoot, CONFIG_FILE_NAME);
        await fs.writeFile(file, JSON.stringify(this._config, null, 2), 'utf8');
    }

    get config(): OpsConfig {
        return this._config;
    }

    get workspaceRoot(): string | undefined {
        return this._workspaceRoot;
    }

    get isLoaded(): boolean {
        return this._loaded;
    }

    dispose(): void {
        this._fileWatcher?.dispose();
        this._folderListener?.dispose();
        this._onDidChange.dispose();
    }
}

function sanitize(raw: any): OpsConfig {
    const defaults = createEmptyConfig();
    const rawSegments = raw?.workspaceInfoPathSegments;
    return {
        categories: Array.isArray(raw?.categories) ? raw.categories : defaults.categories,
        items: Array.isArray(raw?.items) ? raw.items : defaults.items,
        workspaceNotices: Array.isArray(raw?.workspaceNotices) ? raw.workspaceNotices : defaults.workspaceNotices,
        currentNoticeName: typeof raw?.currentNoticeName === 'string' ? raw.currentNoticeName : defaults.currentNoticeName,
        workspaceInfoPathSegments: (typeof rawSegments === 'number' && Number.isInteger(rawSegments) && rawSegments >= 0)
            ? rawSegments
            : defaults.workspaceInfoPathSegments,
    };
}

export function generateId(): string {
    return Math.random().toString(36).slice(2, 11);
}
