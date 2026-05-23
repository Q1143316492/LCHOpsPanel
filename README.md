
# LCH Ops Panel

A VS Code extension that provides a sidebar panel for managing files, scripts, and commands in a workspace. Includes a notice collections view, a JSON tree editor, and mini games for coding breaks.

## Features

**Operations Panel** — category-based shortcuts to files, scripts, and commands.
- Left-click a file to open it; right-click a script/command to execute it or open a terminal.
- Add / edit / delete items via the toolbar and context menu.

**Notice Collections** — named file lists for quick navigation across related files.
- Switch between collections; files auto-organize by folder path.
- **Save Open Tabs** as a collection in one click (toolbar button).
- **Open All** files in a collection at once (right-click or Manage menu).
- **Edit** a collection: add/remove files, rename, or change description.

**JSON Tree Editor** — visual tree editor for any `.json` file.
- Open via the editor title button or command palette.

**Workspace Info** — persistent identity bar at the top of the panel.
- Shows the current workspace folder name and path, Git branch, and SVN URL.
- Auto-refreshes on branch switch (watches `.git/HEAD`).
- Path display length is configurable via `workspaceInfoPathSegments`.

**Mini Games** — 2048 and Minesweeper in the sidebar. Best scores are persisted.

## Configuration

Each workspace stores its settings in `.lch-ops-panel.json` at the workspace root. The file is watched; both panels update in real time.

```json
{
  "categories": ["📁 Files", "💻 Scripts", "⚡ Commands"],
  "items": [
    {
      "id": "pkg",
      "name": "package.json",
      "type": "file",
      "path": "./package.json",
      "category": "📁 Files"
    },
    {
      "id": "build",
      "name": "Build",
      "type": "script",
      "path": "./scripts/build.bat",
      "category": "💻 Scripts",
      "description": "Compile the extension"
    },
    {
      "id": "lint",
      "name": "Lint",
      "type": "command",
      "command": "npm run lint",
      "category": "⚡ Commands"
    }
  ],
  "workspaceNotices": [
    {
      "name": "Core Source",
      "files": [
        { "name": "extension.ts", "path": "./src/extension.ts" },
        { "name": "configStore.ts", "path": "./src/core/configStore.ts" }
      ]
    }
  ],
  "currentNoticeName": "Core Source",
  "workspaceInfoPathSegments": 3
}
```

**Item types**

| type | left-click | right-click |
|------|-----------|-------------|
| `file` | open in editor | — |
| `script` | — | execute / open terminal |
| `command` | — | run in terminal |

**Top-level config fields**

| field | type | default | description |
|-------|------|---------|-------------|
| `categories` | `string[]` | `["Files","Scripts","Commands"]` | Category display order |
| `items` | `OpsItem[]` | `[]` | All operations panel items |
| `workspaceNotices` | `WorkspaceNotice[]` | `[]` | Named file-list collections |
| `currentNoticeName` | `string` | `""` | Active notice collection |
| `workspaceInfoPathSegments` | `number` | `3` | Trailing path segments shown in Workspace Info; `0` = full path |

## Source structure

```
src/
├── extension.ts          # entry point (activation only)
├── core/
│   ├── configStore.ts    # config I/O, file watcher, change events
│   ├── constants.ts      # view/command IDs
│   ├── types.ts          # shared types
│   └── terminalRunner.ts # path resolution & terminal helpers
└── features/
    ├── opsPanel/         # Operations Panel view + commands
    ├── notices/          # Notice Collections view + commands
    ├── games/            # Mini Games webview
    └── jsonEditor/       # JSON Tree custom editor
```

## License
[MIT](./LICENSE.md)
