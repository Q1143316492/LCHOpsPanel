@echo off
echo ========================================
echo    LCH Ops Panel - 游戏功能演示
echo ========================================
echo.
echo 🎮 新增功能：迷你游戏面板
echo.
echo 📍 测试步骤：
echo 1. 启动 VS Code
echo 2. 按 F5 运行扩展（开发模式）
echo 3. 在侧边栏找到 "LCH Ops Panel"
echo 4. 展开 "Mini Games" 面板
echo 5. 开始玩 2048 游戏！
echo.
echo 🎯 游戏控制：
echo - 使用方向键 ↑↓←→ 移动
echo - 合并相同数字达到 2048
echo - 点击 "New Game" 重新开始
echo.
echo 🔧 开发者提示：
echo - 游戏状态保存在 VS Code 全局存储中
echo - 架构支持轻松添加新游戏
echo - 使用 WebView 技术实现
echo.
echo ========================================
echo 按任意键开始编译和测试...
pause >nul

echo 正在编译扩展...
call npm run compile

echo.
echo ✅ 编译完成！现在可以按 F5 测试扩展了。
echo.
pause
