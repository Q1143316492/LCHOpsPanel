# LCHOpsPanel

A VS Code extension for managing workspace configurations with custom paths, documents, executable scripts, and commands in a tree view panel.

## Features

LCHOpsPanel provides a dedicated activity bar panel that helps you manage workspace-specific configurations without interfering with the normal file explorer:

### 📁 **File Management**
- Configure and organize frequently used files (logs, documents, configs)
- Right-click to open files in editor
- Support for both absolute and relative paths

### 🚀 **Script Execution**
- Add executable scripts to your panel
- Right-click to execute scripts or open terminal in script directory
- Automatic detection of script types (.py, .js, .sh, .bat, .ps1, etc.)

### ⚡ **Custom Commands**
- Configure non-file commands (e.g., `python3 test.py`, `npm start`)
- Right-click to execute commands in workspace context
- Quick access to frequently used terminal commands

### 🗂️ **Category Organization**
- Organize items into custom categories
- Expandable/collapsible category views
- Visual separation for better organization

### 🛡️ **Safe Operation**
- All actions require right-click to prevent accidental execution
- Dedicated activity bar panel that doesn't interfere with file explorer

## How to Use

1. **Open the Panel**: Click on the LCH Ops Panel icon in the Activity Bar (looks like a tools icon) when you have a workspace folder open.

2. **Add Items**: Click the "+" button in the panel header to add new items:
   - **File**: Reference documents, logs, or configuration files
   - **Script**: Executable scripts that can be run directly
   - **Command**: Terminal commands to execute

3. **Organize with Categories**: Create custom categories to group related items together.

4. **Execute Items** (All operations use right-click menu for safety):
   - **Files**: Right-click → "Open File" to open in editor
   - **Scripts**: Right-click → "Execute Script" to run, or "Open in Terminal" for directory navigation
   - **Commands**: Right-click → "Execute Command" to run in terminal

## Configuration

The extension stores its configuration in `.lch-ops-panel.json` in your workspace root. This file contains:

```json
{
  "categories": ["Files", "Scripts", "Commands"],
  "items": [
    {
      "id": "abc123",
      "name": "Application Log",
      "type": "file",
      "path": "./logs/app.log",
      "category": "Files",
      "description": "Main application log file"
    },
    {
      "id": "def456",
      "name": "Deploy Script",
      "type": "script",
      "path": "./scripts/deploy.py",
      "category": "Scripts",
      "description": "Deployment script for production"
    },
    {
      "id": "ghi789",
      "name": "Run Tests",
      "type": "command",
      "command": "python3 -m pytest tests/",
      "category": "Commands",
      "description": "Run all unit tests"
    }
  ]
}
```

## Supported Script Types

The extension automatically determines how to execute scripts based on file extensions:

- **Python** (`.py`): `python script.py`
- **JavaScript** (`.js`): `node script.js`
- **PowerShell** (`.ps1`): `powershell -ExecutionPolicy Bypass -File script.ps1`
- **Batch** (`.bat`, `.cmd`): Direct execution
- **Shell** (`.sh`): `bash script.sh`
- **Other**: Direct execution attempt

## Commands

- `lchOpsPanel.refresh`: Refresh the panel view
- `lchOpsPanel.addItem`: Add a new item to the panel
- `lchOpsPanel.editItem`: Edit an existing item
- `lchOpsPanel.deleteItem`: Delete an item
- `lchOpsPanel.openFile`: Open a file item
- `lchOpsPanel.executeScript`: Execute a script item
- `lchOpsPanel.openInTerminal`: Open terminal in item's directory
- `lchOpsPanel.executeCommand`: Execute a command item

## Development

To run the extension in development mode:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Press `F5` to open a new Extension Development Host window
4. Open a workspace folder and click the LCH Ops Panel icon in the Activity Bar

### Building

```bash
npm run compile  # Compile TypeScript
npm run watch    # Watch mode for development
npm run package  # Build for production
```

### Testing

```bash
npm run test  # Run tests
```

## Requirements

- VS Code 1.102.0 or higher
- A workspace folder must be open to use the extension

## Known Issues

- Configuration file is stored in workspace root and may need manual cleanup when removing the extension
- Terminal execution paths may need adjustment based on your system configuration
- All operations now require right-click menu for safety (no accidental left-click execution)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
