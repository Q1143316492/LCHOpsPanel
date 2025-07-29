
# LCH Ops Panel

A Visual Studio Code extension for managing workspace configurations with dual tree view panels.

## Features

### 📋 Dual Panel Design
- **Operations Panel**: Traditional file/script/command management with categories
- **Notice Collections**: File collection management with tree structure display

### 🔧 Operations Panel
- **Category-based Organization**: Items grouped into categories:
  - 📁 Files: Quick access to important project files
  - 💻 Scripts: Execute batch/shell scripts with one click
  - 📝 Logs: Access documentation and log files
  - ⚡ Commands: Run custom commands and build tasks
- **Context Actions**: Right-click menus for file operations, script execution, and terminal access
- **Item Management**: Add, edit, and delete items through UI

### 📚 Notice Collections Panel
- **File Collections**: Organize related files into named collections
- **Tree Structure**: Files automatically organized by folder structure
- **Collection Management**: 
  - Switch between collections
  - Create new collections
  - Edit and delete existing collections
- **Quick File Access**: Click to open files directly

### ⚙️ Configuration
- **Per-workspace Settings**: Each workspace maintains its own `.lch-ops-panel.json`
- **Real-time Updates**: Changes reflect immediately in both panels
- **Flexible Structure**: Support for relative and absolute file paths

## Configuration

Edit the `.lch-ops-panel.json` file in your workspace to customize both panels.

## Example Configuration

```json
{
  "categories": [
    "📁 Files",
    "💻 Scripts", 
    "📝 Logs",
    "⚡ Commands"
  ],
  "items": [
    {
      "id": "example1",
      "name": "Package.json",
      "type": "file",
      "path": "./package.json",
      "category": "📁 Files",
      "description": "Project package configuration"
    },
    {
      "id": "example2", 
      "name": "Test Script",
      "type": "script",
      "path": "./scripts/test-script.bat",
      "category": "💻 Scripts"
    },
    {
      "id": "example3",
      "name": "Build Extension",
      "type": "command", 
      "command": "npm run compile",
      "category": "⚡ Commands",
      "description": "Compile the extension code"
    }
  ],
  "currentNoticeName": "Terminal Tiler",
  "workspaceNotices": [
    {
      "name": "Terminal Tiler",
      "description": "Terminal tiling functionality files",
      "files": [
        {
          "name": "Terminal Tiler Core",
          "path": "./scripts/tile/terminal_tiler.py",
          "description": "Main terminal tiling script"
        },
        {
          "name": "Tile README", 
          "path": "./scripts/tile/README.md",
          "description": "Documentation for tiling features"
        }
      ]
    }
  ]
}
```

## Usage

### Operations Panel
- **Add Items**: Click the `+` button in the panel toolbar
- **Edit/Delete**: Right-click on any item for context menu
- **Execute**: Click files to open, right-click scripts/commands to execute

### Notice Collections Panel  
- **Switch Collections**: Click the list icon to select active collection
- **Manage Collections**: Click the gear icon to edit/delete collections
- **Add Collections**: Click the folder icon to create new collections
- **Browse Files**: Expand folders and click files to open

## Repository
[https://github.com/Q1143316492/LCHOpsPanel](https://github.com/Q1143316492/LCHOpsPanel)

## License
This project is licensed under the terms of the [MIT License](./LICENSE.md).
