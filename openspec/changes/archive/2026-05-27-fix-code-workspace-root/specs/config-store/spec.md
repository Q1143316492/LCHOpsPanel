## MODIFIED Requirements

### Requirement: Config file location resolution
`ConfigStore` SHALL resolve the config root directory using the following priority:

1. If `vscode.workspace.workspaceFile` exists and its URI scheme is `file`, the root is `path.dirname(workspaceFile.fsPath)` (the directory containing the `.code-workspace` file).
2. Otherwise, the root is `vscode.workspace.workspaceFolders?.[0]?.uri.fsPath` (single-folder workspace behaviour, unchanged from before).

The config file path is always `path.join(resolvedRoot, ".lch-ops-panel.json")`.

#### Scenario: Single-folder workspace
- **WHEN** VS Code opens a folder directly (no `.code-workspace` file)
- **THEN** `ConfigStore` SHALL use `workspaceFolders[0].uri.fsPath` as the config root

#### Scenario: Multi-root workspace via .code-workspace
- **WHEN** VS Code opens a `.code-workspace` file whose `folders` entries are sub-directories of the workspace file's parent directory
- **THEN** `ConfigStore` SHALL use `path.dirname(workspaceFile.fsPath)` as the config root
- **THEN** `.lch-ops-panel.json` SHALL be read from that parent directory

#### Scenario: Remote or untitled workspace file
- **WHEN** `vscode.workspace.workspaceFile` exists but its URI scheme is NOT `file`
- **THEN** `ConfigStore` SHALL fall back to `workspaceFolders[0].uri.fsPath` as the config root

#### Scenario: File watcher follows resolved root
- **WHEN** the config root is resolved (either via `workspaceFile` or `workspaceFolders[0]`)
- **THEN** the `FileSystemWatcher` SHALL watch `<resolvedRoot>/.lch-ops-panel.json`
