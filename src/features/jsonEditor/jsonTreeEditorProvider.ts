import * as vscode from 'vscode';
import { VIEW_IDS } from '../../core/constants';

/**
 * Custom text editor that renders a JSON file as an interactive tree.
 */
export class JsonTreeEditorProvider implements vscode.CustomTextEditorProvider {
    public static readonly viewType = VIEW_IDS.jsonTreeEditor;

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new JsonTreeEditorProvider(context);
        return vscode.window.registerCustomEditorProvider(JsonTreeEditorProvider.viewType, provider);
    }

    constructor(private readonly context: vscode.ExtensionContext) {}

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
    ): Promise<void> {
        webviewPanel.webview.options = { enableScripts: true };
        webviewPanel.webview.html = this._getHtml(webviewPanel.webview);

        const post = () => webviewPanel.webview.postMessage({
            type: 'update',
            text: document.getText(),
        });

        const changeSub = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                post();
            }
        });
        webviewPanel.onDidDispose(() => changeSub.dispose());
        webviewPanel.onDidChangeViewState(() => {
            if (webviewPanel.visible) {
                post();
            }
        });

        webviewPanel.webview.onDidReceiveMessage(e => {
            if (e.type === 'save') {
                void this._writeDocument(document, e.json);
            }
        });

        post();
    }

    private _getHtml(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'jsonTreeEditor.js'),
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'jsonTreeEditor.css'),
        );
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">
                <title>JSON Tree Editor</title>
            </head>
            <body>
                <div class="container">
                    <div class="toolbar">
                        <button id="saveBtn" class="btn btn-primary">保存</button>
                        <button id="expandAllBtn" class="btn btn-secondary">展开全部</button>
                        <button id="collapseAllBtn" class="btn btn-secondary">折叠全部</button>
                        <button id="addRootBtn" class="btn btn-success">添加根属性</button>
                    </div>
                    <div id="jsonTree" class="json-tree"></div>
                    <div id="errorMessage" class="error-message" style="display: none;"></div>
                </div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }

    private _writeDocument(document: vscode.TextDocument, json: unknown): Thenable<boolean> {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            JSON.stringify(json, null, 2),
        );
        return vscode.workspace.applyEdit(edit);
    }
}

function getNonce(): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
