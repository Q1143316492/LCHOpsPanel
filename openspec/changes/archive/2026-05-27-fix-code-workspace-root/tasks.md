## 1. ConfigStore — root resolution

- [x] 1.1 Add private `_resolveRoot()` method to `ConfigStore`: returns `path.dirname(workspace.workspaceFile.fsPath)` when `workspaceFile` exists and scheme is `'file'`, otherwise returns `workspaceFolders?.[0]?.uri.fsPath` (see specs/config-store/spec.md — "Config file location resolution")
- [x] 1.2 Replace the inline `vscode.workspace.workspaceFolders?.[0]?.uri.fsPath` expression in `updateWorkspaceRoot()` with a call to `_resolveRoot()`
- [x] 1.3 Replace the inline `workspaceFolders[0]` expression in `_setupWatcher()` with a call to `_resolveRoot()` so the file watcher follows the same root

## 2. Spec update

- [x] 2.1 Update `openspec/specs/config-store/spec.md`: change the "Location" line under "Config File" from `workspaceFolders[0].uri.fsPath` to the new priority-based resolution rule, and update the "Responsibilities" bullet that mentions `workspaceFolders[0]`

## 3. Verification

- [x] 3.1 Open `test-workspace.code-workspace` in VS Code and confirm the panel loads the `.lch-ops-panel.json` from the project root (not from `docs/` or `src/`)
- [x] 3.2 Open the project as a single folder (no `.code-workspace`) and confirm the panel still loads correctly from the folder root
