## Context

`ConfigStore.updateWorkspaceRoot()` currently resolves the config root as `vscode.workspace.workspaceFolders?.[0]?.uri.fsPath`. In a `.code-workspace` multi-root workspace, `workspaceFolders[0]` is the first sub-folder listed inside the workspace file — not the directory that contains the workspace file itself. This causes `.lch-ops-panel.json` to be searched in the wrong location, resulting in an empty panel.

VS Code exposes `vscode.workspace.workspaceFile`: a `Uri` pointing to the open `.code-workspace` file. Its parent directory (`path.dirname`) is the logical project root where the config file should live.

## Goals / Non-Goals

**Goals:**
- Make `ConfigStore` find `.lch-ops-panel.json` in the `.code-workspace` file's parent directory when a multi-root workspace is open.
- Keep single-folder workspace behaviour identical to today.
- Contain the entire change to `ConfigStore` — no other files touched.

**Non-Goals:**
- Per-folder configs in multi-root workspaces.
- Walk-up directory search.
- A user-configurable `lchOpsPanel.configFilePath` setting.
- Changes to how relative paths inside config items are resolved (`terminalRunner` still uses `workspaceFolders[0]`).

## Decisions

### Use `workspace.workspaceFile` as the root signal

**Decision**: Add a private `_resolveRoot()` method:

```
_resolveRoot(): string | undefined
  if workspace.workspaceFile exists AND scheme === 'file'
    → path.dirname(workspace.workspaceFile.fsPath)
  else
    → workspace.workspaceFolders?.[0]?.uri.fsPath
```

**Why not walk-up from `workspaceFolders[0]`?**  
Walk-up is implicit and could accidentally pick up a config in an ancestor directory the user never intended. `workspaceFile` is an explicit VS Code signal that directly encodes the user's intent.

**Why not a user setting?**  
A setting requires manual setup for every project. The `workspaceFile` path is always available and requires zero configuration.

**Why only `scheme === 'file'`?**  
Untitled or remote workspace files (e.g. `vscode-remote://...`) have non-file schemes. Falling back to `workspaceFolders[0]` is safer than trying to resolve a non-local path.

### `_setupWatcher` reuses `_resolveRoot()`

The file watcher must watch the same path returned by `_resolveRoot()`. Since `_resolveRoot()` is a pure computed value (no state), both `updateWorkspaceRoot` and `_setupWatcher` can call it independently without any caching concerns.

## Risks / Trade-offs

- **`.code-workspace` file outside the project root** (rare): if someone stores the workspace file in a sibling or parent directory, `_resolveRoot()` will look in the wrong place. Acceptable trade-off; this pattern is uncommon, and a future `configFilePath` setting can address it.
- **Remote workspaces**: `workspaceFile` scheme is not `file`, so the fallback to `workspaceFolders[0]` applies. Behaviour is unchanged from today.
