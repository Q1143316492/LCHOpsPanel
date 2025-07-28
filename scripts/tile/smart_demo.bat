@echo off
REM 智能终端平铺演示脚本
echo ==========================================
echo     智能终端平铺演示
echo ==========================================
echo.

echo 第一步: 启动3个gas测试终端...
echo.

REM 启动3个gas终端测试智能布局
start "gas1-demo" cmd /k "echo=== Gas Terminal 1 === && echo Monitoring gas process 1... && echo Press Ctrl+C to exit"
timeout /t 1 /nobreak >nul

start "gas2-demo" cmd /k "echo=== Gas Terminal 2 === && echo Monitoring gas process 2... && echo Press Ctrl+C to exit"  
timeout /t 1 /nobreak >nul

start "gas3-demo" cmd /k "echo=== Gas Terminal 3 === && echo Monitoring gas process 3... && echo Press Ctrl+C to exit"
timeout /t 1 /nobreak >nul

echo 已启动3个gas终端，现在它们应该显示在屏幕上
echo.

echo 等待3秒让终端完全加载...
timeout /t 3 /nobreak >nul

echo.
echo 第二步: 使用智能垂直平铺 - 应该自动分为2列!
echo 预期效果: 第1列2个终端，第2列1个终端，每个终端高度限制在600px
echo.

python terminal_tiler.py gas-demo

echo.
echo ==========================================
echo 测试说明:
echo 1. 3个终端已自动分为2列布局 (不再是单列)
echo 2. 每个终端高度最大600px (适合查看日志)
echo 3. 窗口排列更整齐，不会显得过挤
echo ==========================================
echo.

echo 想要测试更多终端吗？
echo 输入以下命令:
echo   python terminal_tiler.py gas-demo --horizontal  ^(水平平铺^)
echo   python terminal_tiler.py --list                 ^(查看所有终端^)
echo.

echo 或者启动更多终端测试:
echo   start "gas4-demo" cmd /k "echo Gas Terminal 4"
echo   start "gas5-demo" cmd /k "echo Gas Terminal 5"
echo   然后再次运行: python terminal_tiler.py gas-demo
echo.

pause
