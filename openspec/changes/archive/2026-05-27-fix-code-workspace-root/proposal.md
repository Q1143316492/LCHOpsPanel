## Why

When a `.code-workspace` file is opened in VS Code, `workspaceFolders[0]` points to the first sub-folder defined inside the workspace file (e.g. `frontend/`, `src/`), not the directory containing the `.code-workspace` file. Since `ConfigStore` always looks for `.lch-ops-panel.json` under `workspaceFolders[0]`, the config is never found and the panel appears empty in every multi-root workspace setup.

## What Changes

- `ConfigStore` gains a `_resolveRoot()` helper that checks `vscode.workspace.workspaceFile` first: if a `.code-workspace` file is open, its parent directory is used as the config root instead of `workspaceFolders[0]`.
- The file watcher in `_setupWatcher()` is updated to watch the path returned by `_resolveRoot()`.
- Existing single-folder behaviour is completely unchanged (falls through to `workspaceFolders[0]`).

## Capabilities

### New Capabilities

_(none — this is a bug-fix, no new user-visible capability is introduced)_

### Modified Capabilities

- `config-store`: The rule for locating `.lch-ops-panel.json` changes. See [specs/config-store/spec.md](../../specs/config-store/spec.md).

## Impact

- **`src/core/configStore.ts`** — only file that needs to change.
- No changes to `package.json`, commands, tree providers, or any other feature module.
- No breaking changes; existing `.lch-ops-panel.json` files already placed at the workspace root continue to work.

## Non-goals

- Supporting a separate config per workspace folder in a multi-root setup.
- Walk-up directory search for the config file.
- A `lchOpsPanel.configFilePath` user setting (separate future change if needed).
