# LCHOpsPanel

LCHOpsPanel 是一个 VS Code 插件，提供独立面板，帮助你在工作区内高效管理常用路径、文档、脚本和命令。

## 核心功能
- 独立活动栏面板，不干扰文件浏览
- 支持自定义分类（带图标）
- 文件、脚本、命令一站式管理
- 所有操作均通过右键菜单，防止误触
- 配置存储于 `.lch-ops-panel.json`，支持团队共享

## 用法
1. 点击活动栏的 LCH Ops Panel 图标打开面板
2. 右上角“+”添加项目（文件/脚本/命令）
3. 右键项目，选择操作：
   - 文件：右键“Open File”
   - 脚本：右键“Execute Script”或“Open in Terminal”
   - 命令：右键“Execute Command”

## 配置示例
```json
{
  "categories": ["📁 Files", "💻 Scripts", "📝 Logs", "⚡ Commands"],
  "items": [
    {
      "name": "Package.json",
      "type": "file",
      "path": "./package.json",
      "category": "📁 Files"
    },
    {
      "name": "Deploy Script",
      "type": "script",
      "path": "./scripts/deploy.py",
      "category": "💻 Scripts"
    },
    {
      "name": "Run Tests",
      "type": "command",
      "command": "npm test",
      "category": "⚡ Commands"
    }
  ]
}
```

## 支持类型
- `type: "file"`    普通文件，右键可打开
- `type: "script"`  可执行脚本，右键可执行或进终端
- `type: "command"` 自定义命令，右键可执行

## 说明
- 分类名需与 `categories` 数组一致，建议加图标
- 所有操作均为右键菜单，安全防误触
- 配置文件可提交到团队仓库共享
