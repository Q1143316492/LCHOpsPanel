# Change Log

All notable changes to the "LCHOpsPanel" extension will be documented in this file.

## [1.3.0] - 2025-07-31

### Added 💣
- **Minesweeper Game**: Complete implementation of the classic minesweeper game
  - Three difficulty levels: Beginner (9x9, 10 mines), Intermediate (16x16, 40 mines), Expert (30x16, 99 mines)
  - Smart first-click protection (no mines around first click)
  - Left-click to reveal, right-click to flag mines
  - Auto-reveal empty areas and number display
  - Win/lose detection with appropriate messaging
- **Game Selection System**: Dropdown menu and command palette integration
  - Easy switching between 2048 and Minesweeper
  - Game preference persistence (remembers last played game)
  - Enhanced UI with game-specific controls and status displays

### Enhanced 🎮
- **Improved Game Architecture**: Better separation of game logic and UI
- **WASD Support for 2048**: Added WASD keys alongside arrow keys for 2048 game
- **Enhanced Commands**: New commands for direct game access
  - `lchOpsPanel.startGameMinesweeper` - Start Minesweeper directly
  - Improved `lchOpsPanel.switchGame` with game selection UI

### Technical 🔧
- Added responsive grid layout for minesweeper board
- Implemented right-click context menu handling
- Enhanced CSS styling with game-specific themes
- Improved state management across multiple games

## [1.2.0] - 2025-07-30

### Added 🎮
- **Mini Games Panel**: New WebView-based games panel in the sidebar
- **2048 Game**: Complete implementation of the classic 2048 puzzle game
  - Smooth keyboard controls with arrow keys
  - Real-time score tracking and display
  - Persistent best score storage using VS Code's global state
  - Win/lose condition detection with appropriate messaging
  - Beautiful tile animations and VS Code theme integration
- **Extensible Game Architecture**: Modular design for easy addition of future games
  - Base game interface and abstract class
  - Game manager for handling multiple games
  - Clean separation between game logic and UI

### Changed
- Updated extension version to 1.2.0
- Enhanced sidebar with third panel for entertainment
- Improved package.json with new game-related commands

### Technical
- Added new commands: `switchGame`, `resetGame`, `startGame2048`
- Created comprehensive games module with TypeScript interfaces
- Implemented WebView communication for real-time game interaction
- Added responsive CSS styling with VS Code theme variables

## [0.1.0] - 2025-07-27

### Changed
- **BREAKING**: Moved panel from Explorer sidebar to dedicated Activity Bar panel
- **BREAKING**: Removed left-click execution to prevent accidental triggers
- All operations now require right-click menu for safety
- Panel now has its own icon in the Activity Bar (tools icon)
- Improved user experience by not interfering with normal file browsing

### Added
- Dedicated Activity Bar container for the extension
- Comprehensive right-click context menus for all item types
- Better menu organization with action groups
- Enhanced safety with intentional right-click operations

## [0.0.1] - 2025-07-27

### Added
- Initial release of LCHOpsPanel extension
- Tree view panel in VS Code Explorer for workspace configuration management
- Support for three item types:
  - **Files**: Quick access to frequently used files
  - **Scripts**: Executable scripts with automatic type detection
  - **Commands**: Custom terminal commands
- Category-based organization system
- Context menu actions for items
- Configuration stored in `.lch-ops-panel.json` per workspace
- Support for both absolute and relative file paths
- Automatic script execution based on file extensions (.py, .js, .sh, .bat, .ps1, etc.)
- Terminal integration for script execution and directory navigation
- Add, edit, and delete functionality for all items
- Refresh capability to reload configuration changes

### Features
- **File Management**: Open files directly in VS Code editor
- **Script Execution**: Execute scripts with terminal integration
- **Command Execution**: Run custom commands in workspace context
- **Category Organization**: Group items by custom categories
- **Configuration Management**: JSON-based configuration per workspace
- **Path Support**: Both absolute and workspace-relative paths
- **Auto-detection**: Automatic script type detection and execution
- **Context Menus**: Right-click actions for enhanced functionality

### Technical Details
- Built with TypeScript and webpack
- VS Code API integration for tree views and commands
- File system operations for configuration management
- Terminal integration for script and command execution
- Extension activates when workspace folder is present