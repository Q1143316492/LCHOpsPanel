# Spec: Workspace Info

## Summary

A read-only tree view that displays persistent workspace identity information: the folder path, Git branch (if applicable), and SVN URL (if applicable). Automatically refreshes when the Git branch changes.

## Tree Items

| Label | Description | Icon | Condition |
|---|---|---|---|
| `<folder name>` | Shortened workspace path | `folder-opened` | Always shown |
| `Git` | Current branch name | `git-branch` | `.git/` directory exists |
| `SVN` | Repository URL | `source-control` | `.svn/` directory exists |

## Path Shortening

Controlled by `config.workspaceInfoPathSegments` (default: 3):
- `0` → show full absolute path
- `N > 0` → show last N path segments prefixed with `.../<sep>`
- The full path is always preserved in the tooltip regardless of shortening.

Example with `segments = 2` and path `/home/user/projects/myapp`:
- Display: `.../projects/myapp`
- Tooltip: `/home/user/projects/myapp`

## Auto-refresh Triggers

- Workspace folder added or removed (`onDidChangeWorkspaceFolders`)
- `.git/HEAD` file changed/created/deleted (branch change detection)
- `ConfigStore.onDidChange` (for `workspaceInfoPathSegments` changes)

## VCS Detection

**Git**: checks for `.git/` directory existence, then runs `git rev-parse --abbrev-ref HEAD` (timeout: 3s, stderr ignored).

**SVN**: checks for `.svn/` directory existence, then runs `svn info` (timeout: 5s), extracts the `URL:` line.

Both commands are synchronous (`execSync`) and run at refresh time. Failures return `null` (item not shown).

## Commands

### Refresh Workspace Info (`lchOpsPanel.refreshWorkspaceInfo`)
- Forces immediate re-collection of workspace data and fires tree change event.

## Invariants

- Both Git and SVN items are suppressed (not shown) when their respective VCS directories are absent.
- It is possible for both Git and SVN items to appear simultaneously if both directories exist (uncommon but supported).
- The provider implements `vscode.Disposable`; it disposes the file watcher and event emitter on extension deactivation.

## Non-goals

- Editing or setting the workspace path.
- Showing commit history, blame, or diff information.
- Supporting VCS systems other than Git and SVN.
- Showing branch info for multi-root workspaces (uses `[0]` only).
