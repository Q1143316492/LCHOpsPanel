# Spec: Notes Memo

## Summary

A persistent free-form text memo panel implemented as a WebviewView. Notes are stored as `string[]` (one entry per line) in `config.notes` and survive workspace closes. The panel retains unsaved edits across hide/show cycles via VS Code webview state.

## UI Layout

```
┌─────────────────────────────┐
│ [Save]  ● unsaved           │  ← toolbar
├─────────────────────────────┤
│                             │
│  Free-form textarea         │  ← monospace, full height
│  (editor font family/size)  │
│                             │
└─────────────────────────────┘
```

## Behaviors

### Loading notes
- On `resolveWebviewView`: posts `{ type: 'load', text: notes.join('\n') }` to the webview.
- On `ConfigStore.onDidChange`: re-posts the load message to keep the view in sync with external edits.

### Saving notes
Two triggers:
1. User clicks **Save** button in the toolbar.
2. User presses `Ctrl+S` / `Cmd+S` inside the textarea.

Both post `{ type: 'save', text: <textarea value> }` to the extension host.

The host handler:
1. Splits text on `\n`.
2. Strips a single trailing empty line if present.
3. Calls `store.savePartial({ notes: lines })` — other config fields are untouched.
4. Posts `{ type: 'saved' }` back to show "Saved" status for 1.5 s.

### External save (`lchOpsPanel.saveNotesMemo` command)
- Posts `{ type: 'requestSave' }` to the webview, which re-triggers the save flow.
- Used by the toolbar button registered in `package.json`.

### Clear notes (`lchOpsPanel.clearNotesMemo` command)
- Modal confirmation required.
- Calls `store.savePartial({ notes: [] })` directly from the host (does not go through the webview).

### Unsaved state persistence
- Webview stores current textarea value via `vscode.setState({ text })` on every keystroke.
- On panel re-show (after hide), `vscode.getState()` restores the unsaved draft.
- The "● unsaved" status indicator is shown while the textarea differs from last saved state.

## Storage Format

```json
{
  "notes": [
    "Line one of the memo",
    "Line two",
    "",
    "After blank line"
  ]
}
```

Blank lines are preserved as empty strings in the array.

## Security

- CSP: `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-<N>'`
- A cryptographically random 32-character nonce is generated per `resolveWebviewView` call.
- `enableScripts: true` required for the Webview API (`acquireVsCodeApi`).
- `retainContextWhenHidden: true` so state is preserved when panel is collapsed.

## Non-goals

- Rich text formatting or markdown rendering.
- Multiple memo buffers / tabs.
- Search or filtering within notes.
- Syncing notes across machines.
