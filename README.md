
# LCH Ops Panel

A Visual Studio Code extension for managing workspace configurations with a customizable tree view panel.

## Features
- **Category-based Organization**: Items are grouped into categories for clear visual separation:
  - 📁 Files
  - 💻 Scripts
  - 📝 Logs
  - ⚡ Commands
- **Quick Access to Files**: Open important files like `package.json` and `README.md` directly from the panel.
- **Script Execution**: Run scripts (e.g., batch files) with a single click.
- **Command Runner**: Execute custom commands such as build and test tasks from the panel.
- **Workspace-specific Configuration**: All items and categories are defined per workspace in `.lch-ops-panel.json`.

## Example Items
- **Files**: Quickly open project files.
- **Scripts**: Run batch or shell scripts.
- **Commands**: Execute commands like `npm run compile`, `npm test`, or custom echo commands.

## Configuration

Edit the `.lch-ops-panel.json` file in your workspace to customize categories and items.

## Example .lch-ops-panel.json

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
      "name": "README",
      "type": "file",
      "path": "./README.md",
      "category": "📝 Logs",
      "description": "Project documentation"
    },
    {
      "id": "test-script-1",
      "name": "Test Script",
      "type": "script",
      "path": "./scripts/test-script.bat",
      "category": "💻 Scripts"
    },
    {
      "id": "example3",
      "name": "Build Extension",
      "type": "command",
      "command": "echo 'npm run compile'",
      "category": "⚡ Commands",
      "description": "Compile the extension code"
    },
    {
      "id": "example4",
      "name": "Run Tests",
      "type": "command",
      "command": "echo 'npm test'",
      "category": "⚡ Commands",
      "description": "Run the test suite"
    },
    {
      "name": "test echo",
      "type": "command",
      "command": "echo 'test echo'",
      "description": "test222",
      "category": "⚡ Commands",
      "id": "scuudx39j"
    }
  ]
}
```

## Repository
[https://github.com/Q1143316492/LCHOpsPanel](https://github.com/Q1143316492/LCHOpsPanel)

## License
This project is licensed under the terms of the [MIT License](./LICENSE.md).
