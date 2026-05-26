# Spec: JSON Tree Editor

## Summary

A custom text editor that renders any `.json` file as an interactive collapsible/expandable tree with inline editing. Registered as `priority: option`, so it does not replace the default JSON editor — users must explicitly "Open With" to invoke it.

## Registration

- View type: `lchOpsPanel.jsonTreeEditor`
- Selector: `*.json` (all JSON files)
- Priority: `option` (not the default editor)

## Behaviors

### Opening
Two ways to open:
1. Editor title button (any `.json` file open in the editor) — `lchOpsPanel.openJsonEditor` command.
2. Right-click a `.json` file → "Open With" → "JSON Tree Editor".

The `openJsonEditor` command resolves the target in this order:
1. URI passed as argument (e.g., from editor/title context menu)
2. Active text editor if it's a `.json` file
3. File picker dialog (`showOpenDialog` filtered to `.json`)

### Rendering
- On `resolveCustomTextEditor`: posts `{ type: 'update', text: document.getText() }` to the webview.
- On `onDidChangeTextDocument` (same document): re-posts the update.
- On `onDidChangeViewState` (panel becomes visible): re-posts the update.

### Editing & Saving
- User edits values inline in the tree UI.
- Clicking **Save** (or equivalent toolbar action) posts `{ type: 'save', json: <parsed object> }` to the host.
- Host applies a `WorkspaceEdit` replacing the full document range with `JSON.stringify(json, null, 2)`.

### Toolbar actions (webview-side)
- **保存 (Save)** — triggers save flow
- **展开全部 (Expand All)** — expands all tree nodes
- **折叠全部 (Collapse All)** — collapses all tree nodes
- **添加根属性 (Add Root Property)** — adds a new key at the root level

## Media Assets

- `media/jsonTreeEditor.js` — tree rendering, expand/collapse, inline edit logic
- `media/jsonTreeEditor.css` — tree styles

Loaded as `webview.asWebviewUri(...)`. CSP: `script-src 'nonce-<N>'`, `style-src ${webview.cspSource}`.

## Security

- CSP: `default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-<N>'`
- Nonce is a 32-character random alphanumeric string generated per editor resolution.
- `enableScripts: true` required for webview interactivity.

## Invariants

- The editor is read-write: changes made in the tree UI are written back to the original document via `WorkspaceEdit` (undo-able in VS Code).
- The webview is disposed and its `onDidChangeTextDocument` subscription is cleaned up when the editor panel closes.

## Non-goals

- JSON Schema validation or autocomplete.
- Diffing or merging JSON files.
- Support for JSON with comments (JSONC).
- Sorting keys or formatting beyond standard `JSON.stringify` 2-space indent.
