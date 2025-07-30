# LCHOpsPanel Quick Start Guide

## 🚀 Getting Started

### 1. Launch the Extension
- Press `F5` to open a new Extension Development Host window
- Open a workspace folder in the new window
- Click on the **LCH Ops Panel** icon in the Activity Bar (tools icon)

### 2. First Time Setup
The extension will create a sample configuration automatically. You'll see categories like:
- **Files** - For documents, logs, and configuration files
- **Scripts** - For executable scripts
- **Commands** - For terminal commands

### 3. Adding Your First Item
1. Click the "+" button in the LCH Ops Panel header
2. Choose item type (File, Script, or Command)
3. Fill in the details:
   - **Name**: Display name for the item
   - **Path/Command**: File path or command to execute
   - **Description**: Optional description
   - **Category**: Choose existing or create new category

### 4. Using Items (All via Right-Click Menu)
- **Files**: Right-click → "Open File" to open in editor
- **Scripts**: Right-click → "Execute Script" to run, or "Open in Terminal" for directory navigation
- **Commands**: Right-click → "Execute Command" to run in terminal

## 📁 Example Configuration

The extension creates `.lch-ops-panel.json` in your workspace root:

```json
{
  "categories": ["Files", "Scripts", "Commands"],
  "items": [
    {
      "name": "Application Log",
      "type": "file",
      "path": "./logs/app.log",
      "category": "Files"
    },
    {
      "name": "Deploy Script", 
      "type": "script",
      "path": "./scripts/deploy.py",
      "category": "Scripts"
    },
    {
      "name": "Run Tests",
      "type": "command", 
      "command": "npm test",
      "category": "Commands"
    }
  ]
}
```

## 🛠️ Development Tips

### Testing the Extension
1. The watch mode automatically recompiles on changes
2. Press `Ctrl+R` (or `Cmd+R` on macOS) in the Extension Development Host to reload
3. Check the Debug Console for any error messages

### Common Use Cases
- **Log Files**: Add paths to application logs for quick access
- **Build Scripts**: Add deployment and build scripts
- **Database Commands**: Add frequently used database queries or connections
- **Documentation**: Quick access to project documentation and README files
- **Configuration Files**: Easy access to config files across the project

### Path Examples
- Relative to workspace: `./src/config.json`
- Absolute path: `C:\\Projects\\MyApp\\config.json`
- Log files: `./logs/application.log`
- Scripts: `./scripts/deploy.sh`

## 🎯 Next Steps

1. **Customize Categories**: Create categories that match your workflow
2. **Add Your Files**: Add frequently accessed files to avoid navigating through folders
3. **Script Automation**: Add build, test, and deployment scripts
4. **Team Sharing**: Commit the `.lch-ops-panel.json` file to share configurations with your team

## 🐛 Troubleshooting

### Extension Not Showing
- Ensure you have a workspace folder open
- Look for the LCH Ops Panel icon (tools) in the Activity Bar, not in Explorer
- Check that the extension compiled successfully (watch for webpack errors)

### Script Not Executing
- Verify the script path is correct
- Check file permissions (especially on Unix systems)
- Ensure the script interpreter is available (python, node, etc.)
- Use right-click menu to execute (left-click no longer executes)

### Configuration Not Loading
- Check that `.lch-ops-panel.json` is in the workspace root
- Verify JSON syntax is valid
- Use the refresh button in the panel header

Enjoy using LCHOpsPanel! 🎉
