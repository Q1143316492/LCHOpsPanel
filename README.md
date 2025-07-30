
# LCH Ops Panel

A Visual Studio Code extension for managing workspace configurations with dual tree view panels and mini games for coding breaks.

## Features

### 🎮 Mini Games Panel (NEW!)
- **2048 Game**: Classic number puzzle game built right into the sidebar
- **Coding Breaks**: Perfect for quick relaxation during development
- **Persistent Scores**: Your best scores are automatically saved
- **Keyboard Controls**: Use arrow keys for smooth gameplay
- **More Games Coming**: Architecture designed for easy game additions

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

## Documentation

For more detailed documentation:

- 🎮 **[Game Feature Guide](docs/GAMES_README.md)** - Complete guide to the mini-games panel
- 🧪 **[Testing Guide](docs/TESTING_GUIDE.md)** - How to test and debug the extension
- 🚀 **[Quick Start Guide](docs/QUICKSTART.md)** - Get started quickly
- 🔧 **[VS Code Extension Quickstart](docs/vsc-extension-quickstart.md)** - Extension development guide

## License
This project is licensed under the terms of the [MIT License](./LICENSE.md).
