# Spec: Notice Collections

## Summary

Manages named collections of files ("notices") that can be recalled and opened in bulk. Designed for tracking sets of related files (e.g., all files relevant to a task, a code review set, a sprint's changes). Collections are persisted in `config.workspaceNotices`.

## Tree Structure

**Single collection active** (`currentNoticeName` is set):
```
Notice Collections
└── 📚 MyCollection (3 files)
    ├── 📁 src/
    │   └── 📄 index.ts
    └── 📄 README.md
```

**No active collection** (`currentNoticeName` is empty):
```
Notice Collections
├── 📚 CollectionA (2 files)
│   └── ...
└── 📚 CollectionB (5 files)
    └── ...
```

## Virtual Folder Hierarchy

Files within a collection are displayed as a folder tree by parsing `/` separators in their paths. Example: a file with path `./src/core/types.ts` renders as `src/ > core/ > types.ts`. The folder nodes are synthetic (not persisted); only flat `NoticeFile[]` is stored.

## Commands

### Switch Collection (`lchOpsPanel.switchNoticeCollection`)
- QuickPick showing all collections + "Clear Selection" option.
- Sets `config.currentNoticeName`. Empty string = show all.

### Add Collection (`lchOpsPanel.addNoticeCollection`)
1. Prompt for name (unique, non-empty)
2. Prompt for description (optional)
3. Loop: add files manually (name + path + optional description) until "Done"
4. Reject empty collections.

### Save Open Tabs as Collection (`lchOpsPanel.saveTabsAsCollection`)
- Collects all open file editor tabs (deduped by `fsPath`, scheme `file` only).
- User multi-selects which tabs to include.
- Prompts for collection name and description.
- Paths stored as `./relative` form.

### Open All in Collection (`lchOpsPanel.openAllInCollection`)
- Opens every file in the collection as a non-preview tab with `preserveFocus: true`.
- Reports count of opened vs. failed files.

### Edit Collection (`lchOpsPanel.editNoticeCollection`)
Actions available:
- **Add Files from Open Tabs** — appends tabs not already in the collection.
- **Add Files from File Picker** — `showOpenDialog`, converts to workspace-relative paths.
- **Add File by Path** — manual path entry.
- **Remove Files** — multi-select from collection's file list.
- **Rename Collection** — updates `name`; if collection was current, `currentNoticeName` is updated too.
- **Change Description** — update or clear description.

### Manage Collections (`lchOpsPanel.manageNoticeCollections`)
- List all collections → pick one → sub-menu: Set as Current / Edit / Open All / Delete.
- Delete requires modal confirmation.

## Data Model

```typescript
interface WorkspaceNotice {
  name: string;
  description?: string;
  files: NoticeFile[];
}

interface NoticeFile {
  name: string;       // display name
  path: string;       // workspace-relative (e.g. ./src/index.ts) or absolute
  description?: string;
}
```

## Path Conventions

- Paths are stored as `./`-prefixed workspace-relative strings when inside the workspace.
- Absolute paths are stored as-is when the file is outside the workspace root.
- Path separator in stored paths: `/` (forward slash).
- Virtual folder hierarchy is derived from `/` splits at render time only.

## Invariants

- Collection names are unique within `workspaceNotices`.
- Renaming a collection that is currently active updates `currentNoticeName` atomically.
- Collections cannot be empty (enforced only on creation via `addNoticeCollection`; existing collections may become empty after file removal).
- `openFile` command is shared with the ops-panel feature; it handles `notice-file` items via the same `openPathInEditor` utility.

## Non-goals

- File content previews within the panel.
- Sorting or filtering files within a collection.
- Syncing collections across machines (stored in `.lch-ops-panel.json` which is workspace-local).
