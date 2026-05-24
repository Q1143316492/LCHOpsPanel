import * as vscode from 'vscode';
import { ConfigStore } from '../../core/configStore';

/**
 * WebviewViewProvider for the Notes Memo panel.
 *
 * Notes are stored as `string[]` in the config (one entry per line).
 * The webview presents a plain-text textarea; on save the text is split
 * back into lines and written to disk via ConfigStore.save().
 *
 * Special characters (quotes, backslashes, Unicode, etc.) are handled
 * transparently because JSON.stringify/parse takes care of escaping.
 */
export class NotesMemoProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(private readonly store: ConfigStore) {
        store.onDidChange(() => this._syncToWebview());
    }

    resolveWebviewView(webviewView: vscode.WebviewView): void {
        this._view = webviewView;

        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = this._buildHtml(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (msg: { type: string; text?: string }) => {
            if (msg.type === 'save' && typeof msg.text === 'string') {
                await this._saveNotes(msg.text);
            }
        });

        // Push current notes as soon as the view resolves.
        this._syncToWebview();
    }

    /** Called externally (e.g., toolbar "Save" command) to trigger save from the host side. */
    requestSave(): void {
        void this._view?.webview.postMessage({ type: 'requestSave' });
    }

    private _syncToWebview(): void {
        if (!this._view) {
            return;
        }
        const notes = this.store.config.notes ?? [];
        void this._view.webview.postMessage({ type: 'load', text: notes.join('\n') });
    }

    private async _saveNotes(text: string): Promise<void> {
        // Split on newline; keep all lines including empty ones so the user's
        // blank lines are preserved.  Strip only a single trailing empty line
        // that the browser may append after the last \n.
        const lines = text.split('\n');
        if (lines.length > 0 && lines[lines.length - 1] === '') {
            lines.pop();
        }
        // Use savePartial so only the `notes` key is rewritten;
        // all other fields in the JSON file are preserved as-is.
        await this.store.savePartial({ notes: lines });
        void this._view?.webview.postMessage({ type: 'saved' });
    }

    private _buildHtml(webview: vscode.Webview): string {
        // A nonce is required to satisfy VS Code's Content Security Policy for
        // inline scripts inside WebviewViews.
        const nonce = generateNonce();

        return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0;
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      background: var(--vscode-sideBarSectionHeader-background);
      border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border, transparent);
      flex-shrink: 0;
    }
    button {
      padding: 2px 10px;
      font-size: 12px;
      cursor: pointer;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 2px;
    }
    button:hover { background: var(--vscode-button-hoverBackground); }
    #status {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      flex: 1;
    }
    #editor {
      flex: 1;
      width: 100%;
      border: none;
      outline: none;
      resize: none;
      padding: 8px;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: var(--vscode-editor-font-size, 13px);
      line-height: 1.5;
    }
    #editor::placeholder {
      color: var(--vscode-input-placeholderForeground);
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button id="saveBtn">Save</button>
    <span id="status"></span>
  </div>
  <textarea id="editor" spellcheck="false"
    placeholder="Write your notes here... (one line per entry)"></textarea>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const editor = document.getElementById('editor');
    const status = document.getElementById('status');
    const saveBtn = document.getElementById('saveBtn');

    // Restore unsaved edits from webview state (survives panel hide/show).
    const saved = vscode.getState();
    if (saved && typeof saved.text === 'string') {
      editor.value = saved.text;
    }

    function markDirty() {
      status.textContent = '\\u25cf unsaved';
      vscode.setState({ text: editor.value });
    }

    function markClean() {
      status.textContent = 'Saved';
      setTimeout(() => { if (status.textContent === 'Saved') status.textContent = ''; }, 1500);
    }

    editor.addEventListener('input', markDirty);

    saveBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'save', text: editor.value });
    });

    // Ctrl+S / Cmd+S shortcut
    editor.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        vscode.postMessage({ type: 'save', text: editor.value });
      }
    });

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type === 'load') {
        editor.value = msg.text;
        vscode.setState({ text: msg.text });
        status.textContent = '';
      } else if (msg.type === 'saved') {
        vscode.setState({ text: editor.value });
        markClean();
      } else if (msg.type === 'requestSave') {
        vscode.postMessage({ type: 'save', text: editor.value });
      }
    });
  </script>
</body>
</html>`;
    }
}

function generateNonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
