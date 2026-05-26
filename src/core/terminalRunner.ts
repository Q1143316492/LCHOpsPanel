import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PathBearing } from './types';
import { resolveWorkspaceRoot } from './configStore';

/**
 * Resolve an item path to an absolute file path on disk.
 * Relative paths are joined to the first workspace folder.
 */
export function resolvePath(itemPath: string): string | undefined {
    if (path.isAbsolute(itemPath)) {
        return itemPath;
    }
    const root = resolveWorkspaceRoot();
    return root ? path.join(root, itemPath) : undefined;
}

/** Open the item's `path` in a text editor. */
export async function openPathInEditor(item: PathBearing): Promise<void> {
    if (!item.path) {
        vscode.window.showErrorMessage('No path specified for this item');
        return;
    }
    const abs = resolvePath(item.path);
    if (!abs) {
        vscode.window.showErrorMessage('Cannot resolve path: no workspace folder');
        return;
    }
    try {
        await vscode.window.showTextDocument(vscode.Uri.file(abs));
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open file: ${error}`);
    }
}

/** Open a terminal whose CWD is the directory containing the item. */
export function openPathInTerminal(item: PathBearing): void {
    if (!item.path) {
        vscode.window.showErrorMessage('No path specified for this item');
        return;
    }
    const abs = resolvePath(item.path);
    if (!abs) {
        vscode.window.showErrorMessage('Cannot resolve path: no workspace folder');
        return;
    }
    try {
        const cwd = fs.lstatSync(abs).isDirectory() ? abs : path.dirname(abs);
        const terminal = vscode.window.createTerminal({ name: `LCH Ops: ${item.name}`, cwd });
        terminal.show();
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open terminal: ${error}`);
    }
}

/** Map a script's file extension to the shell command that runs it. */
function buildRunCommand(scriptName: string): string {
    const ext = path.extname(scriptName).toLowerCase();
    switch (ext) {
        case '.py': return `python "${scriptName}"`;
        case '.js': return `node "${scriptName}"`;
        case '.ps1': return `powershell -ExecutionPolicy Bypass -File "${scriptName}"`;
        case '.bat':
        case '.cmd': return `"${scriptName}"`;
        case '.sh': return `bash "${scriptName}"`;
        default: return `"${scriptName}"`;
    }
}

/** Spawn a terminal that cd's into the script directory and runs it. */
export function runScriptInTerminal(item: PathBearing): void {
    if (!item.path) {
        vscode.window.showErrorMessage('No path specified for this script');
        return;
    }
    const abs = resolvePath(item.path);
    if (!abs) {
        vscode.window.showErrorMessage('Cannot resolve path: no workspace folder');
        return;
    }
    if (!fs.existsSync(abs)) {
        vscode.window.showErrorMessage(`Script file not found: ${abs}`);
        return;
    }
    try {
        const terminal = vscode.window.createTerminal(`LCH Ops: ${item.name}`);
        const dir = path.dirname(abs);
        const name = path.basename(abs);
        terminal.sendText(`cd "${dir}"`);
        terminal.sendText(buildRunCommand(name));
        terminal.show();
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to execute script: ${error}`);
    }
}

/** Spawn a terminal at the workspace root and send an arbitrary command. */
export function runCommandInTerminal(name: string, command: string): void {
    try {
        const terminal = vscode.window.createTerminal(`LCH Ops: ${name}`);
        const root = resolveWorkspaceRoot();
        if (root) {
            terminal.sendText(`cd "${root}"`);
        }
        terminal.sendText(command);
        terminal.show();
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to execute command: ${error}`);
    }
}
