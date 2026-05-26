# Spec: Config Store

## Summary

`ConfigStore` is the single source of truth for all persistent workspace configuration. It owns the lifecycle of the `.lch-ops-panel.json` file: reading, writing, watching, and broadcasting changes to all feature consumers.

## Responsibilities

- Resolve the config root directory: prefer the parent directory of `vscode.workspace.workspaceFile` (when a `.code-workspace` file is open with `scheme === 'file'`); fall back to `workspaceFolders[0]` for single-folder workspaces.
- Load the config file from disk on activation and whenever the workspace root changes.
- Watch the config file with a `FileSystemWatcher` and auto-reload on external edits.
- Expose `onDidChange` event — fires on workspace root change, file create/change/delete.
- Provide `save()` (full overwrite) and `savePartial(patch)` (field-level merge preserving unknown keys).
- Sanitize raw JSON on read: unknown or malformed fields fall back to `createEmptyConfig()` defaults.

## Config Root Resolution

`ConfigStore` SHALL resolve the config root directory using the following priority:

1. If `vscode.workspace.workspaceFile` exists and its URI scheme is `file`, the root is `path.dirname(workspaceFile.fsPath)` (the directory containing the `.code-workspace` file).
2. Otherwise, the root is `vscode.workspace.workspaceFolders?.[0]?.uri.fsPath` (single-folder workspace).

The config file path is always `path.join(resolvedRoot, ".lch-ops-panel.json")`.

### Scenario: Single-folder workspace
- **WHEN** VS Code opens a folder directly (no `.code-workspace` file)
- **THEN** `ConfigStore` SHALL use `workspaceFolders[0].uri.fsPath` as the config root

### Scenario: Multi-root workspace via .code-workspace
- **WHEN** VS Code opens a `.code-workspace` file whose `folders` entries are sub-directories of the workspace file's parent directory
- **THEN** `ConfigStore` SHALL use `path.dirname(workspaceFile.fsPath)` as the config root
- **THEN** `.lch-ops-panel.json` SHALL be read from that parent directory

### Scenario: Remote or untitled workspace file
- **WHEN** `vscode.workspace.workspaceFile` exists but its URI scheme is NOT `file`
- **THEN** `ConfigStore` SHALL fall back to `workspaceFolders[0].uri.fsPath` as the config root

### Scenario: File watcher follows resolved root
- **WHEN** the config root is resolved (either via `workspaceFile` or `workspaceFolders[0]`)
- **THEN** the `FileSystemWatcher` SHALL watch `<resolvedRoot>/.lch-ops-panel.json`

## Config File

- Filename: `.lch-ops-panel.json`
- Location: resolved root — `path.dirname(workspaceFile.fsPath)` when a `.code-workspace` file is open (scheme `file`), otherwise `workspaceFolders[0].uri.fsPath`
- Format: pretty-printed JSON (2-space indent)
- Schema: `OpsConfig` (see `src/core/types.ts`)

## OpsConfig Schema

| Field | Type | Default | Description |
|---|---|---|---|
| `categories` | `string[]` | `['Files', 'Scripts', 'Commands']` | Ordered category names for the ops panel |
| `items` | `OpsItem[]` | `[]` | Flat list of file/script/command items |
| `workspaceNotices` | `WorkspaceNotice[]` | `[]` | Named file collections |
| `currentNoticeName` | `string` | `''` | Active notice collection name (empty = show all) |
| `workspaceInfoPathSegments` | `number` | `3` | Trailing path segments shown in Workspace Info (0 = full path) |
| `notes` | `string[]` | `[]` | Memo lines (one array entry per line) |

## Invariants

- Only one `ConfigStore` instance exists per extension activation.
- `config` property always returns a valid `OpsConfig` — never `null` or `undefined`.
- `isLoaded` is `false` until the first successful disk read.
- `savePartial` merges at the top-level JSON key level; it does NOT deep-merge nested objects.
- The file watcher is re-created whenever the workspace root changes.

## Non-goals

- Does not validate individual `OpsItem` shapes beyond basic type checking.
- Does not encrypt or compress the config file.
- Does not provide undo/redo for config changes.
